/**
 * Sleeper API Service for Dookie Dynasty
 * Based on the Python lottery system but adapted for TypeScript/React
 */

import axios from 'axios';

// Types for Sleeper API responses
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  metadata?: {
    team_name?: string;
  };
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
  reserve?: string[];
  taxi?: string[];
  settings: {
    wins: number;
    waiver_position: number;
    waiver_budget_used: number;
    total_moves: number;
    trades: number;
    losses: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
  };
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  sport: string;
  settings: {
    max_keepers: number;
    draft_rounds: number;
    playoff_teams: number;
    playoff_round_type: number;
    playoff_seed_type: number;
    squads: number;
    teams: number;
    type: number;
  };
  scoring_settings: Record<string, number>;
  roster_positions: string[];
}

export interface DookieTeam {
  roster_id: number;
  owner_name: string;
  team_name: string;
  user_id: string;
  avatar: string;
  waiver_position: number;
  record?: {
    wins: number;
    losses: number;
  };
  points_for?: number;
  points_against?: number;
}

export interface MatchupResult {
  roster_id: number;
  points: number;
  matchup_id: number;
  players: string[];
  starters: string[];
}

class SleeperAPIService {
  private readonly baseURL = 'https://api.sleeper.app/v1';
  private readonly leagueId = '1313238117100056576'; // Dookie Dynasty League ID
  
  /**
   * Get league information
   */
  async getLeague(): Promise<SleeperLeague> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${this.leagueId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching league data:', error);
      throw new Error('Failed to fetch league information');
    }
  }

  /**
   * Get all users in the league
   */
  async getUsers(): Promise<SleeperUser[]> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${this.leagueId}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch league users');
    }
  }

  /**
   * Get all rosters in the league
   */
  async getRosters(): Promise<SleeperRoster[]> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${this.leagueId}/rosters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rosters:', error);
      throw new Error('Failed to fetch league rosters');
    }
  }

  /**
   * Get combined team data (users + rosters)
   */
  async getTeams(): Promise<DookieTeam[]> {
    try {
      const [users, rosters] = await Promise.all([
        this.getUsers(),
        this.getRosters()
      ]);

      // Create user map for easy lookup
      const userMap = users.reduce((acc, user) => {
        acc[user.user_id] = user;
        return acc;
      }, {} as Record<string, SleeperUser>);

      // Combine roster and user data
      const teams: DookieTeam[] = rosters.map(roster => {
        const user = userMap[roster.owner_id];
        return {
          roster_id: roster.roster_id,
          owner_name: user?.display_name || 'Unknown',
          team_name: user?.metadata?.team_name || `Team ${user?.display_name}` || 'Unknown Team',
          user_id: roster.owner_id,
          avatar: user?.avatar || '',
          waiver_position: roster.settings.waiver_position,
          record: {
            wins: roster.settings.wins,
            losses: roster.settings.losses
          },
          points_for: roster.settings.fpts + (roster.settings.fpts_decimal / 100),
          points_against: roster.settings.fpts_against + (roster.settings.fpts_against_decimal / 100)
        };
      });

      // Sort by waiver position (standings)
      return teams.sort((a, b) => a.waiver_position - b.waiver_position);
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch team data');
    }
  }

  /**
   * Get lottery eligible teams (bottom 6)
   */
  async getLotteryTeams(): Promise<DookieTeam[]> {
    const teams = await this.getTeams();
    return teams.slice(-6); // Bottom 6 teams
  }

  /**
   * Get matchup data for a specific week
   */
  async getMatchups(week: number): Promise<MatchupResult[]> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${this.leagueId}/matchups/${week}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching matchups for week ${week}:`, error);
      throw new Error(`Failed to fetch matchups for week ${week}`);
    }
  }

  /**
   * Get all player data
   */
  async getAllPlayers(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(`${this.baseURL}/players/nfl`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player data:', error);
      throw new Error('Failed to fetch player data');
    }
  }

  /**
   * Get draft data for the league
   */
  async getDraftData(): Promise<any[]> {
    try {
      // First get all drafts for this league
      const draftsResponse = await axios.get(`${this.baseURL}/league/${this.leagueId}/drafts`);
      const drafts = draftsResponse.data;
      
      if (!drafts || drafts.length === 0) {
        return [];
      }

      // Get the most recent draft
      const latestDraft = drafts[0];
      const draftId = latestDraft.draft_id;

      // Get draft picks
      const picksResponse = await axios.get(`${this.baseURL}/draft/${draftId}/picks`);
      return picksResponse.data;
    } catch (error) {
      console.error('Error fetching draft data:', error);
      throw new Error('Failed to fetch draft data');
    }
  }

  /**
   * Get transactions (trades, adds, drops)
   */
  async getTransactions(week?: number): Promise<any[]> {
    try {
      const url = week 
        ? `${this.baseURL}/league/${this.leagueId}/transactions/${week}`
        : `${this.baseURL}/league/${this.leagueId}/transactions/1`; // Default to week 1 if no week specified
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transaction data');
    }
  }

  /**
   * Get previous seasons data
   */
  async getPreviousSeasons(): Promise<SleeperLeague[]> {
    try {
      const currentLeague = await this.getLeague();
      const currentSeason = parseInt(currentLeague.season);
      
      const seasons: SleeperLeague[] = [currentLeague];
      
      // Try to get previous seasons (going back up to 3 years)
      for (let year = currentSeason - 1; year >= currentSeason - 3; year--) {
        try {
          // This would require knowing previous league IDs
          // For now, we'll just return the current season
          // In a real implementation, you'd store historical league IDs
          break;
        } catch {
          // Season doesn't exist, stop looking
          break;
        }
      }
      
      return seasons;
    } catch (error) {
      console.error('Error fetching previous seasons:', error);
      return [];
    }
  }
}

// Export singleton instance
export const sleeperAPI = new SleeperAPIService();
export default sleeperAPI;