/**
 * Type definitions for Dookie Dynasty Dashboard
 */

// Re-export types from SleeperAPI
export type { DookieTeam, SleeperUser, SleeperRoster, SleeperLeague, MatchupResult } from './services/SleeperAPI';

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
  currentRecord: {
    wins: number;
    losses: number;
  };
  projectedRecord: {
    wins: number;
    losses: number;
  };
  strengthOfSchedule: number;
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