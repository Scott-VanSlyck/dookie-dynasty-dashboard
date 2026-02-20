/**
 * Players Analysis Component - Placeholder
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { Sports, TrendingUp, TrendingDown } from '@mui/icons-material';
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
      id={`players-tabpanel-${index}`}
      aria-labelledby={`players-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PlayersAnalysis: React.FC = () => {
  const [players, setPlayers] = useState<PlayerValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await tradingValueAPI.getCombinedPlayerValues();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return null;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading player analysis...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        🏈 Player Analysis
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Player Values" icon={<Sports />} />
          <Tab label="Trending Up" icon={<TrendingUp />} />
          <Tab label="Trending Down" icon={<TrendingDown />} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Player Values
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell align="right">Dynasty Value</TableCell>
                    <TableCell align="center">Dynasty Rank</TableCell>
                    <TableCell align="center">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.slice(0, 20).map((player) => (
                    <TableRow key={player.player_id}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {player.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={player.position} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          ${player.value.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`#${player.dynasty_rank}`}
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          {getTrendIcon(player.trend)}
                          <Chip 
                            label={player.trend.toUpperCase()}
                            size="small"
                            color={getTrendColor(player.trend) as any}
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {players.filter(p => p.trend === 'up').slice(0, 12).map(player => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={player.player_id}>
              <Card sx={{ bgcolor: 'success.dark', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUp />
                    <Typography variant="h6">{player.name}</Typography>
                  </Box>
                  <Typography variant="body2" gutterBottom>
                    {player.position} - {player.team}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ${player.value.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    Dynasty Rank: #{player.dynasty_rank}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {players.filter(p => p.trend === 'down').slice(0, 12).map(player => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={player.player_id}>
              <Card sx={{ bgcolor: 'error.dark', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingDown />
                    <Typography variant="h6">{player.name}</Typography>
                  </Box>
                  <Typography variant="body2" gutterBottom>
                    {player.position} - {player.team}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ${player.value.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    Dynasty Rank: #{player.dynasty_rank}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default PlayersAnalysis;