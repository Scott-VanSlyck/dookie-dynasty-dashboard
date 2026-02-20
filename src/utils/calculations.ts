/**
 * Utility functions for calculations used throughout the dashboard
 */

/**
 * Calculate win percentage from wins and losses
 */
export const calculateWinPercentage = (wins: number, losses: number): number => {
  const totalGames = wins + losses;
  if (totalGames === 0) return 0;
  return wins / totalGames;
};

/**
 * Format a decimal as a percentage string
 */
export const formatPercentage = (decimal: number): string => {
  return `${(decimal * 100).toFixed(1)}%`;
};

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  
  if (j == 1 && k != 11) {
    return num + "st";
  }
  if (j == 2 && k != 12) {
    return num + "nd";
  }
  if (j == 3 && k != 13) {
    return num + "rd";
  }
  return num + "th";
};

/**
 * Calculate variance in a dataset
 */
export const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Calculate standard deviation
 */
export const calculateStandardDeviation = (values: number[]): number => {
  return Math.sqrt(calculateVariance(values));
};

/**
 * Calculate consistency score (inverse of coefficient of variation)
 * Higher score = more consistent performance
 */
export const calculateConsistencyScore = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (mean === 0) return 0;
  
  const stdDev = calculateStandardDeviation(values);
  const coefficientOfVariation = stdDev / mean;
  
  // Convert to consistency score (0-100, higher is better)
  return Math.max(0, 100 - (coefficientOfVariation * 100));
};

/**
 * Calculate Z-score for a value in a dataset
 */
export const calculateZScore = (value: number, values: number[]): number => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = calculateStandardDeviation(values);
  
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate points per game
 */
export const calculatePointsPerGame = (totalPoints: number, gamesPlayed: number): number => {
  if (gamesPlayed === 0) return 0;
  return totalPoints / gamesPlayed;
};

/**
 * Calculate strength of schedule
 * Higher values indicate tougher schedule
 */
export const calculateStrengthOfSchedule = (opponentWinPercentages: number[]): number => {
  if (opponentWinPercentages.length === 0) return 0;
  return opponentWinPercentages.reduce((sum, pct) => sum + pct, 0) / opponentWinPercentages.length;
};

/**
 * Determine if a team is trending up, down, or stable
 */
export const calculateTrend = (recentScores: number[]): 'up' | 'down' | 'stable' => {
  if (recentScores.length < 3) return 'stable';
  
  const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
  const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  const threshold = firstAvg * 0.1; // 10% threshold
  
  if (difference > threshold) return 'up';
  if (difference < -threshold) return 'down';
  return 'stable';
};

/**
 * Calculate playoff odds based on current record and remaining games
 */
export const calculatePlayoffOdds = (
  currentWins: number,
  currentLosses: number,
  gamesRemaining: number,
  totalTeams: number,
  playoffSpots: number = 6
): number => {
  // Simplified playoff odds calculation
  // In reality, this would be much more complex
  const currentWinPct = calculateWinPercentage(currentWins, currentLosses);
  const projectedWins = currentWins + (gamesRemaining * currentWinPct);
  const projectedWinPct = projectedWins / (currentWins + currentLosses + gamesRemaining);
  
  // Rough approximation: teams above 60% win rate have good playoff odds
  if (projectedWinPct >= 0.65) return 0.9;
  if (projectedWinPct >= 0.55) return 0.7;
  if (projectedWinPct >= 0.45) return 0.4;
  if (projectedWinPct >= 0.35) return 0.1;
  return 0.05;
};

/**
 * Calculate draft lottery odds based on record
 */
export const calculateLotteryOdds = (
  wins: number,
  losses: number,
  lotteryTeamRecords: Array<{wins: number, losses: number}>
): number => {
  // Sort lottery teams by record (worst first)
  const sortedRecords = lotteryTeamRecords.sort((a, b) => {
    const aWinPct = calculateWinPercentage(a.wins, a.losses);
    const bWinPct = calculateWinPercentage(b.wins, b.losses);
    return aWinPct - bWinPct;
  });
  
  // Find position in lottery
  const myWinPct = calculateWinPercentage(wins, losses);
  const position = sortedRecords.findIndex(record => {
    const recordWinPct = calculateWinPercentage(record.wins, record.losses);
    return Math.abs(recordWinPct - myWinPct) < 0.001;
  });
  
  // NBA-style lottery odds (simplified)
  const lotteryOdds = [0.25, 0.156, 0.156, 0.119, 0.104, 0.09];
  return lotteryOdds[position] || 0.05;
};

/**
 * Format currency values
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Calculate age from birthdate
 */
export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get team colors based on team name or ID
 */
export const getTeamColor = (teamName: string): string => {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    const char = teamName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const colors = [
    '#1e88e5', '#ff9800', '#4caf50', '#f44336', 
    '#9c27b0', '#00bcd4', '#795548', '#607d8b',
    '#e91e63', '#3f51b5', '#009688', '#ff5722'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Lottery odds for bottom 6 teams (NBA-style weighted system)
 */
// Dookie Dynasty 1/2.5 drop system starting at 60%
export const LOTTERY_ODDS = [60.0, 24.0, 9.6, 3.84, 1.54, 0.62];

/**
 * Run weighted lottery based on team records
 */
export const runWeightedLottery = (teams: any[]): any[] => {
  // Sort teams by record (worst first)
  const sortedTeams = [...teams].sort((a, b) => {
    const aWinPct = calculateWinPercentage(a.record?.wins || 0, a.record?.losses || 0);
    const bWinPct = calculateWinPercentage(b.record?.wins || 0, b.record?.losses || 0);
    return aWinPct - bWinPct;
  });

  const results = [];
  const remainingTeams = [...sortedTeams];
  
  for (let pick = 1; pick <= 6; pick++) {
    if (remainingTeams.length === 0) break;
    
    // Create weighted pool
    const weightedPool: any[] = [];
    remainingTeams.forEach((team, index) => {
      const odds = LOTTERY_ODDS[index] || 1;
      const weight = Math.floor(odds * 10); // Scale for better randomization
      
      for (let i = 0; i < weight; i++) {
        weightedPool.push(team);
      }
    });
    
    // Pick random team from weighted pool
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedTeam = weightedPool[randomIndex];
    
    results.push({
      pick,
      team: selectedTeam,
      timestamp: new Date().toISOString()
    });
    
    // Remove selected team from remaining teams
    const teamIndex = remainingTeams.findIndex(t => t.roster_id === selectedTeam.roster_id);
    if (teamIndex !== -1) {
      remainingTeams.splice(teamIndex, 1);
    }
  }
  
  return results;
};

/**
 * Run equal odds lottery (each team has same chance)
 */
export const runEqualLottery = (teams: any[]): any[] => {
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  return shuffledTeams.slice(0, 6).map((team, index) => ({
    pick: index + 1,
    team,
    timestamp: new Date().toISOString()
  }));
};

/**
 * Generate Tankathon data for draft positioning analysis
 */
export const generateTankathonData = (teams: any[], weeksRemaining: number = 3): any[] => {
  // Sort teams by record (worst first for draft positioning)
  const sortedTeams = [...teams].sort((a, b) => {
    const aWinPct = calculateWinPercentage(a.record?.wins || 0, a.record?.losses || 0);
    const bWinPct = calculateWinPercentage(b.record?.wins || 0, b.record?.losses || 0);
    return aWinPct - bWinPct;
  });

  return sortedTeams.map((team, index) => {
    const currentWins = team.record?.wins || 0;
    const currentLosses = team.record?.losses || 0;
    const currentWinPct = calculateWinPercentage(currentWins, currentLosses);
    
    // Simulate potential draft positions
    const currentPosition = index + 1;
    const bestCaseWins = Math.min(weeksRemaining, weeksRemaining); // Win all remaining
    const worstCaseLosses = Math.min(weeksRemaining, weeksRemaining); // Lose all remaining
    
    const maxPossibleWins = currentWins + bestCaseWins;
    const maxPossibleLosses = currentLosses + worstCaseLosses;
    
    return {
      team,
      current_pick: currentPosition,
      projected_pick: currentPosition, // Simplified - would be more complex in reality
      max_pick: Math.min(12, currentPosition + 2), // Best case scenario
      min_pick: Math.max(1, currentPosition - 2), // Worst case scenario
      lottery_odds: currentPosition <= 6 ? LOTTERY_ODDS[currentPosition - 1] || 5 : 0,
      games_remaining: weeksRemaining,
      max_points_possible: (team.points_for || 0) + (weeksRemaining * 120), // Estimate 120 ppg
      elimination_scenario: currentPosition <= 6 
        ? `Need ${Math.max(0, 3 - currentWins)} more losses to secure lottery position`
        : 'Not in lottery contention'
    };
  });
};

/**
 * Simulate season outcomes for remaining games
 */
export const simulateSeasonOutcomes = (teams: any[], iterations: number = 1000): any => {
  const outcomes = {
    draftPositions: teams.map(() => ({ min: 12, max: 1, avg: 6.5 })),
    playoffOdds: teams.map(() => 0.5),
    lotteryOdds: teams.map(() => 0)
  };

  // Simplified simulation - in reality this would be much more complex
  for (let i = 0; i < iterations; i++) {
    // Simulate remaining games for each team
    const simulatedTeams = teams.map(team => {
      const currentWins = team.record?.wins || 0;
      const currentLosses = team.record?.losses || 0;
      const gamesRemaining = 3; // Assume 3 games left
      
      // Random simulation of remaining games
      let additionalWins = 0;
      for (let game = 0; game < gamesRemaining; game++) {
        if (Math.random() > 0.5) additionalWins++;
      }
      
      return {
        ...team,
        finalWins: currentWins + additionalWins,
        finalLosses: currentLosses + (gamesRemaining - additionalWins)
      };
    });
    
    // Sort by final record to determine draft positions
    simulatedTeams.sort((a, b) => {
      const aWinPct = a.finalWins / (a.finalWins + a.finalLosses);
      const bWinPct = b.finalWins / (b.finalWins + b.finalLosses);
      return aWinPct - bWinPct; // Worst record gets pick 1
    });
    
    // Update outcome tracking
    simulatedTeams.forEach((team, position) => {
      const originalIndex = teams.findIndex(t => t.roster_id === team.roster_id);
      if (originalIndex !== -1) {
        const draftPosition = position + 1;
        outcomes.draftPositions[originalIndex].min = Math.min(
          outcomes.draftPositions[originalIndex].min, 
          draftPosition
        );
        outcomes.draftPositions[originalIndex].max = Math.max(
          outcomes.draftPositions[originalIndex].max, 
          draftPosition
        );
      }
    });
  }

  return outcomes;
};