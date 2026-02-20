/**
 * Enhanced Trading Value API Service
 * Supports Dynasty Daddy, KeepTradeCut APIs with fallback scrapers
 * Contains comprehensive mock data for immediate development
 */

import axios from 'axios';
import { PlayerValue } from '../types';

export interface DynastyDaddyPlayer {
  player_id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  dynasty_value: number;
  dynasty_rank: number;
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
  tier: number;
  positional_rank: number;
}

export interface KeepTradeCutPlayer {
  player_id: string;
  name: string;
  position: string;
  team: string;
  value: number;
  rank: number;
  trend_30d: number;
  trend_7d: number;
  overall_rank: number;
  positional_rank: number;
}

export interface APIConfig {
  dynastyDaddy: {
    apiKey?: string;
    baseUrl: string;
    enabled: boolean;
  };
  keepTradeCut: {
    apiKey?: string;
    baseUrl: string;
    enabled: boolean;
  };
}

class TradingValueService {
  private config: APIConfig = {
    dynastyDaddy: {
      apiKey: process.env.REACT_APP_DYNASTY_DADDY_API_KEY,
      baseUrl: 'https://api.dynastydaddy.com/v1',
      enabled: false // Set to true when API key is available
    },
    keepTradeCut: {
      apiKey: process.env.REACT_APP_KEEP_TRADE_CUT_API_KEY,
      baseUrl: 'https://api.keeptradecut.com/v1',
      enabled: false // Set to true when API key is available
    }
  };

  // Expanded mock data with more comprehensive player base
  private mockPlayers: PlayerValue[] = [
    // Top QBs
    { player_id: '4034', name: 'Patrick Mahomes', position: 'QB', team: 'KC', value: 9200, trend: 'stable', dynasty_rank: 1, redraft_rank: 1 },
    { player_id: '4046', name: 'Josh Allen', position: 'QB', team: 'BUF', value: 8500, trend: 'stable', dynasty_rank: 2, redraft_rank: 2 },
    { player_id: '5849', name: 'Lamar Jackson', position: 'QB', team: 'BAL', value: 8200, trend: 'up', dynasty_rank: 3, redraft_rank: 3 },
    { player_id: '6797', name: 'Justin Herbert', position: 'QB', team: 'LAC', value: 7800, trend: 'stable', dynasty_rank: 4, redraft_rank: 5 },
    { player_id: '6945', name: 'Joe Burrow', position: 'QB', team: 'CIN', value: 7600, trend: 'up', dynasty_rank: 5, redraft_rank: 4 },
    
    // Top WRs  
    { player_id: '5892', name: 'Justin Jefferson', position: 'WR', team: 'MIN', value: 10500, trend: 'stable', dynasty_rank: 1, redraft_rank: 1 },
    { player_id: '6794', name: "Ja'Marr Chase", position: 'WR', team: 'CIN', value: 9800, trend: 'up', dynasty_rank: 2, redraft_rank: 2 },
    { player_id: '7568', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', value: 9200, trend: 'stable', dynasty_rank: 3, redraft_rank: 3 },
    { player_id: '6955', name: 'Jaylen Waddle', position: 'WR', team: 'MIA', value: 8100, trend: 'stable', dynasty_rank: 4, redraft_rank: 6 },
    { player_id: '7553', name: 'DK Metcalf', position: 'WR', team: 'SEA', value: 7800, trend: 'stable', dynasty_rank: 5, redraft_rank: 8 },
    { player_id: '5045', name: 'Tyreek Hill', position: 'WR', team: 'MIA', value: 7200, trend: 'down', dynasty_rank: 8, redraft_rank: 4 },
    { player_id: '4866', name: 'Davante Adams', position: 'WR', team: 'LV', value: 6800, trend: 'down', dynasty_rank: 12, redraft_rank: 7 },
    { player_id: '8155', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', value: 7600, trend: 'up', dynasty_rank: 6, redraft_rank: 10 },
    
    // Top RBs
    { player_id: '8110', name: 'Bijan Robinson', position: 'RB', team: 'ATL', value: 8900, trend: 'up', dynasty_rank: 1, redraft_rank: 2 },
    { player_id: '9509', name: 'Breece Hall', position: 'RB', team: 'NYJ', value: 8600, trend: 'up', dynasty_rank: 2, redraft_rank: 4 },
    { player_id: '4988', name: 'Christian McCaffrey', position: 'RB', team: 'SF', value: 7200, trend: 'down', dynasty_rank: 6, redraft_rank: 1 },
    { player_id: '7564', name: 'Jonathan Taylor', position: 'RB', team: 'IND', value: 6500, trend: 'stable', dynasty_rank: 8, redraft_rank: 3 },
    { player_id: '5045', name: 'Saquon Barkley', position: 'RB', team: 'PHI', value: 6800, trend: 'up', dynasty_rank: 7, redraft_rank: 5 },
    { player_id: '8000', name: 'Kenneth Walker III', position: 'RB', team: 'SEA', value: 7800, trend: 'stable', dynasty_rank: 3, redraft_rank: 8 },
    { player_id: '8121', name: 'Isiah Pacheco', position: 'RB', team: 'KC', value: 5200, trend: 'stable', dynasty_rank: 15, redraft_rank: 12 },
    
    // Top TEs
    { player_id: '6813', name: 'Travis Kelce', position: 'TE', team: 'KC', value: 5200, trend: 'down', dynasty_rank: 3, redraft_rank: 1 },
    { player_id: '5850', name: 'Mark Andrews', position: 'TE', team: 'BAL', value: 4800, trend: 'down', dynasty_rank: 4, redraft_rank: 2 },
    { player_id: '7818', name: 'Kyle Pitts', position: 'TE', team: 'ATL', value: 6200, trend: 'up', dynasty_rank: 1, redraft_rank: 5 },
    { player_id: '8146', name: 'TJ Hockenson', position: 'TE', team: 'MIN', value: 3800, trend: 'stable', dynasty_rank: 6, redraft_rank: 3 },
    { player_id: '9213', name: 'Sam LaPorta', position: 'TE', team: 'DET', value: 5800, trend: 'up', dynasty_rank: 2, redraft_rank: 4 },
    
    // Rookies and Young Players
    { player_id: '11111', name: 'Caleb Williams', position: 'QB', team: 'CHI', value: 6800, trend: 'up', dynasty_rank: 8, redraft_rank: 15 },
    { player_id: '11112', name: 'Jayden Daniels', position: 'QB', team: 'WAS', value: 6200, trend: 'up', dynasty_rank: 10, redraft_rank: 18 },
    { player_id: '11113', name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI', value: 8200, trend: 'up', dynasty_rank: 7, redraft_rank: 12 },
    { player_id: '11114', name: 'Rome Odunze', position: 'WR', team: 'CHI', value: 6800, trend: 'up', dynasty_rank: 15, redraft_rank: 25 },
    { player_id: '11115', name: 'Malik Nabers', position: 'WR', team: 'NYG', value: 7200, trend: 'up', dynasty_rank: 12, redraft_rank: 18 }
  ];

  /**
   * Get Dynasty Daddy player values (mock implementation)
   */
  async getDynastyDaddyValues(): Promise<DynastyDaddyPlayer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockPlayers.map(player => ({
      player_id: player.player_id,
      name: player.name,
      position: player.position,
      team: player.team,
      age: this.getMockAge(player.position),
      dynasty_value: player.value,
      dynasty_rank: player.dynasty_rank || 0,
      trend: player.trend,
      last_updated: new Date().toISOString(),
      tier: Math.ceil((player.dynasty_rank || 0) / 20) || 1, // Calculate tier based on rank
      positional_rank: player.dynasty_rank || 0
    }));
  }

  /**
   * Get KeepTradeCut player values (mock implementation)
   */
  async getKeepTradeCutValues(): Promise<KeepTradeCutPlayer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return this.mockPlayers.map(player => ({
      player_id: player.player_id,
      name: player.name,
      position: player.position,
      team: player.team,
      value: player.value,
      rank: player.redraft_rank || 0,
      trend_30d: this.getMockTrend(player.trend),
      trend_7d: this.getMockTrend(player.trend, 0.5),
      overall_rank: player.redraft_rank || 0,
      positional_rank: player.redraft_rank || 0
    }));
  }

  /**
   * Get combined player values from both sources
   */
  async getCombinedPlayerValues(): Promise<PlayerValue[]> {
    try {
      const [dynastyDaddy, keepTradeCut] = await Promise.all([
        this.getDynastyDaddyValues(),
        this.getKeepTradeCutValues()
      ]);

      // Combine and average values
      const playerMap = new Map<string, PlayerValue>();

      dynastyDaddy.forEach(player => {
        playerMap.set(player.player_id, {
          player_id: player.player_id,
          name: player.name,
          position: player.position,
          team: player.team,
          value: player.dynasty_value,
          trend: player.trend,
          dynasty_rank: player.dynasty_rank
        });
      });

      keepTradeCut.forEach(player => {
        const existing = playerMap.get(player.player_id);
        if (existing) {
          // Average the values
          existing.value = (existing.value + player.value) / 2;
          existing.redraft_rank = player.rank;
        } else {
          playerMap.set(player.player_id, {
            player_id: player.player_id,
            name: player.name,
            position: player.position,
            team: player.team,
            value: player.value,
            trend: this.getTrendFromNumber(player.trend_30d),
            redraft_rank: player.rank
          });
        }
      });

      return Array.from(playerMap.values());
    } catch (error) {
      console.error('Error fetching combined player values:', error);
      // Return mock data as fallback
      return this.mockPlayers;
    }
  }

  /**
   * Search for a specific player's value
   */
  async getPlayerValue(playerId: string): Promise<PlayerValue | null> {
    const allValues = await this.getCombinedPlayerValues();
    return allValues.find(player => player.player_id === playerId) || null;
  }

  /**
   * Get top players by position
   */
  async getTopPlayersByPosition(position: string, limit: number = 20): Promise<PlayerValue[]> {
    const allValues = await this.getCombinedPlayerValues();
    return allValues
      .filter(player => player.position === position)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Analyze a trade's value
   */
  async analyzeTradeValue(
    teamAPlayers: string[],
    teamBPlayers: string[]
  ): Promise<{
    teamAValue: number;
    teamBValue: number;
    difference: number;
    percentageDifference: number;
    winner: 'A' | 'B' | 'Even';
    playerValues: { [playerId: string]: PlayerValue };
  }> {
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const playerValues: { [playerId: string]: PlayerValue } = {};

    // Get values for all players in the trade
    await Promise.all(
      allPlayers.map(async playerId => {
        const value = await this.getPlayerValue(playerId);
        if (value) {
          playerValues[playerId] = value;
        }
      })
    );

    const teamAValue = teamAPlayers.reduce((sum, id) => {
      return sum + (playerValues[id]?.value || 0);
    }, 0);

    const teamBValue = teamBPlayers.reduce((sum, id) => {
      return sum + (playerValues[id]?.value || 0);
    }, 0);

    const difference = Math.abs(teamAValue - teamBValue);
    const totalValue = teamAValue + teamBValue;
    const percentageDifference = totalValue === 0 ? 0 : (difference / totalValue) * 100;

    let winner: 'A' | 'B' | 'Even';
    if (percentageDifference < 5) {
      winner = 'Even';
    } else if (teamAValue > teamBValue) {
      winner = 'A';
    } else {
      winner = 'B';
    }

    return {
      teamAValue,
      teamBValue,
      difference,
      percentageDifference,
      winner,
      playerValues
    };
  }

  /**
   * Get trending players (up or down)
   */
  async getTrendingPlayers(direction: 'up' | 'down', limit: number = 10): Promise<PlayerValue[]> {
    const allValues = await this.getCombinedPlayerValues();
    return allValues
      .filter(player => player.trend === direction)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  // Helper methods for mock data
  private getMockAge(position: string): number {
    const baseAge = { QB: 26, RB: 24, WR: 25, TE: 26 }[position] || 25;
    return baseAge + Math.floor(Math.random() * 8) - 4; // ±4 years
  }

  private getMockTrend(trend: 'up' | 'down' | 'stable', multiplier: number = 1): number {
    const base = { up: 5, down: -5, stable: 0 }[trend];
    return base * multiplier + (Math.random() - 0.5) * 2;
  }

  private getTrendFromNumber(trendValue: number): 'up' | 'down' | 'stable' {
    if (trendValue > 2) return 'up';
    if (trendValue < -2) return 'down';
    return 'stable';
  }

  /**
   * Dynasty Daddy API call with fallback to scraper
   */
  private async callDynastyDaddyAPI(endpoint: string): Promise<any> {
    if (this.config.dynastyDaddy.enabled && this.config.dynastyDaddy.apiKey) {
      try {
        const response = await axios.get(`${this.config.dynastyDaddy.baseUrl}/${endpoint}`, {
          headers: { 
            'Authorization': `Bearer ${this.config.dynastyDaddy.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        return response.data;
      } catch (error) {
        console.warn('Dynasty Daddy API call failed, falling back to scraper:', error);
        return await this.scrapeDynastyDaddy(endpoint);
      }
    }
    
    return await this.scrapeDynastyDaddy(endpoint);
  }

  /**
   * KeepTradeCut API call with fallback to scraper  
   */
  private async callKeepTradeCutAPI(endpoint: string): Promise<any> {
    if (this.config.keepTradeCut.enabled && this.config.keepTradeCut.apiKey) {
      try {
        const response = await axios.get(`${this.config.keepTradeCut.baseUrl}/${endpoint}`, {
          headers: { 
            'Authorization': `Bearer ${this.config.keepTradeCut.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        return response.data;
      } catch (error) {
        console.warn('KeepTradeCut API call failed, falling back to scraper:', error);
        return await this.scrapeKeepTradeCut(endpoint);
      }
    }
    
    return await this.scrapeKeepTradeCut(endpoint);
  }

  /**
   * Dynasty Daddy scraper fallback (respectful scraping)
   */
  private async scrapeDynastyDaddy(endpoint: string): Promise<any> {
    try {
      // For now, return mock data - in production this would scrape Dynasty Daddy
      console.info('Using mock Dynasty Daddy data - scraper not implemented');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      return this.mockPlayers.filter(p => Math.random() > 0.3); // Return subset
    } catch (error) {
      console.error('Dynasty Daddy scraper failed:', error);
      throw new Error('Dynasty Daddy data unavailable');
    }
  }

  /**
   * KeepTradeCut scraper fallback (respectful scraping)
   */
  private async scrapeKeepTradeCut(endpoint: string): Promise<any> {
    try {
      // For now, return mock data - in production this would scrape KeepTradeCut
      console.info('Using mock KeepTradeCut data - scraper not implemented');
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate delay
      return this.mockPlayers.filter(p => Math.random() > 0.2); // Return subset
    } catch (error) {
      console.error('KeepTradeCut scraper failed:', error);
      throw new Error('KeepTradeCut data unavailable');
    }
  }

  /**
   * Get historical value trends for a player
   */
  async getPlayerValueTrends(playerId: string, days: number = 30): Promise<{
    dates: string[];
    values: number[];
    trend_direction: 'up' | 'down' | 'stable';
    trend_percentage: number;
  }> {
    // Mock trend data - in production this would come from APIs
    const dates = [];
    const values = [];
    const baseValue = this.mockPlayers.find(p => p.player_id === playerId)?.value || 5000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      // Generate realistic trend data
      const randomVariation = (Math.random() - 0.5) * 200;
      const trendValue = baseValue + (Math.random() * 1000) - 500 + randomVariation;
      values.push(Math.max(100, trendValue));
    }
    
    const startValue = values[0];
    const endValue = values[values.length - 1];
    const percentChange = ((endValue - startValue) / startValue) * 100;
    
    return {
      dates,
      values,
      trend_direction: percentChange > 2 ? 'up' : percentChange < -2 ? 'down' : 'stable',
      trend_percentage: percentChange
    };
  }

  /**
   * Compare multiple players values
   */
  async comparePlayersValues(playerIds: string[]): Promise<{
    players: PlayerValue[];
    comparison_matrix: { [key: string]: { [key: string]: number } };
    winner: string;
  }> {
    const players = await Promise.all(
      playerIds.map(async id => await this.getPlayerValue(id))
    ).then(results => results.filter(p => p !== null) as PlayerValue[]);

    const comparison_matrix: { [key: string]: { [key: string]: number } } = {};
    
    players.forEach(playerA => {
      comparison_matrix[playerA.player_id] = {};
      players.forEach(playerB => {
        if (playerA.player_id !== playerB.player_id) {
          comparison_matrix[playerA.player_id][playerB.player_id] = playerA.value - playerB.value;
        }
      });
    });

    const winner = players.reduce((highest, current) => 
      current.value > highest.value ? current : highest
    ).player_id;

    return {
      players,
      comparison_matrix,
      winner
    };
  }

  /**
   * Get market inefficiencies (players with high value discrepancy between sources)
   */
  async getMarketInefficiencies(): Promise<{
    undervalued: PlayerValue[];
    overvalued: PlayerValue[];
    consensus: PlayerValue[];
  }> {
    const allPlayers = await this.getCombinedPlayerValues();
    
    // Mock inefficiency detection - in production this would compare multiple sources
    const undervalued = allPlayers.filter(p => Math.random() > 0.85).slice(0, 10);
    const overvalued = allPlayers.filter(p => Math.random() > 0.85).slice(0, 10);
    const consensus = allPlayers.filter(p => !undervalued.includes(p) && !overvalued.includes(p)).slice(0, 15);

    return {
      undervalued: undervalued.map(p => ({ ...p, trend: 'up' as const })),
      overvalued: overvalued.map(p => ({ ...p, trend: 'down' as const })),
      consensus: consensus.map(p => ({ ...p, trend: 'stable' as const }))
    };
  }
}

// Export singleton instance
export const tradingValueAPI = new TradingValueService();
export default tradingValueAPI;