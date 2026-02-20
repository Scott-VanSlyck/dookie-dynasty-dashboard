/**
 * Tankathon View - Draft positioning tracker similar to NBA Tankathon
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Tooltip,
  Alert,
  Slider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Casino,
  Refresh,
  Timeline,
  EmojiEvents
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { DookieTeam, TankathonData } from '../../types';
import { generateTankathonData, calculateWinPercentage, getOrdinalSuffix, formatPercentage, simulateSeasonOutcomes } from '../../utils/calculations';

interface TankathonViewProps {
  teams: DookieTeam[];
}

const TankathonView: React.FC<TankathonViewProps> = ({ teams }) => {
  const [tankathonData, setTankathonData] = useState<TankathonData[]>([]);
  const [weeksRemaining, setWeeksRemaining] = useState(3);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [simulations, setSimulations] = useState<Map<string, number[]>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateTankathonData();
  }, [teams, weeksRemaining]);

  const updateTankathonData = () => {
    if (teams.length === 0) return;
    
    const data = generateTankathonData(teams, weeksRemaining);
    setTankathonData(data);
    
    if (!selectedTeam && data.length > 0) {
      setSelectedTeam(data[0].team.user_id);
    }
  };

  const runSimulations = async () => {
    setLoading(true);
    try {
      const results = simulateSeasonOutcomes(teams, 1000);
      setSimulations(results);
    } catch (error) {
      console.error('Error running simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSimulationData = (teamId: string) => {
    const results = simulations.get(teamId) || [];
    if (results.length === 0) return [];

    const positionCounts = new Array(teams.length).fill(0);
    results.forEach(position => {
      positionCounts[position - 1]++;
    });

    return positionCounts.map((count, index) => ({
      position: index + 1,
      probability: (count / results.length) * 100
    }));
  };

  const selectedTeamData = tankathonData.find(data => data.team.user_id === selectedTeam);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          📈 Dookie Dynasty Tankathon
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Track draft positioning and lottery scenarios
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography gutterBottom>Weeks Remaining: {weeksRemaining}</Typography>
            <Slider
              value={weeksRemaining}
              onChange={(_, value) => setWeeksRemaining(value as number)}
              min={0}
              max={6}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Focus Team</InputLabel>
              <Select
                value={selectedTeam}
                label="Focus Team"
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {tankathonData.map(data => (
                  <MenuItem key={data.team.user_id} value={data.team.user_id}>
                    {data.team.team_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <Button
              variant="contained"
              startIcon={<Timeline />}
              onClick={runSimulations}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Running Simulations...' : 'Run Season Simulations'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Current Tankathon Standings */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Casino color="primary" />
                Draft Lottery Positioning
              </Typography>
              
              <TableContainer component={Paper} sx={{ bgcolor: 'background.default' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      <TableCell align="center">Current</TableCell>
                      <TableCell align="center">Projected</TableCell>
                      <TableCell align="center">Range</TableCell>
                      <TableCell align="center">Lottery Odds</TableCell>
                      <TableCell>Scenario</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tankathonData.map((data, index) => (
                      <TableRow 
                        key={data.team.roster_id}
                        sx={{ 
                          bgcolor: selectedTeam === data.team.user_id ? 'primary.main' : 'inherit',
                          color: selectedTeam === data.team.user_id ? 'primary.contrastText' : 'inherit',
                          '&:hover': {
                            bgcolor: selectedTeam === data.team.user_id ? 'primary.dark' : 'action.hover'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{ 
                                bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                                width: 32,
                                height: 32
                              }}
                            >
                              {data.team.owner_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {data.team.team_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {data.team.record?.wins || 0}-{data.team.record?.losses || 0} ({formatPercentage(calculateWinPercentage(data.team.record?.wins || 0, data.team.record?.losses || 0))})
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getOrdinalSuffix(data.current_pick)}
                            color={data.current_pick <= 3 ? 'success' : data.current_pick <= 6 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getOrdinalSuffix(data.projected_pick)}
                            color={data.projected_pick <= 3 ? 'success' : data.projected_pick <= 6 ? 'warning' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {getOrdinalSuffix(data.min_pick)} - {getOrdinalSuffix(data.max_pick)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`${data.lottery_odds}% chance at #1 pick`}>
                            <Chip
                              label={`${data.lottery_odds}%`}
                              color={data.lottery_odds >= 20 ? 'success' : data.lottery_odds >= 8 ? 'warning' : 'default'}
                              size="small"
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {data.elimination_scenario}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {weeksRemaining === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Season complete - Final lottery positioning determined
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Team Details */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {selectedTeamData && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents color="primary" />
                  Team Focus
                </Typography>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: 'primary.main',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 1,
                      fontSize: '1.5rem'
                    }}
                  >
                    {selectedTeamData.team.owner_name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {selectedTeamData.team.team_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTeamData.team.owner_name}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {getOrdinalSuffix(selectedTeamData.current_pick).replace(/\d+/, '')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Current Pick
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {selectedTeamData.current_pick}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {selectedTeamData.lottery_odds}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lottery Odds
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Season Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={`${selectedTeamData.team.record?.wins || 0}-${selectedTeamData.team.record?.losses || 0}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={`${selectedTeamData.games_remaining} games left`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTeamData.elimination_scenario}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Draft Pick Range
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={getOrdinalSuffix(selectedTeamData.min_pick)}
                        color="success"
                        size="small"
                      />
                      <Typography>to</Typography>
                      <Chip
                        label={getOrdinalSuffix(selectedTeamData.max_pick)}
                        color="error"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Simulation Results */}
        {selectedTeam && simulations.has(selectedTeam) && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline color="primary" />
                  Season Simulation Results (1,000 simulations)
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSimulationData(selectedTeam)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="position" 
                        tickFormatter={(value) => getOrdinalSuffix(value)}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip 
                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Probability']}
                        labelFormatter={(value) => `${getOrdinalSuffix(value)} Overall`}
                      />
                      <Bar 
                        dataKey="probability" 
                        fill="#1e88e5" 
                        name="Probability"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Based on {weeksRemaining} weeks remaining with 50/50 win probability each game
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Draft Lottery Odds Reference */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎰 Lottery Odds Reference
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Weighted lottery odds for bottom 6 teams (1/2.5 drop system):
              </Typography>
              
              <TableContainer component={Paper} sx={{ bgcolor: 'background.default' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Finish</TableCell>
                      <TableCell align="center">#1 Pick Odds</TableCell>
                      <TableCell align="center">Top 3 Odds</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Worst Record</TableCell>
                      <TableCell align="center">
                        <Chip label="60.0%" color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="88.0%" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2nd Worst</TableCell>
                      <TableCell align="center">
                        <Chip label="20.0%" color="warning" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="48.0%" color="warning" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3rd Worst</TableCell>
                      <TableCell align="center">
                        <Chip label="8.0%" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="20.0%" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>4th-6th Worst</TableCell>
                      <TableCell align="center">
                        <Chip label="2.0%, 1.0%, 1.0%" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="4.0%, 2.0%, 2.0%" size="small" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tank Strategy Tips */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
                🏗️ Tankathon Strategy Guide
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingDown color="error" />
                  Tanking Benefits
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Higher lottery odds for top picks<br/>
                  • Access to premium rookie talent<br/>
                  • Multiple draft picks through trades<br/>
                  • Long-term dynasty building
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="success" />
                  Competitive Benefits  
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  • Playoff experience and potential<br/>
                  • Team morale and momentum<br/>
                  • Prize money and bragging rights<br/>
                  • Proven players vs rookie unknowns
                </Typography>
              </Box>

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Remember:</strong> Even the worst team only has 60% odds at the #1 pick. 
                  Lottery luck plays a huge role!
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TankathonView;