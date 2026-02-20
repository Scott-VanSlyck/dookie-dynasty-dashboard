/**
 * Enhanced Trading Hub with FREE Multi-Source Data
 * Replaces paid APIs with free alternatives
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
  Tabs,
  Tab,
  Autocomplete,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Balance,
  Assessment,
  Add,
  Remove,
  Info,
  LocalAtm,
  People,
  ShowChart,
  Psychology,
  Speed,
  MoneyOff
} from '@mui/icons-material';

import { 
  customValuationEngine,
  FreePlayerValue 
} from '../../services/FreeDataCollectors';

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

interface MultiSourceData {
  sleeper: FreePlayerValue[];
  community: FreePlayerValue[];
  adp: FreePlayerValue[];
  consensus: FreePlayerValue[];
  leagueInfo: any;
}

const EnhancedTradingHub: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dataSource, setDataSource] = useState<'sleeper' | 'community' | 'adp' | 'consensus'>('consensus');
  const [multiSourceData, setMultiSourceData] = useState<MultiSourceData>({
    sleeper: [],
    community: [],
    adp: [],
    consensus: [],
    leagueInfo: null
  });

  // Trade Analyzer State
  const [teamAPlayers, setTeamAPlayers] = useState<FreePlayerValue[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<FreePlayerValue[]>([]);
  const [tradeAnalysis, setTradeAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);

  useEffect(() => {
    loadFreeData();
  }, []);

  const loadFreeData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading FREE dynasty trade values...');
      
      const data = await customValuationEngine.generateMultiSourceValues();
      setMultiSourceData(data);
      
      console.log('✅ FREE data loaded successfully!');
      console.log(`- Sleeper: ${data.sleeper.length} players`);
      console.log(`- Community: ${data.community.length} players`);
      console.log(`- ADP: ${data.adp.length} players`);
      console.log(`- Consensus: ${data.consensus.length} players`);
      
    } catch (error) {
      console.error('❌ Error loading free data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlayerData = (): FreePlayerValue[] => {
    return multiSourceData[dataSource] || [];
  };

  const addPlayerToTeam = (player: FreePlayerValue, team: 'A' | 'B') => {
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
    
    const teamAValue = teamAPlayers.reduce((sum, p) => sum + p.value, 0);
    const teamBValue = teamBPlayers.reduce((sum, p) => sum + p.value, 0);
    const difference = Math.abs(teamAValue - teamBValue);
    const totalValue = teamAValue + teamBValue;
    const percentageDifference = totalValue === 0 ? 0 : (difference / totalValue) * 100;

    let winner: 'A' | 'B' | 'Even';
    if (percentageDifference < 5) {
      winner = 'Even';
    } else if (teamAValue > teamBValue) {
      winner = 'A';
    } else {
      winner = 'B';
    }

    // Calculate confidence scores
    const teamAConfidence = teamAPlayers.reduce((sum, p) => sum + p.confidence, 0) / teamAPlayers.length;
    const teamBConfidence = teamBPlayers.reduce((sum, p) => sum + p.confidence, 0) / teamBPlayers.length;

    setTradeAnalysis({
      teamAValue,
      teamBValue,
      difference,
      percentageDifference,
      winner,
      teamAConfidence: Math.round(teamAConfidence),
      teamBConfidence: Math.round(teamBConfidence),
      dataSource
    });

    setAnalyzing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <TrendingUp color="success" />;
    if (trend === 'down') return <TrendingDown color="error" />;
    return <ShowChart color="action" />;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          💰 FREE Dynasty Trade Hub
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">Loading FREE dynasty trade values...</Typography>
          <Typography variant="body2">
            • Sleeper community data (trending adds/drops)<br/>
            • Reddit dynasty consensus values<br/>
            • ADP-based dynasty rankings<br/>
            • Custom valuation algorithm
          </Typography>
        </Alert>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>🔄 Gathering data from multiple free sources...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          💰 FREE Dynasty Trade Hub
        </Typography>
        <Chip 
          icon={<MoneyOff />}
          label="$0/month • No API Fees" 
          color="success" 
          variant="outlined"
          size="medium"
        />
      </Box>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6">🎉 100% FREE Dynasty Trade Values!</Typography>
        <Typography variant="body2">
          Powered by Sleeper community data, Reddit consensus, ADP rankings, and our custom algorithm. 
          No more $30-80/month API fees!
        </Typography>
      </Alert>

      {/* League-Specific Settings Display */}
      {multiSourceData.leagueInfo && (
        <Card sx={{ mb: 3, bgcolor: 'info.dark' }}>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              🏆 {multiSourceData.leagueInfo.settings.name} - EXACT League Settings
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    📊 Scoring Format
                  </Typography>
                  {multiSourceData.leagueInfo.settings.te_ppr > multiSourceData.leagueInfo.settings.rec && (
                    <Chip 
                      label={`TE Premium: ${(multiSourceData.leagueInfo.settings.te_ppr / multiSourceData.leagueInfo.settings.rec).toFixed(2)}x`}
                      color="error"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  {multiSourceData.leagueInfo.roster.SUPER_FLEX > 0 && (
                    <Chip 
                      label={`Superflex (${multiSourceData.leagueInfo.roster.SUPER_FLEX} SF)`}
                      color="primary"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  {(multiSourceData.leagueInfo.settings.first_down_rec || 
                    multiSourceData.leagueInfo.settings.first_down_rush ||
                    multiSourceData.leagueInfo.settings.first_down_pass) && (
                    <Chip 
                      label="First Down Bonuses"
                      color="warning"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    👥 Starting Lineup
                  </Typography>
                  <Typography variant="body2">
                    {multiSourceData.leagueInfo.roster.QB > 0 && `${multiSourceData.leagueInfo.roster.QB} QB, `}
                    {multiSourceData.leagueInfo.roster.SUPER_FLEX > 0 && `${multiSourceData.leagueInfo.roster.SUPER_FLEX} SF, `}
                    {multiSourceData.leagueInfo.roster.RB > 0 && `${multiSourceData.leagueInfo.roster.RB} RB, `}
                    {multiSourceData.leagueInfo.roster.WR > 0 && `${multiSourceData.leagueInfo.roster.WR} WR, `}
                    {multiSourceData.leagueInfo.roster.TE > 0 && `${multiSourceData.leagueInfo.roster.TE} TE, `}
                    {multiSourceData.leagueInfo.roster.FLEX > 0 && `${multiSourceData.leagueInfo.roster.FLEX} FLEX`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    + {multiSourceData.leagueInfo.roster.BN} Bench spots
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ✅ Trade values automatically adjusted for YOUR league's exact scoring and roster settings!
                {multiSourceData.leagueInfo.roster.SUPER_FLEX > 0 && ' QBs are significantly more valuable in superflex.'}
                {multiSourceData.leagueInfo.settings.te_ppr > multiSourceData.leagueInfo.settings.rec && ' Elite TEs are premium assets with TE bonus scoring.'}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Data Source Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Choose Your Data Source
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant={dataSource === 'consensus' ? 'contained' : 'outlined'}
            onClick={() => setDataSource('consensus')}
            startIcon={<Psychology />}
          >
            Consensus ({multiSourceData.consensus.length})
          </Button>
          <Button
            variant={dataSource === 'sleeper' ? 'contained' : 'outlined'}
            onClick={() => setDataSource('sleeper')}
            startIcon={<People />}
          >
            Sleeper Community ({multiSourceData.sleeper.length})
          </Button>
          <Button
            variant={dataSource === 'community' ? 'contained' : 'outlined'}
            onClick={() => setDataSource('community')}
            startIcon={<ShowChart />}
          >
            r/DynastyFF ({multiSourceData.community.length})
          </Button>
          <Button
            variant={dataSource === 'adp' ? 'contained' : 'outlined'}
            onClick={() => setDataSource('adp')}
            startIcon={<Speed />}
          >
            ADP Rankings ({multiSourceData.adp.length})
          </Button>
        </Box>
        
        <FormControlLabel
          control={
            <Switch 
              checked={showAllSources} 
              onChange={(e) => setShowAllSources(e.target.checked)} 
            />
          }
          label="Show values from all sources in trade analyzer"
          sx={{ mt: 1 }}
        />
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Trade Analyzer" icon={<Balance />} />
          <Tab label="Player Values" icon={<LocalAtm />} />
          <Tab label="Market Trends" icon={<Assessment />} />
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
                  options={getCurrentPlayerData()}
                  getOptionLabel={(player) => 
                    `${player.name} (${player.position}) - $${player.value.toLocaleString()} [${player.confidence}%]`
                  }
                  onChange={(event, value) => {
                    if (value && !teamAPlayers.find(p => p.player_id === value.player_id)) {
                      addPlayerToTeam(value, 'A');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Add Player to Team A" variant="outlined" />
                  )}
                  renderOption={(props, player) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body1">{player.name}</Typography>
                        <Chip label={player.position} size="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          ${player.value.toLocaleString()}
                        </Typography>
                        <Chip 
                          label={`${player.confidence}%`} 
                          size="small" 
                          color={getConfidenceColor(player.confidence) as any}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {player.source}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ mb: 2 }}
                />

                <List>
                  {teamAPlayers.map((player) => (
                    <ListItem key={player.player_id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {player.name}
                            {getTrendIcon(player.trend, player.trend_percentage)}
                            {player.trend_percentage !== 0 && (
                              <Typography variant="caption" color={player.trend === 'up' ? 'success.main' : 'error.main'}>
                                ({player.trend_percentage > 0 ? '+' : ''}{player.trend_percentage}%)
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip label={player.position} size="small" color="primary" />
                            <Chip 
                              label={`$${player.value.toLocaleString()}`} 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`${player.confidence}% confidence`} 
                              size="small" 
                              color={getConfidenceColor(player.confidence) as any}
                            />
                            <Tooltip title={`Source: ${player.source}`}>
                              <Chip 
                                label={player.source.split(' ')[0]} 
                                size="small" 
                                variant="outlined"
                                color="info"
                              />
                            </Tooltip>
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
                  <Typography variant="body2">
                    Avg Confidence: {teamAPlayers.length ? Math.round(teamAPlayers.reduce((sum, p) => sum + p.confidence, 0) / teamAPlayers.length) : 0}%
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
                  options={getCurrentPlayerData()}
                  getOptionLabel={(player) => 
                    `${player.name} (${player.position}) - $${player.value.toLocaleString()} [${player.confidence}%]`
                  }
                  onChange={(event, value) => {
                    if (value && !teamBPlayers.find(p => p.player_id === value.player_id)) {
                      addPlayerToTeam(value, 'B');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Add Player to Team B" variant="outlined" />
                  )}
                  renderOption={(props, player) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body1">{player.name}</Typography>
                        <Chip label={player.position} size="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          ${player.value.toLocaleString()}
                        </Typography>
                        <Chip 
                          label={`${player.confidence}%`} 
                          size="small" 
                          color={getConfidenceColor(player.confidence) as any}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {player.source}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ mb: 2 }}
                />

                <List>
                  {teamBPlayers.map((player) => (
                    <ListItem key={player.player_id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {player.name}
                            {getTrendIcon(player.trend, player.trend_percentage)}
                            {player.trend_percentage !== 0 && (
                              <Typography variant="caption" color={player.trend === 'up' ? 'success.main' : 'error.main'}>
                                ({player.trend_percentage > 0 ? '+' : ''}{player.trend_percentage}%)
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip label={player.position} size="small" color="primary" />
                            <Chip 
                              label={`$${player.value.toLocaleString()}`} 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`${player.confidence}% confidence`} 
                              size="small" 
                              color={getConfidenceColor(player.confidence) as any}
                            />
                            <Tooltip title={`Source: ${player.source}`}>
                              <Chip 
                                label={player.source.split(' ')[0]} 
                                size="small" 
                                variant="outlined"
                                color="info"
                              />
                            </Tooltip>
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
                  <Typography variant="body2">
                    Avg Confidence: {teamBPlayers.length ? Math.round(teamBPlayers.reduce((sum, p) => sum + p.confidence, 0) / teamBPlayers.length) : 0}%
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
                {analyzing ? 'Analyzing...' : 'Analyze Trade (FREE)'}
              </Button>
            </Box>
          </Grid>

          {/* Trade Analysis Results */}
          {tradeAnalysis && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Trade Analysis Results
                    </Typography>
                    <Chip 
                      label={`Data: ${tradeAnalysis.dataSource}`}
                      color="info"
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Team A Value
                        </Typography>
                        <Typography variant="h5" sx={{ color: 'success.main' }}>
                          ${tradeAnalysis.teamAValue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          {tradeAnalysis.teamAConfidence}% confidence
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
                        <Typography variant="caption">
                          {tradeAnalysis.teamBConfidence}% confidence
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
                          color={
                            tradeAnalysis.winner === 'Even' ? 'success' :
                            tradeAnalysis.winner === 'A' ? 'info' : 'warning'
                          }
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
                            ? '✅ This is a very fair trade with minimal value difference.'
                            : tradeAnalysis.percentageDifference < 15
                            ? '⚠️ This trade has some value imbalance but could be acceptable.'
                            : '❌ This trade has significant value imbalance. Consider adjusting.'}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          💰 Analysis powered by FREE {tradeAnalysis.dataSource} data - No API fees!
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

      {/* Tab 2: Player Values */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          📊 {dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Player Values
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Position</TableCell>
                <TableCell align="right">Dynasty Value</TableCell>
                <TableCell align="center">Confidence</TableCell>
                <TableCell align="center">Trend</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPlayerData().slice(0, 50).map((player) => (
                <TableRow key={player.player_id}>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>
                    <Chip label={player.position} size="small" color="primary" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${player.value.toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={`${player.confidence}%`}
                      size="small"
                      color={getConfidenceColor(player.confidence) as any}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {getTrendIcon(player.trend, player.trend_percentage)}
                      {player.trend_percentage !== 0 && (
                        <Typography variant="caption" color={player.trend === 'up' ? 'success.main' : 'error.main'}>
                          {player.trend_percentage > 0 ? '+' : ''}{player.trend_percentage}%
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {player.source}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab 3: Market Trends */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                  📈 Trending Up
                </Typography>
                <List>
                  {getCurrentPlayerData()
                    .filter(p => p.trend === 'up')
                    .slice(0, 10)
                    .map((player) => (
                      <ListItem key={player.player_id}>
                        <ListItemText
                          primary={player.name}
                          secondary={`${player.position} - $${player.value.toLocaleString()}`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp color="success" />
                          <Typography variant="body2" color="success.main">
                            +{player.trend_percentage}%
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                  📉 Trending Down  
                </Typography>
                <List>
                  {getCurrentPlayerData()
                    .filter(p => p.trend === 'down')
                    .slice(0, 10)
                    .map((player) => (
                      <ListItem key={player.player_id}>
                        <ListItemText
                          primary={player.name}
                          secondary={`${player.position} - $${player.value.toLocaleString()}`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingDown color="error" />
                          <Typography variant="body2" color="error.main">
                            {player.trend_percentage}%
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default EnhancedTradingHub;