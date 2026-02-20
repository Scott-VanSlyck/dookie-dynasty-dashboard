/**
 * Enhanced Trading Value API Service - Real Data Implementation
 * Uses free public APIs and Sleeper data - NO MOCK DATA
 */

import axios from 'axios';
import { sleeperAPI } from './SleeperAPI';
import { PlayerValue } from '../types';

export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string | null;
  age: number;
  height: string;
  weight: string;
  years_exp: number;
  active: boolean;
  status: string;
  fantasy_positions: string[];
}

class TradingValueService {
  private playersCache: Record<string, SleeperPlayer> = {};
  private lastPlayersUpdate: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

  /**
   * Get all NFL players from Sleeper API
   */
  async getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
    const now = Date.now();
    
    if (Object.keys(this.playersCache).length > 0 && (now - this.lastPlayersUpdate) < this.CACHE_DURATION) {
      return this.playersCache;
    }

    try {
      const players = await sleeperAPI.getAllPlayers();
      this.playersCache = players;
      this.lastPlayersUpdate = now;
      return players;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw new Error('Failed to fetch player data');
    }
  }

  /**
   * Get active players with fantasy relevance
   */
  async getActiveFantasyPlayers(): Promise<PlayerValue[]> {
    try {
      const allPlayers = await this.getAllPlayers();
      const fantasyRelevantPlayers: PlayerValue[] = [];

      // Filter for active fantasy-relevant players
      Object.entries(allPlayers).forEach(([playerId, player]) => {
        // Check if player is active using both status and active fields for robustness
        const isActive = player.status === 'Active' || player.active === true;
        
        // Check if player has fantasy-relevant position (use fantasy_positions if available, fallback to position)
        const playerPositions = player.fantasy_positions || [player.position];
        const isFantasyRelevant = playerPositions.some(pos => 
          ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(pos)
        );
        
        // Include both players on teams AND free agents (team can be null)
        if (isActive && isFantasyRelevant && player.full_name) {
          
          // Generate a basic dynasty value based on position and age
          const baseValue = this.calculateBaseValue(player);
          
          fantasyRelevantPlayers.push({
            player_id: playerId,
            name: player.full_name,
            position: playerPositions[0] || player.position, // Use primary fantasy position
            team: player.team || 'FA', // Show 'FA' for free agents instead of null
            value: baseValue,
            trend: this.determineTrend(player),
            dynasty_rank: 0, // Will be calculated after sorting
            redraft_rank: 0   // Will be calculated after sorting
          });
        }
      });

      // Sort by estimated value and assign ranks
      fantasyRelevantPlayers.sort((a, b) => b.value - a.value);
      fantasyRelevantPlayers.forEach((player, index) => {
        player.dynasty_rank = index + 1;
        player.redraft_rank = index + 1;
      });

      return fantasyRelevantPlayers.slice(0, 500); // Top 500 fantasy players
    } catch (error) {
      console.error('Error getting fantasy players:', error);
      throw new Error('Failed to get fantasy players');
    }
  }

  /**
   * Calculate base dynasty value for a player
   */
  private calculateBaseValue(player: SleeperPlayer): number {
    let baseValue = 1000; // Base value for all players
    
    // Position multipliers
    const positionMultipliers = {
      'QB': 1.2,
      'RB': 1.0,
      'WR': 1.1,
      'TE': 0.8,
      'K': 0.3,
      'DEF': 0.4
    };

    baseValue *= positionMultipliers[player.position as keyof typeof positionMultipliers] || 0.5;

    // Age factor (younger = more valuable in dynasty)
    if (player.age && player.age > 0) {
      if (player.age <= 23) {
        baseValue *= 1.4; // Young, high upside
      } else if (player.age <= 26) {
        baseValue *= 1.2; // Prime age
      } else if (player.age <= 29) {
        baseValue *= 1.0; // Still good
      } else if (player.age <= 32) {
        baseValue *= 0.7; // Declining
      } else {
        baseValue *= 0.4; // Veteran
      }
    } else {
      // Default multiplier for players with missing age data
      baseValue *= 0.9;
    }

    // Experience factor
    if (player.years_exp !== undefined) {
      if (player.years_exp <= 2) {
        baseValue *= 1.2; // Rookie/sophomore upside
      } else if (player.years_exp <= 5) {
        baseValue *= 1.1; // Established but young
      }
    }

    // Use search_rank for more realistic values (lower rank = higher value)
    const searchRank = (player as any).search_rank;
    if (searchRank && searchRank <= 300) {
      if (searchRank <= 25) baseValue *= 1.8;        // Elite players
      else if (searchRank <= 50) baseValue *= 1.5;   // High-end players  
      else if (searchRank <= 100) baseValue *= 1.2;  // Good players
      else if (searchRank <= 200) baseValue *= 1.1;  // Above average
      else baseValue *= 0.9;                         // Below average
    } else {
      baseValue *= 0.7; // Lower value for unranked/deep players
    }

    return Math.round(baseValue);
  }

  /**
   * Determine trend based on player characteristics
   */
  private determineTrend(player: SleeperPlayer): 'up' | 'down' | 'stable' {
    // Handle missing age data
    if (!player.age || player.age <= 0) {
      // Use years_exp as backup for trend determination
      if (player.years_exp <= 2) {
        return 'up'; // Young/rookie players trending up
      }
      return 'stable';
    }
    
    if (player.age <= 24 && player.years_exp <= 2) {
      return 'up'; // Young players trending up
    } else if (player.age >= 30) {
      return 'down'; // Older players trending down
    }
    
    return 'stable';
  }

  /**
   * Get combined player values (main API method)
   */
  async getCombinedPlayerValues(): Promise<PlayerValue[]> {
    return this.getActiveFantasyPlayers();
  }

  /**
   * Get market inefficiencies (players that might be undervalued/overvalued)
   */
  async getMarketInefficiencies(): Promise<{
    undervalued: PlayerValue[];
    overvalued: PlayerValue[];
    consensus: PlayerValue[];
  }> {
    try {
      const players = await this.getActiveFantasyPlayers();
      
      // Simple algorithm: compare age vs value for "inefficiencies"
      const undervalued = players.filter(p => {
        const player = Object.values(this.playersCache).find(cached => cached.player_id === p.player_id);
        return player && player.age && player.age <= 25 && p.value < 3000; // Young players with lower values
      }).slice(0, 20);

      const overvalued = players.filter(p => {
        const player = Object.values(this.playersCache).find(cached => cached.player_id === p.player_id);
        return player && player.age && player.age >= 30 && p.value > 2000; // Older players with higher values
      }).slice(0, 20);

      const consensus = players.filter(p => 
        !undervalued.includes(p) && !overvalued.includes(p)
      ).slice(0, 20);

      return {
        undervalued,
        overvalued,
        consensus
      };
    } catch (error) {
      console.error('Error analyzing market inefficiencies:', error);
      return { undervalued: [], overvalued: [], consensus: [] };
    }
  }

  /**
   * Get trending players
   */
  async getTrendingPlayers(direction: 'up' | 'down', limit: number = 10): Promise<PlayerValue[]> {
    try {
      const players = await this.getActiveFantasyPlayers();
      
      return players
        .filter(p => p.trend === direction)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting trending players:', error);
      return [];
    }
  }

  /**
   * Analyze trade value between two sets of players
   */
  async analyzeTradeValue(teamAPlayerIds: string[], teamBPlayerIds: string[]): Promise<{
    teamAValue: number;
    teamBValue: number;
    difference: number;
    percentageDifference: number;
    winner: 'A' | 'B' | 'Even';
    fairness: 'Very Fair' | 'Fair' | 'Somewhat Unfair' | 'Very Unfair';
  }> {
    try {
      const players = await this.getActiveFantasyPlayers();
      const playersMap = players.reduce((acc, p) => {
        acc[p.player_id] = p;
        return acc;
      }, {} as Record<string, PlayerValue>);

      const teamAValue = teamAPlayerIds.reduce((sum, playerId) => {
        return sum + (playersMap[playerId]?.value || 0);
      }, 0);

      const teamBValue = teamBPlayerIds.reduce((sum, playerId) => {
        return sum + (playersMap[playerId]?.value || 0);
      }, 0);

      const difference = Math.abs(teamAValue - teamBValue);
      const totalValue = teamAValue + teamBValue;
      const percentageDifference = totalValue > 0 ? (difference / (totalValue / 2)) * 100 : 0;

      let winner: 'A' | 'B' | 'Even';
      if (percentageDifference < 5) {
        winner = 'Even';
      } else {
        winner = teamAValue > teamBValue ? 'A' : 'B';
      }

      let fairness: 'Very Fair' | 'Fair' | 'Somewhat Unfair' | 'Very Unfair';
      if (percentageDifference < 5) {
        fairness = 'Very Fair';
      } else if (percentageDifference < 15) {
        fairness = 'Fair';
      } else if (percentageDifference < 25) {
        fairness = 'Somewhat Unfair';
      } else {
        fairness = 'Very Unfair';
      }

      return {
        teamAValue,
        teamBValue,
        difference,
        percentageDifference,
        winner,
        fairness
      };
    } catch (error) {
      console.error('Error analyzing trade:', error);
      throw new Error('Failed to analyze trade');
    }
  }

  /**
   * Search players by name
   */
  async searchPlayers(query: string): Promise<PlayerValue[]> {
    try {
      const players = await this.getActiveFantasyPlayers();
      const lowerQuery = query.toLowerCase();
      
      return players.filter(player => 
        player.name.toLowerCase().includes(lowerQuery)
      ).slice(0, 20);
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }

  /**
   * Get players by position
   */
  async getPlayersByPosition(position: string): Promise<PlayerValue[]> {
    try {
      const players = await this.getActiveFantasyPlayers();
      
      return players
        .filter(p => p.position === position)
        .slice(0, 50);
    } catch (error) {
      console.error('Error getting players by position:', error);
      return [];
    }
  }

  /**
   * Get top players overall
   */
  async getTopPlayers(limit: number = 100): Promise<PlayerValue[]> {
    try {
      const players = await this.getActiveFantasyPlayers();
      return players.slice(0, limit);
    } catch (error) {
      console.error('Error getting top players:', error);
      return [];
    }
  }

  /**
   * Get single player value by ID
   */
  async getPlayerValue(playerId: string): Promise<PlayerValue | null> {
    try {
      const players = await this.getActiveFantasyPlayers();
      return players.find(p => p.player_id === playerId) || null;
    } catch (error) {
      console.error('Error getting player value:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tradingValueAPI = new TradingValueService();
export default tradingValueAPI;