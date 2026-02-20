/**
 * Teams Explorer Component - Placeholder
 */

import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Avatar, Chip, LinearProgress } from '@mui/material';
import { DookieTeam } from '../../types';

interface TeamsExplorerProps {
  teams: DookieTeam[];
  loading?: boolean;
}

const TeamsExplorer: React.FC<TeamsExplorerProps> = ({ teams, loading }) => {
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading teams...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        👥 Team Explorer
      </Typography>
      
      <Grid container spacing={3}>
        {teams.map(team => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.roster_id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {team.team_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{team.team_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {team.owner_name}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Waiver Position: #{team.waiver_position}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TeamsExplorer;