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
  // Sort by roster_id for deterministic but "random-looking" order
  const sortedTeams = [...teams].sort((a, b) => {
    const aId = a.roster_id || a.user_id || 0;
    const bId = b.roster_id || b.user_id || 0;
    return aId - bId;
  });
  
  return sortedTeams.slice(0, 6).map((team, index) => ({
    pick: index + 1,
    team,
    timestamp: new Date().toISOString()
  }));
};

/**
 * Generate Tankathon data for draft positioning analysis
 */
export const generateTankathonData = (teams: any[], weeksRemaining: number = 3): any[] => {
  console.log('generateTankathonData called with teams:', teams.length, 'weeksRemaining:', weeksRemaining);
  
  if (!teams || teams.length === 0) {
    console.warn('No teams provided to generateTankathonData');
    return [];
  }

  try {
    // Sort teams by record (worst first for draft positioning)
    const sortedTeams = [...teams].sort((a, b) => {
      const aWins = a.record?.wins || 0;
      const aLosses = a.record?.losses || 0;
      const bWins = b.record?.wins || 0;
      const bLosses = b.record?.losses || 0;
      
      const aWinPct = calculateWinPercentage(aWins, aLosses);
      const bWinPct = calculateWinPercentage(bWins, bLosses);
      return aWinPct - bWinPct;
    });

    const tankathonData = sortedTeams.map((team, index) => {
      try {
        const currentWins = team.record?.wins || 0;
        const currentLosses = team.record?.losses || 0;
        const currentWinPct = calculateWinPercentage(currentWins, currentLosses);
        
        // Simulate potential draft positions
        const currentPosition = index + 1;
        
        // Calculate potential range based on remaining games
        const maxAdditionalWins = weeksRemaining;
        const maxAdditionalLosses = weeksRemaining;
        
        // Estimate position range (simplified calculation)
        const positionVariance = Math.min(3, Math.ceil(weeksRemaining / 2));
        const minPick = Math.max(1, currentPosition - positionVariance);
        const maxPick = Math.min(teams.length, currentPosition + positionVariance);
        
        // Get lottery odds (safe array access)
        const lotteryPosition = Math.max(0, currentPosition - 1);
        const baseLotteryOdds = lotteryPosition < LOTTERY_ODDS.length ? LOTTERY_ODDS[lotteryPosition] : 0;
        
        return {
          team,
          current_pick: currentPosition,
          projected_pick: currentPosition, // Simplified - would be more complex in reality
          min_pick: minPick,
          max_pick: maxPick,
          currentRecord: {
            wins: currentWins,
            losses: currentLosses
          },
          projectedRecord: {
            wins: currentWins + Math.floor(weeksRemaining / 2), // Estimate 50% win rate
            losses: currentLosses + Math.ceil(weeksRemaining / 2)
          },
          strengthOfSchedule: 0.5, // Placeholder
          lottery_odds: baseLotteryOdds,
          lotteryOdds: {
            position1: currentPosition <= 6 ? baseLotteryOdds : 0,
            position2: currentPosition <= 6 ? baseLotteryOdds * 0.6 : 0,
            position3: currentPosition <= 6 ? baseLotteryOdds * 0.4 : 0,
            top6: currentPosition <= 6 ? Math.min(100, baseLotteryOdds * 2) : 0
          },
          scenarios: {
            bestCase: minPick,
            worstCase: maxPick,
            mostLikely: currentPosition
          },
          games_remaining: weeksRemaining,
          elimination_scenario: currentPosition <= 6 
            ? `Need ${Math.max(0, 3 - currentWins)} more losses to secure lottery position`
            : 'Not in lottery contention'
        };
      } catch (teamError) {
        console.error('Error processing team for tankathon data:', team, teamError);
        // Return a safe fallback object
        return {
          team,
          current_pick: index + 1,
          projected_pick: index + 1,
          min_pick: index + 1,
          max_pick: index + 1,
          currentRecord: { wins: 0, losses: 0 },
          projectedRecord: { wins: 0, losses: weeksRemaining },
          strengthOfSchedule: 0.5,
          lottery_odds: 0,
          lotteryOdds: { position1: 0, position2: 0, position3: 0, top6: 0 },
          scenarios: { bestCase: index + 1, worstCase: index + 1, mostLikely: index + 1 },
          games_remaining: weeksRemaining,
          elimination_scenario: 'Data not available'
        };
      }
    });

    console.log('Generated tankathon data for', tankathonData.length, 'teams');
    return tankathonData;
  } catch (error) {
    console.error('Error in generateTankathonData:', error);
    return [];
  }
};

/**
 * Simulate season outcomes for remaining games
 */
export const simulateSeasonOutcomes = (teams: any[], iterations: number = 1000): Map<string, number[]> => {
  console.log('simulateSeasonOutcomes called with teams:', teams.length, 'iterations:', iterations);
  
  if (!teams || teams.length === 0) {
    console.warn('No teams provided to simulateSeasonOutcomes');
    return new Map();
  }

  try {
    const teamPositions = new Map<string, number[]>();
    
    // Initialize position tracking for each team
    teams.forEach(team => {
      teamPositions.set(team.user_id || team.roster_id?.toString() || 'unknown', []);
    });

    // Run simulations
    for (let i = 0; i < iterations; i++) {
      try {
        // Simulate remaining games for each team
        const simulatedTeams = teams.map(team => {
          const currentWins = team.record?.wins || 0;
          const currentLosses = team.record?.losses || 0;
          const gamesRemaining = 3; // Assume 3 games left
          
          // Deterministic projection based on current performance
          const currentWinPct = currentWins + currentLosses > 0 
            ? currentWins / (currentWins + currentLosses) 
            : 0.5; // Default to 50% if no games played
          const additionalWins = Math.round(gamesRemaining * currentWinPct);
          
          return {
            ...team,
            finalWins: currentWins + additionalWins,
            finalLosses: currentLosses + (gamesRemaining - additionalWins)
          };
        });
        
        // Sort by final record to determine draft positions (worst record gets pick 1)
        simulatedTeams.sort((a, b) => {
          const aTotalGames = a.finalWins + a.finalLosses;
          const bTotalGames = b.finalWins + b.finalLosses;
          
          if (aTotalGames === 0 && bTotalGames === 0) return 0;
          if (aTotalGames === 0) return 1;
          if (bTotalGames === 0) return -1;
          
          const aWinPct = a.finalWins / aTotalGames;
          const bWinPct = b.finalWins / bTotalGames;
          return aWinPct - bWinPct; // Ascending order (worst first)
        });
        
        // Record positions
        simulatedTeams.forEach((team, position) => {
          const teamId = team.user_id || team.roster_id?.toString() || 'unknown';
          const positions = teamPositions.get(teamId);
          if (positions) {
            positions.push(position + 1);
          }
        });
      } catch (simulationError) {
        console.error('Error in simulation iteration', i, ':', simulationError);
        continue; // Skip this iteration
      }
    }

    console.log('Completed', iterations, 'simulations for', teams.length, 'teams');
    return teamPositions;
  } catch (error) {
    console.error('Error in simulateSeasonOutcomes:', error);
    return new Map();
  }
};