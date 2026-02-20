/**
 * Common types for the Dookie Dynasty Dashboard
 */

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

export interface LotteryResult {
  pick: number;
  team: DookieTeam;
  timestamp?: string;
}

export interface PlayerValue {
  player_id: string;
  name: string;
  position: string;
  team: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  dynasty_rank?: number;
  redraft_rank?: number;
}

export interface Trade {
  id: string;
  date: string;
  teams: {
    roster_id: number;
    team_name: string;
    players_sent: string[];
    players_received: string[];
    picks_sent?: DraftPick[];
    picks_received?: DraftPick[];
  }[];
  status: 'pending' | 'completed' | 'vetoed';
}

export interface DraftPick {
  season: string;
  round: number;
  pick_no?: number;
  original_owner: number;
  current_owner: number;
}

export interface SeasonData {
  season: string;
  league_id: string;
  champion: DookieTeam;
  standings: DookieTeam[];
  draft_results?: DraftResult[];
  trades?: Trade[];
}

export interface DraftResult {
  pick_no: number;
  round: number;
  player_id: string;
  player_name: string;
  position: string;
  team: string;
  roster_id: number;
}

export interface PlayerStats {
  player_id: string;
  name: string;
  position: string;
  team: string;
  fantasy_points: number;
  games_played: number;
  injury_status?: string;
  bye_week?: number;
}

export interface WeeklyMatchup {
  week: number;
  matchup_id: number;
  teams: {
    roster_id: number;
    points: number;
    players: string[];
    starters: string[];
  }[];
}

export interface TankathonData {
  team: DookieTeam;
  current_pick: number;
  projected_pick: number;
  max_pick: number;
  min_pick: number;
  lottery_odds: number;
  games_remaining: number;
  max_points_possible: number;
  elimination_scenario: string;
}

export interface DashboardStats {
  total_teams: number;
  current_week: number;
  season_status: 'pre_draft' | 'drafting' | 'pre_season' | 'regular_season' | 'playoffs' | 'complete' | string;
  lottery_eligible_teams: number;
  total_trades: number;
  most_active_trader: DookieTeam;
  highest_scoring_team: DookieTeam;
  longest_win_streak: {
    team: DookieTeam;
    streak: number;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description?: string;
}

// Historical Trade Tracking Types
export interface HistoricalPlayerValue {
  player_id: string;
  date: string;
  value: number;
  source: 'keeptradecut' | 'dynastydaddy' | 'calculated';
}

export interface TradeTimeline {
  execution: {
    date: string;
    values: { [player_id: string]: number };
  };
  one_year: {
    date: string;
    values: { [player_id: string]: number };
  } | null;
  three_years: {
    date: string;
    values: { [player_id: string]: number };
  } | null;
}

export interface TradeAnalysisPoint {
  period: 'execution' | 'one_year' | 'three_years';
  date: string;
  team_a_value: number;
  team_b_value: number;
  winner: 'team_a' | 'team_b' | 'even';
  value_difference: number;
  percentage_difference: number;
}

export interface HistoricalTrade extends Trade {
  analysis: {
    timeline: TradeTimeline;
    evolution: TradeAnalysisPoint[];
    final_grade: {
      team_a_grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
      team_b_grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
      hindsight_winner: 'team_a' | 'team_b' | 'even';
      lessons_learned: string[];
    };
  };
  participants: {
    team_a: {
      roster_id: number;
      team_name: string;
      players_sent: string[];
      players_received: string[];
      picks_sent?: DraftPick[];
      picks_received?: DraftPick[];
    };
    team_b: {
      roster_id: number;
      team_name: string;
      players_sent: string[];
      players_received: string[];
      picks_sent?: DraftPick[];
      picks_received?: DraftPick[];
    };
  };
}

export interface TradePerformanceMetrics {
  manager_id: string;
  manager_name: string;
  total_trades: number;
  immediate_wins: number;
  long_term_wins: number;
  trade_accuracy: number; // % of trades that looked good at execution and stayed good
  hindsight_score: number; // Overall score when evaluated 3 years later
  best_position_traded: string;
  worst_position_traded: string;
  avg_trade_value: number;
  biggest_win: HistoricalTrade;
  biggest_loss: HistoricalTrade;
}

export interface PositionTradingAnalysis {
  position: string;
  total_trades_involving: number;
  avg_value_retention_1yr: number; // % of value retained after 1 year
  avg_value_retention_3yr: number; // % of value retained after 3 years
  best_age_to_trade: number;
  worst_age_to_trade: number;
  injury_impact_factor: number;
  most_successful_trades: HistoricalTrade[];
  biggest_busts: HistoricalTrade[];
}

export interface TradeLearning {
  id: string;
  title: string;
  category: 'age_curve' | 'injury_risk' | 'position_value' | 'market_timing' | 'team_situation';
  description: string;
  supporting_trades: string[]; // Trade IDs that support this learning
  confidence_level: 'high' | 'medium' | 'low';
  impact_score: number; // How much this lesson could improve future trades
}