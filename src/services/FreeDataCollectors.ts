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
        .filter(([_, player]) => 
          player.fantasy_positions && 
          ['QB', 'RB', 'WR', 'TE'].some(pos => player.fantasy_positions.includes(pos)) &&
          player.status === 'Active'
        )
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
   * Calculate community consensus values (mock implementation)
   * In production, this would scrape Reddit dynasty threads and forums
   */
  async calculateCommunityValues(): Promise<FreePlayerValue[]> {
    // Mock community values based on common dynasty consensus
    const communityValues: FreePlayerValue[] = [
      {
        player_id: '5892',
        name: 'Justin Jefferson',
        position: 'WR',
        team: 'MIN',
        value: 12500,
        confidence: 95,
        source: 'r/DynastyFF',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        trend_percentage: 2,
        age: 25
      },
      {
        player_id: '6794',
        name: "Ja'Marr Chase",
        position: 'WR', 
        team: 'CIN',
        value: 11800,
        confidence: 93,
        source: 'r/DynastyFF',
        last_updated: new Date().toISOString(),
        trend: 'up',
        trend_percentage: 8,
        age: 24
      },
      {
        player_id: '8110',
        name: 'Bijan Robinson',
        position: 'RB',
        team: 'ATL',
        value: 10200,
        confidence: 88,
        source: 'r/DynastyFF',
        last_updated: new Date().toISOString(),
        trend: 'up',
        trend_percentage: 15,
        age: 22
      }
    ];
    
    console.log(`Generated ${communityValues.length} community-based values`);
    return communityValues;
  }

  /**
   * Get ADP-based dynasty values (mock implementation) 
   * In production, this would integrate with fantasy football calculator or similar
   */
  async calculateADPValues(): Promise<FreePlayerValue[]> {
    // Mock ADP values - convert draft position to dynasty value
    const adpValues: FreePlayerValue[] = [
      {
        player_id: '4034',
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        value: 9500,
        confidence: 90,
        source: 'ADP Consensus',
        last_updated: new Date().toISOString(),
        trend: 'stable',
        trend_percentage: 0,
        age: 29,
        metadata: { adp_rank: 1.2, startup_adp: 8.5 }
      }
    ];
    
    return adpValues;
  }
}

/**
 * Web Scraping Data Collector (Legal/Ethical Only)
 */
export class WebScrapingCollector {
  
  /**
   * Check robots.txt and scrape public dynasty rankings
   * Only scrapes if explicitly allowed
   */
  async scrapePublicRankings(): Promise<FreePlayerValue[]> {
    // For now, return mock data
    // In production, implement respectful scraping with rate limiting
    
    console.log('Web scraping not implemented - using mock data');
    return [];
  }
  
  /**
   * Scrape FantasyPros dynasty consensus rankings (free tier)
   */
  async scrapeFantasyProsRankings(): Promise<FreePlayerValue[]> {
    // Mock implementation - would scrape free consensus rankings
    const mockValues: FreePlayerValue[] = [
      {
        player_id: '7568',
        name: 'CeeDee Lamb',
        position: 'WR',
        team: 'DAL', 
        value: 9800,
        confidence: 85,
        source: 'FantasyPros Consensus',
        last_updated: new Date().toISOString(),
        trend: 'up',
        trend_percentage: 5,
        age: 25
      }
    ];
    
    return mockValues;
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