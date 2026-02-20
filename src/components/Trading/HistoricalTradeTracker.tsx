/**
 * Historical Trade Tracker Component
 * Track trades over time to see current value vs 1 year after vs 3 years after
 * to see who lost and won trades in the moment vs long term
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  TextField,
  Autocomplete,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Balance,
  Search,
  Assessment,
  School,
  EmojiEvents,
  History,
  SwapHoriz,
  Grade,
  ShowChart,
  CompareArrows,
  FilterList,
  Star,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

import { 
  HistoricalTrade, 
  TradePerformanceMetrics, 
  PositionTradingAnalysis,
  TradeLearning,
  DookieTeam 
} from '../../types';
import { historicalTradeAPI } from '../../services/HistoricalTradeAPI';
import { tradingValueAPI } from '../../services/TradingValueAPI';

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
      id={`historical-tabpanel-${index}`}
      aria-labelledby={`historical-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface HistoricalTradeTrackerProps {
  teams: DookieTeam[];
  loading?: boolean;
}

const HistoricalTradeTracker: React.FC<HistoricalTradeTrackerProps> = ({ teams, loading }) => {
  const [tabValue, setTabValue] = useState(0);
  const [historicalTrades, setHistoricalTrades] = useState<HistoricalTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<HistoricalTrade | null>(null);
  const [managerMetrics, setManagerMetrics] = useState<TradePerformanceMetrics[]>([]);
  const [positionAnalysis, setPositionAnalysis] = useState<PositionTradingAnalysis[]>([]);
  const [dynastyLearnings, setDynastyLearnings] = useState<TradeLearning[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    manager: '',
    position: '',
    dateFrom: '',
    dateTo: '',
    winnerOnly: ''
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, [teams]);

  const loadHistoricalData = async () => {
    try {
      setLoadingData(true);
      const [trades, learnings] = await Promise.all([
        historicalTradeAPI.getHistoricalTrades(),
        historicalTradeAPI.getDynastyLearnings()
      ]);

      setHistoricalTrades(trades);
      setDynastyLearnings(learnings);

      // Load manager metrics for each team
      const metrics = await Promise.all(
        teams.map(team => 
          historicalTradeAPI.getManagerTradePerformance(team.roster_id.toString(), teams)
        )
      );
      setManagerMetrics(metrics);

      // Load position analysis for major positions
      const positions = ['QB', 'RB', 'WR', 'TE'];
      const posAnalysis = await Promise.all(
        positions.map(pos => historicalTradeAPI.getPositionTradingAnalysis(pos))
      );
      setPositionAnalysis(posAnalysis);

    } catch (error) {
      console.error('Error loading historical trade data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTradeSelect = (trade: HistoricalTrade) => {
    setSelectedTrade(trade);
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('A')) return 'success';
    if (grade.includes('B')) return 'info';  
    if (grade.includes('C')) return 'warning';
    return 'error';
  };

  const getWinnerIcon = (winner: string) => {
    if (winner === 'team_a') return <TrendingUp color="success" />;
    if (winner === 'team_b') return <TrendingDown color="error" />;
    return <Balance color="warning" />;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (loadingData || loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading historical trade data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        📊 Historical Trade Tracker
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Track trades over time to see current value vs 1 year after vs 3 years after
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="Trade Timeline" icon={<Timeline />} />
          <Tab label="Manager Analysis" icon={<Assessment />} />
          <Tab label="Position Trends" icon={<ShowChart />} />
          <Tab label="Dynasty Learnings" icon={<School />} />
          <Tab label="Trade Search" icon={<Search />} />
        </Tabs>
      </Box>

      {/* Tab 1: Trade Timeline View */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Trade Timeline Cards */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SwapHoriz />
              Recent Historical Trades
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {historicalTrades.map((trade) => (
                <Card key={trade.id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleTradeSelect(trade)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" color="primary">
                        {trade.participants.team_a.team_name} ⚔️ {trade.participants.team_b.team_name}
                      </Typography>
                      <Chip 
                        label={new Date(trade.date).toLocaleDateString()} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>

                    {/* Trade Evolution Timeline */}
                    <Grid container spacing={2}>
                      {trade.analysis.evolution.map((point, index) => (
                        <Grid size={{ xs: 12, md: 4 }} key={point.period}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: index === 0 ? 'action.hover' : 'background.paper' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {point.period === 'execution' ? '📅 At Trade' : 
                               point.period === 'one_year' ? '📈 1 Year Later' : '🎯 3 Years Later'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body2" color="success.main">
                                  Team A: {formatCurrency(point.team_a_value)}
                                </Typography>
                                <Typography variant="body2" color="error.main">
                                  Team B: {formatCurrency(point.team_b_value)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getWinnerIcon(point.winner)}
                                <Typography variant="body2" fontWeight="bold">
                                  {point.winner === 'team_a' ? 'A Wins' : 
                                   point.winner === 'team_b' ? 'B Wins' : 'Even'}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Final Grades */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Chip 
                        icon={<Grade />}
                        label={`${trade.participants.team_a.team_name}: ${trade.analysis.final_grade.team_a_grade}`}
                        color={getGradeColor(trade.analysis.final_grade.team_a_grade) as any}
                        variant="outlined"
                      />
                      <Chip 
                        icon={<Grade />}
                        label={`${trade.participants.team_b.team_name}: ${trade.analysis.final_grade.team_b_grade}`}
                        color={getGradeColor(trade.analysis.final_grade.team_b_grade) as any}
                        variant="outlined"
                      />
                      <Chip 
                        icon={<EmojiEvents />}
                        label={`Hindsight Winner: ${trade.analysis.final_grade.hindsight_winner === 'team_a' ? 'Team A' : 'Team B'}`}
                        color="primary"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            {/* Trade Detail Sidebar */}
            {selectedTrade && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📋 Trade Details
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Players Involved:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {selectedTrade.participants.team_a.team_name} sent:
                    </Typography>
                    <List dense>
                      {selectedTrade.participants.team_a.players_sent.map(playerId => (
                        <ListItem key={playerId}>
                          <ListItemText primary="Player Name" secondary={`ID: ${playerId}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {selectedTrade.participants.team_b.team_name} sent:
                    </Typography>
                    <List dense>
                      {selectedTrade.participants.team_b.players_sent.map(playerId => (
                        <ListItem key={playerId}>
                          <ListItemText primary="Player Name" secondary={`ID: ${playerId}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    💡 Lessons Learned:
                  </Typography>
                  <List dense>
                    {selectedTrade.analysis.final_grade.lessons_learned.map((lesson, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={lesson}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Manager Analysis */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          Manager Trade Performance
        </Typography>

        <Grid container spacing={3}>
          {managerMetrics.map((metrics) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={metrics.manager_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {metrics.manager_name.charAt(0)}
                    </Avatar>
                    <Typography variant="h6">{metrics.manager_name}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Paper sx={{ p: 1, textAlign: 'center', flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Total Trades</Typography>
                      <Typography variant="h6">{metrics.total_trades}</Typography>
                    </Paper>
                    <Paper sx={{ p: 1, textAlign: 'center', flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                      <Typography variant="h6" color="primary">{metrics.hindsight_score.toFixed(0)}%</Typography>
                    </Paper>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Trade Accuracy</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.trade_accuracy} 
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="caption">{metrics.trade_accuracy.toFixed(0)}% (immediate vs long-term)</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      icon={<TrendingUp />} 
                      label={`Best: ${metrics.best_position_traded}`} 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                    <Chip 
                      icon={<TrendingDown />} 
                      label={`Worst: ${metrics.worst_position_traded}`} 
                      size="small" 
                      color="error" 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Manager Comparison Chart */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Manager Trading Comparison</Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <RadarChart data={managerMetrics.slice(0, 6)}>
                  <PolarGrid />
                  {/* <PolarAngleAxis dataKey="manager_name" tick={{ fontSize: 12 }} /> */}
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Long-term Success %" 
                    dataKey="hindsight_score" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3} 
                  />
                  <Radar 
                    name="Trade Accuracy %" 
                    dataKey="trade_accuracy" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.3} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 3: Position Analysis */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShowChart />
          Position Trading Patterns
        </Typography>

        <Grid container spacing={3}>
          {positionAnalysis.map((analysis) => (
            <Grid size={{ xs: 12, md: 6 }} key={analysis.position}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {analysis.position} Analysis
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">1-Year Value Retention</Typography>
                        <Typography variant="h5" color={analysis.avg_value_retention_1yr > 75 ? 'success.main' : 'warning.main'}>
                          {analysis.avg_value_retention_1yr}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">3-Year Value Retention</Typography>
                        <Typography variant="h5" color={analysis.avg_value_retention_3yr > 60 ? 'success.main' : 'error.main'}>
                          {analysis.avg_value_retention_3yr}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Best Age to Trade</Typography>
                        <Typography variant="h6">{analysis.best_age_to_trade}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Trades Involving</Typography>
                        <Typography variant="h6">{analysis.total_trades_involving}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Position Value Retention Chart */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Position Value Retention Over Time</Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={positionAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="avg_value_retention_1yr" fill="#8884d8" name="1 Year %" />
                  <Bar dataKey="avg_value_retention_3yr" fill="#82ca9d" name="3 Years %" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Dynasty Learnings */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <School />
          Dynasty Trading Lessons
        </Typography>

        <Grid container spacing={3}>
          {dynastyLearnings.map((learning) => (
            <Grid size={{ xs: 12 }} key={learning.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      {learning.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        size="small" 
                        label={learning.category.replace('_', ' ').toUpperCase()} 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        size="small" 
                        icon={learning.confidence_level === 'high' ? <CheckCircle /> : 
                              learning.confidence_level === 'medium' ? <Warning /> : <Star />}
                        label={learning.confidence_level.toUpperCase()} 
                        color={learning.confidence_level === 'high' ? 'success' : 
                               learning.confidence_level === 'medium' ? 'warning' : 'default'}
                      />
                    </Box>
                  </Box>

                  <Typography variant="body1" paragraph>
                    {learning.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Supporting Trades: {learning.supporting_trades.length}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Impact Score:</Typography>
                      <Typography variant="h6" color="primary">{learning.impact_score.toFixed(1)}/10</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 5: Trade Search */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search />
          Search Historical Trades
        </Typography>

        {/* Search Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Autocomplete
                  options={teams}
                  getOptionLabel={(team) => team.team_name}
                  onChange={(event, value) => {
                    setSearchFilters(prev => ({ ...prev, manager: value?.roster_id.toString() || '' }));
                  }}
                  renderInput={(params) => <TextField {...params} label="Manager" variant="outlined" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Autocomplete
                  options={['QB', 'RB', 'WR', 'TE']}
                  onChange={(event, value) => {
                    setSearchFilters(prev => ({ ...prev, position: value || '' }));
                  }}
                  renderInput={(params) => <TextField {...params} label="Position" variant="outlined" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  type="date"
                  label="From Date"
                  variant="outlined"
                  fullWidth
                  value={searchFilters.dateFrom}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  type="date"
                  label="To Date"
                  variant="outlined"
                  fullWidth
                  value={searchFilters.dateTo}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Autocomplete
                  options={['team_a', 'team_b']}
                  getOptionLabel={(option) => option === 'team_a' ? 'Team A Wins' : 'Team B Wins'}
                  onChange={(event, value) => {
                    setSearchFilters(prev => ({ ...prev, winnerOnly: value || '' }));
                  }}
                  renderInput={(params) => <TextField {...params} label="Winner Only" variant="outlined" />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Button variant="contained" fullWidth startIcon={<FilterList />}>
                  Filter
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Search Results */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Found {historicalTrades.length} trades matching your criteria
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Teams</TableCell>
                <TableCell>At Trade</TableCell>
                <TableCell>1 Year Later</TableCell>
                <TableCell>3 Years Later</TableCell>
                <TableCell>Hindsight Winner</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historicalTrades.map((trade) => (
                <TableRow key={trade.id} hover>
                  <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {trade.participants.team_a.team_name} vs {trade.participants.team_b.team_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small"
                      icon={getWinnerIcon(trade.analysis.evolution[0].winner)}
                      label={trade.analysis.evolution[0].winner === 'team_a' ? 'Team A' : 
                             trade.analysis.evolution[0].winner === 'team_b' ? 'Team B' : 'Even'}
                      color={trade.analysis.evolution[0].winner !== 'even' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {trade.analysis.evolution[1] && (
                      <Chip 
                        size="small"
                        icon={getWinnerIcon(trade.analysis.evolution[1].winner)}
                        label={trade.analysis.evolution[1].winner === 'team_a' ? 'Team A' : 
                               trade.analysis.evolution[1].winner === 'team_b' ? 'Team B' : 'Even'}
                        color={trade.analysis.evolution[1].winner !== 'even' ? 'primary' : 'default'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {trade.analysis.evolution[2] && (
                      <Chip 
                        size="small"
                        icon={getWinnerIcon(trade.analysis.evolution[2].winner)}
                        label={trade.analysis.evolution[2].winner === 'team_a' ? 'Team A' : 
                               trade.analysis.evolution[2].winner === 'team_b' ? 'Team B' : 'Even'}
                        color={trade.analysis.evolution[2].winner !== 'even' ? 'primary' : 'default'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<EmojiEvents />}
                      label={trade.analysis.final_grade.hindsight_winner === 'team_a' ? 'Team A' : 'Team B'}
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleTradeSelect(trade)}>
                        <CompareArrows />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
    </Box>
  );
};

export default HistoricalTradeTracker;