/**
 * Trading Hub Component - Enhanced with API integration and analysis
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  Autocomplete,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Balance,
  Assessment,
  Add,
  Remove
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  LineChart,
  Line
} from 'recharts';

import { tradingValueAPI } from '../../services/TradingValueAPI';
import { PlayerValue } from '../../types';

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
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TradingHub: React.FC = () => {
  const [players, setPlayers] = useState<PlayerValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Trade Analyzer State
  const [teamAPlayers, setTeamAPlayers] = useState<PlayerValue[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<PlayerValue[]>([]);
  const [tradeAnalysis, setTradeAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Market Data State
  const [marketInefficiencies, setMarketInefficiencies] = useState<any>(null);
  const [trendingPlayers, setTrendingPlayers] = useState<{up: PlayerValue[], down: PlayerValue[]}>({up: [], down: []});

  useEffect(() => {
    loadTradingData();
  }, []);

  const loadTradingData = async () => {
    try {
      setLoading(true);
      const [playerData, inefficiencies, trendingUp, trendingDown] = await Promise.all([
        tradingValueAPI.getCombinedPlayerValues(),
        tradingValueAPI.getMarketInefficiencies(),
        tradingValueAPI.getTrendingPlayers('up', 10),
        tradingValueAPI.getTrendingPlayers('down', 10)
      ]);

      setPlayers(playerData);
      setMarketInefficiencies(inefficiencies);
      setTrendingPlayers({ up: trendingUp, down: trendingDown });
    } catch (error) {
      console.error('Error loading trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPlayerToTeam = (player: PlayerValue, team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAPlayers(prev => [...prev, player]);
    } else {
      setTeamBPlayers(prev => [...prev, player]);
    }
  };

  const removePlayerFromTeam = (playerId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAPlayers(prev => prev.filter(p => p.player_id !== playerId));
    } else {
      setTeamBPlayers(prev => prev.filter(p => p.player_id !== playerId));
    }
  };

  const analyzeTrade = async () => {
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await tradingValueAPI.analyzeTradeValue(
        teamAPlayers.map(p => p.player_id),
        teamBPlayers.map(p => p.player_id)
      );
      setTradeAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing trade:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getWinnerColor = (winner: string) => {
    switch (winner) {
      case 'A': return 'success';
      case 'B': return 'error'; 
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading trading hub...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        📈 Trading Hub
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Trade Analyzer" icon={<Balance />} />
          <Tab label="Market Watch" icon={<Assessment />} />
          <Tab label="Trending Players" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {/* Tab 1: Trade Analyzer */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Team A */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                  Team A
                </Typography>
                
                <Autocomplete
                  options={players}
                  getOptionLabel={(player) => `${player.name} (${player.position}) - $${player.value.toLocaleString()}`}
                  onChange={(event, value) => {
                    if (value && !teamAPlayers.find(p => p.player_id === value.player_id)) {
                      addPlayerToTeam(value, 'A');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Add Player to Team A" variant="outlined" />
                  )}
                  sx={{ mb: 2 }}
                />

                <List>
                  {teamAPlayers.map((player) => (
                    <ListItem key={player.player_id}>
                      <ListItemText
                        primary={player.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip label={player.position} size="small" color="primary" />
                            <Chip label={`$${player.value.toLocaleString()}`} size="small" variant="outlined" />
                          </Box>
                        }
                      />
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => removePlayerFromTeam(player.player_id, 'A')}
                      >
                        <Remove />
                      </Button>
                    </ListItem>
                  ))}
                </List>

                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="h6">
                    Total Value: ${teamAPlayers.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          {/* Team B */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                  Team B  
                </Typography>
                
                <Autocomplete
                  options={players}
                  getOptionLabel={(player) => `${player.name} (${player.position}) - $${player.value.toLocaleString()}`}
                  onChange={(event, value) => {
                    if (value && !teamBPlayers.find(p => p.player_id === value.player_id)) {
                      addPlayerToTeam(value, 'B');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Add Player to Team B" variant="outlined" />
                  )}
                  sx={{ mb: 2 }}
                />

                <List>
                  {teamBPlayers.map((player) => (
                    <ListItem key={player.player_id}>
                      <ListItemText
                        primary={player.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip label={player.position} size="small" color="primary" />
                            <Chip label={`$${player.value.toLocaleString()}`} size="small" variant="outlined" />
                          </Box>
                        }
                      />
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => removePlayerFromTeam(player.player_id, 'B')}
                      >
                        <Remove />
                      </Button>
                    </ListItem>
                  ))}
                </List>

                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="h6">
                    Total Value: ${teamBPlayers.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          {/* Analyze Button */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="contained"
                size="medium"
                startIcon={<SwapHoriz />}
                onClick={analyzeTrade}
                disabled={analyzing || teamAPlayers.length === 0 || teamBPlayers.length === 0}
              >
                {analyzing ? 'Analyzing...' : 'Analyze Trade'}
              </Button>
            </Box>
          </Grid>

          {/* Trade Analysis Results */}
          {tradeAnalysis && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Trade Analysis Results
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Team A Value
                        </Typography>
                        <Typography variant="h5" sx={{ color: 'success.main' }}>
                          ${tradeAnalysis.teamAValue.toLocaleString()}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Team B Value
                        </Typography>
                        <Typography variant="h5" sx={{ color: 'error.main' }}>
                          ${tradeAnalysis.teamBValue.toLocaleString()}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Winner
                        </Typography>
                        <Chip 
                          label={
                            tradeAnalysis.winner === 'Even' 
                              ? 'Fair Trade' 
                              : `Team ${tradeAnalysis.winner} Wins`
                          }
                          color={getWinnerColor(tradeAnalysis.winner) as any}
                          size="medium"
                        />
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Alert 
                        severity={
                          tradeAnalysis.percentageDifference < 5 
                            ? 'success' 
                            : tradeAnalysis.percentageDifference < 15 
                            ? 'warning' 
                            : 'error'
                        }
                      >
                        <Typography variant="body1">
                          <strong>Value Difference:</strong> ${tradeAnalysis.difference.toLocaleString()} 
                          ({tradeAnalysis.percentageDifference.toFixed(1)}%)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {tradeAnalysis.percentageDifference < 5 
                            ? 'This is a very fair trade with minimal value difference.'
                            : tradeAnalysis.percentageDifference < 15
                            ? 'This trade has some value imbalance but could be acceptable depending on team needs.'
                            : 'This trade has significant value imbalance. Consider adjusting the players involved.'}
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Tab 2: Market Watch */}
      <TabPanel value={tabValue} index={1}>
        {marketInefficiencies && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                    📉 Undervalued Players
                  </Typography>
                  <List dense>
                    {marketInefficiencies.undervalued.slice(0, 8).map((player: PlayerValue) => (
                      <ListItem key={player.player_id}>
                        <ListItemText
                          primary={player.name}
                          secondary={`${player.position} - $${player.value.toLocaleString()}`}
                        />
                        <TrendingUp color="success" />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                    📈 Overvalued Players
                  </Typography>
                  <List dense>
                    {marketInefficiencies.overvalued.slice(0, 8).map((player: PlayerValue) => (
                      <ListItem key={player.player_id}>
                        <ListItemText
                          primary={player.name}
                          secondary={`${player.position} - $${player.value.toLocaleString()}`}
                        />
                        <TrendingDown color="error" />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    ⚖️ Fairly Valued
                  </Typography>
                  <List dense>
                    {marketInefficiencies.consensus.slice(0, 8).map((player: PlayerValue) => (
                      <ListItem key={player.player_id}>
                        <ListItemText
                          primary={player.name}
                          secondary={`${player.position} - $${player.value.toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Tab 3: Trending Players */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="success" />
                  Trending Up
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trendingPlayers.up.map((player) => (
                        <TableRow key={player.player_id}>
                          <TableCell>{player.name}</TableCell>
                          <TableCell>
                            <Chip label={player.position} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            ${player.value.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingDown color="error" />
                  Trending Down
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trendingPlayers.down.map((player) => (
                        <TableRow key={player.player_id}>
                          <TableCell>{player.name}</TableCell>
                          <TableCell>
                            <Chip label={player.position} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            ${player.value.toLocaleString()}
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

export default TradingHub;