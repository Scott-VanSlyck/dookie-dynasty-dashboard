/**
 * Dynasty Achievements API
 * Tracks and calculates achievements for teams based on performance and roster construction
 */

import { DookieTeam } from '../types';
import { sleeperAPI } from './SleeperAPI';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trading' | 'roster' | 'performance' | 'draft' | 'consistency';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  points: number; // Achievement points for gamification
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number; // 0-100 for partially completed achievements
  requirement: string; // What they need to do to unlock it
}

export interface TeamAchievements {
  teamId: string;
  achievements: Achievement[];
  totalPoints: number;
  completionRate: number; // Percentage of available achievements unlocked
  recentUnlocks: Achievement[]; // Last 3 unlocked achievements
  nextToUnlock: Achievement[]; // Closest achievements to unlocking
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Achievement['category'];
  rarity: Achievement['rarity'];
  points: number;
  requirement: string;
  checkUnlocked: (team: DookieTeam, teams: DookieTeam[], seasonData?: any) => {
    unlocked: boolean;
    progress?: number;
  };
}

class DynastyAchievementsAPI {
  private achievementDefinitions: AchievementDefinition[] = [
    // ROSTER ACHIEVEMENTS
    {
      id: 'youth_movement',
      name: 'Youth Movement',
      description: 'Have the youngest average roster age in the league',
      icon: '👶',
      category: 'roster',
      rarity: 'uncommon',
      points: 25,
      requirement: 'Build the youngest team in the league',
      checkUnlocked: (team, teams) => {
        // Players data not yet available in pre-season - return progress based on team structure
        const unlocked = false; // Will be determined when player data is available
        const progress = 25; // Placeholder progress
        
        return { unlocked, progress };
      }
    },
    {
      id: 'veteran_collector',
      name: 'Veteran Collector',
      description: 'Have the oldest average roster age in the league',
      icon: '🧓',
      category: 'roster',
      rarity: 'uncommon',
      points: 25,
      requirement: 'Build the oldest team in the league',
      checkUnlocked: (team, teams) => {
        // Players data not yet available in pre-season - return progress based on team structure
        const unlocked = false; // Will be determined when player data is available
        const progress = 15; // Placeholder progress
        
        return { unlocked, progress };
      }
    },
    {
      id: 'balanced_roster',
      name: 'Perfectly Balanced',
      description: 'Have the most balanced age distribution (mix of young and veteran players)',
      icon: '⚖️',
      category: 'roster',
      rarity: 'rare',
      points: 40,
      requirement: 'Balance young talent with veteran experience',
      checkUnlocked: (team, teams) => {
        // Players data not yet available in pre-season - return progress based on team structure
        const unlocked = false; // Will be determined when roster is populated
        const progress = 35; // Placeholder progress
        
        return { unlocked, progress };
      }
    },
    {
      id: 'draft_guru',
      name: 'Draft Guru',
      description: 'Have the highest-scoring rookie class',
      icon: '🎓',
      category: 'draft',
      rarity: 'rare',
      points: 50,
      requirement: 'Draft the most productive rookie class',
      checkUnlocked: (team, teams) => {
        // Rookie performance will be determined when season data is available
        const unlocked = false; 
        const progress = 20; // Placeholder progress
        
        return { unlocked, progress };
      }
    },

    // PERFORMANCE ACHIEVEMENTS
    {
      id: 'dynasty_rookie',
      name: 'Dynasty Rookie',
      description: 'First season in the league',
      icon: '🌟',
      category: 'performance',
      rarity: 'common',
      points: 10,
      requirement: 'Complete your first season',
      checkUnlocked: (team) => {
        // Check if this is their first season (would be based on historical data)
        const unlocked = true; // For demo, everyone gets this
        return { unlocked, progress: 100 };
      }
    },
    {
      id: 'consistency_award',
      name: 'Mr. Consistent',
      description: 'Make the playoffs in 3+ consecutive seasons',
      icon: '🎯',
      category: 'consistency',
      rarity: 'legendary',
      points: 100,
      requirement: 'Make playoffs 3 seasons in a row',
      checkUnlocked: (team) => {
        // Would check historical playoff data
        const consecutivePlayoffs = 1; // Mock data
        const unlocked = consecutivePlayoffs >= 3;
        const progress = Math.min(100, (consecutivePlayoffs / 3) * 100);
        
        return { unlocked, progress };
      }
    },
    {
      id: 'title_defender',
      name: 'Title Defender',
      description: 'Win back-to-back championships',
      icon: '👑',
      category: 'performance',
      rarity: 'legendary',
      points: 150,
      requirement: 'Win consecutive championships',
      checkUnlocked: (team) => {
        // Would check championship history
        const backToBackChamps = false; // Mock data
        return { unlocked: backToBackChamps, progress: 0 };
      }
    },

    // TRADING ACHIEVEMENTS
    {
      id: 'trade_master',
      name: 'Trade Master',
      description: 'Complete the most trades in a single season',
      icon: '🤝',
      category: 'trading',
      rarity: 'uncommon',
      points: 30,
      requirement: 'Be the most active trader',
      checkUnlocked: (team, teams) => {
        // Would check actual trade counts
        const tradeCount = 0; // Mock - no trades in pre-draft
        const maxTrades = Math.max(...teams.map(() => 0)); // All teams have 0 trades
        const unlocked = tradeCount > 0 && tradeCount >= maxTrades && tradeCount >= 5;
        const progress = Math.min(100, (tradeCount / 5) * 100);
        
        return { unlocked, progress };
      }
    },
    {
      id: 'wheeler_dealer',
      name: 'Wheeler Dealer',
      description: 'Complete 10+ trades in a single season',
      icon: '💼',
      category: 'trading',
      rarity: 'rare',
      points: 60,
      requirement: 'Complete 10 trades in one season',
      checkUnlocked: (team) => {
        const tradeCount = 0; // Mock data
        const unlocked = tradeCount >= 10;
        const progress = Math.min(100, (tradeCount / 10) * 100);
        
        return { unlocked, progress };
      }
    },

    // UNIQUE ACHIEVEMENTS
    {
      id: 'comeback_king',
      name: 'Comeback King',
      description: 'Win a playoff game after trailing by 40+ points',
      icon: '🔥',
      category: 'performance',
      rarity: 'legendary',
      points: 75,
      requirement: 'Stage an epic comeback victory',
      checkUnlocked: () => {
        // Would check actual game data
        return { unlocked: false, progress: 0 };
      }
    },
    {
      id: 'perfect_season',
      name: 'Perfection',
      description: 'Go undefeated in the regular season',
      icon: '💯',
      category: 'performance',
      rarity: 'legendary',
      points: 200,
      requirement: 'Win every regular season game',
      checkUnlocked: (team) => {
        const wins = team.record?.wins || 0;
        const losses = team.record?.losses || 0;
        const totalGames = wins + losses;
        
        if (totalGames === 0) return { unlocked: false, progress: 0 };
        
        const unlocked = losses === 0 && totalGames >= 13; // Full season
        const progress = totalGames > 0 ? (wins / Math.max(totalGames, 13)) * 100 : 0;
        
        return { unlocked, progress };
      }
    }
  ];

  /**
   * Calculate all achievements for a specific team
   */
  async calculateTeamAchievements(team: DookieTeam, allTeams: DookieTeam[]): Promise<TeamAchievements> {
    const achievements: Achievement[] = [];
    let totalPoints = 0;

    for (const definition of this.achievementDefinitions) {
      const result = definition.checkUnlocked(team, allTeams);
      
      const achievement: Achievement = {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        category: definition.category,
        rarity: definition.rarity,
        points: definition.points,
        unlocked: result.unlocked,
        progress: result.progress,
        requirement: definition.requirement,
        unlockedDate: result.unlocked ? new Date().toISOString() : undefined
      };

      achievements.push(achievement);
      
      if (result.unlocked) {
        totalPoints += definition.points;
      }
    }

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const completionRate = (unlockedCount / achievements.length) * 100;

    const recentUnlocks = achievements
      .filter(a => a.unlocked)
      .sort((a, b) => (b.unlockedDate || '').localeCompare(a.unlockedDate || ''))
      .slice(0, 3);

    const nextToUnlock = achievements
      .filter(a => !a.unlocked && (a.progress || 0) > 50)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 3);

    return {
      teamId: String(team.roster_id),
      achievements,
      totalPoints,
      completionRate,
      recentUnlocks,
      nextToUnlock
    };
  }

  /**
   * Get achievements for all teams
   */
  async calculateAllTeamAchievements(teams: DookieTeam[]): Promise<TeamAchievements[]> {
    const results: TeamAchievements[] = [];
    
    for (const team of teams) {
      const teamAchievements = await this.calculateTeamAchievements(team, teams);
      results.push(teamAchievements);
    }

    return results.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  /**
   * Get league-wide achievement statistics
   */
  async getLeagueAchievementStats(teams: DookieTeam[]): Promise<{
    totalAchievements: number;
    totalUnlocked: number;
    averageCompletion: number;
    topAchiever: TeamAchievements | null;
    rareUnlocks: Achievement[];
  }> {
    const allTeamAchievements = await this.calculateAllTeamAchievements(teams);
    
    const totalAchievements = this.achievementDefinitions.length * teams.length;
    const totalUnlocked = allTeamAchievements.reduce(
      (sum, team) => sum + team.achievements.filter(a => a.unlocked).length, 
      0
    );
    const averageCompletion = allTeamAchievements.reduce(
      (sum, team) => sum + team.completionRate, 
      0
    ) / teams.length;

    const topAchiever = allTeamAchievements.length > 0 ? allTeamAchievements[0] : null;

    const rareUnlocks = allTeamAchievements
      .flatMap(team => team.achievements)
      .filter(a => a.unlocked && (a.rarity === 'rare' || a.rarity === 'legendary'))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    return {
      totalAchievements,
      totalUnlocked,
      averageCompletion,
      topAchiever,
      rareUnlocks
    };
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(teams: DookieTeam[], category: Achievement['category']): Promise<Achievement[]> {
    const allAchievements = await this.calculateAllTeamAchievements(teams);
    
    return allAchievements
      .flatMap(team => team.achievements)
      .filter(a => a.category === category && a.unlocked)
      .sort((a, b) => b.points - a.points);
  }

  /**
   * Save achievements to localStorage (for persistence between sessions)
   */
  saveAchievements(teamAchievements: TeamAchievements[]): void {
    try {
      const data = {
        achievements: teamAchievements,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('dynasty_achievements', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save achievements to localStorage:', error);
    }
  }

  /**
   * Load achievements from localStorage
   */
  loadAchievements(): TeamAchievements[] | null {
    try {
      const data = localStorage.getItem('dynasty_achievements');
      if (!data) return null;

      const parsed = JSON.parse(data);
      const daysSinceUpdate = (Date.now() - new Date(parsed.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      
      // Refresh achievements if data is older than 1 day
      if (daysSinceUpdate > 1) return null;

      return parsed.achievements;
    } catch (error) {
      console.warn('Failed to load achievements from localStorage:', error);
      return null;
    }
  }
}

export const dynastyAchievementsAPI = new DynastyAchievementsAPI();