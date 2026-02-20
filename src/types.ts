/**
 * Type definitions for Dookie Dynasty Dashboard
 */

// Core team interface
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

// Re-export other types from SleeperAPI
export type { SleeperUser, SleeperRoster, SleeperLeague, MatchupResult } from './services/SleeperAPI';

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
}

// Dashboard types
export interface DashboardStats {
  total_teams: number;
  current_week: number;
  season_status: 'pre_draft' | 'drafting' | 'in_season' | 'complete';
  lottery_eligible_teams: number;
  total_trades: number;
  most_active_trader: DookieTeam;
  highest_scoring_team: DookieTeam;
  longest_win_streak: {
    team: DookieTeam;
    streak: number;
  };
}

// Tankathon types
export interface TankathonData {
  team: DookieTeam;
  current_pick: number;
  projected_pick: number;
  min_pick: number;
  max_pick: number;
  currentRecord: {
    wins: number;
    losses: number;
  };
  projectedRecord: {
    wins: number;
    losses: number;
  };
  strengthOfSchedule: number;
  lottery_odds: number;
  lotteryOdds: {
    position1: number;
    position2: number;
    position3: number;
    top6: number;
  };
  scenarios: {
    bestCase: number;
    worstCase: number;
    mostLikely: number;
  };
  elimination_scenario: string;
  games_remaining: number;
}

export interface WeeklyMatchup {
  week: number;
  matchup_id: number;
  roster_id: number;
  players: string[];
  starters: string[];
  points: number;
}

export interface SeasonData {
  season: string;
  teams: DookieTeam[];
  matchups: WeeklyMatchup[];
  transactions: Trade[];
}

// Player types
export interface Player {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string;
  age?: number;
  years_exp?: number;
  dynasty_value?: number;
  injury_status?: string;
}

export interface PlayerValue {
  player_id: string;
  name: string;
  position: string;
  team?: string;
  value: number;
  dynasty_rank: number;
  redraft_rank?: number;
  trend: 'up' | 'down' | 'stable';
  age?: number;
  years_exp?: number;
}

// Trade types
export interface Trade {
  transaction_id: string;
  roster_ids: string[];
  created: number;
  type: string;
  settings?: {
    waiver_bid?: number;
  };
  adds?: { [player_id: string]: string };
  drops?: { [player_id: string]: string };
  draft_picks?: DraftPick[];
}

export interface HistoricalTrade {
  id: string;
  date: string;
  status: string;
  teams: DookieTeam[];
  participants: any;
  analysis: any;
  consensus: any;
  metadata: any;
}

export interface TradePerformanceMetrics {
  [key: string]: any;
}

export interface PositionTradingAnalysis {
  [key: string]: any;
}

export interface TradeLearning {
  [key: string]: any;
}

export interface TradeAnalysisPoint {
  id: string;
  date: string;
  analysis: any;
  consensus: any;
  metadata: any;
}

export interface HistoricalPlayerValue {
  player_id: string;
  date: string;
  value: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DraftPick {
  season: string;
  round: number;
  roster_id: string;
  previous_owner_id: string;
  owner_id: string;
}

// Analytics types
export interface TeamPerformance {
  team: DookieTeam;
  averagePoints: number;
  consistency: number; // Standard deviation
  weeklyTrends: number[];
  positionAnalysis: {
    [position: string]: {
      avgPoints: number;
      consistency: number;
    };
  };
}

export interface LeagueRecord {
  id: string;
  category: 'points' | 'streak' | 'margin' | 'consistency';
  title: string;
  description: string;
  holder: DookieTeam;
  value: number;
  week?: number;
  season: string;
}

// Historical types
export interface HistoricalSeason {
  season: string;
  champion: DookieTeam;
  runnerUp: DookieTeam;
  regularSeasonWinner: DookieTeam;
  playoffBracket: PlayoffMatchup[];
}

export interface PlayoffMatchup {
  week: number;
  matchup_id: number;
  team1: DookieTeam;
  team2: DookieTeam;
  team1_score: number;
  team2_score: number;
  winner: DookieTeam;
}

// Draft types
export interface DraftLotteryResult {
  team: DookieTeam;
  originalPosition: number;
  finalPosition: number;
  moved: number; // positive = moved up, negative = moved down
}

export interface LotteryOdds {
  position: number;
  team: DookieTeam;
  record: string;
  odds: {
    first: number;
    second: number;
    third: number;
    top6: number;
  };
}

export interface LotteryResult {
  pick: number;
  team: DookieTeam;
  timestamp: string;
}

// Fantasy scoring types
export interface ScoringSettings {
  [key: string]: number; // e.g., "pass_td": 4, "rush_yd": 0.1
}

// Engagement feature types (from Phase 2)
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trading' | 'roster' | 'performance' | 'draft' | 'consistency';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  requirement: string;
}

export interface TeamPersonality {
  teamId: string;
  primaryPersonality: PersonalityProfile;
  secondaryPersonality?: PersonalityProfile;
  traits: PersonalityTrait[];
  overallStrategy: string;
  confidence: number;
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

export interface PersonalityTrait {
  name: string;
  description: string;
  icon: string;
  color: string;
  strength: number;
}

export interface TradeRelationship {
  teamId1: string;
  teamId2: string;
  tradeCount: number;
  relationshipType: 'allies' | 'enemies' | 'neutral';
  relationshipStrength: number;
  lastTradeDate?: string;
  totalValue: number;
  description: string;
}