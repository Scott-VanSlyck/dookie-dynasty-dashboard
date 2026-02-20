/**
 * Overview Dashboard - Main dashboard showing key stats and recent activity
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Button
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  Casino,
  SwapHoriz,
  Refresh,
  Group,
  Assessment
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { DookieTeam, DashboardStats } from '../../types';
import { calculateWinPercentage, formatPercentage, getOrdinalSuffix } from '../../utils/calculations';

interface OverviewDashboardProps {
  teams: DookieTeam[];
  stats: DashboardStats | null;
  loading: boolean;
}

const COLORS = ['#1e88e5', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4'];

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  teams,
  stats,
  loading
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would call a refresh function passed as prop
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  // Sort teams by standings
  const standings = teams.slice().sort((a, b) => {
    const aWinPct = calculateWinPercentage(a.record?.wins || 0, a.record?.losses || 0);
    const bWinPct = calculateWinPercentage(b.record?.wins || 0, b.record?.losses || 0);
    
    if (aWinPct !== bWinPct) {
      return bWinPct - aWinPct; // Higher win % first
    }
    
    // Tie-breaker: points for
    return (b.points_for || 0) - (a.points_for || 0);
  });

  // Get playoff teams (top 6) and lottery teams (bottom 6)
  const playoffTeams = standings.slice(0, 6);
  const lotteryTeams = standings.slice(-6);

  // Prepare chart data
  const standingsChartData = standings.map((team, index) => ({
    name: team.team_name.length > 15 ? team.team_name.substring(0, 15) + '...' : team.team_name,
    wins: team.record?.wins || 0,
    losses: team.record?.losses || 0,
    position: index + 1
  }));

  const divisionData = [
    { name: 'Playoff Teams', value: playoffTeams.length, color: COLORS[2] },
    { name: 'Lottery Teams', value: lotteryTeams.length, color: COLORS[3] }
  ];

  if (loading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading dashboard data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🏈 Dookie Dynasty Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <LinearProgress /> : <Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Key Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {teams.length}
                  </Typography>
                  <Typography variant="body2">
                    Total Teams
                  </Typography>
                </Box>
                <Group sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats?.current_week || 15}
                  </Typography>
                  <Typography variant="body2">
                    Current Week
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    6
                  </Typography>
                  <Typography variant="body2">
                    Lottery Teams
                  </Typography>
                </Box>
                <Casino sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats?.total_trades || 0}
                  </Typography>
                  <Typography variant="body2">
                    Total Trades
                  </Typography>
                </Box>
                <SwapHoriz sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Current Standings */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents color="primary" />
                Current Standings
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={standingsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Bar dataKey="wins" stackId="a" fill={COLORS[2]} name="Wins" />
                    <Bar dataKey="losses" stackId="a" fill={COLORS[3]} name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Playoff vs Lottery Split */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                League Split
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={divisionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {divisionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Playoff Race
              </Typography>
              <List>
                {playoffTeams.slice(0, 6).map((team, index) => (
                  <React.Fragment key={team.roster_id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          {getOrdinalSuffix(index + 1).replace(/\d+/, '')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={team.team_name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`${team.record?.wins || 0}-${team.record?.losses || 0}`}
                              size="small"
                              color="success"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatPercentage(calculateWinPercentage(team.record?.wins || 0, team.record?.losses || 0))}
                            </Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary">
                        {team.points_for?.toFixed(1)} pts
                      </Typography>
                    </ListItem>
                    {index < playoffTeams.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Lottery Contenders */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
                <TrendingDown sx={{ mr: 1, verticalAlign: 'middle' }} />
                Lottery Contenders
              </Typography>
              <List>
                {lotteryTeams.map((team, index) => (
                  <React.Fragment key={team.roster_id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                          {getOrdinalSuffix(standings.length - 5 + index).replace(/\d+/, '')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={team.team_name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`${team.record?.wins || 0}-${team.record?.losses || 0}`}
                              size="small"
                              color="warning"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatPercentage(calculateWinPercentage(team.record?.wins || 0, team.record?.losses || 0))}
                            </Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary">
                        {team.points_for?.toFixed(1)} pts
                      </Typography>
                    </ListItem>
                    {index < lotteryTeams.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Casino />}
                  href="/lottery"
                  sx={{ py: 2 }}
                >
                  Run Draft Lottery
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  href="/tankathon"
                  sx={{ py: 2 }}
                >
                  View Tankathon
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SwapHoriz />}
                  href="/trading"
                  sx={{ py: 2 }}
                >
                  Analyze Trades
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Group />}
                  href="/teams"
                  sx={{ py: 2 }}
                >
                  Explore Teams
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewDashboard;