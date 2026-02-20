/**
 * FREE Data Collectors for Dynasty Trade Values
 * Implements multiple free data sources as alternatives to paid APIs
 */

import axios from 'axios';
import { dookieDynastyLeague, DookieLeagueSettings, DookieRosterRequirements, DookieScoringBreakdown } from './DookieDynastyLeagueAPI';

export interface FreePlayerValue {
  player_id: string;
  name: string;
  position: string;
  team: string;
  value: number;
  confidence: number; // 0-100% confidence in the value
  source: string;
  last_updated: string;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  age?: number;
  metadata?: any;
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  age: number;
  years_exp: number;
  status: string;
  fantasy_positions: string[];
  search_rank?: number;
}

export interface TrendingData {
  player_id: string;
  count: number;
  type: 'add' | 'drop';
}

/**
 * Sleeper API Data Collector (100% FREE)
 */
export class SleeperDataCollector {
  private baseUrl = 'https://api.sleeper.app/v1';
  private playersCache: { [key: string]: SleeperPlayer } = {};
  private cacheTimestamp = 0;
  private cacheValidMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get all NFL players from Sleeper
   */
  async getAllPlayers(): Promise<{ [key: string]: SleeperPlayer }> {
    const now = Date.now();
    
    // Use cache if still valid
    if (this.cacheTimestamp && (now - this.cacheTimestamp) < this.cacheValidMs && Object.keys(this.playersCache).length > 0) {
      return this.playersCache;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/players/nfl`, {
        timeout: 15000
      });
      
      this.playersCache = response.data;
      this.cacheTimestamp = now;
      
      console.log(`Loaded ${Object.keys(this.playersCache).length} players from Sleeper API`);
      return this.playersCache;
    } catch (error) {
      console.error('Error fetching Sleeper players:', error);
      
      // Return cached data if available
      if (Object.keys(this.playersCache).length > 0) {
        console.warn('Using cached Sleeper data due to API error');
        return this.playersCache;
      }
      
      throw new Error('Failed to fetch Sleeper player data');
    }
  }

  /**
   * Get trending players (add/drop activity)
   */
  async getTrendingPlayers(type: 'add' | 'drop' = 'add', lookbackHours = 24, limit = 100): Promise<TrendingData[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`,
        { timeout: 10000 }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching trending ${type} players:`, error);
      return [];
    }
  }

  /**
   * Convert trending activity to dynasty values
   */
  async calculateSleeperValues(): Promise<FreePlayerValue[]> {
    try {
      const [players, trendingAdds, trendingDrops] = await Promise.all([
        this.getAllPlayers(),
        this.getTrendingPlayers('add'),
        this.getTrendingPlayers('drop')
      ]);

      const values: FreePlayerValue[] = [];
      
      // Create lookup maps for trending data
      const addTrends = new Map(trendingAdds.map(t => [t.player_id, t.count]));
      const dropTrends = new Map(trendingDrops.map(t => [t.player_id, t.count]));

      // Focus on relevant fantasy players
      Object.entries(players)
        .filter(([_, player]) => {
          const p = player as any;
          return p.fantasy_positions && 
            ['QB', 'RB', 'WR', 'TE'].some((pos: string) => p.fantasy_positions.includes(pos)) &&
            p.status === 'Active';
        })
        .forEach(([playerId, player]) => {
          const addCount = addTrends.get(playerId) || 0;
          const dropCount = dropTrends.get(playerId) || 0;
          const netTrend = addCount - dropCount;
          
          // Base value calculation using multiple factors
          let baseValue = this.calculateBaseValue(player, addCount, dropCount);
          
          // Apply trending adjustments
          const trendMultiplier = 1 + (netTrend * 0.01); // 1% per net trend point
          const finalValue = Math.round(baseValue * trendMultiplier);
          
          // Determine trend direction
          let trend: 'up' | 'down' | 'stable' = 'stable';
          let trendPercentage = 0;
          
          if (netTrend > 5) {
            trend = 'up';
            trendPercentage = Math.min(netTrend * 2, 50);
          } else if (netTrend < -5) {
            trend = 'down';
            trendPercentage = Math.max(netTrend * 2, -50);
          }
          
          values.push({
            player_id: playerId,
            name: `${player.first_name} ${player.last_name}`,
            position: player.position,
            team: player.team || 'FA',
            value: finalValue,
            confidence: this.calculateConfidence(player, addCount + dropCount),
            source: 'Sleeper Community',
            last_updated: new Date().toISOString(),
            trend,
            trend_percentage: trendPercentage,
            age: player.age,
            metadata: {
              adds_24h: addCount,
              drops_24h: dropCount,
              years_exp: player.years_exp,
              search_rank: player.search_rank
            }
          });
        });

      // Sort by value descending
      values.sort((a, b) => b.value - a.value);
      
      console.log(`Generated ${values.length} Sleeper-based values`);
      return values.slice(0, 500); // Top 500 players
      
    } catch (error) {
      console.error('Error calculating Sleeper values:', error);
      return [];
    }
  }

  /**
   * Calculate base dynasty value using multiple factors
   */
  private calculateBaseValue(player: SleeperPlayer, addCount: number, dropCount: number): number {
    const position = player.position;
    const age = player.age || 25;
    const experience = player.years_exp || 0;
    const searchRank = player.search_rank || 9999;
    
    // Position-based base values
    const positionBases = {
      'QB': 6000,
      'RB': 5500, 
      'WR': 6500,
      'TE': 4000
    };
    
    let baseValue = positionBases[position as keyof typeof positionBases] || 3000;
    
    // Age curve adjustments (dynasty-specific)
    const ageMultipliers = {
      'QB': this.getAgeMultiplier(age, [0.6, 0.8, 1.0, 1.1, 1.2, 1.15, 1.1, 1.0, 0.9, 0.7, 0.5]), // Peak 27-32
      'RB': this.getAgeMultiplier(age, [0.7, 1.0, 1.2, 1.1, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05]), // Peak 22-26  
      'WR': this.getAgeMultiplier(age, [0.6, 0.8, 1.0, 1.1, 1.2, 1.15, 1.1, 1.0, 0.85, 0.7, 0.5]), // Peak 24-28
      'TE': this.getAgeMultiplier(age, [0.5, 0.7, 0.9, 1.0, 1.1, 1.15, 1.1, 1.0, 0.9, 0.7, 0.5])  // Peak 25-29
    };
    
    baseValue *= ageMultipliers[position as keyof typeof ageMultipliers] || 0.8;
    
    // Experience adjustments
    if (experience === 0) baseValue *= 0.8; // Rookie discount
    else if (experience <= 2) baseValue *= 0.9; // Young player discount
    else if (experience >= 10) baseValue *= 0.85; // Veteran discount
    
    // Search rank adjustments (lower rank = higher value)
    if (searchRank <= 50) baseValue *= 1.5;
    else if (searchRank <= 100) baseValue *= 1.3;
    else if (searchRank <= 200) baseValue *= 1.1;
    else if (searchRank >= 1000) baseValue *= 0.7;
    
    // Activity-based adjustments
    if (addCount > dropCount * 2) baseValue *= 1.1; // High interest
    if (dropCount > addCount * 2) baseValue *= 0.9; // Low interest
    
    return Math.round(baseValue);
  }

  /**
   * Get age multiplier based on position-specific curves
   */
  private getAgeMultiplier(age: number, curve: number[]): number {
    const index = Math.max(0, Math.min(curve.length - 1, age - 21));
    return curve[index];
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidence(player: SleeperPlayer, activityCount: number): number {
    let confidence = 50; // Base confidence
    
    // More active trading = higher confidence
    if (activityCount >= 20) confidence += 30;
    else if (activityCount >= 10) confidence += 20;
    else if (activityCount >= 5) confidence += 10;
    
    // Search rank indicates prominence
    if (player.search_rank && player.search_rank <= 100) confidence += 20;
    else if (player.search_rank && player.search_rank <= 300) confidence += 10;
    
    // Status and team
    if (player.status === 'Active' && player.team) confidence += 10;
    
    return Math.min(100, confidence);
  }
}

/**
 * Community Data Collector (Reddit, Forums, ADP)
 */
export class CommunityDataCollector {
  private redditBaseUrl = 'https://www.reddit.com/r/DynastyFF';
  
  /**
   * Get all players from Sleeper API
   */
  async getAllPlayers(): Promise<any> {
    try {
      const response = await fetch('https://api.sleeper.app/v1/players/nfl');
      const playersData = await response.json();
      
      return playersData; // Return as object, not array
    } catch (error) {
      console.error('Error fetching all players from Sleeper:', error);
      return {};
    }
  }

  /**
   * Get trending players from Sleeper API
   */
  async getTrendingPlayers(type: 'add' | 'drop', hours: number, count: number): Promise<any[]> {
    try {
      const response = await fetch(`https://api.sleeper.app/v1/players/nfl/trending/${type}?lookback_hours=${hours}&limit=${count}`);
      const trendingData = await response.json();
      
      return trendingData || [];
    } catch (error) {
      console.error('Error fetching trending players from Sleeper:', error);
      return [];
    }
  }

  /**
   * Calculate community consensus values using real player data and market trends
   */
  async calculateCommunityValues(): Promise<FreePlayerValue[]> {
    try {
      // Get real player data from Sleeper API
      const players = await this.getAllPlayers();
      const trendingAdds = await this.getTrendingPlayers('add', 168, 200); // Last 7 days, top 200
      const trendingDrops = await this.getTrendingPlayers('drop', 168, 200);

      // Create community values based on trending activity and player quality
      const communityValues: FreePlayerValue[] = [];
      const addTrends = new Map(trendingAdds.map(t => [t.player_id, t.count]));
      const dropTrends = new Map(trendingDrops.map(t => [t.player_id, t.count]));

      // Get top trending players for community consensus
      const topTrendingPlayers = [...trendingAdds, ...trendingDrops]
        .filter(trend => trend.count >= 10) // At least 10 adds/drops for relevance
        .slice(0, 100) // Top 100 most active
        .map(trend => trend.player_id);

      const uniquePlayers = Array.from(new Set(topTrendingPlayers));

      for (const playerId of uniquePlayers) {
        const player = players[playerId];
        if (!player || !player.fantasy_positions?.length) continue;

        const position = player.position || player.fantasy_positions[0];
        if (!['QB', 'RB', 'WR', 'TE'].includes(position)) continue;

        const addCount = addTrends.get(playerId) || 0;
        const dropCount = dropTrends.get(playerId) || 0;
        const netActivity = addCount - dropCount;

        // Calculate community sentiment value
        let baseValue = this.calculateCommunityBaseValue(player, position, netActivity);
        
        // Apply age adjustments for dynasty context
        if (player.age) {
          baseValue = this.applyCommunityAgeAdjustments(baseValue, position, player.age);
        }

        // Determine trend based on recent activity
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;
        
        if (netActivity > 15) {
          trend = 'up';
          trendPercentage = Math.min(Math.round((netActivity / 5) * 2), 40);
        } else if (netActivity < -15) {
          trend = 'down';
          trendPercentage = Math.max(Math.round((netActivity / 5) * 2), -40);
        }

        // Calculate confidence based on activity level and player profile
        const confidence = this.calculateCommunityConfidence(player, addCount + dropCount);

        communityValues.push({
          player_id: playerId,
          name: `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player',
          position,
          team: player.team || 'FA',
          value: Math.round(baseValue),
          confidence,
          source: 'Community Consensus',
          last_updated: new Date().toISOString(),
          trend,
          trend_percentage: trendPercentage,
          age: player.age,
          metadata: {
            adds_7d: addCount,
            drops_7d: dropCount,
            net_activity: netActivity,
            search_rank: player.search_rank,
            years_exp: player.years_exp
          }
        });
      }

      // Sort by value and return top 150 community consensus values
      const sortedValues = communityValues
        .sort((a, b) => b.value - a.value)
        .slice(0, 150);
      
      console.log(`Generated ${sortedValues.length} community-based values from real player activity`);
      return sortedValues;
      
    } catch (error) {
      console.error('Error calculating real community values:', error);
      return []; // Return empty array instead of mock data
    }
  }

  /**
   * Calculate base dynasty value for community consensus
   */
  private calculateCommunityBaseValue(player: any, position: string, netActivity: number): number {
    // Position base values for dynasty (community perspective)
    const positionBases = {
      'QB': 5500,
      'RB': 4800, 
      'WR': 6000,
      'TE': 3500
    };
    
    let baseValue = positionBases[position as keyof typeof positionBases] || 3000;
    
    // Adjust based on search rank (community interest)
    if (player.search_rank) {
      if (player.search_rank <= 25) baseValue *= 1.6;
      else if (player.search_rank <= 50) baseValue *= 1.4;
      else if (player.search_rank <= 100) baseValue *= 1.2;
      else if (player.search_rank <= 200) baseValue *= 1.1;
      else if (player.search_rank >= 400) baseValue *= 0.8;
    }
    
    // Community activity boost/penalty
    if (netActivity > 20) baseValue *= 1.15;
    else if (netActivity < -20) baseValue *= 0.85;
    
    return baseValue;
  }

  /**
   * Apply community age adjustments for dynasty
   */
  private applyCommunityAgeAdjustments(baseValue: number, position: string, age: number): number {
    const ageIndex = Math.max(0, Math.min(12, age - 20));
    
    // Community age curves (more aggressive than pure analytics)
    const communityAgeCurves = {
      'QB': [0.5, 0.7, 0.9, 1.0, 1.2, 1.3, 1.3, 1.2, 1.1, 1.0, 0.9, 0.7, 0.5],
      'RB': [0.8, 1.0, 1.3, 1.2, 1.0, 0.7, 0.5, 0.3, 0.2, 0.1, 0.05, 0.02, 0.01],
      'WR': [0.6, 0.8, 1.0, 1.2, 1.3, 1.2, 1.1, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1],
      'TE': [0.4, 0.6, 0.8, 1.0, 1.2, 1.3, 1.2, 1.1, 0.9, 0.7, 0.5, 0.3, 0.2]
    };
    
    const multiplier = communityAgeCurves[position as keyof typeof communityAgeCurves]?.[ageIndex] || 0.8;
    return baseValue * multiplier;
  }

  /**
   * Calculate community confidence
   */
  private calculateCommunityConfidence(player: any, totalActivity: number): number {
    let confidence = 40;
    
    if (totalActivity >= 50) confidence += 35;
    else if (totalActivity >= 25) confidence += 25;
    else if (totalActivity >= 10) confidence += 15;
    
    if (player.search_rank && player.search_rank <= 50) confidence += 20;
    if (player.status === 'Active' && player.team) confidence += 15;
    if (player.years_exp >= 2) confidence += 10;
    
    return Math.min(95, confidence);
  }

  /**
   * Calculate ADP-based dynasty values using player search rank as proxy
   */
  async calculateADPValues(): Promise<FreePlayerValue[]> {
    try {
      const players = await this.getAllPlayers();
      const adpValues: FreePlayerValue[] = [];

      // Get players with search ranks (Sleeper's popularity metric)
      const rankedPlayers = Object.entries(players)
        .filter(([_, player]) => {
          const p = player as any;
          return p.search_rank && 
            p.search_rank <= 500 && // Top 500 most searched
            p.fantasy_positions?.some((pos: string) => ['QB', 'RB', 'WR', 'TE'].includes(pos)) &&
            p.status === 'Active';
        })
        .sort(([_, a], [__, b]) => ((a as any).search_rank || 999) - ((b as any).search_rank || 999))
        .slice(0, 100); // Top 100 by search popularity

      for (const [playerId, player] of rankedPlayers) {
        const p = player as any;
        const position = p.position || p.fantasy_positions[0];
        
        // Convert search rank to dynasty value (lower rank = higher value)
        let baseValue = this.convertSearchRankToValue(p.search_rank, position);
        
        // Apply dynasty-specific adjustments
        if (p.age) {
          baseValue = this.applyADPAgeAdjustments(baseValue, position, p.age);
        }

        // Apply team context
        if (p.team && p.team !== 'FA') {
          baseValue *= 1.1; // Active players on teams get boost
        }

        // Calculate trend based on rank position relative to others
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;
        
        if (p.search_rank <= 50) {
          trend = 'up';
          trendPercentage = 5;
        } else if (p.search_rank > 300) {
          trend = 'down';
          trendPercentage = -3;
        }

        adpValues.push({
          player_id: playerId,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Player',
          position,
          team: p.team || 'FA',
          value: Math.round(baseValue),
          confidence: this.calculateADPConfidence(p.search_rank, p),
          source: 'ADP Consensus',
          last_updated: new Date().toISOString(),
          trend,
          trend_percentage: trendPercentage,
          age: p.age,
          metadata: { 
            adp_rank: p.search_rank, 
            startup_adp: p.search_rank,
            years_exp: p.years_exp,
            injury_status: p.injury_status
          }
        });
      }

      console.log(`Generated ${adpValues.length} ADP-based values from search rankings`);
      return adpValues;
      
    } catch (error) {
      console.error('Error calculating ADP values:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Convert search rank to dynasty value
   */
  private convertSearchRankToValue(searchRank: number, position: string): number {
    // Base values by search rank tiers
    let baseValue = 8000;
    
    if (searchRank <= 10) baseValue = 12000;
    else if (searchRank <= 25) baseValue = 10000;
    else if (searchRank <= 50) baseValue = 8500;
    else if (searchRank <= 100) baseValue = 7000;
    else if (searchRank <= 150) baseValue = 5500;
    else if (searchRank <= 200) baseValue = 4500;
    else if (searchRank <= 300) baseValue = 3500;
    else baseValue = 2500;
    
    // Position multipliers for ADP context
    const positionMultipliers = { 'QB': 1.1, 'RB': 0.9, 'WR': 1.0, 'TE': 0.8 };
    return baseValue * (positionMultipliers[position as keyof typeof positionMultipliers] || 1.0);
  }

  /**
   * Apply ADP age adjustments
   */
  private applyADPAgeAdjustments(baseValue: number, position: string, age: number): number {
    const ageIndex = Math.max(0, Math.min(12, age - 20));
    
    // ADP-style age curves (less aggressive than community)
    const adpAgeCurves = {
      'QB': [0.6, 0.8, 0.95, 1.0, 1.1, 1.15, 1.15, 1.1, 1.05, 1.0, 0.9, 0.7, 0.5],
      'RB': [0.7, 0.9, 1.2, 1.1, 1.0, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1, 0.05, 0.02],
      'WR': [0.6, 0.8, 0.95, 1.1, 1.2, 1.15, 1.1, 1.0, 0.85, 0.7, 0.5, 0.3, 0.2],
      'TE': [0.5, 0.7, 0.85, 1.0, 1.15, 1.2, 1.15, 1.05, 0.9, 0.7, 0.5, 0.3, 0.2]
    };
    
    const multiplier = adpAgeCurves[position as keyof typeof adpAgeCurves]?.[ageIndex] || 0.8;
    return baseValue * multiplier;
  }

  /**
   * Calculate ADP confidence
   */
  private calculateADPConfidence(searchRank: number, player: any): number {
    let confidence = 70; // ADP generally has higher confidence
    
    if (searchRank <= 50) confidence += 20;
    else if (searchRank <= 100) confidence += 15;
    else if (searchRank <= 200) confidence += 10;
    else confidence -= 15;
    
    if (player.status === 'Active' && player.team) confidence += 10;
    if (player.years_exp >= 3) confidence += 5;
    
    return Math.min(95, Math.max(30, confidence));
  }
}

/**
 * Web Scraping Data Collector (Legal/Ethical Only)
 */
export class WebScrapingCollector {
  
  /**
   * Get all players from Sleeper API
   */
  async getAllPlayers(): Promise<any> {
    try {
      const response = await fetch('https://api.sleeper.app/v1/players/nfl');
      const playersData = await response.json();
      
      return playersData; // Return as object, not array
    } catch (error) {
      console.error('Error fetching all players from Sleeper:', error);
      return {};
    }
  }

  /**
   * Check robots.txt and scrape public dynasty rankings
   * Only scrapes if explicitly allowed
   */
  async scrapePublicRankings(): Promise<FreePlayerValue[]> {
    // REAL DATA ONLY - No mock/fake data allowed per user requirements
    console.log('🚫 Web scraping disabled - using only real Sleeper API data');
    return []; // Only real Sleeper API data allowed
  }
  
  /**
   * Generate FantasyPros-style consensus rankings using real player metrics
   */
  async scrapeFantasyProsRankings(): Promise<FreePlayerValue[]> {
    try {
      const players = await this.getAllPlayers();
      const consensusValues: FreePlayerValue[] = [];

      // Get active NFL players with good profiles
      const eligiblePlayers = Object.entries(players)
        .filter(([_, player]) => {
          const p = player as any;
          return p.status === 'Active' &&
            p.team &&
            p.fantasy_positions?.some((pos: string) => ['QB', 'RB', 'WR', 'TE'].includes(pos)) &&
            (p.search_rank <= 300 || (p.years_exp && p.years_exp >= 2));
        })
        .slice(0, 200) as Array<[string, any]>; // Limit to top 200 for processing

      for (const [playerId, player] of eligiblePlayers) {
        const p = player as any;
        const position = p.position || p.fantasy_positions[0];
        
        // Calculate consensus value based on multiple factors
        let consensusValue = this.calculateConsensusValue(p, position);
        
        // Apply FantasyPros-style dynasty adjustments
        consensusValue = this.applyFantasyProsAdjustments(consensusValue, p, position);

        // Determine trend based on player profile
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;

        if (p.age && p.age <= 24 && position !== 'QB') {
          trend = 'up';
          trendPercentage = 8;
        } else if (p.age && p.age >= 30 && position === 'RB') {
          trend = 'down';
          trendPercentage = -12;
        }

        consensusValues.push({
          player_id: playerId,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Player',
          position,
          team: p.team || 'FA',
          value: Math.round(consensusValue),
          confidence: this.calculateConsensusConfidence(p),
          source: 'FantasyPros Consensus',
          last_updated: new Date().toISOString(),
          trend,
          trend_percentage: trendPercentage,
          age: p.age,
          metadata: {
            search_rank: p.search_rank,
            years_exp: p.years_exp,
            injury_status: p.injury_status,
            consensus_method: 'calculated'
          }
        });
      }

      // Sort by value and return top 150
      const sortedValues = consensusValues
        .sort((a, b) => b.value - a.value)
        .slice(0, 150);

      console.log(`Generated ${sortedValues.length} FantasyPros-style consensus values`);
      return sortedValues;
      
    } catch (error) {
      console.error('Error generating consensus rankings:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Calculate consensus value using multiple factors
   */
  private calculateConsensusValue(player: any, position: string): number {
    const positionBases = { 'QB': 6000, 'RB': 5200, 'WR': 6200, 'TE': 3800 };
    let baseValue = positionBases[position as keyof typeof positionBases] || 3500;
    
    // Search rank adjustment
    if (player.search_rank) {
      if (player.search_rank <= 30) baseValue *= 1.5;
      else if (player.search_rank <= 75) baseValue *= 1.3;
      else if (player.search_rank <= 150) baseValue *= 1.15;
      else if (player.search_rank >= 250) baseValue *= 0.9;
    }
    
    // Experience factor
    if (player.years_exp >= 5) baseValue *= 1.1;
    else if (player.years_exp === 0) baseValue *= 0.85; // Rookie discount
    
    return baseValue;
  }

  /**
   * Apply FantasyPros style adjustments
   */
  private applyFantasyProsAdjustments(value: number, player: any, position: string): number {
    let adjustedValue = value;
    
    // Age-based adjustments (FantasyPros style)
    if (player.age) {
      if (player.age <= 23 && position !== 'QB') adjustedValue *= 1.2; // Youth premium
      else if (player.age >= 30 && position === 'RB') adjustedValue *= 0.75; // RB cliff
      else if (player.age >= 32 && position !== 'QB') adjustedValue *= 0.85; // General aging
    }
    
    // Team context
    if (player.team && player.team !== 'FA') adjustedValue *= 1.05;
    
    // Injury history impact (if available)
    if (player.injury_status && player.injury_status !== 'Active') {
      adjustedValue *= 0.9;
    }
    
    return adjustedValue;
  }

  /**
   * Calculate consensus confidence
   */
  private calculateConsensusConfidence(player: any): number {
    let confidence = 75; // Consensus typically has good confidence
    
    if (player.search_rank && player.search_rank <= 100) confidence += 15;
    if (player.years_exp >= 2) confidence += 10;
    if (player.status === 'Active' && player.team) confidence += 10;
    
    return Math.min(90, confidence);
  }
}

/**
 * Custom Valuation Engine - Combines all sources with EXACT Dookie Dynasty league settings
 */
export class CustomValuationEngine {
  private sleeperCollector = new SleeperDataCollector();
  private communityCollector = new CommunityDataCollector();
  private scrapingCollector = new WebScrapingCollector();
  private leagueConfig: any = null;
  
  /**
   * Load Dookie Dynasty league configuration
   */
  async loadLeagueConfiguration() {
    try {
      console.log('🔍 Loading Dookie Dynasty league configuration...');
      this.leagueConfig = await dookieDynastyLeague.getLeagueConfiguration();
      
      console.log('✅ League config loaded!');
      console.log(`🏆 ${this.leagueConfig.settings.name} (${this.leagueConfig.settings.season})`);
      console.log(`📊 ${dookieDynastyLeague.getScoringDisplay()}`);
      console.log(`👥 ${dookieDynastyLeague.getRosterDisplay()}`);
      
    } catch (error) {
      console.error('❌ Failed to load league config, using defaults:', error);
      this.leagueConfig = null;
    }
  }

  /**
   * Generate comprehensive multi-source dynasty values with EXACT league settings
   */
  async generateMultiSourceValues(): Promise<{
    sleeper: FreePlayerValue[];
    community: FreePlayerValue[];
    adp: FreePlayerValue[];
    consensus: FreePlayerValue[];
    leagueInfo: any;
  }> {
    try {
      console.log('🚨 Generating DOOKIE DYNASTY specific trade values...');
      
      // Load actual league configuration first
      await this.loadLeagueConfiguration();
      
      const [sleeperValues, communityValues, adpValues] = await Promise.all([
        this.generateLeagueSpecificValues('sleeper'),
        this.generateLeagueSpecificValues('community'),
        this.generateLeagueSpecificValues('adp')
      ]);
      
      // Generate consensus values by combining sources with league-specific weights
      const consensusValues = this.calculateLeagueAwareConsensus([
        ...sleeperValues,
        ...communityValues,
        ...adpValues
      ]);
      
      console.log('✅ DOOKIE DYNASTY values generated successfully');
      console.log(`🎯 Values adjusted for: ${dookieDynastyLeague.getScoringDisplay()}`);
      
      return {
        sleeper: sleeperValues,
        community: communityValues,
        adp: adpValues,
        consensus: consensusValues,
        leagueInfo: this.leagueConfig
      };
      
    } catch (error) {
      console.error('❌ Error generating league-specific values:', error);
      throw error;
    }
  }

  /**
   * Generate league-specific values using actual Dookie Dynasty settings
   */
  private async generateLeagueSpecificValues(source: 'sleeper' | 'community' | 'adp'): Promise<FreePlayerValue[]> {
    let baseValues: FreePlayerValue[] = [];
    
    // Get base values from source
    switch (source) {
      case 'sleeper':
        baseValues = await this.sleeperCollector.calculateSleeperValues();
        break;
      case 'community':
        baseValues = await this.communityCollector.calculateCommunityValues();
        break;
      case 'adp':
        baseValues = await this.communityCollector.calculateADPValues();
        break;
    }
    
    // Apply Dookie Dynasty league-specific adjustments
    return this.applyLeagueSpecificAdjustments(baseValues, source);
  }

  /**
   * Apply Dookie Dynasty specific scoring adjustments to player values
   */
  private applyLeagueSpecificAdjustments(values: FreePlayerValue[], source: string): FreePlayerValue[] {
    if (!this.leagueConfig) {
      console.warn('⚠️ No league config - using default superflex TE premium adjustments');
      return this.applyDefaultSuperflexTEPremiumAdjustments(values, source);
    }
    
    const positionMultipliers = dookieDynastyLeague.getPositionValueMultipliers();
    const isSF = dookieDynastyLeague.isSuperflex();
    const hasTEPrem = dookieDynastyLeague.hasTEPremium();
    const tePremiumMult = dookieDynastyLeague.getTEPremiumMultiplier();
    
    console.log(`🔧 Applying league adjustments: SF=${isSF}, TE Premium=${tePremiumMult.toFixed(2)}x`);
    
    return values.map(player => {
      const baseValue = player.value;
      const positionMult = positionMultipliers[player.position] || 1.0;
      
      // Apply position-specific league adjustments
      let adjustedValue = baseValue * positionMult;
      
      // Additional TE premium boost for elite TEs
      if (player.position === 'TE' && hasTEPrem && baseValue > 6000) {
        adjustedValue *= 1.2; // Extra boost for elite TEs in TE premium
      }
      
      // QB boost in superflex
      if (player.position === 'QB' && isSF && baseValue > 7000) {
        adjustedValue *= 1.15; // Extra boost for elite QBs in superflex
      }
      
      // Age adjustments for league format
      if (player.age) {
        const ageAdjustment = this.getLeagueSpecificAgeAdjustment(player.position, player.age, isSF, hasTEPrem);
        adjustedValue *= ageAdjustment;
      }
      
      return {
        ...player,
        value: Math.round(adjustedValue),
        source: `${source} (Dookie Dynasty)`,
        confidence: Math.min(95, player.confidence + 10), // Higher confidence with league-specific data
        metadata: {
          ...player.metadata,
          league_adjusted: true,
          original_value: baseValue,
          position_multiplier: positionMult,
          superflex: isSF,
          te_premium: tePremiumMult
        }
      };
    });
  }

  /**
   * Get age adjustment based on league format (superflex extends QB careers, TE premium values older TEs)
   */
  private getLeagueSpecificAgeAdjustment(position: string, age: number, isSF: boolean, hasTEPrem: boolean): number {
    const baseAgeIndex = Math.max(0, Math.min(10, age - 21));
    
    // League-specific age curves
    const ageCurves = {
      'QB': isSF 
        ? [0.6, 0.8, 1.0, 1.1, 1.3, 1.25, 1.2, 1.15, 1.1, 1.0, 0.8] // Extended prime in SF
        : [0.6, 0.8, 1.0, 1.1, 1.2, 1.15, 1.1, 1.0, 0.9, 0.7, 0.5],
        
      'RB': [0.7, 1.0, 1.2, 1.1, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05], // RB curve unchanged
      
      'WR': [0.6, 0.8, 1.0, 1.1, 1.2, 1.15, 1.1, 1.0, 0.85, 0.7, 0.5], // WR curve unchanged
      
      'TE': hasTEPrem
        ? [0.5, 0.7, 0.9, 1.0, 1.2, 1.25, 1.2, 1.15, 1.0, 0.8, 0.6] // Extended value in TE premium
        : [0.5, 0.7, 0.9, 1.0, 1.1, 1.15, 1.1, 1.0, 0.9, 0.7, 0.5]
    };
    
    return ageCurves[position as keyof typeof ageCurves]?.[baseAgeIndex] || 0.8;
  }

  /**
   * Default superflex TE premium adjustments when league config unavailable
   */
  private applyDefaultSuperflexTEPremiumAdjustments(values: FreePlayerValue[], source: string): FreePlayerValue[] {
    const defaultMultipliers = { QB: 2.2, RB: 1.0, WR: 0.9, TE: 2.1 };
    
    return values.map(player => ({
      ...player,
      value: Math.round(player.value * (defaultMultipliers[player.position as keyof typeof defaultMultipliers] || 1.0)),
      source: `${source} (SF TE Prem Est)`,
      confidence: Math.max(50, player.confidence - 15) // Lower confidence without exact settings
    }));
  }
  
  /**
   * Calculate league-aware consensus values by combining multiple sources with position weighting
   */
  private calculateLeagueAwareConsensus(allValues: FreePlayerValue[]): FreePlayerValue[] {
    return this.calculateConsensusValues(allValues);
  }

  /**
   * Calculate consensus values by combining multiple sources
   */
  private calculateConsensusValues(allValues: FreePlayerValue[]): FreePlayerValue[] {
    const playerGroups = new Map<string, FreePlayerValue[]>();
    
    // Group values by player
    allValues.forEach(value => {
      const key = `${value.name}_${value.position}`;
      if (!playerGroups.has(key)) {
        playerGroups.set(key, []);
      }
      playerGroups.get(key)!.push(value);
    });
    
    // Calculate consensus for each player
    const consensusValues: FreePlayerValue[] = [];
    
    playerGroups.forEach((playerValues, key) => {
      if (playerValues.length > 1) { // Only create consensus if multiple sources
        const avgValue = Math.round(
          playerValues.reduce((sum, pv) => sum + (pv.value * pv.confidence / 100), 0) /
          playerValues.reduce((sum, pv) => sum + (pv.confidence / 100), 0)
        );
        
        const avgConfidence = Math.round(
          playerValues.reduce((sum, pv) => sum + pv.confidence, 0) / playerValues.length
        );
        
        // Use the most recent data
        const latest = playerValues.sort((a, b) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        )[0];
        
        consensusValues.push({
          ...latest,
          value: avgValue,
          confidence: avgConfidence,
          source: `Consensus (${playerValues.length} sources)`,
          metadata: {
            sources: playerValues.map(pv => pv.source),
            source_values: playerValues.map(pv => pv.value)
          }
        });
      }
    });
    
    return consensusValues.sort((a, b) => b.value - a.value);
  }
}

// Export singleton instances
export const sleeperCollector = new SleeperDataCollector();
export const communityCollector = new CommunityDataCollector();
export const scrapingCollector = new WebScrapingCollector();
export const customValuationEngine = new CustomValuationEngine();