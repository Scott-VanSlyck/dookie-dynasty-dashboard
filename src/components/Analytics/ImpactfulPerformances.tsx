/**
 * Impactful Performances Component
 * Displays game-winning performances, clutch plays, and "what if" scenarios
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
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Star,
  Bolt,
  Psychology,
  Timeline,
  TrendingUp,
  SportsFootball,
  EmojiEvents,
  Whatshot,
  Speed,
  LocalFireDepartment,
  QueryStats,
  PlayArrow,
  ExpandMore
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar
} from 'recharts';

import { DookieTeam } from '../../types';
import { advancedAnalyticsAPI, ImpactfulPerformance, RivalryData } from '../../services/AdvancedAnalyticsAPI';

interface ImpactfulPerformancesProps {
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
      id={`performances-tabpanel-${index}`}
      aria-labelledby={`performances-tab-${index}`}
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

const COLORS = ['#1e88e5', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4'];

const ImpactfulPerformances: React.FC<ImpactfulPerformancesProps> = ({ teams, loading }) => {
  const [performances, setPerformances] = useState<ImpactfulPerformance[]>([]);
  const [rivalries, setRivalries] = useState<RivalryData[]>([]);
  const [whatIfScenarios, setWhatIfScenarios] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [performancesLoading, setPerformancesLoading] = useState(true);
  const [selectedPerformance, setSelectedPerformance] = useState<ImpactfulPerformance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (teams.length > 0) {
      loadPerformances();
    }
  }, [teams]);

  const loadPerformances = async () => {
    try {
      setPerformancesLoading(true);
      const [performanceData, rivalryData, whatIfData] = await Promise.all([
        advancedAnalyticsAPI.analyzeImpactfulPerformances(),
        advancedAnalyticsAPI.calculateRivalries(teams),
        advancedAnalyticsAPI.generateWhatIfScenarios(teams[0]?.roster_id || 1)
      ]);
      
      setPerformances(performanceData);
      setRivalries(rivalryData);
      setWhatIfScenarios(whatIfData.scenarios);
    } catch (error) {
      console.error('Error loading impactful performances:', error);
    } finally {
      setPerformancesLoading(false);
    }
  };

  const getImpactTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'game_winning': <EmojiEvents color="success" />,
      'season_defining': <Star color="primary" />,
      'clutch_performance': <Bolt color="warning" />
    };
    return iconMap[type] || <SportsFootball />;
  };

  const getImpactTypeColor = (type: string) => {
    const colorMap: { [key: string]: 'success' | 'primary' | 'warning' | 'error' | 'info' } = {
      'game_winning': 'success',
      'season_defining': 'primary', 
      'clutch_performance': 'warning'
    };
    return colorMap[type] || 'info';
  };

  const getImpactTypeLabel = (type: string) => {
    const labelMap: { [key: string]: string } = {
      'game_winning': 'Game Winner',
      'season_defining': 'Season Defining',
      'clutch_performance': 'Clutch Performance'
    };
    return labelMap[type] || type;
  };

  const handlePerformanceClick = (performance: ImpactfulPerformance) => {
    setSelectedPerformance(performance);
    setDialogOpen(true);
  };

  // Generate performance impact chart data
  const impactChartData = performances.map(p => ({
    name: `${p.player_name} (W${p.week})`,
    points: p.points,
    impact: p.margin_of_victory,
    type: p.impact_type
  }));

  if (loading || performancesLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading impactful performances...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          ⚡ Impactful Performances
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Game Winners" icon={<EmojiEvents />} />
          <Tab label="Rivalries" icon={<Whatshot />} />
          <Tab label="What If Scenarios" icon={<Psychology />} />
          <Tab label="Performance Impact" icon={<QueryStats />} />
        </Tabs>
      </Box>

      {/* Tab 1: Game Winners */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Performance Cards */}
          {performances.map((performance, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handlePerformanceClick(performance)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Badge 
                      badgeContent={performance.points.toFixed(1)}
                      color="primary"
                      max={999}
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', minWidth: 'auto' } }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getImpactTypeIcon(performance.impact_type)}
                      </Avatar>
                    </Badge>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {performance.player_name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={getImpactTypeLabel(performance.impact_type)}
                          color={getImpactTypeColor(performance.impact_type)}
                          size="small"
                        />
                        <Chip 
                          label={`Week ${performance.week}`}
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {performance.team.team_name} vs {performance.opponent.team_name}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: performance.margin_of_victory > 10 ? 'success.main' : 'warning.main',
                        fontWeight: 'bold'
                      }}>
                        Won by {performance.margin_of_victory.toFixed(1)} points
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Performance Impact Visualization */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance vs Game Impact
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={impactChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="points" 
                        name="Points Scored"
                        label={{ value: 'Points Scored', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="impact" 
                        name="Margin of Victory"
                        label={{ value: 'Margin of Victory', angle: -90, position: 'insideLeft' }}
                      />
                      <RechartsTooltip 
                        formatter={(value: any, name?: string) => [
                          `${value}${name === 'Points Scored' ? ' pts' : ' pt margin'}`, 
                          name || ''
                        ]}
                      />
                      <Scatter 
                        dataKey="impact" 
                        fill="#1e88e5" 
                        fillOpacity={0.8}
                        strokeWidth={2}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Rivalries */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {rivalries.map((rivalry, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Whatshot color="error" />
                    {rivalry.teams[0].team_name} vs {rivalry.teams[1].team_name}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* All-Time Record */}
                    <Grid size={{ xs: 12 }}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          All-Time Record
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {rivalry.all_time_record.team1_wins} - {rivalry.all_time_record.team2_wins}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    {/* Stats */}
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Avg Score Diff
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                          {rivalry.average_score_diff.toFixed(1)} pts
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Recent Form
                        </Typography>
                        <Typography variant="body2">
                          {rivalry.recent_form}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    {/* Notable Games */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notable Games
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Closest: ${rivalry.closest_game.score_diff.toFixed(1)} pts`}
                          size="small"
                          color="warning"
                          icon={<Bolt />}
                        />
                        <Chip 
                          label={`Blowout: ${rivalry.biggest_blowout.score_diff.toFixed(1)} pts`}
                          size="small"
                          color="error"
                          icon={<LocalFireDepartment />}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Rivalry Intensity Chart */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rivalry Intensity (Lower Score Diff = More Competitive)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rivalries.map(r => ({
                      matchup: `${r.teams[0].team_name.substring(0, 8)} vs ${r.teams[1].team_name.substring(0, 8)}`,
                      intensity: 100 - r.average_score_diff, // Inverse for "intensity"
                      avg_diff: r.average_score_diff
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="matchup" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value: any) => [`${(100 - value).toFixed(1)} avg diff`, 'Intensity']}
                      />
                      <Bar dataKey="intensity" fill="#ff5722" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: What If Scenarios */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="primary" />
                  What If Scenarios
                </Typography>
                <List>
                  {whatIfScenarios.map((scenario, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            ?
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {scenario.description}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Paper sx={{ p: 2, bgcolor: 'error.dark', color: 'white' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      What Actually Happened
                                    </Typography>
                                    <Typography variant="body2">
                                      {scenario.original_outcome}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <Paper sx={{ p: 2, bgcolor: 'info.dark', color: 'white' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      What Would Have Happened
                                    </Typography>
                                    <Typography variant="body2">
                                      {scenario.what_if_outcome}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                              <Box sx={{ mt: 2 }}>
                                <Chip 
                                  label={`Impact: ${scenario.point_difference > 0 ? '+' : ''}${scenario.point_difference.toFixed(1)} points`}
                                  color={scenario.point_difference > 0 ? 'success' : 'error'}
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < whatIfScenarios.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Impact Summary
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="30%" 
                      outerRadius="100%" 
                      data={whatIfScenarios.map((s, i) => ({
                        name: `Scenario ${i + 1}`,
                        value: Math.abs(s.point_difference),
                        fill: s.point_difference > 0 ? '#4caf50' : '#f44336'
                      }))}
                    >
                      <RadialBar dataKey="value" cornerRadius={10} />
                      <RechartsTooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 4: Performance Impact */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Impact Analysis
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performances.map((p, index) => ({
                      week: p.week,
                      points: p.points,
                      impact: p.margin_of_victory,
                      player: p.player_name
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="points" 
                        stackId="1"
                        stroke="#1e88e5" 
                        fill="#1e88e5"
                        fillOpacity={0.6}
                        name="Points Scored"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="impact" 
                        stackId="2"
                        stroke="#4caf50" 
                        fill="#4caf50"
                        fillOpacity={0.6}
                        name="Victory Margin"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedPerformance && getImpactTypeIcon(selectedPerformance.impact_type)}
            Performance Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPerformance && (
            <Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedPerformance.player_name}
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
                    {selectedPerformance.points.toFixed(1)} points
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip 
                      label={getImpactTypeLabel(selectedPerformance.impact_type)}
                      color={getImpactTypeColor(selectedPerformance.impact_type)}
                    />
                    <Typography variant="body1">
                      <strong>Matchup:</strong> {selectedPerformance.team.team_name} vs {selectedPerformance.opponent.team_name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Week:</strong> {selectedPerformance.week}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Margin of Victory:</strong> {selectedPerformance.margin_of_victory.toFixed(1)} points
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Context</Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedPerformance.context}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImpactfulPerformances;