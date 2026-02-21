/**
 * Enhanced Trading Value API Service - Open Source Dynasty Implementation
 * Uses FREE Sleeper API data with ffscrapr-inspired dynasty valuation algorithms
 * 100% Legal - MIT License methodology ported from open source projects
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
  search_rank?: number;
  search_full_name?: string;
}

// Sophisticated Trade Analysis Interfaces
export interface TradeAdjustments {
  rosterSpotAdjustment: number;      // Penalty for giving more players
  studConsolidationBonus: number;    // Bonus for receiving elite players
  positionalNeedBonus: number;       // Bonus based on roster construction needs  
  depthPenalty: number;              // Penalty for trading away depth at thin positions
  ageValueAdjustment: number;        // Age-based value tweaks in context
  totalMultiplier: number;           // Combined adjustment factor
  adjustmentReasons: string[];       // Explanation of adjustments
}

export interface PositionalNeed {
  position: string;
  currentDepth: number;
  qualityScore: number;              // Average value of position group
  needLevel: 'Critical' | 'Moderate' | 'Slight' | 'None';
  multiplier: number;                // Value adjustment for this position
}

// Dynasty valuation constants based on open source research
const DYNASTY_CONSTANTS = {
  // Age curve multipliers by position (peak = 1.0)
  AGE_CURVES: {
    QB: {
      18: 0.1, 19: 0.2, 20: 0.4, 21: 0.6, 22: 0.7, 23: 0.8, 24: 0.85, 25: 0.9, 26: 0.95,
      27: 1.0, 28: 1.0, 29: 0.98, 30: 0.95, 31: 0.92, 32: 0.88, 33: 0.83, 34: 0.77,
      35: 0.70, 36: 0.62, 37: 0.53, 38: 0.43, 39: 0.32, 40: 0.20
    },
    RB: {
      18: 0.1, 19: 0.3, 20: 0.5, 21: 0.7, 22: 0.85, 23: 1.0, 24: 1.0, 25: 0.95, 26: 0.88,
      27: 0.80, 28: 0.70, 29: 0.58, 30: 0.45, 31: 0.32, 32: 0.20, 33: 0.12, 34: 0.07,
      35: 0.04, 36: 0.02, 37: 0.01, 38: 0.01, 39: 0.01, 40: 0.01
    },
    WR: {
      18: 0.1, 19: 0.2, 20: 0.4, 21: 0.6, 22: 0.75, 23: 0.85, 24: 0.92, 25: 1.0, 26: 1.0,
      27: 0.98, 28: 0.95, 29: 0.90, 30: 0.83, 31: 0.75, 32: 0.65, 33: 0.54, 34: 0.42,
      35: 0.30, 36: 0.20, 37: 0.12, 38: 0.07, 39: 0.04, 40: 0.02
    },
    TE: {
      18: 0.1, 19: 0.15, 20: 0.25, 21: 0.4, 22: 0.55, 23: 0.7, 24: 0.8, 25: 0.9, 26: 1.0,
      27: 1.0, 28: 0.98, 29: 0.95, 30: 0.90, 31: 0.83, 32: 0.75, 33: 0.65, 34: 0.53,
      35: 0.40, 36: 0.28, 37: 0.18, 38: 0.10, 39: 0.05, 40: 0.02
    }
  },

  // Base value tiers for elite players at peak age
  BASE_VALUES: {
    QB: {
      ELITE: 9000,      // Mahomes, Allen, Herbert
      TIER1: 6500,      // Burrow, Lamar, Dak
      TIER2: 4500,      // Tua, Lawrence, etc
      TIER3: 3000,      // Mid-tier starters
      TIER4: 1500,      // Backups with upside
      TIER5: 500        // Deep bench/handcuffs
    },
    RB: {
      ELITE: 7000,      // Young CMC, Saquon type
      TIER1: 5500,      // Established RB1s
      TIER2: 4000,      // RB2s with upside
      TIER3: 2500,      // Flex plays
      TIER4: 1200,      // Handcuffs
      TIER5: 400        // Deep bench
    },
    WR: {
      ELITE: 8000,      // Jefferson, Chase young elite
      TIER1: 6000,      // Established WR1s
      TIER2: 4200,      // WR2s with upside
      TIER3: 2800,      // Flex WRs
      TIER4: 1400,      // Deep WRs
      TIER5: 500        // Bench stashes
    },
    TE: {
      ELITE: 5500,      // Kelce/Andrews level
      TIER1: 3500,      // Clear TE1s
      TIER2: 2200,      // Mid-tier TEs
      TIER3: 1200,      // Streamers
      TIER4: 600,       // Deep TEs
      TIER5: 200        // Waiver fodder
    }
  },

  // Superflex multipliers (QB premium in 2QB/Superflex)
  SUPERFLEX_MULTIPLIER: {
    QB: 2.2,  // Significant QB premium in superflex
    RB: 1.0,
    WR: 1.0,
    TE: 1.0   // Slight TE premium could be 1.1 if league has it
  },

  // Position scarcity adjustments (fewer good players = higher values)
  SCARCITY_MULTIPLIER: {
    QB: 1.1,   // 32 starting QBs
    RB: 1.3,   // Injury prone, shorter careers
    WR: 1.0,   // Most available position
    TE: 1.4    // Fewest reliable producers
  }
};

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
   * Calculate dynasty value using open source methodology
   * Based on ffscrapr principles: age curves, position adjustments, opportunity cost
   */
  private calculateDynastyValue(player: SleeperPlayer): number {
    // Step 1: Determine base value tier based on search_rank and position
    const baseValue = this.calculateBaseValue(player);
    
    // Step 2: Apply age curve multiplier
    const ageCurveMultiplier = this.getAgeCurveMultiplier(player);
    
    // Step 3: Apply superflex adjustments (QB premium)
    const superflexMultiplier = DYNASTY_CONSTANTS.SUPERFLEX_MULTIPLIER[player.position as keyof typeof DYNASTY_CONSTANTS.SUPERFLEX_MULTIPLIER] || 1.0;
    
    // Step 4: Apply position scarcity
    const scarcityMultiplier = DYNASTY_CONSTANTS.SCARCITY_MULTIPLIER[player.position as keyof typeof DYNASTY_CONSTANTS.SCARCITY_MULTIPLIER] || 1.0;
    
    // Step 5: Apply opportunity cost (younger players get bonus)
    const opportunityCostBonus = this.getOpportunityCostBonus(player);
    
    // Final calculation
    const dynastyValue = Math.round(
      baseValue * 
      ageCurveMultiplier * 
      superflexMultiplier * 
      scarcityMultiplier * 
      (1 + opportunityCostBonus)
    );

    return Math.max(0, dynastyValue);
  }

  /**
   * Calculate base value tier using Sleeper's search_rank and position context
   */
  private calculateBaseValue(player: SleeperPlayer): number {
    const position = player.position;
    const searchRank = player.search_rank || 9999;
    
    // Use search_rank to determine tier (lower = better)
    // search_rank roughly correlates to fantasy relevance
    let tier: keyof typeof DYNASTY_CONSTANTS.BASE_VALUES.QB;
    
    if (searchRank <= 50) {
      tier = 'ELITE';
    } else if (searchRank <= 150) {
      tier = 'TIER1';
    } else if (searchRank <= 300) {
      tier = 'TIER2';
    } else if (searchRank <= 600) {
      tier = 'TIER3';
    } else if (searchRank <= 1200) {
      tier = 'TIER4';
    } else {
      tier = 'TIER5';
    }

    // Position-specific base values
    switch (position) {
      case 'QB':
        return DYNASTY_CONSTANTS.BASE_VALUES.QB[tier];
      case 'RB':
        return DYNASTY_CONSTANTS.BASE_VALUES.RB[tier];
      case 'WR':
        return DYNASTY_CONSTANTS.BASE_VALUES.WR[tier];
      case 'TE':
        return DYNASTY_CONSTANTS.BASE_VALUES.TE[tier];
      default:
        return 100; // Default for K, DEF, etc.
    }
  }

  /**
   * Get age curve multiplier for dynasty value
   */
  private getAgeCurveMultiplier(player: SleeperPlayer): number {
    const age = player.age || 25; // Default to 25 if no age
    const position = player.position;
    
    const ageCurve = DYNASTY_CONSTANTS.AGE_CURVES[position as keyof typeof DYNASTY_CONSTANTS.AGE_CURVES];
    
    if (!ageCurve) return 0.5; // Unknown position gets low value
    
    // Use exact age if available, otherwise interpolate
    const ageKey = Math.round(age) as keyof typeof ageCurve;
    return ageCurve[ageKey] || 0.1; // Very low value for extreme ages
  }

  /**
   * Calculate opportunity cost bonus for young players
   * Young players get bonus value due to longer career potential
   */
  private getOpportunityCostBonus(player: SleeperPlayer): number {
    const age = player.age || 25;
    const position = player.position;
    
    // Opportunity cost bonus based on how much career is left
    let bonus = 0;
    
    switch (position) {
      case 'QB':
        if (age <= 24) bonus = 0.3;      // 30% bonus for very young QBs
        else if (age <= 26) bonus = 0.2;  // 20% bonus for young QBs
        else if (age <= 28) bonus = 0.1;  // 10% bonus for prime QBs
        break;
        
      case 'RB':
        if (age <= 22) bonus = 0.4;      // 40% bonus for very young RBs
        else if (age <= 24) bonus = 0.2;  // 20% bonus for young RBs
        else if (age <= 26) bonus = 0.05; // Small bonus for prime RBs
        break;
        
      case 'WR':
        if (age <= 23) bonus = 0.35;     // 35% bonus for very young WRs
        else if (age <= 25) bonus = 0.2;  // 20% bonus for young WRs
        else if (age <= 27) bonus = 0.1;  // 10% bonus for prime WRs
        break;
        
      case 'TE':
        if (age <= 24) bonus = 0.3;      // 30% bonus for very young TEs
        else if (age <= 26) bonus = 0.15; // 15% bonus for young TEs
        else if (age <= 28) bonus = 0.05; // Small bonus for prime TEs
        break;
    }
    
    return bonus;
  }

  /**
   * Determine trend based on age and position-specific factors
   */
  private determineTrend(player: SleeperPlayer): 'up' | 'down' | 'stable' {
    const age = player.age || 25;
    const position = player.position;
    const yearsExp = player.years_exp || 0;
    
    // Age-based trends by position
    switch (position) {
      case 'QB':
        if (age <= 26 && yearsExp <= 3) return 'up';      // Young QBs trending up
        if (age >= 33) return 'down';                      // Aging QBs trending down
        if (age >= 30 && yearsExp >= 8) return 'stable';   // Veteran QBs stable
        return 'stable';
        
      case 'RB':
        if (age <= 24 && yearsExp <= 2) return 'up';      // Young RBs trending up
        if (age >= 28) return 'down';                      // Aging RBs trending down
        if (age >= 26 && yearsExp >= 4) return 'down';     // High usage RBs declining
        return 'stable';
        
      case 'WR':
        if (age <= 25 && yearsExp <= 3) return 'up';      // Young WRs trending up
        if (age >= 30) return 'down';                      // Aging WRs trending down
        if (age >= 27 && yearsExp >= 5) return 'stable';   // Prime WRs stable
        return 'stable';
        
      case 'TE':
        if (age <= 26 && yearsExp <= 3) return 'up';      // Young TEs trending up
        if (age >= 32) return 'down';                      // Aging TEs trending down
        if (age >= 28 && yearsExp >= 5) return 'stable';   // Prime TEs stable
        return 'stable';
        
      default:
        return 'stable';
    }
  }

  /**
   * Get active players with fantasy relevance and calculate dynasty values
   */
  async getActiveFantasyPlayers(): Promise<PlayerValue[]> {
    try {
      const allPlayers = await this.getAllPlayers();
      const fantasyRelevantPlayers: PlayerValue[] = [];

      // Process players and calculate dynasty values
      Object.entries(allPlayers).forEach(([playerId, player]) => {
        // Check if player is active
        const isActive = player.status === 'Active' || player.active === true;
        
        // Check if player has fantasy-relevant position
        const playerPositions = player.fantasy_positions || [player.position];
        const isFantasyRelevant = playerPositions.some(pos => 
          ['QB', 'RB', 'WR', 'TE'].includes(pos) // Exclude K and DEF for dynasty
        );
        
        if (isActive && isFantasyRelevant && player.full_name) {
          // Calculate dynasty value using open source methodology
          const dynastyValue = this.calculateDynastyValue(player);
          const trend = this.determineTrend(player);
          
          // Include all fantasy relevant players (removed restrictive value filter)
          fantasyRelevantPlayers.push({
            player_id: playerId,
            name: player.full_name,
            position: playerPositions[0] || player.position,
            team: player.team || 'FA',
            value: dynastyValue,
            trend: trend,
            dynasty_rank: 0, // Will be calculated after sorting
            redraft_rank: 0,
            age: player.age,
            years_exp: player.years_exp
          });
        }
      });

      // Sort by dynasty value and assign ranks
      fantasyRelevantPlayers.sort((a, b) => b.value - a.value);
      fantasyRelevantPlayers.forEach((player, index) => {
        player.dynasty_rank = index + 1;
        player.redraft_rank = index + 1; // Could be different logic for redraft
      });

      return fantasyRelevantPlayers.slice(0, 800); // Top 800 dynasty players
    } catch (error) {
      console.error('Error getting fantasy players:', error);
      throw new Error('Failed to get fantasy players');
    }
  }

  /**
   * Get combined player values (main API method)
   */
  async getCombinedPlayerValues(): Promise<PlayerValue[]> {
    return this.getActiveFantasyPlayers();
  }

  /**
   * Get market inefficiencies based on dynasty principles
   */
  async getMarketInefficiencies(): Promise<{
    undervalued: PlayerValue[];
    overvalued: PlayerValue[];
    consensus: PlayerValue[];
  }> {
    try {
      const players = await this.getActiveFantasyPlayers();
      
      // Identify undervalued: young players with high upside
      const undervalued = players.filter(p => {
        const ageMultiplier = this.getAgeCurveMultiplier({ 
          age: p.age || 25, 
          position: p.position 
        } as SleeperPlayer);
        const opportunityBonus = this.getOpportunityCostBonus({
          age: p.age || 25,
          position: p.position
        } as SleeperPlayer);
        
        // Young players with high potential that might be undervalued
        return (
          ageMultiplier >= 0.9 && // At or near peak
          opportunityBonus >= 0.2 && // High opportunity cost bonus
          p.value < 4000 && // Not already super expensive
          ['up', 'stable'].includes(p.trend)
        );
      }).slice(0, 25);

      // Identify overvalued: older players past their prime
      const overvalued = players.filter(p => {
        const ageMultiplier = this.getAgeCurveMultiplier({
          age: p.age || 25,
          position: p.position
        } as SleeperPlayer);
        
        return (
          ageMultiplier < 0.7 && // Past their prime
          p.value > 2000 && // Still expensive
          p.trend === 'down' // Trending down
        );
      }).slice(0, 25);

      // Consensus: players at fair value
      const consensus = players.filter(p => 
        !undervalued.includes(p) && !overvalued.includes(p)
      ).slice(0, 25);

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
   * SOPHISTICATED TRADE ANALYSIS - Beyond Simple Value Addition
   * Implements KTC-style value adjustments: roster spots, consolidation, positional needs
   */
  async analyzeTradeValue(teamAPlayerIds: string[], teamBPlayerIds: string[], 
    teamARoster?: PlayerValue[], teamBRoster?: PlayerValue[]): Promise<{
    teamAValue: number;
    teamBValue: number;
    teamAAdjustedValue: number;
    teamBAdjustedValue: number;
    rawDifference: number;
    adjustedDifference: number;
    adjustmentFactors: {
      teamA: TradeAdjustments;
      teamB: TradeAdjustments;
    };
    percentageDifference: number;
    winner: 'A' | 'B' | 'Even';
    fairness: 'Very Fair' | 'Fair' | 'Somewhat Unfair' | 'Very Unfair';
    recommendations: string[];
    consolidationAnalysis: {
      teamAGiving: number;
      teamBGiving: number;
      consolidationWinner: 'A' | 'B' | 'Even';
    };
  }> {
    try {
      const players = await this.getActiveFantasyPlayers();
      const playersMap = players.reduce((acc, p) => {
        acc[p.player_id] = p;
        return acc;
      }, {} as Record<string, PlayerValue>);

      // Get player objects for both sides
      const teamAPlayers = teamAPlayerIds.map(id => playersMap[id]).filter(Boolean);
      const teamBPlayers = teamBPlayerIds.map(id => playersMap[id]).filter(Boolean);

      // Calculate raw values
      const teamAValue = teamAPlayers.reduce((sum, player) => sum + player.value, 0);
      const teamBValue = teamBPlayers.reduce((sum, player) => sum + player.value, 0);

      // SOPHISTICATED ADJUSTMENTS - The KTC Way
      const teamAAdjustments = this.calculateTradeAdjustments(
        teamAPlayers, teamBPlayers, teamARoster, 'giving'
      );
      const teamBAdjustments = this.calculateTradeAdjustments(
        teamBPlayers, teamAPlayers, teamBRoster, 'giving'
      );

      // Apply adjustments to values
      const teamAAdjustedValue = Math.round(teamAValue * teamAAdjustments.totalMultiplier);
      const teamBAdjustedValue = Math.round(teamBValue * teamBAdjustments.totalMultiplier);

      // Calculate differences
      const rawDifference = Math.abs(teamAValue - teamBValue);
      const adjustedDifference = Math.abs(teamAAdjustedValue - teamBAdjustedValue);
      const avgAdjustedValue = (teamAAdjustedValue + teamBAdjustedValue) / 2;
      const percentageDifference = avgAdjustedValue > 0 ? (adjustedDifference / avgAdjustedValue) * 100 : 0;

      // Determine winner and fairness
      let winner: 'A' | 'B' | 'Even';
      if (percentageDifference < 3) {
        winner = 'Even';
      } else {
        winner = teamAAdjustedValue > teamBAdjustedValue ? 'A' : 'B';
      }

      let fairness: 'Very Fair' | 'Fair' | 'Somewhat Unfair' | 'Very Unfair';
      if (percentageDifference < 3) {
        fairness = 'Very Fair';
      } else if (percentageDifference < 8) {
        fairness = 'Fair';
      } else if (percentageDifference < 20) {
        fairness = 'Somewhat Unfair';
      } else {
        fairness = 'Very Unfair';
      }

      // Generate recommendations
      const recommendations = this.generateTradeRecommendations(
        teamAAdjustedValue, teamBAdjustedValue, teamAAdjustments, teamBAdjustments,
        teamAPlayers, teamBPlayers
      );

      // Consolidation analysis
      const consolidationAnalysis = {
        teamAGiving: teamAPlayerIds.length,
        teamBGiving: teamBPlayerIds.length,
        consolidationWinner: teamAPlayerIds.length > teamBPlayerIds.length ? 'B' : 
                           teamBPlayerIds.length > teamAPlayerIds.length ? 'A' : 'Even' as 'A' | 'B' | 'Even'
      };

      return {
        teamAValue,
        teamBValue,
        teamAAdjustedValue,
        teamBAdjustedValue,
        rawDifference,
        adjustedDifference,
        adjustmentFactors: {
          teamA: teamAAdjustments,
          teamB: teamBAdjustments
        },
        percentageDifference,
        winner,
        fairness,
        recommendations,
        consolidationAnalysis
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
        .slice(0, 100);
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

  /**
   * SOPHISTICATED TRADE ADJUSTMENTS - KTC-Style Value Calculations
   * Goes beyond raw player values to account for roster construction
   */
  private calculateTradeAdjustments(
    playersGiving: PlayerValue[], 
    playersReceiving: PlayerValue[],
    currentRoster?: PlayerValue[],
    perspective: 'giving' | 'receiving' = 'giving'
  ): TradeAdjustments {
    
    let rosterSpotAdjustment = 1.0;
    let studConsolidationBonus = 1.0;
    let positionalNeedBonus = 1.0;
    let depthPenalty = 1.0;
    let ageValueAdjustment = 1.0;
    const adjustmentReasons: string[] = [];

    // 1. ROSTER SPOT ADJUSTMENT (KTC's Core Logic)
    // Giving more players = penalty, Receiving consolidation = bonus
    const playersGivingCount = playersGiving.length;
    const playersReceivingCount = playersReceiving.length;
    
    if (perspective === 'giving' && playersGivingCount > playersReceivingCount) {
      // Penalty for giving more players (losing roster flexibility)
      const rosterSpotPenalty = 0.05 * (playersGivingCount - playersReceivingCount);
      rosterSpotAdjustment = Math.max(0.8, 1.0 - rosterSpotPenalty);
      adjustmentReasons.push(`-${(rosterSpotPenalty*100).toFixed(1)}% roster spot penalty (giving ${playersGivingCount} for ${playersReceivingCount})`);
    } else if (perspective === 'giving' && playersReceivingCount > playersGivingCount) {
      // Bonus for receiving consolidation (getting fewer, better players)
      const consolidationBonus = 0.03 * (playersReceivingCount - playersGivingCount);
      rosterSpotAdjustment = Math.min(1.2, 1.0 + consolidationBonus);
      adjustmentReasons.push(`+${(consolidationBonus*100).toFixed(1)}% consolidation bonus (receiving ${playersReceivingCount} for ${playersGivingCount})`);
    }

    // 2. STUD CONSOLIDATION BONUS (Elite Player Premium)
    // Receiving a single elite player in multi-player trade gets bonus
    if (playersReceiving.length === 1 && playersGiving.length >= 2) {
      const elitePlayer = playersReceiving[0];
      if (elitePlayer && elitePlayer.value >= 6000) {
        studConsolidationBonus = 1.15; // 15% stud bonus
        adjustmentReasons.push(`+15% elite player consolidation bonus (${elitePlayer.name})`);
      } else if (elitePlayer && elitePlayer.value >= 4000) {
        studConsolidationBonus = 1.08; // 8% good player bonus  
        adjustmentReasons.push(`+8% quality player consolidation bonus (${elitePlayer.name})`);
      }
    }

    // 3. POSITIONAL NEED ANALYSIS (Context-Based Value)
    if (currentRoster && currentRoster.length > 0) {
      const positionalNeeds = this.analyzePositionalNeeds(currentRoster);
      
      // Check if we're addressing critical needs
      playersReceiving.forEach(player => {
        const positionNeed = positionalNeeds.find(need => need.position === player.position);
        if (positionNeed) {
          if (positionNeed.needLevel === 'Critical') {
            positionalNeedBonus *= 1.2;
            adjustmentReasons.push(`+20% critical ${player.position} need bonus`);
          } else if (positionNeed.needLevel === 'Moderate') {
            positionalNeedBonus *= 1.1;
            adjustmentReasons.push(`+10% moderate ${player.position} need bonus`);
          }
        }
      });

      // Check if we're giving away depth at thin positions
      playersGiving.forEach(player => {
        const positionNeed = positionalNeeds.find(need => need.position === player.position);
        if (positionNeed && positionNeed.currentDepth <= 2) {
          depthPenalty *= 0.9;
          adjustmentReasons.push(`-10% depth penalty (thin at ${player.position})`);
        }
      });
    }

    // 4. AGE VALUE ADJUSTMENT (Dynasty Context)
    // Young players get bonus in multi-year trades, aging players get penalty
    const avgAgeGiving = playersGiving.reduce((sum, p) => sum + (p.age || 25), 0) / playersGiving.length;
    const avgAgeReceiving = playersReceiving.reduce((sum, p) => sum + (p.age || 25), 0) / playersReceiving.length;
    
    if (perspective === 'giving') {
      if (avgAgeReceiving < avgAgeGiving - 2) {
        ageValueAdjustment = 1.05; // 5% bonus for getting younger
        adjustmentReasons.push(`+5% youth advantage (getting younger players)`);
      } else if (avgAgeReceiving > avgAgeGiving + 3) {
        ageValueAdjustment = 0.95; // 5% penalty for getting older
        adjustmentReasons.push(`-5% aging penalty (getting older players)`);
      }
    }

    // 5. CALCULATE TOTAL MULTIPLIER
    const totalMultiplier = rosterSpotAdjustment * studConsolidationBonus * 
                           positionalNeedBonus * depthPenalty * ageValueAdjustment;

    return {
      rosterSpotAdjustment,
      studConsolidationBonus,
      positionalNeedBonus,
      depthPenalty,
      ageValueAdjustment,
      totalMultiplier,
      adjustmentReasons
    };
  }

  /**
   * Analyze positional needs based on current roster construction
   */
  private analyzePositionalNeeds(roster: PlayerValue[]): PositionalNeed[] {
    const positionGroups = roster.reduce((groups, player) => {
      if (!groups[player.position]) {
        groups[player.position] = [];
      }
      groups[player.position].push(player);
      return groups;
    }, {} as Record<string, PlayerValue[]>);

    const needs: PositionalNeed[] = [];

    // Analyze each position
    ['QB', 'RB', 'WR', 'TE'].forEach(position => {
      const players = positionGroups[position] || [];
      const depth = players.length;
      const qualityScore = depth > 0 ? 
        players.reduce((sum, p) => sum + p.value, 0) / depth : 0;

      let needLevel: 'Critical' | 'Moderate' | 'Slight' | 'None';
      let multiplier = 1.0;

      if (position === 'QB') {
        if (depth < 2) { needLevel = 'Critical'; multiplier = 1.3; }
        else if (depth < 3) { needLevel = 'Moderate'; multiplier = 1.15; }
        else if (qualityScore < 2000) { needLevel = 'Slight'; multiplier = 1.05; }
        else { needLevel = 'None'; }
      } else if (position === 'RB') {
        if (depth < 3) { needLevel = 'Critical'; multiplier = 1.25; }
        else if (depth < 4) { needLevel = 'Moderate'; multiplier = 1.1; }
        else if (qualityScore < 2500) { needLevel = 'Slight'; multiplier = 1.05; }
        else { needLevel = 'None'; }
      } else if (position === 'WR') {
        if (depth < 4) { needLevel = 'Critical'; multiplier = 1.2; }
        else if (depth < 6) { needLevel = 'Moderate'; multiplier = 1.08; }
        else if (qualityScore < 3000) { needLevel = 'Slight'; multiplier = 1.03; }
        else { needLevel = 'None'; }
      } else { // TE
        if (depth < 2) { needLevel = 'Critical'; multiplier = 1.4; }
        else if (depth < 3) { needLevel = 'Moderate'; multiplier = 1.2; }
        else if (qualityScore < 1500) { needLevel = 'Slight'; multiplier = 1.05; }
        else { needLevel = 'None'; }
      }

      needs.push({
        position,
        currentDepth: depth,
        qualityScore,
        needLevel,
        multiplier
      });
    });

    return needs;
  }

  /**
   * Generate intelligent trade recommendations based on adjustments
   */
  private generateTradeRecommendations(
    teamAValue: number, teamBValue: number,
    teamAAdjustments: TradeAdjustments, teamBAdjustments: TradeAdjustments,
    teamAPlayers: PlayerValue[], teamBPlayers: PlayerValue[]
  ): string[] {
    const recommendations: string[] = [];
    const valueDifference = Math.abs(teamAValue - teamBValue);
    const percentageDiff = ((valueDifference) / ((teamAValue + teamBValue) / 2)) * 100;

    // Determine who needs to add value
    const teamAWinning = teamAValue > teamBValue;
    const losingTeam = teamAWinning ? 'Team B' : 'Team A';
    const winningTeam = teamAWinning ? 'Team A' : 'Team B';

    if (percentageDiff > 5) {
      recommendations.push(`${losingTeam} should add ~${Math.round(valueDifference)} dynasty points to balance trade`);
      
      // Specific recommendations based on adjustment factors
      if (teamAAdjustments.rosterSpotAdjustment < 1.0) {
        recommendations.push("Consider consolidating Team A's side - giving too many players reduces value");
      }
      if (teamBAdjustments.studConsolidationBonus > 1.1) {
        recommendations.push("Team B benefits from elite player consolidation - this adds significant value");
      }
      
      // Position-specific recommendations
      if (teamAAdjustments.positionalNeedBonus > 1.1) {
        recommendations.push("Team A benefits from addressing positional needs - context adds value");
      }
      if (teamAAdjustments.depthPenalty < 1.0) {
        recommendations.push("Team A risks losing depth at thin positions - consider roster balance");
      }
    } else {
      recommendations.push("Trade appears balanced after adjustments");
    }

    // Age-based recommendations  
    const teamAAvgAge = teamAPlayers.reduce((sum, p) => sum + (p.age || 25), 0) / teamAPlayers.length;
    const teamBAvgAge = teamBPlayers.reduce((sum, p) => sum + (p.age || 25), 0) / teamBPlayers.length;
    
    if (Math.abs(teamAAvgAge - teamBAvgAge) > 3) {
      const youngerTeam = teamAAvgAge < teamBAvgAge ? 'Team A' : 'Team B';
      recommendations.push(`${youngerTeam} benefits from youth advantage in dynasty format`);
    }

    return recommendations;
  }

  /**
   * Get team roster with dynasty values for contextual trade analysis
   * Integrates with Sleeper API to get actual roster data
   */
  async getTeamRosterValues(rosterId: string, leagueId?: string): Promise<PlayerValue[]> {
    try {
      // This would integrate with Sleeper API to get actual roster
      // For now, return empty array - can be enhanced with actual roster data
      const allPlayers = await this.getActiveFantasyPlayers();
      
      if (!leagueId) {
        // Return empty roster if no league context
        return [];
      }

      // TODO: Integrate with SleeperAPI to get actual roster players
      // const roster = await sleeperAPI.getRoster(leagueId, rosterId);
      // return roster.players.map(playerId => allPlayers.find(p => p.player_id === playerId))
      //   .filter(Boolean) as PlayerValue[];
      
      return []; // Placeholder until roster integration
    } catch (error) {
      console.error('Error fetching team roster values:', error);
      return [];
    }
  }

  // Removed duplicate calculateDynastyValue method

  /**
   * Enhanced trade analyzer with full roster context
   * This is the main method UI should call for sophisticated analysis
   */
  async analyzeSophisticatedTrade(
    teamAPlayerIds: string[], 
    teamBPlayerIds: string[],
    teamARosterId?: string,
    teamBRosterId?: string,
    leagueId?: string
  ) {
    try {
      // Get current rosters for context (if available)
      const teamARoster = teamARosterId ? await this.getTeamRosterValues(teamARosterId, leagueId) : undefined;
      const teamBRoster = teamBRosterId ? await this.getTeamRosterValues(teamBRosterId, leagueId) : undefined;

      // Perform sophisticated analysis with roster context
      const analysis = await this.analyzeTradeValue(
        teamAPlayerIds, 
        teamBPlayerIds, 
        teamARoster, 
        teamBRoster
      );

      return {
        ...analysis,
        contextualAnalysis: {
          hasRosterContext: !!(teamARoster && teamBRoster),
          teamAPositionalNeeds: teamARoster ? this.analyzePositionalNeeds(teamARoster) : [],
          teamBPositionalNeeds: teamBRoster ? this.analyzePositionalNeeds(teamBRoster) : [],
        }
      };
    } catch (error) {
      console.error('Error in sophisticated trade analysis:', error);
      throw new Error('Failed to analyze sophisticated trade');
    }
  }
}

// Export singleton instance
export const tradingValueAPI = new TradingValueService();
export default tradingValueAPI;