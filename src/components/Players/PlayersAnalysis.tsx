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
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  TableSortLabel,
  IconButton
} from '@mui/material';
import { Sports, TrendingUp, TrendingDown, Search, Clear } from '@mui/icons-material';
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
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [sortField, setSortField] = useState<keyof PlayerValue>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(25);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await tradingValueAPI.getCombinedPlayerValues();
      setPlayers(data);
      setFilteredPlayers(data);
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort players
  useEffect(() => {
    let filtered = [...players];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.team && player.team.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply position filter  
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPlayers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [players, searchTerm, positionFilter, sortField, sortDirection]);

  const handleSort = (field: keyof PlayerValue) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPositionFilter('ALL');
  };

  // Pagination
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

  const uniquePositions = [...new Set(players.map(p => p.position))].sort();

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Player Database ({filteredPlayers.length} players)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={clearSearch}>
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={positionFilter}
                    label="Position"
                    onChange={(e) => setPositionFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Positions</MenuItem>
                    {uniquePositions.map(pos => (
                      <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'name'}
                        direction={sortField === 'name' ? sortDirection : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Player
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'position'}
                        direction={sortField === 'position' ? sortDirection : 'asc'}
                        onClick={() => handleSort('position')}
                      >
                        Position
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'team'}
                        direction={sortField === 'team' ? sortDirection : 'asc'}
                        onClick={() => handleSort('team')}
                      >
                        Team
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'value'}
                        direction={sortField === 'value' ? sortDirection : 'asc'}
                        onClick={() => handleSort('value')}
                      >
                        Dynasty Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortField === 'dynasty_rank'}
                        direction={sortField === 'dynasty_rank' ? sortDirection : 'asc'}
                        onClick={() => handleSort('dynasty_rank')}
                      >
                        Dynasty Rank
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPlayers.map((player) => (
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

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Stack spacing={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event, value) => setCurrentPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Showing {indexOfFirstPlayer + 1}-{Math.min(indexOfLastPlayer, filteredPlayers.length)} of {filteredPlayers.length} players
                </Typography>
              </Stack>
            </Box>
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