/**
 * Dookie Dynasty League-Specific API Service
 * Pulls EXACT league settings from Sleeper API to ensure accurate trade values
 */

import axios from 'axios';

export interface DookieLeagueSettings {
  // Scoring Settings
  pass_yd: number;
  pass_td: number;
  pass_int: number;
  rush_yd: number;
  rush_td: number;
  rec_yd: number;
  rec: number;
  rec_td: number;
  te_ppr?: number; // TE Premium multiplier
  first_down_pass?: number;
  first_down_rush?: number;
  first_down_rec?: number;
  
  // Roster Settings
  roster_positions: string[];
  total_rosters: number;
  
  // League Info
  name: string;
  season: string;
  scoring_settings: any;
  settings: any;
}

export interface DookieRosterRequirements {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  SUPER_FLEX: number;
  K: number;
  DEF: number;
  BN: number;
  TAXI?: number;
}

export interface DookieScoringBreakdown {
  position: string;
  scoring_multipliers: {
    passing?: number;
    rushing?: number;
    receiving?: number;
    te_premium?: number;
    first_down_bonus?: number;
  };
  positional_value_impact: number; // How much this scoring affects position value
}

/**
 * Service to fetch and analyze Dookie Dynasty league configuration
 */
export class DookieDynastyLeagueService {
  private readonly LEAGUE_ID = '1313238117100056576';
  private readonly SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
  
  private leagueData: any = null;
  private scoringAnalysis: DookieScoringBreakdown[] = [];
  private rosterRequirements: DookieRosterRequirements | null = null;

  /**
   * Fetch complete league configuration
   */
  async getLeagueConfiguration(): Promise<{
    settings: DookieLeagueSettings;
    roster: DookieRosterRequirements;
    scoring: DookieScoringBreakdown[];
    raw_data: any;
  }> {
    try {
      console.log('🔍 Fetching Dookie Dynasty league configuration...');
      
      const response = await axios.get(`${this.SLEEPER_BASE_URL}/league/${this.LEAGUE_ID}`, {
        timeout: 10000
      });
      
      this.leagueData = response.data;
      
      const settings = this.parseLeagueSettings();
      const roster = this.parseRosterRequirements();
      const scoring = this.analyzeScoringImpact();
      
      console.log('✅ Dookie Dynasty league configuration loaded!');
      console.log('📊 League Name:', settings.name);
      console.log('🏆 Season:', settings.season);
      console.log('👥 Total Teams:', settings.total_rosters);
      console.log('🎯 Roster Format:', roster);
      console.log('⚖️ Scoring Analysis:', scoring);
      
      return {
        settings,
        roster,
        scoring,
        raw_data: this.leagueData
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch Dookie Dynasty league data:', error);
      throw new Error('Could not load league configuration');
    }
  }

  /**
   * Parse league scoring settings
   */
  private parseLeagueSettings(): DookieLeagueSettings {
    const scoring = this.leagueData.scoring_settings || {};
    const settings = this.leagueData.settings || {};
    
    return {
      // Passing
      pass_yd: scoring.pass_yd || 0,
      pass_td: scoring.pass_td || 0,
      pass_int: scoring.pass_int || 0,
      
      // Rushing
      rush_yd: scoring.rush_yd || 0,
      rush_td: scoring.rush_td || 0,
      
      // Receiving
      rec_yd: scoring.rec_yd || 0,
      rec: scoring.rec || 0,
      rec_td: scoring.rec_td || 0,
      
      // TE Premium (this is the key!)
      te_ppr: scoring.te_ppr || scoring.rec_te || null,
      
      // First Down Bonuses
      first_down_pass: scoring.first_down_pass || 0,
      first_down_rush: scoring.first_down_rush || 0,
      first_down_rec: scoring.first_down_rec || 0,
      
      // League Structure
      roster_positions: this.leagueData.roster_positions || [],
      total_rosters: this.leagueData.total_rosters || 0,
      name: this.leagueData.name || 'Dookie Dynasty',
      season: this.leagueData.season || '2024',
      
      // Raw data for reference
      scoring_settings: scoring,
      settings: settings
    };
  }

  /**
   * Parse roster requirements and starting lineup
   */
  private parseRosterRequirements(): DookieRosterRequirements {
    const positions = this.leagueData.roster_positions || [];
    
    const requirements: DookieRosterRequirements = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      FLEX: 0,
      SUPER_FLEX: 0,
      K: 0,
      DEF: 0,
      BN: 0,
      TAXI: 0
    };
    
    // Count each position requirement
    positions.forEach((pos: string) => {
      switch (pos) {
        case 'QB':
          requirements.QB++;
          break;
        case 'RB':
          requirements.RB++;
          break;
        case 'WR':
          requirements.WR++;
          break;
        case 'TE':
          requirements.TE++;
          break;
        case 'FLEX':
        case 'RB/WR':
        case 'RB/WR/TE':
          requirements.FLEX++;
          break;
        case 'SUPER_FLEX':
        case 'QB/RB/WR/TE':
          requirements.SUPER_FLEX++;
          break;
        case 'K':
          requirements.K++;
          break;
        case 'DEF':
          requirements.DEF++;
          break;
        case 'BN':
          requirements.BN++;
          break;
        case 'TAXI':
          requirements.TAXI = (requirements.TAXI || 0) + 1;
          break;
      }
    });
    
    this.rosterRequirements = requirements;
    return requirements;
  }

  /**
   * Analyze scoring impact on position values
   */
  private analyzeScoringImpact(): DookieScoringBreakdown[] {
    const settings = this.parseLeagueSettings();
    const roster = this.parseRosterRequirements();
    
    const scoring: DookieScoringBreakdown[] = [
      {
        position: 'QB',
        scoring_multipliers: {
          passing: settings.pass_yd,
          first_down_bonus: settings.first_down_pass
        },
        positional_value_impact: this.calculateQBValueImpact(settings, roster)
      },
      {
        position: 'RB',
        scoring_multipliers: {
          rushing: settings.rush_yd,
          receiving: settings.rec_yd,
          first_down_bonus: (settings.first_down_rush || 0) + (settings.first_down_rec || 0)
        },
        positional_value_impact: this.calculateRBValueImpact(settings, roster)
      },
      {
        position: 'WR',
        scoring_multipliers: {
          receiving: settings.rec_yd,
          first_down_bonus: settings.first_down_rec
        },
        positional_value_impact: this.calculateWRValueImpact(settings, roster)
      },
      {
        position: 'TE',
        scoring_multipliers: {
          receiving: settings.rec_yd,
          te_premium: settings.te_ppr,
          first_down_bonus: settings.first_down_rec
        },
        positional_value_impact: this.calculateTEValueImpact(settings, roster)
      }
    ];
    
    this.scoringAnalysis = scoring;
    return scoring;
  }

  /**
   * Calculate QB value impact from superflex
   */
  private calculateQBValueImpact(settings: DookieLeagueSettings, roster: DookieRosterRequirements): number {
    const baseMultiplier = 1.0;
    
    // Superflex impact - each superflex spot adds significant QB value
    const superflexBoost = roster.SUPER_FLEX * 0.8; // 80% boost per SF spot
    
    // QB scarcity - only ~32 startable QBs for potentially 24+ starting spots (12 teams x 2 QB spots)
    const scarcityMultiplier = (roster.QB + roster.SUPER_FLEX) * (settings.total_rosters || 12) / 32;
    
    return baseMultiplier + superflexBoost + Math.max(0, scarcityMultiplier - 1);
  }

  /**
   * Calculate RB value impact  
   */
  private calculateRBValueImpact(settings: DookieLeagueSettings, roster: DookieRosterRequirements): number {
    const baseMultiplier = 1.0;
    
    // First down bonuses help possession backs
    const firstDownBoost = ((settings.first_down_rush || 0) + (settings.first_down_rec || 0)) * 0.1;
    
    // RB scarcity remains high
    const scarcityBoost = 0.2;
    
    return baseMultiplier + firstDownBoost + scarcityBoost;
  }

  /**
   * Calculate WR value impact
   */
  private calculateWRValueImpact(settings: DookieLeagueSettings, roster: DookieRosterRequirements): number {
    const baseMultiplier = 1.0;
    
    // First down bonuses help possession receivers
    const firstDownBoost = (settings.first_down_rec || 0) * 0.1;
    
    // WRs less relatively valuable in superflex (QB/TE premium takes share)
    const superflexPenalty = roster.SUPER_FLEX * -0.1;
    
    return baseMultiplier + firstDownBoost + superflexPenalty;
  }

  /**
   * Calculate TE value impact from TE premium
   */
  private calculateTEValueImpact(settings: DookieLeagueSettings, roster: DookieRosterRequirements): number {
    const baseMultiplier = 1.0;
    
    // TE Premium is THE key factor
    const tePremiumMultiplier = settings.te_ppr ? (settings.te_ppr / settings.rec) : 1.75; // Default to 1.75x if not found
    
    // First down bonuses
    const firstDownBoost = (settings.first_down_rec || 0) * 0.1;
    
    // TE scarcity - only ~4-6 elite TEs
    const scarcityBoost = 0.5;
    
    return (baseMultiplier + firstDownBoost + scarcityBoost) * tePremiumMultiplier;
  }

  /**
   * Get position value multipliers for trade calculations
   */
  getPositionValueMultipliers(): { [position: string]: number } {
    if (!this.scoringAnalysis.length) {
      // Return default superflex TE premium multipliers if data not loaded
      return {
        'QB': 2.2,
        'RB': 1.0,
        'WR': 0.9,
        'TE': 2.1
      };
    }
    
    const multipliers: { [position: string]: number } = {};
    
    this.scoringAnalysis.forEach(analysis => {
      multipliers[analysis.position] = analysis.positional_value_impact;
    });
    
    return multipliers;
  }

  /**
   * Get display-friendly scoring summary
   */
  getScoringDisplay(): string {
    if (!this.leagueData) return 'League data not loaded';
    
    const settings = this.parseLeagueSettings();
    const roster = this.parseRosterRequirements();
    
    const scoringFeatures = [];
    
    // Check for superflex
    if (roster.SUPER_FLEX > 0) {
      scoringFeatures.push(`🏆 Superflex (${roster.SUPER_FLEX} SF spots)`);
    }
    
    // Check for TE premium
    if (settings.te_ppr && settings.te_ppr > settings.rec) {
      const premiumMultiplier = settings.te_ppr / settings.rec;
      scoringFeatures.push(`🔥 TE Premium (${premiumMultiplier.toFixed(2)}x)`);
    }
    
    // Check for first down bonuses
    if (settings.first_down_rec || settings.first_down_rush || settings.first_down_pass) {
      scoringFeatures.push(`📈 First Down Bonuses`);
    }
    
    return scoringFeatures.join(' • ') || 'Standard Scoring';
  }

  /**
   * Get league roster summary
   */
  getRosterDisplay(): string {
    if (!this.rosterRequirements) return 'Roster data not loaded';
    
    const r = this.rosterRequirements;
    
    const startingPositions = [];
    if (r.QB > 0) startingPositions.push(`${r.QB} QB`);
    if (r.SUPER_FLEX > 0) startingPositions.push(`${r.SUPER_FLEX} SF`);
    if (r.RB > 0) startingPositions.push(`${r.RB} RB`);
    if (r.WR > 0) startingPositions.push(`${r.WR} WR`);
    if (r.TE > 0) startingPositions.push(`${r.TE} TE`);
    if (r.FLEX > 0) startingPositions.push(`${r.FLEX} FLEX`);
    
    return startingPositions.join(', ') + ` + ${r.BN} Bench`;
  }

  /**
   * Check if league is superflex
   */
  isSuperflex(): boolean {
    return this.rosterRequirements ? this.rosterRequirements.SUPER_FLEX > 0 : false;
  }

  /**
   * Check if league has TE premium
   */
  hasTEPremium(): boolean {
    if (!this.leagueData?.scoring_settings) return false;
    
    const scoring = this.leagueData.scoring_settings;
    const regularPPR = scoring.rec || 1;
    const tePPR = scoring.te_ppr || scoring.rec_te || regularPPR;
    
    return tePPR > regularPPR;
  }

  /**
   * Get TE premium multiplier
   */
  getTEPremiumMultiplier(): number {
    if (!this.leagueData?.scoring_settings) return 1.0;
    
    const scoring = this.leagueData.scoring_settings;
    const regularPPR = scoring.rec || 1;
    const tePPR = scoring.te_ppr || scoring.rec_te || regularPPR;
    
    return tePPR / regularPPR;
  }
}

// Export singleton
export const dookieDynastyLeague = new DookieDynastyLeagueService();