/**
 * Teams Explorer Component - Enhanced with Real Roster Data
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Group,
  Person,
  Sports
} from '@mui/icons-material';
import { DookieTeam } from '../../types';
import { sleeperAPI } from '../../services/SleeperAPI';
import { tradingValueAPI } from '../../services/TradingValueAPI';

interface TeamRoster {
  roster_id: number;
  players: string[];
  starters: string[];
}

interface PlayerInfo {
  player_id: string;
  name: string;
  position: string;
  team: string;
  value?: number;
}

interface TeamsExplorerProps {
  teams: DookieTeam[];
  loading?: boolean;
}

const TeamsExplorer: React.FC<TeamsExplorerProps> = ({ teams, loading }) => {
  const [rosters, setRosters] = useState<Record<number, TeamRoster>>({});
  const [playerData, setPlayerData] = useState<Record<string, PlayerInfo>>({});
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [loadingRosters, setLoadingRosters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRosterData();
  }, [teams]);

  const loadRosterData = async () => {
    try {
      setLoadingRosters(true);
      setError(null);

      // Get rosters and player data
      const [rostersData, allPlayers] = await Promise.all([
        sleeperAPI.getRosters(),
        tradingValueAPI.getAllPlayers()
      ]);

      // Convert rosters to map
      const rostersMap = rostersData.reduce((acc, roster) => {
        acc[roster.roster_id] = {
          roster_id: roster.roster_id,
          players: roster.players || [],
          starters: roster.starters || []
        };
        return acc;
      }, {} as Record<number, TeamRoster>);

      // Convert players to PlayerInfo format
      const playersMap: Record<string, PlayerInfo> = {};
      Object.entries(allPlayers).forEach(([playerId, player]) => {
        playersMap[playerId] = {
          player_id: playerId,
          name: player.full_name || `${player.first_name} ${player.last_name}` || 'Unknown Player',
          position: player.position || 'N/A',
          team: player.team || 'FA'
        };
      });

      setRosters(rostersMap);
      setPlayerData(playersMap);
    } catch (err) {
      console.error('Error loading roster data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roster data');
    } finally {
      setLoadingRosters(false);
    }
  };

  const handleTeamClick = (rosterId: number) => {
    setExpandedTeam(expandedTeam === rosterId ? null : rosterId);
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'error';
      case 'RB': return 'success';
      case 'WR': return 'primary';
      case 'TE': return 'warning';
      case 'K': return 'secondary';
      case 'DEF': return 'default';
      default: return 'default';
    }
  };

  const groupPlayersByPosition = (playerIds: string[]) => {
    const groups: Record<string, PlayerInfo[]> = {};
    
    playerIds.forEach(playerId => {
      const player = playerData[playerId];
      if (player) {
        const pos = player.position;
        if (!groups[pos]) groups[pos] = [];
        groups[pos].push(player);
      }
    });

    // Sort positions
    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    const sortedGroups: Record<string, PlayerInfo[]> = {};
    
    positionOrder.forEach(pos => {
      if (groups[pos]) {
        sortedGroups[pos] = groups[pos];
      }
    });

    // Add any other positions
    Object.keys(groups).forEach(pos => {
      if (!positionOrder.includes(pos)) {
        sortedGroups[pos] = groups[pos];
      }
    });

    return sortedGroups;
  };

  if (loading || loadingRosters) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading teams and rosters...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading roster data: {error}
        </Alert>
        <Button onClick={loadRosterData} variant="outlined">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        👥 Team Explorer
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Click on any team to view their current roster and player details.
      </Typography>
      
      <Grid container spacing={3}>
        {teams.map(team => {
          const roster = rosters[team.roster_id];
          const isExpanded = expandedTeam === team.roster_id;
          const playerCount = roster?.players?.length || 0;

          return (
            <Grid size={{ xs: 12 }} key={team.roster_id}>
              <Card>
                <CardContent>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      p: 1,
                      borderRadius: 1,
                      margin: -1
                    }}
                    onClick={() => handleTeamClick(team.roster_id)}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
                      {team.team_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{team.team_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Owner: {team.owner_name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
                      <Chip 
                        label={`${team.record?.wins || 0}-${team.record?.losses || 0}`}
                        color="primary"
                        size="small"
                      />
                      <Chip 
                        label={`${(team.points_for || 0).toFixed(1)} PF`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`${playerCount} players`}
                        variant="outlined"
                        size="small"
                        icon={<Group />}
                      />
                    </Box>

                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </Box>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 2 }} />
                      
                      {roster && roster.players && roster.players.length > 0 ? (
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Sports color="primary" />
                            Full Roster ({roster.players.length} players)
                          </Typography>

                          {(() => {
                            const groupedPlayers = groupPlayersByPosition(roster.players);
                            return Object.entries(groupedPlayers).map(([position, players]) => (
                              <Paper key={position} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                                  {position} ({players.length})
                                </Typography>
                                <Grid container spacing={1}>
                                  {players.map(player => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.player_id}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                          label={player.position}
                                          size="small"
                                          color={getPositionColor(player.position) as any}
                                          sx={{ minWidth: 40 }}
                                        />
                                        <Typography variant="body2">
                                          {player.name} ({player.team})
                                        </Typography>
                                        {roster.starters.includes(player.player_id) && (
                                          <Chip
                                            label="Starter"
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                          />
                                        )}
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Paper>
                            ));
                          })()}

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Waiver Position: #{team.waiver_position} | 
                            Starters: {roster.starters.length} | 
                            Bench: {roster.players.length - roster.starters.length}
                          </Typography>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          No roster data available for this team (possibly pre-draft).
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          📊 Team data loaded from Sleeper API • Player database: {Object.keys(playerData).length.toLocaleString()} NFL players
        </Typography>
      </Box>
    </Box>
  );
};

export default TeamsExplorer;