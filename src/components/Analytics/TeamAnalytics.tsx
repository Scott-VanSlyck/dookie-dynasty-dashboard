/**
 * Team Analytics Component - Advanced team performance metrics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Speed,
  Assessment,
  SwapVert,
  EmojiEvents,
  Psychology,
  QueryStats
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

import { DookieTeam } from '../../types';
import { advancedAnalyticsAPI, TeamPerformanceMetrics } from '../../services/AdvancedAnalyticsAPI';

interface TeamAnalyticsProps {
  teams: DookieTeam[];
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-analytics-tabpanel-${index}`}
      aria-labelledby={`team-analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TeamAnalytics: React.FC<TeamAnalyticsProps> = ({ teams, loading }) => {
  const [metrics, setMetrics] = useState<TeamPerformanceMetrics[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number>(teams[0]?.roster_id || 0);
  const [tabValue, setTabValue] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (teams.length > 0) {
      loadTeamMetrics();
    }
  }, [teams]);

  const loadTeamMetrics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await advancedAnalyticsAPI.calculateTeamPerformanceMetrics(teams);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading team metrics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const selectedTeamMetrics = metrics.find(m => m.team.roster_id === selectedTeam);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="warning" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'warning';
    }
  };

  // Prepare radar chart data for team comparison
  const getRadarData = (teamMetrics: TeamPerformanceMetrics) => {
    return [
      { metric: 'PPG', value: Math.min(100, teamMetrics.points_per_game * 0.8) },
      { metric: 'Consistency', value: teamMetrics.consistency_score },
      { metric: 'SOS', value: teamMetrics.strength_of_schedule * 100 },
      { metric: 'Clutch', value: teamMetrics.clutch_performances * 20 },
      { metric: 'Trend', value: teamMetrics.trend_last_4_weeks === 'up' ? 80 : teamMetrics.trend_last_4_weeks === 'down' ? 20 : 50 }
    ];
  };

  // Prepare weekly ranking chart data
  const getWeeklyRankingData = (teamMetrics: TeamPerformanceMetrics) => {
    return teamMetrics.weekly_rankings.map((rank, week) => ({
      week: week + 1,
      rank: 13 - rank, // Invert for chart (higher position = better)
      actualRank: rank
    }));
  };

  if (loading || analyticsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading advanced team analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📊 Team Analytics
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Team</InputLabel>
          <Select
            value={selectedTeam}
            label="Select Team"
            onChange={(e) => setSelectedTeam(e.target.value as number)}
          >
            {teams.map(team => (
              <MenuItem key={team.roster_id} value={team.roster_id}>
                {team.team_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Team Overview" icon={<Assessment />} />
          <Tab label="Performance Trends" icon={<TrendingUp />} />
          <Tab label="Head-to-Head" icon={<SwapVert />} />
          <Tab label="League Comparison" icon={<QueryStats />} />
        </Tabs>
      </Box>

      {/* Tab 1: Team Overview */}
      <TabPanel value={tabValue} index={0}>
        {selectedTeamMetrics && (
          <Grid container spacing={3}>
            {/* Key Metrics Cards */}
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {selectedTeamMetrics.points_per_game.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">Points Per Game</Typography>
                    </Box>
                    <Speed sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {selectedTeamMetrics.consistency_score.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">Consistency Score</Typography>
                    </Box>
                    <Psychology sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {(selectedTeamMetrics.strength_of_schedule * 100).toFixed(0)}%
                      </Typography>
                      <Typography variant="body2">Strength of Schedule</Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {selectedTeamMetrics.clutch_performances}
                      </Typography>
                      <Typography variant="body2">Clutch Performances</Typography>
                    </Box>
                    <EmojiEvents sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Team Radar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QueryStats color="primary" />
                    Team Performance Radar
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={getRadarData(selectedTeamMetrics)}>
                        <PolarGrid />
                        {/* <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} /> */}
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                        <Radar
                          name={selectedTeamMetrics.team.team_name}
                          dataKey="value"
                          stroke="#1e88e5"
                          fill="#1e88e5"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Trend */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Form (Last 4 Weeks)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getTrendIcon(selectedTeamMetrics.trend_last_4_weeks)}
                    <Chip
                      label={selectedTeamMetrics.trend_last_4_weeks.toUpperCase()}
                      color={getTrendColor(selectedTeamMetrics.trend_last_4_weeks) as any}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Based on weekly performance rankings and point differentials over the last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Tab 2: Performance Trends */}
      <TabPanel value={tabValue} index={1}>
        {selectedTeamMetrics && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Weekly Performance Ranking
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getWeeklyRankingData(selectedTeamMetrics)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis 
                          domain={[1, 12]} 
                          tickFormatter={(value) => `${13 - value}`}
                          label={{ value: 'Ranking', angle: -90, position: 'insideLeft' }}
                        />
                        <RechartsTooltip 
                          formatter={(value: any) => [`#${13 - value}`, 'Rank']}
                          labelFormatter={(label) => `Week ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rank" 
                          stroke="#1e88e5" 
                          strokeWidth={3}
                          dot={{ fill: '#1e88e5', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Tab 3: Head-to-Head */}
      <TabPanel value={tabValue} index={2}>
        {selectedTeamMetrics && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Head-to-Head Records vs All Teams
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Opponent</TableCell>
                          <TableCell align="center">Record</TableCell>
                          <TableCell align="center">Win %</TableCell>
                          <TableCell align="center">Avg Point Diff</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedTeamMetrics.head_to_head_record).map(([rosterId, record]) => {
                          const opponent = teams.find(t => t.roster_id === parseInt(rosterId));
                          const totalGames = record.wins + record.losses;
                          const winPct = totalGames > 0 ? (record.wins / totalGames) * 100 : 0;
                          
                          return (
                            <TableRow key={rosterId}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                    {opponent?.team_name.charAt(0)}
                                  </Avatar>
                                  {opponent?.team_name}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                {record.wins}-{record.losses}
                              </TableCell>
                              <TableCell align="center">
                                {winPct.toFixed(0)}%
                              </TableCell>
                              <TableCell align="center">
                                <Typography 
                                  color={record.points_diff > 0 ? 'success.main' : 'error.main'}
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {record.points_diff > 0 ? '+' : ''}{record.points_diff.toFixed(1)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={winPct >= 60 ? 'Dominates' : winPct <= 40 ? 'Struggles' : 'Competitive'}
                                  color={winPct >= 60 ? 'success' : winPct <= 40 ? 'error' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Tab 4: League Comparison */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  League-Wide Performance Comparison
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.map(m => ({
                      name: m.team.team_name.substring(0, 10),
                      ppg: m.points_per_game,
                      consistency: m.consistency_score,
                      clutch: m.clutch_performances * 10 // Scale for visualization
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="ppg" fill="#1e88e5" name="Points Per Game" />
                      <Bar dataKey="consistency" fill="#4caf50" name="Consistency Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default TeamAnalytics;