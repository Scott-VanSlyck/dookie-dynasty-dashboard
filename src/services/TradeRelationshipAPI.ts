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
      // Get real trade data from Sleeper API
      const realTrades = await sleeperAPI.getTrades();
      
      console.log(`🔍 Analyzing relationships from ${realTrades.length} real trades`);
      
      if (realTrades.length > 0) {
        return this.calculateTradeRelationships(teams, realTrades);
      } else {
        console.log('⚠️ No trades found - analyzing based on current roster activity');
        // No trades yet, analyze based on other activity patterns
        return this.calculateRelationshipsWithoutTrades(teams);
      }
    } catch (error) {
      console.error('Error analyzing trade relationships:', error);
      throw error;
    }
  }

  /**
   * Calculate relationships between all teams based on real trade data
   */
  private calculateTradeRelationships(teams: DookieTeam[], trades: any[]): TradeWarAnalysis {
    const relationships: TradeRelationship[] = [];
    const teamTradeCount: { [key: string]: number } = {};
    
    // Initialize trade counts
    teams.forEach(team => {
      teamTradeCount[String(team.roster_id)] = 0;
    });

    // Calculate relationships between all team pairs based on real trades
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Filter trades between these two teams
        const tradesBetween = trades.filter(trade => {
          const rosterIds = trade.roster_ids || [];
          return rosterIds.includes(team1.roster_id) && rosterIds.includes(team2.roster_id);
        });

        const tradeCount = tradesBetween.length;
        teamTradeCount[String(team1.roster_id)] += tradeCount;
        teamTradeCount[String(team2.roster_id)] += tradeCount;

        // Determine relationship type and strength based on real trade frequency
        let relationshipType: 'allies' | 'enemies' | 'neutral' = 'neutral';
        let relationshipStrength = 0;
        let description = 'No trading history';

        if (tradeCount >= 3) {
          relationshipType = 'allies';
          relationshipStrength = Math.min(100, tradeCount * 30);
          description = `Frequent trade partners - ${tradeCount} deals completed`;
        } else if (tradeCount === 0) {
          // Check if these teams are avoiding each other in an active trading environment
          const totalLeagueTrades = trades.length;
          if (totalLeagueTrades > 10) {
            relationshipType = 'enemies';
            relationshipStrength = 40;
            description = 'These teams rarely trade with each other';
          } else {
            description = 'No trades yet (early season or inactive trading period)';
          }
        } else if (tradeCount >= 1) {
          relationshipType = 'neutral';
          relationshipStrength = tradeCount * 25;
          description = `Occasional trading partners - ${tradeCount} deal${tradeCount > 1 ? 's' : ''}`;
        }

        // Calculate total estimated value of trades between teams
        const totalValue = tradesBetween.reduce((sum, trade) => {
          return sum + this.estimateTradeValue(trade);
        }, 0);

        relationships.push({
          teamId1: String(team1.roster_id),
          teamId2: String(team2.roster_id),
          tradeCount,
          relationshipType,
          relationshipStrength,
          totalValue,
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

    // Calculate network centrality (how connected each team is in the trade network)
    const networkCentrality = teams.map(team => {
      const teamIdStr = String(team.roster_id);
      const connectedness = relationships
        .filter(r => r.teamId1 === teamIdStr || r.teamId2 === teamIdStr)
        .reduce((sum, r) => sum + r.relationshipStrength, 0);
      
      return {
        teamId: teamIdStr,
        centralityScore: relationships.length > 0 ? Math.round(connectedness / relationships.length) : 0
      };
    }).sort((a, b) => b.centralityScore - a.centralityScore);

    console.log(`✅ Analyzed ${relationships.length} team relationships from ${trades.length} trades`);
    console.log(`📊 Found ${tradeAlliances.length} alliances, ${tradeWars.length} rivalries`);

    return {
      tradeWars,
      tradeAlliances,
      mostActiveTraders,
      isolatedTeams,
      networkCentrality
    };
  }

  /**
   * Calculate relationships without trades (pre-season analysis)
   */
  private async calculateRelationshipsWithoutTrades(teams: DookieTeam[]): Promise<TradeWarAnalysis> {
    // In the absence of trade data, analyze based on other factors
    console.log('📊 Calculating pre-season relationship analysis');
    
    const relationships: TradeRelationship[] = [];
    
    // Create neutral relationships for all team pairs
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        relationships.push({
          teamId1: String(team1.roster_id),
          teamId2: String(team2.roster_id),
          tradeCount: 0,
          relationshipType: 'neutral',
          relationshipStrength: 0,
          totalValue: 0,
          description: 'No trading history yet - season hasn\'t begun',
        });
      }
    }

    return {
      tradeWars: [],
      tradeAlliances: [],
      mostActiveTraders: [],
      isolatedTeams: teams.map(team => String(team.roster_id)), // All teams are "isolated" with no trades
      networkCentrality: teams.map(team => ({
        teamId: String(team.roster_id),
        centralityScore: 0
      }))
    };
  }

  /**
   * Analyze real trade data to estimate values
   */
  private estimateTradeValue(trade: any): number {
    // Estimate trade value based on number of assets involved
    let estimatedValue = 0;
    
    // Count players and picks involved
    const totalAssets = (trade.adds?.length || 0) + (trade.draft_picks?.length || 0);
    
    // Base estimation: more complex trades typically involve higher values
    if (totalAssets >= 6) estimatedValue = 200;
    else if (totalAssets >= 4) estimatedValue = 150;
    else if (totalAssets >= 2) estimatedValue = 100;
    else estimatedValue = 50;
    
    return estimatedValue;
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