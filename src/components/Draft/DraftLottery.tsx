/**
 * Draft Lottery Component - Interactive lottery system for Dookie Dynasty
 * Based on the existing lottery HTML/Python system but built in React
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fade,
  Grow
} from '@mui/material';
import {
  Casino,
  EmojiEvents,
  Refresh,
  Download,
  Share
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';

import { DookieTeam, LotteryResult } from '../../types';
import { runWeightedLottery, runEqualLottery, LOTTERY_ODDS, getOrdinalSuffix } from '../../utils/calculations';

interface DraftLotteryProps {
  teams: DookieTeam[];
}

// Animation keyframes
const celebrate = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(5deg); }
  50% { transform: scale(1.2) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1.05) rotate(0deg); }
`;

const confetti = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
`;

const DraftLottery: React.FC<DraftLotteryProps> = ({ teams }) => {
  const [lotteryTeams, setLotteryTeams] = useState<DookieTeam[]>([]);
  const [lotteryResults, setLotteryResults] = useState<LotteryResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPick, setCurrentPick] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [resultsDialog, setResultsDialog] = useState(false);

  useEffect(() => {
    // Get bottom 6 teams for lottery
    const sortedTeams = teams.slice().sort((a, b) => {
      const aWins = a.record?.wins || 0;
      const bWins = b.record?.wins || 0;
      const aLosses = a.record?.losses || 0;
      const bLosses = b.record?.losses || 0;
      
      // Sort by win percentage (worst first)
      const aWinPct = aWins + aLosses === 0 ? 0 : aWins / (aWins + aLosses);
      const bWinPct = bWins + bLosses === 0 ? 0 : bWins / (bWins + bLosses);
      
      if (aWinPct !== bWinPct) {
        return aWinPct - bWinPct;
      }
      
      // Tie-breaker: points against (higher = worse)
      return (b.points_against || 0) - (a.points_against || 0);
    });

    setLotteryTeams(sortedTeams.slice(0, 6));
  }, [teams]);

  const startLottery = async (weighted: boolean = true) => {
    if (isRunning || lotteryTeams.length === 0) return;

    setIsRunning(true);
    setCurrentPick(0);
    setLotteryResults([]);
    setShowResults(false);
    setShowConfetti(false);

    try {
      let results: LotteryResult[];
      
      if (weighted && lotteryTeams.length === 6) {
        results = await runAnimatedWeightedLottery();
      } else {
        results = await runAnimatedEqualLottery();
      }

      setLotteryResults(results);
      setShowResults(true);
      setShowConfetti(true);
      
      // Auto-hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error('Error running lottery:', error);
    } finally {
      setIsRunning(false);
      setCurrentPick(0);
    }
  };

  const runAnimatedWeightedLottery = async (): Promise<LotteryResult[]> => {
    const results: LotteryResult[] = [];
    const remainingTeams = [...lotteryTeams];
    const remainingOdds = [...LOTTERY_ODDS];

    for (let pick = 1; pick <= lotteryTeams.length; pick++) {
      setCurrentPick(pick);
      
      // Dramatic pause
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run weighted selection
      const totalWeight = remainingOdds.reduce((sum, weight) => sum + weight, 0);
      const random = Math.random() * totalWeight;
      
      let cumulativeWeight = 0;
      let winnerIndex = 0;
      
      for (let i = 0; i < remainingOdds.length; i++) {
        cumulativeWeight += remainingOdds[i];
        if (random <= cumulativeWeight) {
          winnerIndex = i;
          break;
        }
      }
      
      const winner = remainingTeams[winnerIndex];
      
      results.push({
        pick,
        team: winner,
        timestamp: new Date().toISOString()
      });
      
      remainingTeams.splice(winnerIndex, 1);
      remainingOdds.splice(winnerIndex, 1);
      
      // Brief pause before next pick
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  };

  const runAnimatedEqualLottery = async (): Promise<LotteryResult[]> => {
    const results: LotteryResult[] = [];
    const remainingTeams = [...lotteryTeams];

    for (let pick = 1; pick <= lotteryTeams.length; pick++) {
      setCurrentPick(pick);
      
      // Dramatic pause
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Random selection
      const winnerIndex = Math.floor(Math.random() * remainingTeams.length);
      const winner = remainingTeams[winnerIndex];
      
      results.push({
        pick,
        team: winner,
        timestamp: new Date().toISOString()
      });
      
      remainingTeams.splice(winnerIndex, 1);
      
      // Brief pause before next pick
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    return results;
  };

  const resetLottery = () => {
    setLotteryResults([]);
    setShowResults(false);
    setCurrentPick(0);
    setShowConfetti(false);
    setResultsDialog(false);
  };

  const exportResults = () => {
    if (lotteryResults.length === 0) return;

    const data = {
      timestamp: new Date().toISOString(),
      league: 'Dookie Dynasty',
      lottery_type: 'weighted',
      results: lotteryResults.map(result => ({
        pick: result.pick,
        team_name: result.team.team_name,
        owner_name: result.team.owner_name,
        roster_id: result.team.roster_id
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dookie_dynasty_lottery_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get current odds for display
  const getCurrentOdds = () => {
    if (!isRunning || currentPick === 0) return [];
    
    const remainingTeams = lotteryTeams.filter(team => 
      !lotteryResults.some(result => result.team.roster_id === team.roster_id)
    );
    
    return remainingTeams.map((team, index) => ({
      team,
      odds: LOTTERY_ODDS[index] || 0
    }));
  };

  return (
    <Box>
      {/* Confetti Effect */}
      {showConfetti && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          {Array.from({ length: 50 }, (_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                width: 10,
                height: 10,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][i % 6],
                animation: `${confetti} 3s linear infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </Box>
      )}

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          🎰 Draft Lottery System
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Weighted lottery system with 1/2.5 drop odds
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Created by Grace 🐐 | Commissioner: CookieDonker
        </Typography>
      </Box>

      {/* Current Pick Display */}
      {isRunning && (
        <Fade in={isRunning}>
          <Card sx={{ mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 2 }}>
                🎯 Determining Pick #{currentPick}
              </Typography>
              <LinearProgress sx={{ bgcolor: 'primary.dark' }} />
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Current Odds Table */}
      {isRunning && getCurrentOdds().length > 0 && (
        <Fade in={isRunning}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Current Lottery Odds
              </Typography>
              <TableContainer component={Paper} sx={{ bgcolor: 'background.default' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell align="right">Chance for Pick #{currentPick}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentOdds().map(({ team, odds }) => (
                      <TableRow key={team.roster_id}>
                        <TableCell>{team.team_name}</TableCell>
                        <TableCell>{team.owner_name}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${odds}%`}
                            size="small"
                            color={odds >= 20 ? 'success' : odds >= 8 ? 'warning' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Fade>
      )}

      <Grid container spacing={3}>
        {/* Lottery Teams */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lottery Eligible Teams ({lotteryTeams.length})
              </Typography>
              <Grid container spacing={2}>
                {lotteryTeams.map((team, index) => {
                  const result = lotteryResults.find(r => r.team.roster_id === team.roster_id);
                  const isWinner = !!result;
                  
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={team.roster_id}>
                      <Grow in={true} timeout={300 + index * 100}>
                        <Card
                          sx={{
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            bgcolor: isWinner ? 'success.main' : 'background.paper',
                            color: isWinner ? 'white' : 'inherit',
                            animation: isWinner ? `${celebrate} 1s ease-in-out` : 'none',
                            '&:hover': !isWinner ? {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            } : {}
                          }}
                        >
                          <CardContent>
                            {isWinner && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'rgba(0,0,0,0.7)',
                                  borderRadius: '50%',
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {result.pick}
                                </Typography>
                              </Box>
                            )}
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar
                                sx={{
                                  bgcolor: isWinner ? 'rgba(255,255,255,0.2)' : 'primary.main',
                                  width: 40,
                                  height: 40
                                }}
                              >
                                {team.owner_name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} noWrap>
                                  {team.team_name}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
                                  {team.owner_name}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`${team.record?.wins || 0}-${team.record?.losses || 0}`}
                                size="small"
                                sx={{
                                  bgcolor: isWinner ? 'rgba(255,255,255,0.2)' : 'default',
                                  color: isWinner ? 'inherit' : 'default'
                                }}
                              />
                              <Chip
                                label={`${LOTTERY_ODDS[index]}% odds`}
                                size="small"
                                color={LOTTERY_ODDS[index] >= 20 ? 'success' : LOTTERY_ODDS[index] >= 8 ? 'warning' : 'default'}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Controls & Results */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lottery Controls
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="medium"
                  startIcon={<Casino />}
                  onClick={() => startLottery(true)}
                  disabled={isRunning || lotteryTeams.length !== 6}
                  sx={{ py: 2 }}
                >
                  {isRunning ? 'Running Lottery...' : 'Start Weighted Lottery'}
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Casino />}
                  onClick={() => startLottery(false)}
                  disabled={isRunning}
                >
                  Equal Odds Lottery
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetLottery}
                  disabled={isRunning}
                >
                  Reset Lottery
                </Button>
              </Box>
              
              {lotteryTeams.length !== 6 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Expected 6 teams for weighted lottery. Current: {lotteryTeams.length}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lottery Odds Reference */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Weighted Lottery Odds
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                1/2.5 drop system for bottom 6 teams:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell align="right">Odds</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {LOTTERY_ODDS.map((odds, index) => (
                      <TableRow key={index}>
                        <TableCell>{getOrdinalSuffix(index + 1)} worst</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${odds}%`}
                            size="small"
                            color={odds >= 20 ? 'success' : odds >= 8 ? 'warning' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        {showResults && (
          <Grid size={{ xs: 12 }}>
            <Fade in={showResults}>
              <Card sx={{ bgcolor: 'success.dark', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents />
                      🏆 Final Lottery Results
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={exportResults}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                      >
                        Export
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Share />}
                        onClick={() => setResultsDialog(true)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                      >
                        Share
                      </Button>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {lotteryResults.map((result, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={result.team.roster_id}>
                        <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: index < 3 ? '#ffd700' : 'rgba(255,255,255,0.2)',
                                  color: index < 3 ? '#000' : '#fff',
                                  fontWeight: 'bold'
                                }}
                              >
                                {result.pick}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {result.team.team_name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                  {result.team.owner_name}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        )}
      </Grid>

      {/* Results Dialog */}
      <Dialog
        open={resultsDialog}
        onClose={() => setResultsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Share Lottery Results</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            🏆 Dookie Dynasty Draft Lottery Results - {new Date().toLocaleDateString()}
          </Typography>
          {lotteryResults.map(result => (
            <Typography key={result.team.roster_id}>
              Pick #{result.pick}: {result.team.team_name} ({result.team.owner_name})
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialog(false)}>Close</Button>
          <Button 
            onClick={() => {
              const text = `🏆 Dookie Dynasty Draft Lottery Results\n${lotteryResults.map(r => 
                `Pick #${r.pick}: ${r.team.team_name} (${r.team.owner_name})`
              ).join('\n')}`;
              navigator.clipboard?.writeText(text);
            }}
            variant="contained"
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DraftLottery;