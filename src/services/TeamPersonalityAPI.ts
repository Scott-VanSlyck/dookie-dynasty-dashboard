/**
 * Team Personality API
 * Analyzes roster construction to determine team "personalities" and strategic approaches
 */

import { DookieTeam } from '../types';

export interface PersonalityTrait {
  name: string;
  description: string;
  icon: string;
  color: string;
  strength: number; // 0-100
}

export interface TeamPersonality {
  teamId: string;
  primaryPersonality: PersonalityProfile;
  secondaryPersonality?: PersonalityProfile;
  traits: PersonalityTrait[];
  overallStrategy: string;
  rosterAnalysis: RosterAnalysis;
  confidence: number; // How confident we are in this assessment (0-100)
}

export interface PersonalityProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  characteristics: string[];
  strategy: string;
}

export interface RosterAnalysis {
  averageAge: number;
  ageDistribution: {
    young: number; // ≤24
    prime: number; // 25-27
    veteran: number; // ≥28
  };
  valueDistribution: {
    stars: number; // High-value players
    solid: number; // Mid-tier players
    depth: number; // Low-value players
  };
  positionBalance: {
    [position: string]: number;
  };
  riskProfile: {
    highRisk: number; // Boom/bust players
    mediumRisk: number;
    lowRisk: number; // Consistent producers
  };
  contractSituation: {
    rookieContracts: number;
    expiringSoon: number;
    longTerm: number;
  };
}

class TeamPersonalityAPI {
  private personalityProfiles: PersonalityProfile[] = [
    {
      id: 'win_now',
      name: 'Win Now',
      description: 'Veteran-heavy roster focused on immediate championship contention',
      icon: '🏆',
      color: '#ff6b35',
      characteristics: [
        'High average roster age (27+)',
        'Multiple elite veteran players',
        'Willing to trade picks for proven talent',
        'Strong starting lineup, may lack depth'
      ],
      strategy: 'Championship window is open - maximize current talent'
    },
    {
      id: 'rebuilding',
      name: 'Rebuilding',
      description: 'Youth movement focused on future potential over current production',
      icon: '🏗️',
      color: '#4ecdc4',
      characteristics: [
        'Low average roster age (≤25)',
        'Multiple rookie and 2nd year players',
        'Stockpiling draft picks',
        'Prioritizing upside over floor'
      ],
      strategy: 'Building for the future through young talent and draft capital'
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Mix of veterans and youth with sustainable roster construction',
      icon: '⚖️',
      color: '#45b7d1',
      characteristics: [
        'Balanced age distribution',
        'Mix of proven veterans and promising youth',
        'Moderate risk tolerance',
        'Sustainable roster management'
      ],
      strategy: 'Compete now while building for sustained success'
    },
    {
      id: 'risk_taker',
      name: 'High-Risk High-Reward',
      description: 'Roster full of boom-or-bust players with massive upside potential',
      icon: '🎲',
      color: '#ff4757',
      characteristics: [
        'Multiple high-variance players',
        'Injury-prone stars',
        'Rookies with huge potential',
        'Feast or famine approach'
      ],
      strategy: 'Swing for the fences - championship or bust'
    },
    {
      id: 'conservative',
      name: 'Safe & Steady',
      description: 'Consistent, reliable players with high floors and low ceilings',
      icon: '🛡️',
      color: '#2ed573',
      characteristics: [
        'High-floor, low-ceiling players',
        'Avoid injury-prone players',
        'Predictable weekly production',
        'Risk-averse approach'
      ],
      strategy: 'Minimize variance and maintain consistent performance'
    },
    {
      id: 'value_hunter',
      name: 'Value Hunter',
      description: 'Opportunistic approach focused on finding undervalued talent',
      icon: '🎯',
      color: '#ffa502',
      characteristics: [
        'Mix of breakout candidates',
        'Players in contract years',
        'Undervalued due to situation',
        'Opportunistic trading'
      ],
      strategy: 'Find market inefficiencies and capitalize on value'
    },
    {
      id: 'positional_specialist',
      name: 'Positional Specialist',
      description: 'Heavily invested in one or two positions while ignoring others',
      icon: '🎪',
      color: '#8b5cf6',
      characteristics: [
        'Extreme depth at certain positions',
        'Significant weaknesses elsewhere',
        'Position-specific strategy',
        'Unbalanced roster construction'
      ],
      strategy: 'Dominate at key positions, manage weaknesses'
    },
    {
      id: 'the_wildcard',
      name: 'The Wildcard',
      description: 'Unpredictable roster moves that don\'t fit conventional strategy',
      icon: '🃏',
      color: '#e056fd',
      characteristics: [
        'Seemingly random roster decisions',
        'Contrarian approach',
        'Unusual player combinations',
        'Defies conventional wisdom'
      ],
      strategy: 'Unpredictable - either genius or chaos'
    }
  ];

  /**
   * Analyze team personality based on roster construction
   */
  async analyzeTeamPersonality(team: DookieTeam, allTeams: DookieTeam[]): Promise<TeamPersonality> {
    const rosterAnalysis = this.analyzeRoster(team);
    const personalityScores = this.calculatePersonalityScores(rosterAnalysis, team, allTeams);
    
    // Get primary and secondary personalities
    const sortedPersonalities = personalityScores
      .sort((a, b) => b.score - a.score);
    
    const primary = sortedPersonalities[0];
    const secondary = sortedPersonalities[1].score > 30 ? sortedPersonalities[1] : undefined;

    // Generate personality traits
    const traits = this.generatePersonalityTraits(rosterAnalysis, personalityScores);

    // Calculate confidence based on score gap
    const scoreGap = primary.score - (secondary?.score || 0);
    const confidence = Math.min(100, Math.max(60, scoreGap + 50));

    const overallStrategy = this.generateOverallStrategy(primary, secondary, rosterAnalysis);

    return {
      teamId: String(team.roster_id),
      primaryPersonality: primary.profile,
      secondaryPersonality: secondary?.profile,
      traits,
      overallStrategy,
      rosterAnalysis,
      confidence
    };
  }

  /**
   * Analyze roster composition and characteristics
   */
  private analyzeRoster(team: DookieTeam): RosterAnalysis {
    // Players data not available yet in pre-season - return empty analysis
    return this.getEmptyRosterAnalysis();

    // Player data will be available when rosters are set - return empty for now
  }

  /**
   * Calculate personality scores for each profile
   */
  private calculatePersonalityScores(
    analysis: RosterAnalysis, 
    team: DookieTeam, 
    allTeams: DookieTeam[]
  ): Array<{ profile: PersonalityProfile; score: number }> {
    return this.personalityProfiles.map(profile => {
      let score = 0;

      switch (profile.id) {
        case 'win_now':
          score += analysis.averageAge >= 27 ? 30 : 0;
          score += analysis.ageDistribution.veteran > 40 ? 25 : 0;
          score += analysis.valueDistribution.stars > 30 ? 20 : 0;
          score += analysis.riskProfile.lowRisk > 50 ? 15 : 0;
          break;

        case 'rebuilding':
          score += analysis.averageAge <= 25 ? 30 : 0;
          score += analysis.ageDistribution.young > 40 ? 25 : 0;
          score += analysis.contractSituation.rookieContracts > 30 ? 20 : 0;
          score += analysis.riskProfile.highRisk > 40 ? 15 : 0;
          break;

        case 'balanced':
          const ageBalance = Math.abs(33.3 - analysis.ageDistribution.young) + 
                           Math.abs(33.3 - analysis.ageDistribution.prime) + 
                           Math.abs(33.3 - analysis.ageDistribution.veteran);
          score += ageBalance < 20 ? 30 : 0;
          score += analysis.averageAge >= 25 && analysis.averageAge <= 27 ? 25 : 0;
          score += analysis.riskProfile.mediumRisk > 40 ? 20 : 0;
          break;

        case 'risk_taker':
          score += analysis.riskProfile.highRisk > 50 ? 30 : 0;
          score += analysis.ageDistribution.young > 30 ? 20 : 0;
          score += analysis.valueDistribution.stars > 25 ? 15 : 0;
          break;

        case 'conservative':
          score += analysis.riskProfile.lowRisk > 60 ? 30 : 0;
          score += analysis.ageDistribution.prime > 40 ? 20 : 0;
          score += analysis.valueDistribution.solid > 50 ? 15 : 0;
          break;

        case 'value_hunter':
          // Look for teams with lots of mid-tier players who might be undervalued
          score += analysis.valueDistribution.solid > 60 ? 25 : 0;
          score += analysis.riskProfile.mediumRisk > 50 ? 20 : 0;
          break;

        case 'positional_specialist':
          // Check for extreme imbalance in position distribution
          const positions = Object.values(analysis.positionBalance);
          const maxPosition = Math.max(...positions);
          const minPosition = Math.min(...positions.filter(p => p > 0));
          score += maxPosition > 35 ? 30 : 0;
          score += (maxPosition - minPosition) > 25 ? 20 : 0;
          break;

        case 'the_wildcard':
          // Wildcard gets points for being unusual
          const totalOtherScores = this.personalityProfiles
            .filter(p => p.id !== 'the_wildcard')
            .map(p => this.calculatePersonalityScores(analysis, team, allTeams)
              .find(s => s.profile.id === p.id)?.score || 0)
            .reduce((sum, s) => sum + s, 0);
          score += totalOtherScores < 100 ? 40 : 0; // If no clear personality fits
          break;
      }

      return { profile, score: Math.min(100, score) };
    });
  }

  /**
   * Generate personality traits based on analysis
   */
  private generatePersonalityTraits(
    analysis: RosterAnalysis, 
    personalityScores: Array<{ profile: PersonalityProfile; score: number }>
  ): PersonalityTrait[] {
    const traits: PersonalityTrait[] = [];

    // Age-based traits
    if (analysis.averageAge >= 28) {
      traits.push({
        name: 'Veteran Leadership',
        description: 'Experience and wisdom guide this roster',
        icon: '🧓',
        color: '#8b5a2b',
        strength: Math.min(100, (analysis.averageAge - 25) * 20)
      });
    }

    if (analysis.ageDistribution.young > 35) {
      traits.push({
        name: 'Youth Movement',
        description: 'Building around young, developing talent',
        icon: '👶',
        color: '#4ecdc4',
        strength: analysis.ageDistribution.young
      });
    }

    // Value-based traits
    if (analysis.valueDistribution.stars > 25) {
      traits.push({
        name: 'Star Power',
        description: 'Elite talent at key positions',
        icon: '⭐',
        color: '#ffd700',
        strength: analysis.valueDistribution.stars * 2
      });
    }

    // Risk-based traits
    if (analysis.riskProfile.highRisk > 40) {
      traits.push({
        name: 'High-Risk Tolerance',
        description: 'Comfortable with boom-or-bust players',
        icon: '🎲',
        color: '#ff4757',
        strength: analysis.riskProfile.highRisk
      });
    }

    if (analysis.riskProfile.lowRisk > 60) {
      traits.push({
        name: 'Risk Averse',
        description: 'Prefers safe, consistent production',
        icon: '🛡️',
        color: '#2ed573',
        strength: analysis.riskProfile.lowRisk
      });
    }

    // Position-based traits
    const qbPercent = analysis.positionBalance['QB'] || 0;
    const rbPercent = analysis.positionBalance['RB'] || 0;
    const wrPercent = analysis.positionBalance['WR'] || 0;

    if (wrPercent > 40) {
      traits.push({
        name: 'WR Heavy',
        description: 'Built around wide receiver depth',
        icon: '🏃‍♂️',
        color: '#ff6b35',
        strength: wrPercent * 2
      });
    }

    if (rbPercent > 30) {
      traits.push({
        name: 'Ground Game Focus',
        description: 'Investing heavily in running backs',
        icon: '💪',
        color: '#8b5cf6',
        strength: rbPercent * 2
      });
    }

    return traits.slice(0, 5); // Limit to top 5 traits
  }

  /**
   * Generate overall strategy description
   */
  private generateOverallStrategy(
    primary: { profile: PersonalityProfile; score: number },
    secondary: { profile: PersonalityProfile; score: number } | undefined,
    analysis: RosterAnalysis
  ): string {
    let strategy = primary.profile.strategy;

    if (secondary && secondary.score > 30) {
      strategy += ` with ${secondary.profile.name.toLowerCase()} tendencies`;
    }

    // Add specific roster context
    if (analysis.averageAge < 25) {
      strategy += '. Prioritizing long-term development over immediate results.';
    } else if (analysis.averageAge > 28) {
      strategy += '. Championship window may be closing - time to capitalize.';
    } else {
      strategy += '. In the sweet spot for sustained competitiveness.';
    }

    return strategy;
  }

  /**
   * Get empty roster analysis for teams with no players
   */
  private getEmptyRosterAnalysis(): RosterAnalysis {
    return {
      averageAge: 0,
      ageDistribution: { young: 0, prime: 0, veteran: 0 },
      valueDistribution: { stars: 0, solid: 0, depth: 0 },
      positionBalance: {},
      riskProfile: { highRisk: 0, mediumRisk: 0, lowRisk: 0 },
      contractSituation: { rookieContracts: 0, expiringSoon: 0, longTerm: 0 }
    };
  }

  /**
   * Analyze personalities for all teams
   */
  async analyzeAllTeamPersonalities(teams: DookieTeam[]): Promise<TeamPersonality[]> {
    const results: TeamPersonality[] = [];

    for (const team of teams) {
      const personality = await this.analyzeTeamPersonality(team, teams);
      results.push(personality);
    }

    return results;
  }

  /**
   * Get league personality distribution
   */
  async getLeaguePersonalityDistribution(teams: DookieTeam[]): Promise<{
    [personalityId: string]: {
      count: number;
      percentage: number;
      teams: string[];
    }
  }> {
    const personalities = await this.analyzeAllTeamPersonalities(teams);
    const distribution: { [key: string]: { count: number; percentage: number; teams: string[] } } = {};

    // Initialize all personalities
    this.personalityProfiles.forEach(profile => {
      distribution[profile.id] = { count: 0, percentage: 0, teams: [] };
    });

    // Count primary personalities
    personalities.forEach(personality => {
      const primaryId = personality.primaryPersonality.id;
      distribution[primaryId].count++;
      distribution[primaryId].teams.push(personality.teamId);
    });

    // Calculate percentages
    Object.values(distribution).forEach(dist => {
      dist.percentage = (dist.count / teams.length) * 100;
    });

    return distribution;
  }

  /**
   * Get personality recommendations for team improvement
   */
  getPersonalityRecommendations(personality: TeamPersonality): string[] {
    const recommendations: string[] = [];
    const analysis = personality.rosterAnalysis;

    switch (personality.primaryPersonality.id) {
      case 'win_now':
        if (analysis.valueDistribution.depth > 40) {
          recommendations.push('Consider trading depth pieces for impact players');
        }
        if (analysis.averageAge > 30) {
          recommendations.push('Monitor aging veterans - consider succession planning');
        }
        break;

      case 'rebuilding':
        if (analysis.valueDistribution.stars < 15) {
          recommendations.push('Target a foundational superstar to build around');
        }
        if (analysis.ageDistribution.veteran > 25) {
          recommendations.push('Consider moving veteran assets for picks/young talent');
        }
        break;

      case 'risk_taker':
        if (analysis.riskProfile.lowRisk < 20) {
          recommendations.push('Add some safe floor players for consistency');
        }
        break;

      case 'conservative':
        if (analysis.valueDistribution.stars < 20) {
          recommendations.push('Consider adding more high-upside players');
        }
        break;
    }

    return recommendations;
  }
}

export const teamPersonalityAPI = new TeamPersonalityAPI();