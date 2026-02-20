/**
 * League History Component - Placeholder
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  List, 
  ListItem, 
  ListItemText,
  Avatar,
  Chip,
  CircularProgress
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { historicalSleeperAPI, HistoricalSeason } from '../../services/HistoricalSleeperAPI';

const LeagueHistory: React.FC = () => {
  const [historicalSeasons, setHistoricalSeasons] = useState<HistoricalSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading league history from Sleeper API...');
      
      const multiSeasonData = await historicalSleeperAPI.getMultiSeasonData();
      
      if (multiSeasonData.seasons.length > 0) {
        setHistoricalSeasons(multiSeasonData.seasons);
        console.log(`✅ Loaded ${multiSeasonData.seasons.length} seasons of history`);
      } else {
        setError('No historical data available yet - league may be in first season');
        console.log('⚠️ No historical seasons found');
      }
    } catch (err) {
      console.error('❌ Error loading historical data:', err);
      setError('Error loading league history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading league history...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
          📜 League History
        </Typography>
        
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Historical data will appear here once the league has completed seasons.
              This is likely a new league or the first season hasn't finished yet.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        📜 League History ({historicalSeasons.length} seasons)
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents color="primary" />
                Championship History
              </Typography>
              {historicalSeasons.length > 0 ? (
                <List>
                  {historicalSeasons
                    .sort((a, b) => parseInt(b.year) - parseInt(a.year)) // Most recent first
                    .map((season, index) => (
                    <ListItem key={season.year}>
                      <Avatar sx={{ bgcolor: 'gold', color: 'black', mr: 2 }}>
                        🏆
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6">{season.year} Champion</Typography>
                            <Chip 
                              label={season.champion?.team_name || 'Unknown'} 
                              color="primary" 
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {season.final_standings?.[0] && (
                              <>
                                <Chip 
                                  label={`Record: ${season.final_standings[0].wins}-${season.final_standings[0].losses}`} 
                                  size="small" 
                                  variant="outlined" 
                                />
                                <Chip 
                                  label={`${season.final_standings[0].points_for.toFixed(1)} PF`} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              </>
                            )}
                            <Chip 
                              label={`${season.trades?.length || 0} trades`} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No completed seasons yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Real Historical Data</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Now displaying authentic Sleeper league data:
              </Typography>
              <List dense>
                <ListItem>
                  <Typography variant="body2">✅ Season-by-season standings</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">✅ Real championship history</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">✅ Actual trade counts</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">✅ True points totals</Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">📊 Historical records analysis</Typography>
                </ListItem>
              </List>
              {historicalSeasons.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Data from {Math.min(...historicalSeasons.map(s => parseInt(s.year)))} - {Math.max(...historicalSeasons.map(s => parseInt(s.year)))}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LeagueHistory;