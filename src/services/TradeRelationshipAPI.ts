/**
 * Trade Relationship API
 * Analyzes trading patterns to detect trade wars, alliances, and rivalries
 */

import { DookieTeam } from '../types';
import { sleeperAPI } from './SleeperAPI';

export interface TradeRelationship {
  teamId1: string;
  teamId2: string;
  tradeCount: number;
  relationshipType: 'allies' | 'enemies' | 'neutral';
  relationshipStrength: number; // 0-100
  lastTradeDate?: string;
  totalValue: number;
  description: string;
}

export interface TradeWarAnalysis {
  tradeWars: TradeRelationship[];
  tradeAlliances: TradeRelationship[];
  mostActiveTraders: { teamId: string; totalTrades: number; }[];
  isolatedTeams: string[]; // Teams that rarely trade
  networkCentrality: { teamId: string; centralityScore: number; }[];
}

class TradeRelationshipAPI {
  private tradeCache: any[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  /**
   * Analyze all trading relationships in the league
   */
  async analyzeTradeRelationships(teams: DookieTeam[]): Promise<TradeWarAnalysis> {
    try {
      // In a real league with trading data, this would fetch actual trades
      // For now, we'll simulate some trade patterns for demonstration
      const mockTradeData = await this.generateMockTradeData(teams);
      
      return this.calculateTradeRelationships(teams, mockTradeData);
    } catch (error) {
      console.error('Error analyzing trade relationships:', error);
      throw error;
    }
  }

  /**
   * Calculate relationships between all teams based on trade data
   */
  private calculateTradeRelationships(teams: DookieTeam[], trades: any[]): TradeWarAnalysis {
    const relationships: TradeRelationship[] = [];
    const teamTradeCount: { [key: string]: number } = {};
    
    // Initialize trade counts
    teams.forEach(team => {
      teamTradeCount[String(team.roster_id)] = 0;
    });

    // Calculate relationships between all team pairs
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        const tradesBetween = trades.filter(trade => 
          (trade.roster_ids.includes(team1.roster_id) && 
           trade.roster_ids.includes(team2.roster_id))
        );

        const tradeCount = tradesBetween.length;
        teamTradeCount[String(team1.roster_id)] += tradeCount;
        teamTradeCount[String(team2.roster_id)] += tradeCount;

        // Determine relationship type and strength
        let relationshipType: 'allies' | 'enemies' | 'neutral' = 'neutral';
        let relationshipStrength = 0;
        let description = 'No trading history';

        if (tradeCount >= 3) {
          relationshipType = 'allies';
          relationshipStrength = Math.min(100, tradeCount * 25);
          description = `Trade partners - ${tradeCount} deals completed`;
        } else if (tradeCount === 0) {
          // Teams that never trade might be rivals
          const avgTrades = Object.values(teamTradeCount).reduce((a, b) => a + b, 0) / teams.length;
          if (avgTrades > 2) {
            relationshipType = 'enemies';
            relationshipStrength = 60;
            description = 'Trade war - these teams avoid dealing with each other';
          }
        } else if (tradeCount === 1 || tradeCount === 2) {
          relationshipType = 'neutral';
          relationshipStrength = tradeCount * 20;
          description = `Occasional trading partners - ${tradeCount} deal${tradeCount > 1 ? 's' : ''}`;
        }

        relationships.push({
          teamId1: String(team1.roster_id),
          teamId2: String(team2.roster_id),
          tradeCount,
          relationshipType,
          relationshipStrength,
          totalValue: tradesBetween.reduce((sum, trade) => sum + (trade.estimated_value || 0), 0),
          description,
          lastTradeDate: tradesBetween.length > 0 ? tradesBetween[0].created : undefined
        });
      }
    }

    // Analyze results
    const tradeWars = relationships.filter(r => r.relationshipType === 'enemies');
    const tradeAlliances = relationships.filter(r => r.relationshipType === 'allies');
    
    const mostActiveTraders = Object.entries(teamTradeCount)
      .map(([teamId, count]) => ({ teamId, totalTrades: count }))
      .sort((a, b) => b.totalTrades - a.totalTrades)
      .slice(0, 5);

    const isolatedTeams = Object.entries(teamTradeCount)
      .filter(([_, count]) => count <= 1)
      .map(([teamId]) => teamId);

    // Calculate network centrality (how connected each team is)
    const networkCentrality = teams.map(team => {
      const teamIdStr = String(team.roster_id);
      const connectedness = relationships
        .filter(r => r.teamId1 === teamIdStr || r.teamId2 === teamIdStr)
        .reduce((sum, r) => sum + r.relationshipStrength, 0);
      
      return {
        teamId: teamIdStr,
        centralityScore: Math.round(connectedness / relationships.length)
      };
    }).sort((a, b) => b.centralityScore - a.centralityScore);

    return {
      tradeWars,
      tradeAlliances,
      mostActiveTraders,
      isolatedTeams,
      networkCentrality
    };
  }

  /**
   * Generate mock trade data for demonstration (until real trade data is available)
   * This simulates realistic trading patterns
   */
  private async generateMockTradeData(teams: DookieTeam[]): Promise<any[]> {
    const mockTrades = [];
    const now = Date.now();
    
    // Simulate some trade alliances (teams that trade frequently)
    if (teams.length >= 4) {
      // Alliance 1: Teams 0 and 1 trade frequently
      mockTrades.push(
        {
          transaction_id: 'mock_1',
          roster_ids: [String(teams[0].roster_id), String(teams[1].roster_id)],
          created: now - (30 * 24 * 60 * 60 * 1000), // 30 days ago
          estimated_value: 150
        },
        {
          transaction_id: 'mock_2',
          roster_ids: [String(teams[0].roster_id), String(teams[1].roster_id)],
          created: now - (15 * 24 * 60 * 60 * 1000), // 15 days ago
          estimated_value: 200
        },
        {
          transaction_id: 'mock_3',
          roster_ids: [String(teams[0].roster_id), String(teams[1].roster_id)],
          created: now - (7 * 24 * 60 * 60 * 1000), // 7 days ago
          estimated_value: 120
        }
      );

      // Alliance 2: Teams 2 and 3 also trade
      if (teams.length > 3) {
        mockTrades.push(
          {
            transaction_id: 'mock_4',
            roster_ids: [String(teams[2].roster_id), String(teams[3].roster_id)],
            created: now - (20 * 24 * 60 * 60 * 1000),
            estimated_value: 180
          },
          {
            transaction_id: 'mock_5',
            roster_ids: [String(teams[2].roster_id), String(teams[3].roster_id)],
            created: now - (10 * 24 * 60 * 60 * 1000),
            estimated_value: 90
          }
        );
      }

      // Some isolated trading
      if (teams.length > 5) {
        mockTrades.push({
          transaction_id: 'mock_6',
          roster_ids: [String(teams[4].roster_id), String(teams[5].roster_id)],
          created: now - (25 * 24 * 60 * 60 * 1000),
          estimated_value: 75
        });
      }
    }

    return mockTrades;
  }

  /**
   * Get relationship between two specific teams
   */
  async getTeamRelationship(team1Id: string, team2Id: string, teams: DookieTeam[]): Promise<TradeRelationship | null> {
    const analysis = await this.analyzeTradeRelationships(teams);
    
    return analysis.tradeWars
      .concat(analysis.tradeAlliances)
      .find(r => 
        (r.teamId1 === team1Id && r.teamId2 === team2Id) ||
        (r.teamId1 === team2Id && r.teamId2 === team1Id)
      ) || null;
  }

  /**
   * Get the most interesting rivalries and alliances for UI display
   */
  async getHighlightedRelationships(teams: DookieTeam[]): Promise<{
    topAlliances: TradeRelationship[];
    topRivalries: TradeRelationship[];
  }> {
    const analysis = await this.analyzeTradeRelationships(teams);
    
    return {
      topAlliances: analysis.tradeAlliances
        .sort((a, b) => b.relationshipStrength - a.relationshipStrength)
        .slice(0, 3),
      topRivalries: analysis.tradeWars
        .sort((a, b) => b.relationshipStrength - a.relationshipStrength)
        .slice(0, 3)
    };
  }
}

export const tradeRelationshipAPI = new TradeRelationshipAPI();