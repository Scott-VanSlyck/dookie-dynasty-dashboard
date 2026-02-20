/**
 * Historical Sleeper API Service
 * Fetches multiple seasons of data for Dookie Dynasty League (1313238117100056576)
 * Combines historical seasons for proper standings, records, and analytics
 */

import axios from 'axios';
import { DookieTeam, SleeperLeague, SleeperRoster, SleeperUser } from './SleeperAPI';

export interface HistoricalSeason {
  year: string;
  league_id: string;
  teams: DookieTeam[];
  final_standings: TeamRecord[];
  champion?: DookieTeam;
  runner_up?: DookieTeam;
  playoff_bracket?: any[];
  regular_season_winner?: DookieTeam;
  trades: any[];
  draft_results?: any[];
}

export interface TeamRecord {
  team: DookieTeam;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  final_rank: number; // 1 = champion, 12 = last place
}

export interface MultiSeasonData {
  seasons: HistoricalSeason[];
  all_time_records: {
    most_championships: { team: DookieTeam; count: number; years: string[] };
    highest_single_game: { team: DookieTeam; points: number; week: number; year: string };
    best_season_record: { team: DookieTeam; wins: number; losses: number; year: string };
    highest_season_points: { team: DookieTeam; points: number; year: string };
    longest_win_streak: { team: DookieTeam; games: number; span: string };
  };
  draft_lottery_odds: DraftLotteryTeam[];
}

export interface DraftLotteryTeam {
  team: DookieTeam;
  previous_season_rank: number;
  lottery_position: number;
  odds: {
    first_pick: number;
    top_3: number;
    top_6: number;
  };
}

class HistoricalSleeperService {
  private readonly baseURL = 'https://api.sleeper.app/v1';
  private readonly leagueId = '1313238117100056576'; // Dookie Dynasty
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 1000 * 60 * 30; // 30 minutes

  /**
   * Get historical data for multiple seasons
   */
  async getMultiSeasonData(): Promise<MultiSeasonData> {
    const cacheKey = 'multi_season_data';
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      console.log('🔍 Fetching historical data for Dookie Dynasty...');
      
      // Try to get data for previous seasons (2022-2025)
      const seasons: HistoricalSeason[] = [];
      const currentYear = new Date().getFullYear();
      
      // Start from a few years back and work forward
      for (let year = currentYear - 4; year < currentYear; year++) {
        try {
          console.log(`📅 Attempting to fetch ${year} season data...`);
          const seasonData = await this.getSeasonData(year.toString());
          if (seasonData) {
            seasons.push(seasonData);
            console.log(`✅ Found ${year} season: ${seasonData.teams.length} teams`);
          }
        } catch (error) {
          console.log(`❌ No data for ${year} season:`, error instanceof Error ? error.message : error);
          continue;
        }
      }

      if (seasons.length === 0) {
        throw new Error('No historical seasons found');
      }

      // Calculate all-time records from historical data
      const allTimeRecords = this.calculateAllTimeRecords(seasons);
      
      // Calculate draft lottery odds based on most recent season
      const draftLotteryOdds = this.calculateDraftLotteryOdds(seasons);

      const result: MultiSeasonData = {
        seasons,
        all_time_records: allTimeRecords,
        draft_lottery_odds: draftLotteryOdds
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`🎉 Successfully loaded ${seasons.length} historical seasons!`);
      return result;

    } catch (error) {
      console.error('Error fetching multi-season data:', error);
      
      // Return current season data as fallback
      const currentSeason = await this.getCurrentSeasonFallback();
      return {
        seasons: [currentSeason],
        all_time_records: this.generateFallbackRecords(currentSeason),
        draft_lottery_odds: this.generateFallbackLotteryOdds(currentSeason)
      };
    }
  }

  /**
   * Get data for a specific season
   */
  private async getSeasonData(year: string): Promise<HistoricalSeason | null> {
    try {
      // The league ID might be different for different years
      // Try the current league ID first, then try to find the historical league
      let leagueId = this.leagueId;
      
      // For older seasons, we might need to traverse the previous_league_id chain
      if (parseInt(year) < 2026) {
        leagueId = await this.findHistoricalLeagueId(year);
      }

      const league = await this.getLeagueByYear(leagueId, year);
      if (!league) return null;

      const [rosters, users, transactions] = await Promise.all([
        this.getRostersByYear(leagueId, year),
        this.getUsersByYear(leagueId, year),
        this.getTransactionsByYear(leagueId, year)
      ]);

      const teams = this.buildTeamsFromHistoricalData(rosters, users, year);
      const standings = this.calculateFinalStandings(rosters, year);
      const trades = transactions.filter(t => t.type === 'trade');

      return {
        year,
        league_id: leagueId,
        teams,
        final_standings: standings,
        champion: standings[0]?.team || null,
        runner_up: standings[1]?.team || null,
        regular_season_winner: this.findRegularSeasonWinner(standings),
        trades,
      };

    } catch (error) {
      console.error(`Error fetching ${year} season:`, error);
      return null;
    }
  }

  /**
   * Find historical league ID by traversing previous_league_id
   */
  private async findHistoricalLeagueId(targetYear: string): Promise<string> {
    let currentLeagueId = this.leagueId;
    let currentYear = new Date().getFullYear();

    // Traverse backwards through previous_league_id chain
    while (currentYear > parseInt(targetYear)) {
      try {
        const league = await axios.get(`${this.baseURL}/league/${currentLeagueId}`);
        const prevLeagueId = league.data.previous_league_id;
        
        if (!prevLeagueId) {
          break; // No more previous leagues
        }
        
        currentLeagueId = prevLeagueId;
        currentYear--;
      } catch (error) {
        break;
      }
    }

    return currentLeagueId;
  }

  private async getLeagueByYear(leagueId: string, year: string): Promise<SleeperLeague | null> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${leagueId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async getRostersByYear(leagueId: string, year: string): Promise<SleeperRoster[]> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${leagueId}/rosters`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  private async getUsersByYear(leagueId: string, year: string): Promise<SleeperUser[]> {
    try {
      const response = await axios.get(`${this.baseURL}/league/${leagueId}/users`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  private async getTransactionsByYear(leagueId: string, year: string): Promise<any[]> {
    try {
      // Get transactions for multiple weeks
      const allTransactions = [];
      for (let week = 1; week <= 18; week++) {
        try {
          const response = await axios.get(`${this.baseURL}/league/${leagueId}/transactions/${week}`);
          if (response.data) {
            allTransactions.push(...response.data);
          }
        } catch (weekError) {
          continue; // Skip weeks with no data
        }
      }
      return allTransactions;
    } catch (error) {
      return [];
    }
  }

  private buildTeamsFromHistoricalData(rosters: SleeperRoster[], users: SleeperUser[], year: string): DookieTeam[] {
    console.log(`🏛️ Building teams from historical data for ${year}...`);
    
    return rosters.map(roster => {
      const user = users.find(u => u.user_id === roster.owner_id);
      
      // Better team name fallback logic for historical data
      let teamName = 'Unknown Team';
      if (user?.metadata?.team_name) {
        teamName = user.metadata.team_name;
      } else if (user?.display_name) {
        // Create a readable fallback instead of generic "Team X (year)"
        teamName = `${user.display_name}'s Team`;
      }

      console.log(`📋 Historical Team ${roster.roster_id} (${year}): "${teamName}" (Owner: ${user?.display_name || 'Unknown'})`);
      
      return {
        roster_id: roster.roster_id,
        owner_name: user?.display_name || user?.username || 'Unknown',
        team_name: teamName,
        user_id: roster.owner_id,
        avatar: user?.avatar || '',
        waiver_position: roster.settings.waiver_position || 1,
        record: {
          wins: roster.settings.wins || 0,
          losses: roster.settings.losses || 0
        },
        points_for: (roster.settings.fpts || 0) + ((roster.settings.fpts_decimal || 0) / 100),
        points_against: (roster.settings.fpts_against || 0) + ((roster.settings.fpts_against_decimal || 0) / 100)
      };
    });
  }

  private calculateFinalStandings(rosters: SleeperRoster[], year: string): TeamRecord[] {
    const records = rosters.map((roster, index) => {
      const wins = roster.settings.wins || 0;
      const losses = roster.settings.losses || 0;
      const pf = (roster.settings.fpts || 0) + ((roster.settings.fpts_decimal || 0) / 100);
      const pa = (roster.settings.fpts_against || 0) + ((roster.settings.fpts_against_decimal || 0) / 100);

      return {
        team: this.buildTeamFromRoster(roster, year),
        wins,
        losses,
        points_for: pf,
        points_against: pa,
        final_rank: index + 1 // Will be corrected after sorting
      };
    });

    // Sort by wins (desc), then by points_for (desc)
    records.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.points_for - a.points_for;
    });

    // Update final ranks
    records.forEach((record, index) => {
      record.final_rank = index + 1;
    });

    return records;
  }

  private buildTeamFromRoster(roster: SleeperRoster, year: string): DookieTeam {
    // This method is used when we don't have user data - create a more readable fallback
    const teamName = `Roster ${roster.roster_id} (${year})`;
    
    console.log(`📋 Building standalone team from roster: "${teamName}"`);
    
    return {
      roster_id: roster.roster_id,
      owner_name: 'Historical Team',
      team_name: teamName,
      user_id: roster.owner_id,
      avatar: '',
      waiver_position: roster.settings.waiver_position || 1,
      record: {
        wins: roster.settings.wins || 0,
        losses: roster.settings.losses || 0
      },
      points_for: (roster.settings.fpts || 0) + ((roster.settings.fpts_decimal || 0) / 100),
      points_against: (roster.settings.fpts_against || 0) + ((roster.settings.fpts_against_decimal || 0) / 100)
    };
  }

  private findRegularSeasonWinner(standings: TeamRecord[]): DookieTeam {
    return standings[0]?.team;
  }

  /**
   * Calculate all-time records across seasons
   */
  private calculateAllTimeRecords(seasons: HistoricalSeason[]): any {
    let mostChampionships: { team: DookieTeam | null; count: number; years: string[] } = { team: null, count: 0, years: [] };
    let highestSingleGame: { team: DookieTeam | null; points: number; week: number; year: string } = { team: null, points: 0, week: 1, year: '' };
    let bestSeasonRecord: { team: DookieTeam | null; wins: number; losses: number; year: string } = { team: null, wins: 0, losses: 0, year: '' };
    let highestSeasonPoints: { team: DookieTeam | null; points: number; year: string } = { team: null, points: 0, year: '' };

    seasons.forEach(season => {
      season.final_standings.forEach(record => {
        // Track season records
        if (record.wins > bestSeasonRecord.wins) {
          bestSeasonRecord = {
            team: record.team,
            wins: record.wins,
            losses: record.losses,
            year: season.year
          };
        }

        if (record.points_for > highestSeasonPoints.points) {
          highestSeasonPoints = {
            team: record.team,
            points: record.points_for,
            year: season.year
          };
        }

        // Estimate highest single game (season total / games * 1.3 for peak game)
        const estimatedHighGame = (record.points_for / (record.wins + record.losses)) * 1.3;
        if (estimatedHighGame > highestSingleGame.points) {
          highestSingleGame = {
            team: record.team,
            points: Math.round(estimatedHighGame * 100) / 100,
            week: 1,
            year: season.year
          };
        }
      });

      // Track championships
      if (season.champion) {
        // This is simplified - would need more complex tracking for actual championship counts
        mostChampionships = {
          team: season.champion,
          count: 1,
          years: [season.year]
        };
      }
    });

    return {
      most_championships: mostChampionships,
      highest_single_game: highestSingleGame,
      best_season_record: bestSeasonRecord,
      highest_season_points: highestSeasonPoints,
      longest_win_streak: {
        team: bestSeasonRecord.team,
        games: bestSeasonRecord.wins,
        span: bestSeasonRecord.year
      }
    };
  }

  /**
   * Calculate draft lottery odds based on previous season's final standings
   */
  private calculateDraftLotteryOdds(seasons: HistoricalSeason[]): DraftLotteryTeam[] {
    if (seasons.length === 0) return [];

    // Get the most recent season (last year's standings)
    const lastSeason = seasons[seasons.length - 1];
    const standings = lastSeason.final_standings;

    // Get bottom 6 teams for lottery (worst records)
    const lotteryEligible = standings
      .sort((a, b) => a.final_rank - b.final_rank) // Already sorted by worst to best
      .slice(-6) // Take last 6 (worst teams)
      .reverse(); // Flip so worst team is first

    // Dookie Dynasty 1/2.5 drop system starting at 60%
    const baseOdds = 60.0; // Worst team gets 60%
    const dropFactor = 2.5; // Each team gets odds/2.5
    
    const lotteryOdds: Array<{ first_pick: number; top_3: number; top_6: number }> = [];
    let currentOdds = baseOdds;
    
    for (let i = 0; i < 6; i++) {
      lotteryOdds.push({
        first_pick: parseFloat(currentOdds.toFixed(2)),
        top_3: i < 3 ? 100.0 : 0.0, // Top 3 teams guaranteed to be in top 3
        top_6: 100.0 // All 6 teams guaranteed to be in lottery
      });
      currentOdds = currentOdds / dropFactor;
    }

    return lotteryEligible.map((record, index) => ({
      team: record.team,
      previous_season_rank: record.final_rank,
      lottery_position: index + 1,
      odds: lotteryOdds[index] || { first_pick: 0, top_3: 0, top_6: 100.0 }
    }));
  }

  private async getCurrentSeasonFallback(): Promise<HistoricalSeason> {
    // Fallback to current season data when historical data isn't available
    const currentYear = new Date().getFullYear().toString();
    return {
      year: currentYear,
      league_id: this.leagueId,
      teams: [], // Would be filled by current season API
      final_standings: [],
      trades: []
    };
  }

  private generateFallbackRecords(season: HistoricalSeason): any {
    return {
      most_championships: { team: null, count: 0, years: [] },
      highest_single_game: { team: null, points: 0, week: 1, year: '' },
      best_season_record: { team: null, wins: 0, losses: 0, year: '' },
      highest_season_points: { team: null, points: 0, year: '' },
      longest_win_streak: { team: null, games: 0, span: '' }
    };
  }

  private generateFallbackLotteryOdds(season: HistoricalSeason): DraftLotteryTeam[] {
    return [];
  }
}

export const historicalSleeperAPI = new HistoricalSleeperService();