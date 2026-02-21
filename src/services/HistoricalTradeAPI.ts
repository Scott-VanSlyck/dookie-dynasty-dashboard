/**
 * Historical Trade Tracking API Service
 * Tracks trades over time to analyze long-term performance and value evolution
 */

import axios from 'axios';
import { 
  HistoricalTrade, 
  TradeAnalysisPoint,
  TradePerformanceMetrics,
  PositionTradingAnalysis,
  TradeLearning,
  HistoricalPlayerValue,
  Trade,
  DookieTeam
} from '../types';
import { tradingValueAPI } from './TradingValueAPI';
import { sleeperAPI } from './SleeperAPI';

class HistoricalTradeService {
  private trades: HistoricalTrade[] = [];
  private leagueId = '1313238117100056576';
  
  constructor() {
    console.log('HistoricalTradeService initialized for real Sleeper league:', this.leagueId);
  }

  /**
   * Get all historical trades from Sleeper API across multiple seasons
   */
  async getHistoricalTrades(): Promise<any[]> {
    try {
      console.log('🔍 Fetching historical trades across multiple seasons...');
      
      const allTrades: HistoricalTrade[] = [];
      const currentYear = new Date().getFullYear();
      
      // Efficiently fetch trades from known previous leagues
      const knownLeagues = [
        { id: '1180090570030120960', season: '2025' }, // Previous season
        { id: '1048300314966831104', season: '2024' }  // Earlier season (if it exists)
      ];
      
      for (const league of knownLeagues) {
        try {
          console.log(`📅 Fetching ${league.season} season trades from league ${league.id}...`);
          
          // Get all transactions across all weeks for this league
          const weeklyTrades: any[] = [];
          for (let week = 1; week <= 18; week++) {
            try {
              const response = await fetch(`https://api.sleeper.app/v1/league/${league.id}/transactions/${week}`);
              const transactions = await response.json();
              
              if (Array.isArray(transactions)) {
                const trades = transactions.filter(tx => tx.type === 'trade');
                weeklyTrades.push(...trades);
              }
            } catch (weekError) {
              // Skip weeks with no data
              continue;
            }
          }
          
          // Convert Sleeper trades to our format
          weeklyTrades.forEach(trade => {
            const historicalTrade: HistoricalTrade = {
              id: `${league.id}_${trade.transaction_id}`,
              date: new Date(trade.created).toISOString().split('T')[0],
              status: 'completed',
              teams: [], // Will be populated later if needed
              participants: {
                team_a: {
                  players_sent: Object.keys(trade.drops || {}),
                  players_received: Object.keys(trade.adds || {}),
                  draft_picks_sent: [],
                  draft_picks_received: []
                },
                team_b: {
                  players_sent: Object.keys(trade.adds || {}),
                  players_received: Object.keys(trade.drops || {}),
                  draft_picks_sent: [],
                  draft_picks_received: []
                }
              },
              analysis: {
                evolution: [],
                final_grade: {
                  winner: 'TBD',
                  grade: 'Fair',
                  lessons_learned: []
                }
              },
              consensus: {
                community_vote: 50,
                expert_grades: []
              },
              metadata: {
                season: league.season,
                league_id: league.id,
                roster_ids: trade.roster_ids || []
              }
            };
            
            allTrades.push(historicalTrade);
          });
          
          console.log(`✅ Found ${weeklyTrades.length} trades in ${league.season}`);
          
        } catch (error) {
          console.error(`Error fetching ${league.season} trades:`, error);
          continue;
        }
      }

      // Sort trades by date (newest first)
      allTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      this.trades = allTrades;
      console.log(`🎉 Total historical trades loaded: ${allTrades.length}`);
      
      return allTrades;
      
    } catch (error) {
      console.error('Error fetching historical trades:', error);
      return [];
    }
  }

  /**
   * Find historical league ID by traversing previous_league_id chain
   */
  private async findHistoricalLeagueId(targetYear: string): Promise<string | null> {
    try {
      let currentLeagueId = this.leagueId;
      let currentYear = new Date().getFullYear();
      const targetYearNum = parseInt(targetYear);

      // If we're looking for current or future year, use current league ID
      if (targetYearNum >= currentYear) {
        return currentLeagueId;
      }

      // Traverse backwards through previous_league_id chain
      while (currentYear > targetYearNum) {
        try {
          const response = await fetch(`https://api.sleeper.app/v1/league/${currentLeagueId}`);
          const league = await response.json();
          
          if (!league.previous_league_id) {
            // If we've run out of previous leagues but haven't reached target year,
            // return the oldest league we found
            console.log(`🔗 Reached end of previous_league_id chain at year ~${currentYear}`);
            return currentLeagueId;
          }
          
          currentLeagueId = league.previous_league_id;
          currentYear--;
          console.log(`🔗 Following previous_league_id to ${currentLeagueId} for year ~${currentYear}`);
          
        } catch (error) {
          console.error(`Error fetching league ${currentLeagueId}:`, error);
          break;
        }
      }

      return currentLeagueId;
    } catch (error) {
      console.error('Error finding historical league ID:', error);
      return null;
    }
  }

  /**
   * Get transactions for a specific year/league
   */
  private async getTransactionsByYear(leagueId: string, year: string): Promise<any[]> {
    try {
      const allTransactions = [];
      
      // Get transactions for multiple weeks (1-18 for full season)
      for (let week = 1; week <= 18; week++) {
        try {
          const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`);
          if (response.ok) {
            const weekTransactions = await response.json();
            if (weekTransactions && weekTransactions.length > 0) {
              allTransactions.push(...weekTransactions);
            }
          }
        } catch (weekError) {
          // Skip weeks with no data or errors
          continue;
        }
      }
      
      console.log(`📊 Found ${allTransactions.length} total transactions for ${year} (league: ${leagueId})`);
      return allTransactions;
      
    } catch (error) {
      console.error(`Error fetching transactions for ${year}:`, error);
      return [];
    }
  }

  /**
   * Get teams for a specific year/league
   */
  private async getTeamsByYear(leagueId: string, year: string): Promise<DookieTeam[]> {
    try {
      const [rostersResponse, usersResponse] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
        fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)
      ]);

      if (!rostersResponse.ok || !usersResponse.ok) {
        console.error(`Failed to fetch rosters or users for ${year}`);
        return [];
      }

      const rosters = await rostersResponse.json();
      const users = await usersResponse.json();

      const teams = rosters.map((roster: any) => {
        const user = users.find((u: any) => u.user_id === roster.owner_id);
        
        let teamName = 'Unknown Team';
        if (user?.metadata?.team_name) {
          teamName = user.metadata.team_name;
        } else if (user?.display_name) {
          teamName = `${user.display_name}'s Team`;
        }

        return {
          roster_id: roster.roster_id,
          owner_name: user?.display_name || user?.username || 'Unknown',
          team_name: teamName,
          user_id: roster.owner_id,
          avatar: user?.avatar || '',
          waiver_position: roster.settings?.waiver_position || 1,
          record: {
            wins: roster.settings?.wins || 0,
            losses: roster.settings?.losses || 0
          },
          points_for: (roster.settings?.fpts || 0) + ((roster.settings?.fpts_decimal || 0) / 100),
          points_against: (roster.settings?.fpts_against || 0) + ((roster.settings?.fpts_against_decimal || 0) / 100)
        };
      });

      console.log(`👥 Found ${teams.length} teams for ${year}`);
      return teams;
      
    } catch (error) {
      console.error(`Error fetching teams for ${year}:`, error);
      return [];
    }
  }

  /**
   * Convert Sleeper transaction to HistoricalTrade format
   */
  private convertSleeperTradeToHistoricalTrade(transaction: any, teams: DookieTeam[], year?: string): HistoricalTrade {
    const rosterIds = transaction.roster_ids || [];
    const tradeTeams = rosterIds.map((rosterId: number) => 
      teams.find(team => team.roster_id === rosterId)
    ).filter(Boolean);

    return {
      id: transaction.transaction_id,
      date: new Date(transaction.created).toISOString().split('T')[0],
      status: 'completed',
      teams: tradeTeams,
      consensus: {}, // Real consensus data to be populated
      metadata: {
        transaction_type: transaction.type,
        created_timestamp: transaction.created,
        league_id: this.leagueId,
        season_year: year || new Date(transaction.created).getFullYear().toString(),
        historical_context: year ? `${year} Season Trade` : 'Current Season Trade'
      },
      participants: {
        team_a: {
          roster_id: rosterIds[0] || 0,
          team_name: tradeTeams[0]?.team_name || 'Unknown Team A',
          players_sent: this.getPlayersForRoster(transaction, rosterIds[0], 'sent'),
          players_received: this.getPlayersForRoster(transaction, rosterIds[0], 'received'),
          picks_sent: this.getPicksForRoster(transaction, rosterIds[0], 'sent'),
          picks_received: this.getPicksForRoster(transaction, rosterIds[0], 'received')
        },
        team_b: {
          roster_id: rosterIds[1] || 0,
          team_name: tradeTeams[1]?.team_name || 'Unknown Team B',
          players_sent: this.getPlayersForRoster(transaction, rosterIds[1], 'sent'),
          players_received: this.getPlayersForRoster(transaction, rosterIds[1], 'received'),
          picks_sent: this.getPicksForRoster(transaction, rosterIds[1], 'sent'),
          picks_received: this.getPicksForRoster(transaction, rosterIds[1], 'received')
        }
      },
      analysis: {
        timeline: {
          execution: {
            date: new Date(transaction.created).toISOString().split('T')[0],
            values: {} // Will be populated by real value tracking
          },
          one_year: null,
          three_years: null
        },
        evolution: [],
        final_grade: {
          team_a_grade: 'C' as const, // Default until analysis complete
          team_b_grade: 'C' as const,
          hindsight_winner: 'even' as const,
          lessons_learned: []
        }
      }
    };
  }

  /**
   * Get players involved in trade for specific roster
   */
  private getPlayersForRoster(transaction: any, rosterId: number, direction: 'sent' | 'received'): string[] {
    const players: string[] = [];
    
    if (transaction.adds) {
      Object.entries(transaction.adds).forEach(([playerId, targetRosterId]) => {
        if (direction === 'received' && targetRosterId === rosterId.toString()) {
          players.push(playerId);
        } else if (direction === 'sent' && targetRosterId !== rosterId.toString()) {
          players.push(playerId);
        }
      });
    }

    if (transaction.drops) {
      Object.entries(transaction.drops).forEach(([playerId, sourceRosterId]) => {
        if (direction === 'sent' && sourceRosterId === rosterId.toString()) {
          players.push(playerId);
        }
      });
    }

    return players;
  }

  /**
   * Get draft picks involved in trade for specific roster
   */
  private getPicksForRoster(transaction: any, rosterId: number, direction: 'sent' | 'received'): any[] {
    // Sleeper draft pick trading logic - will implement when we have real pick data
    return [];
  }

  /**
   * Get trade performance metrics for a manager
   */
  async getTradePerformanceMetrics(rosterId: number): Promise<TradePerformanceMetrics | null> {
    try {
      const trades = await this.getHistoricalTrades();
      const managerTrades = trades.filter(trade => 
        trade.participants.team_a.roster_id === rosterId || 
        trade.participants.team_b.roster_id === rosterId
      );

      if (managerTrades.length === 0) {
        return null;
      }

      const teams = await sleeperAPI.getTeams();
      const team = teams.find(t => t.roster_id === rosterId);
      
      return {
        manager_id: rosterId.toString(),
        manager_name: team?.team_name || 'Unknown Manager',
        total_trades: managerTrades.length,
        immediate_wins: 0, // Will calculate from real analysis
        long_term_wins: 0,
        trade_accuracy: 0,
        hindsight_score: 0,
        best_position_traded: 'Unknown',
        worst_position_traded: 'Unknown',
        avg_trade_value: 0,
        biggest_win: managerTrades[0], // Placeholder
        biggest_loss: managerTrades[0] // Placeholder
      };
    } catch (error) {
      console.error('Error getting trade performance metrics:', error);
      return null;
    }
  }

  /**
   * Get position-specific trading analysis
   */
  async getPositionTradingAnalysis(position: string): Promise<any> {
    try {
      // This would analyze real trades involving specific positions
      return {
        position,
        total_trades_involving: 0,
        avg_value_retention_1yr: 0,
        avg_value_retention_3yr: 0,
        best_age_to_trade: 0,
        worst_age_to_trade: 0,
        injury_impact_factor: 0,
        most_successful_trades: [],
        biggest_busts: []
      };
    } catch (error) {
      console.error('Error getting position trading analysis:', error);
      return null;
    }
  }

  /**
   * Get trade learnings from historical data
   */
  async getTradeLearnings(): Promise<TradeLearning[]> {
    try {
      // This would analyze real trade patterns to generate insights
      return [];
    } catch (error) {
      console.error('Error getting trade learnings:', error);
      return [];
    }
  }

  /**
   * Get dynasty-specific learnings from historical data
   */
  async getDynastyLearnings(): Promise<any[]> {
    try {
      // This would analyze real trade patterns to generate dynasty-specific insights
      return [];
    } catch (error) {
      console.error('Error getting dynasty learnings:', error);
      return [];
    }
  }

  /**
   * Get manager trade performance analysis
   */
  async getManagerTradePerformance(managerId: string, teams: DookieTeam[]): Promise<any> {
    try {
      const trades = await this.getHistoricalTrades();
      const managerTrades = trades.filter(trade => 
        trade.participants.team_a.roster_id.toString() === managerId || 
        trade.participants.team_b.roster_id.toString() === managerId
      );

      if (managerTrades.length === 0) {
        return null;
      }

      const team = teams.find(t => t.roster_id.toString() === managerId);
      
      return {
        manager_id: managerId,
        manager_name: team?.team_name || 'Unknown Manager',
        total_trades: managerTrades.length,
        immediate_wins: 0, // Will calculate from real analysis
        long_term_wins: 0,
        trade_accuracy: 0,
        hindsight_score: 0,
        best_position_traded: 'Unknown',
        worst_position_traded: 'Unknown',
        avg_trade_value: 0,
        biggest_win: managerTrades[0], // Placeholder
        biggest_loss: managerTrades[0] // Placeholder
      };
    } catch (error) {
      console.error('Error getting manager trade performance:', error);
      return null;
    }
  }

  /**
   * Track player values over time
   */
  async trackPlayerValues(playerIds: string[]): Promise<any[]> {
    try {
      // This would integrate with real player value APIs
      return [];
    } catch (error) {
      console.error('Error tracking player values:', error);
      return [];
    }
  }
}

export const historicalTradeAPI = new HistoricalTradeService();