/**
 * League History Component - Placeholder
 */

import React from 'react';
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
  Chip
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';

const LeagueHistory: React.FC = () => {
  const mockHistory = [
    { season: '2024', champion: 'Dynasty Lords', record: '12-2', points: 2247.8 },
    { season: '2023', champion: 'Gridiron Giants', record: '11-3', points: 2156.4 },
    { season: '2022', champion: 'Fantasy Phenoms', record: '13-1', points: 2089.2 },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        📜 League History
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents color="primary" />
                Championship History
              </Typography>
              <List>
                {mockHistory.map((season, index) => (
                  <ListItem key={season.season}>
                    <Avatar sx={{ bgcolor: 'gold', color: 'black', mr: 2 }}>
                      🏆
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6">{season.season} Champion</Typography>
                          <Chip label={season.champion} color="primary" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={`Record: ${season.record}`} size="small" variant="outlined" />
                          <Chip label={`${season.points} PF`} size="small" variant="outlined" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Coming Soon</Typography>
              <Typography variant="body2" color="text.secondary">
                • Season-by-season standings
                • Playoff bracket history  
                • Trade history analysis
                • Draft results archive
                • Statistical leaders by year
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LeagueHistory;