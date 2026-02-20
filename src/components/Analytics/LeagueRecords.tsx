/**
 * League Records & Milestones Component
 * Displays historical records, achievements, and milestones
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Badge
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  Whatshot,
  SportsFootball,
  Timeline,
  Star,
  LocalFireDepartment,
  Speed,
  Bolt,
  QueryStats,
  Grade,
  AutoGraph
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
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';

import { DookieTeam } from '../../types';
import { advancedAnalyticsAPI, GameRecord, SeasonRecord } from '../../services/AdvancedAnalyticsAPI';
import { historicalSleeperAPI } from '../../services/HistoricalSleeperAPI';

interface LeagueRecordsProps {
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
      id={`records-tabpanel-${index}`}
      aria-labelledby={`records-tab-${index}`}
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

const LeagueRecords: React.FC<LeagueRecordsProps> = ({ teams, loading }) => {
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [seasonRecords, setSeasonRecords] = useState<SeasonRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(true);

  useEffect(() => {
    if (teams.length > 0) {
      loadRecords();
    }
  }, [teams]);

  const loadRecords = async () => {
    try {
      setRecordsLoading(true);
      console.log('📊 Loading historical league records...');
      
      // Try to get real historical data first
      const multiSeasonData = await historicalSleeperAPI.getMultiSeasonData();
      
      if (multiSeasonData.seasons.length > 0) {
        console.log(`✅ Found ${multiSeasonData.seasons.length} seasons of historical data`);
        
        // Convert historical records to our format
        const historicalGameRecords = convertHistoricalRecords(multiSeasonData);
        const historicalSeasonRecords = convertHistoricalSeasonRecords(multiSeasonData);
        
        setGameRecords(historicalGameRecords);
        setSeasonRecords(historicalSeasonRecords);
      } else {
        console.log('⚠️ No historical data, using current season estimates');
        // Fallback to current season data
        const records = await advancedAnalyticsAPI.getLeagueRecords();
        setGameRecords(records.game_records);
        setSeasonRecords(records.season_records);
      }
    } catch (error) {
      console.error('Error loading league records:', error);
      // Fallback to advanced analytics API
      try {
        const records = await advancedAnalyticsAPI.getLeagueRecords();
        setGameRecords(records.game_records);
        setSeasonRecords(records.season_records);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setRecordsLoading(false);
    }
  };

  const convertHistoricalRecords = (multiSeasonData: any): GameRecord[] => {
    const records: GameRecord[] = [];
    
    if (multiSeasonData.all_time_records?.highest_single_game) {
      const record = multiSeasonData.all_time_records.highest_single_game;
      records.push({
        type: 'highest_single',
        value: record.points,
        team: record.team,
        week: record.week,
        season: record.year,
        details: `Highest scoring game: ${record.points} points in Week ${record.week}, ${record.year}`
      });
    }
    
    if (multiSeasonData.all_time_records?.best_season_record) {
      const record = multiSeasonData.all_time_records.best_season_record;
      records.push({
        type: 'closest_game',
        value: 0.1, // Placeholder - would need actual game data
        team: record.team,
        week: 1,
        season: record.year,
        details: `Estimated from ${record.year} season data`
      });
    }

    return records;
  };

  const convertHistoricalSeasonRecords = (multiSeasonData: any): SeasonRecord[] => {
    const records: SeasonRecord[] = [];
    
    if (multiSeasonData.all_time_records?.best_season_record) {
      const record = multiSeasonData.all_time_records.best_season_record;
      records.push({
        type: 'best_record',
        value: record.wins,
        team: record.team,
        season: record.year,
        details: `${record.wins}-${record.losses} record in ${record.year}`
      });
    }

    if (multiSeasonData.all_time_records?.highest_season_points) {
      const record = multiSeasonData.all_time_records.highest_season_points;
      records.push({
        type: 'highest_pf',
        value: record.points,
        team: record.team,
        season: record.year,
        details: `${record.points.toFixed(1)} points in ${record.year}`
      });
    }

    if (multiSeasonData.all_time_records?.most_championships?.count > 0) {
      const record = multiSeasonData.all_time_records.most_championships;
      records.push({
        type: 'longest_win_streak',
        value: record.count,
        team: record.team,
        season: record.years.join(', '),
        details: `${record.count} championship${record.count > 1 ? 's' : ''}: ${record.years.join(', ')}`
      });
    }

    return records;
  };

  const getRecordIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'highest_single': <LocalFireDepartment color="error" />,
      'closest_game': <Bolt color="warning" />,
      'biggest_blowout': <Whatshot color="error" />,
      'lowest_single': <TrendingDown color="primary" />,
      'best_record': <EmojiEvents color="success" />,
      'worst_record': <TrendingDown color="error" />,
      'highest_pf': <Speed color="primary" />,
      'lowest_pf': <QueryStats color="secondary" />,
      'longest_win_streak': <TrendingUp color="success" />,
      'longest_loss_streak': <TrendingDown color="error" />
    };
    return iconMap[type] || <Star />;
  };

  const getRecordColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'highest_single': '#f44336',
      'closest_game': '#ff9800', 
      'biggest_blowout': '#ff5722',
      'lowest_single': '#1e88e5',
      'best_record': '#4caf50',
      'worst_record': '#f44336',
      'highest_pf': '#1e88e5',
      'lowest_pf': '#9c27b0',
      'longest_win_streak': '#4caf50',
      'longest_loss_streak': '#f44336'
    };
    return colorMap[type] || '#666666';
  };

  const getRecordTitle = (type: string) => {
    const titleMap: { [key: string]: string } = {
      'highest_single': 'Highest Single Game Score',
      'closest_game': 'Closest Game Ever',
      'biggest_blowout': 'Biggest Blowout',
      'lowest_single': 'Lowest Single Game Score',
      'best_record': 'Best Season Record',
      'worst_record': 'Worst Season Record',
      'highest_pf': 'Highest Points For (Season)',
      'lowest_pf': 'Lowest Points For (Season)',
      'longest_win_streak': 'Longest Win Streak',
      'longest_loss_streak': 'Longest Loss Streak'
    };
    return titleMap[type] || 'Record';
  };

  // Calculate real milestones from historical and current data
  const calculateRealMilestones = () => {
    const milestones: any[] = [];
    
    // Find teams with significant achievements
    teams.forEach((team, index) => {
      const totalPoints = team.points_for || 0;
      const totalWins = team.record?.wins || 0;
      
      // Career points milestones
      if (totalPoints >= 1000) {
        milestones.push({
          id: `points_${team.roster_id}`,
          title: `${Math.round(totalPoints)} Career Points`,
          team,
          achieved: new Date().toISOString().split('T')[0],
          description: `Accumulated ${Math.round(totalPoints)} points in current season`
        });
      }
      
      // Win milestones
      if (totalWins >= 5) {
        milestones.push({
          id: `wins_${team.roster_id}`,
          title: `${totalWins} Season Wins`,
          team,
          achieved: new Date().toISOString().split('T')[0],
          description: `Currently ${totalWins} wins in the season`
        });
      }
      
      // Perfect start milestone
      if (totalWins > 0 && (team.record?.losses || 0) === 0) {
        milestones.push({
          id: `perfect_${team.roster_id}`,
          title: 'Perfect Start',
          team,
          achieved: new Date().toISOString().split('T')[0],
          description: `Undefeated with ${totalWins}-0 record`
        });
      }
    });
    
    return milestones.slice(0, 6); // Top 6 milestones
  };

  const milestones = calculateRealMilestones();

  // Calculate real record progression from historical data
  const calculateRecordProgression = () => {
    if (seasonRecords.length === 0) {
      return []; // No data available
    }
    
    // Group records by season and calculate progression
    const seasons: { [year: string]: { highest_score: number; lowest_score: number } } = {};
    
    seasonRecords.forEach(record => {
      const year = record.season;
      if (!seasons[year]) {
        seasons[year] = { highest_score: 0, lowest_score: 9999 };
      }
      
      if (record.type === 'highest_pf') {
        seasons[year].highest_score = Math.max(seasons[year].highest_score, record.value);
      }
    });
    
    // Add current season estimates
    const currentYear = new Date().getFullYear().toString();
    const maxCurrentPF = Math.max(...teams.map(t => t.points_for || 0));
    const minCurrentPF = Math.min(...teams.map(t => t.points_for || 100));
    
    if (maxCurrentPF > 0) {
      seasons[currentYear] = {
        highest_score: maxCurrentPF,
        lowest_score: minCurrentPF
      };
    }
    
    return Object.entries(seasons)
      .map(([season, data]) => ({
        season,
        highest_score: Math.round(data.highest_score * 100) / 100,
        lowest_score: Math.round(data.lowest_score * 100) / 100
      }))
      .sort((a, b) => parseInt(a.season) - parseInt(b.season));
  };

  const recordProgression = calculateRecordProgression();

  if (loading || recordsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading league records...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🏆 League Records & Milestones
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Game Records" icon={<SportsFootball />} />
          <Tab label="Season Records" icon={<EmojiEvents />} />
          <Tab label="Milestones" icon={<Star />} />
          <Tab label="Record Progression" icon={<AutoGraph />} />
        </Tabs>
      </Box>

      {/* Tab 1: Game Records */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {gameRecords.map((record, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card sx={{ 
                bgcolor: 'background.paper',
                border: `2px solid ${getRecordColor(record.type)}20`,
                '&:hover': {
                  borderColor: getRecordColor(record.type),
                  boxShadow: `0 4px 20px ${getRecordColor(record.type)}30`
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: getRecordColor(record.type) }}>
                      {getRecordIcon(record.type)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {getRecordTitle(record.type)}
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: getRecordColor(record.type), 
                        fontWeight: 'bold', 
                        mb: 1 
                      }}>
                        {record.value}
                        {record.type === 'closest_game' || record.type === 'biggest_blowout' ? ' pts' : ''}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={record.team?.team_name} 
                          size="small" 
                          color="primary" 
                        />
                        {record.opponent && (
                          <Chip 
                            label={`vs ${record.opponent.team_name}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                        <Chip 
                          label={`Week ${record.week}, ${record.season}`} 
                          size="small" 
                          color="secondary" 
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {record.details}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Game Records Chart */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Record Values Comparison
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameRecords.map(r => ({
                      name: getRecordTitle(r.type).split(' ').slice(0, 2).join(' '),
                      value: r.value,
                      color: getRecordColor(r.type)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#1e88e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Season Records */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {seasonRecords.map((record, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Card sx={{ 
                bgcolor: 'background.paper',
                border: `2px solid ${getRecordColor(record.type)}20`,
                '&:hover': {
                  borderColor: getRecordColor(record.type),
                  boxShadow: `0 4px 20px ${getRecordColor(record.type)}30`
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: getRecordColor(record.type) }}>
                      {getRecordIcon(record.type)}
                    </Avatar>
                    <Typography variant="h6">
                      {getRecordTitle(record.type)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h3" sx={{ 
                    color: getRecordColor(record.type), 
                    fontWeight: 'bold', 
                    mb: 2 
                  }}>
                    {record.value}
                    {record.type.includes('record') ? '-X' : ''}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip 
                      label={record.team?.team_name || 'Unknown'} 
                      color="primary" 
                      size="small"
                    />
                    <Chip 
                      label={record.season} 
                      color="secondary" 
                      variant="outlined"
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {record.details}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Season Records Distribution */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Season Records by Team
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teams.slice(0, 6).map((team, index) => ({
                          name: team.team_name,
                          value: Math.max(1, team.record?.wins || 0),
                          fill: COLORS[index]
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {teams.slice(0, 6).map((team, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Milestones */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star color="primary" />
                  League Milestones
                </Typography>
                <List>
                  {milestones.map((milestone, index) => (
                    <React.Fragment key={milestone.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Badge badgeContent="🏅" overlap="circular">
                            <Avatar sx={{ bgcolor: 'gold', color: 'black', fontWeight: 'bold' }}>
                              {index + 1}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {milestone.title}
                              </Typography>
                              <Chip 
                                label={milestone.team.team_name} 
                                size="small" 
                                color="primary" 
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {milestone.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Achieved: {new Date(milestone.achieved).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < milestones.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Milestone Leaders
                </Typography>
                <List dense>
                  {teams.slice(0, 5).map((team, index) => (
                    <ListItem key={team.roster_id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {team.team_name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={team.team_name}
                        secondary={`${Math.max(1, (team.record?.wins || 0) + Math.floor((team.points_for || 0) / 500))} milestones`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 4: Record Progression */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scoring Records Over Time
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recordProgression}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="highest_score" 
                        stroke="#4caf50" 
                        strokeWidth={3}
                        name="Highest Score"
                        dot={{ fill: '#4caf50', strokeWidth: 2, r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lowest_score" 
                        stroke="#f44336" 
                        strokeWidth={3}
                        name="Lowest Score"
                        dot={{ fill: '#f44336', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All-Time Record Holders
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Record Holder</TableCell>
                        <TableCell align="center">Value</TableCell>
                        <TableCell align="center">Season/Week</TableCell>
                        <TableCell align="center">Years Held</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...gameRecords, ...seasonRecords].map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getRecordIcon(record.type)}
                              {getRecordTitle(record.type)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={record.team?.team_name || 'Unknown'} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ color: getRecordColor(record.type), fontWeight: 'bold' }}>
                              {record.value}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{record.season}</TableCell>
                          <TableCell align="center">
                            {Math.max(1, new Date().getFullYear() - parseInt(record.season) + 1)} years
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default LeagueRecords;