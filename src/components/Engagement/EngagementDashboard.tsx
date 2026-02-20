/**
 * Engagement Dashboard - Phase 2 Features
 * Trade Wars, Dynasty Achievements, and Team Personalities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Psychology as PersonalityIcon,
  Bolt as RivalryIcon,
  TrendingUp,
  Groups,
  Star,
  Refresh,
  Info
} from '@mui/icons-material';

import { DookieTeam } from '../../types';
import { tradeRelationshipAPI, TradeWarAnalysis } from '../../services/TradeRelationshipAPI';
import { dynastyAchievementsAPI, TeamAchievements } from '../../services/DynastyAchievementsAPI';
import { teamPersonalityAPI, TeamPersonality } from '../../services/TeamPersonalityAPI';

interface EngagementDashboardProps {
  teams: DookieTeam[];
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

const EngagementDashboard: React.FC<EngagementDashboardProps> = ({ teams, loading }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [tradeAnalysis, setTradeAnalysis] = useState<TradeWarAnalysis | null>(null);
  const [achievements, setAchievements] = useState<TeamAchievements[]>([]);
  const [personalities, setPersonalities] = useState<TeamPersonality[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teams.length > 0 && !dataLoading) {
      loadEngagementData();
    }
  }, [teams.length]); // Only depend on teams.length to avoid infinite loops

  const loadEngagementData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      // Load all engagement data in parallel
      const [tradeData, achievementData, personalityData] = await Promise.all([
        tradeRelationshipAPI.analyzeTradeRelationships(teams),
        dynastyAchievementsAPI.calculateAllTeamAchievements(teams),
        teamPersonalityAPI.analyzeAllTeamPersonalities(teams)
      ]);

      setTradeAnalysis(tradeData);
      setAchievements(achievementData);
      setPersonalities(personalityData);

      // Save achievements to localStorage
      dynastyAchievementsAPI.saveAchievements(achievementData);
    } catch (err) {
      console.error('Error loading engagement data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load engagement data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => String(t.roster_id) === teamId)?.team_name || `Team ${teamId}`;
  };

  const getTeamAvatar = (teamId: string) => {
    const team = teams.find(t => String(t.roster_id) === teamId);
    return team?.avatar || '🏈';
  };

  if (loading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading engagement features...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadEngagementData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Dynasty Engagement Hub
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadEngagementData}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <RivalryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {tradeAnalysis?.tradeWars.length || 0}
                  </Typography>
                  <Typography color="text.secondary">Trade Wars</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Groups />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {tradeAnalysis?.tradeAlliances.length || 0}
                  </Typography>
                  <Typography color="text.secondary">Trade Alliances</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <TrophyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {achievements.reduce((sum, team) => sum + team.achievements.filter(a => a.unlocked).length, 0)}
                  </Typography>
                  <Typography color="text.secondary">Achievements Unlocked</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <PersonalityIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {new Set(personalities.map(p => p.primaryPersonality.id)).size}
                  </Typography>
                  <Typography color="text.secondary">Unique Personalities</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<RivalryIcon />} 
            label="Trade Wars" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrophyIcon />} 
            label="Achievements" 
            iconPosition="start"
          />
          <Tab 
            icon={<PersonalityIcon />} 
            label="Team Personalities" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Trade Wars Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Trade Alliances */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                  <Groups sx={{ mr: 1 }} />
                  Trade Alliances
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Teams that frequently trade with each other
                </Typography>
                
                {tradeAnalysis?.tradeAlliances.map((alliance, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'success.dark', borderRadius: 1, opacity: 0.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {getTeamAvatar(alliance.teamId1)}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {getTeamName(alliance.teamId1)}
                      </Typography>
                      <Box sx={{ mx: 2, color: 'success.main' }}>↔</Box>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {getTeamAvatar(alliance.teamId2)}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {getTeamName(alliance.teamId2)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {alliance.description}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={alliance.relationshipStrength}
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                )) || (
                  <Typography color="text.secondary" fontStyle="italic">
                    No trade alliances detected yet. Come back during the season!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Trade Wars */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                  <RivalryIcon sx={{ mr: 1 }} />
                  Trade Wars
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Teams that avoid trading with each other
                </Typography>
                
                {tradeAnalysis?.tradeWars.map((war, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'error.dark', borderRadius: 1, opacity: 0.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {getTeamAvatar(war.teamId1)}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {getTeamName(war.teamId1)}
                      </Typography>
                      <Box sx={{ mx: 2, color: 'error.main' }}>⚔️</Box>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {getTeamAvatar(war.teamId2)}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {getTeamName(war.teamId2)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {war.description}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={war.relationshipStrength}
                      color="error"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                )) || (
                  <Typography color="text.secondary" fontStyle="italic">
                    No trade wars detected yet. Everyone's getting along!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Most Active Traders */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  Most Active Traders
                </Typography>
                
                <Grid container spacing={2}>
                  {tradeAnalysis?.mostActiveTraders.slice(0, 6).map((trader, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={trader.teamId}>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Badge badgeContent={index + 1} color="primary" sx={{ mr: 2 }}>
                          <Avatar>
                            {getTeamAvatar(trader.teamId)}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="subtitle2">
                            {getTeamName(trader.teamId)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {trader.totalTrades} trades
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )) || (
                    <Grid size={{ xs: 12 }}>
                      <Typography color="text.secondary" fontStyle="italic">
                        Trading activity will appear here during the season!
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Achievements Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {achievements.map((teamAchievements) => (
            <Grid size={{ xs: 12, lg: 6 }} key={teamAchievements.teamId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {getTeamAvatar(teamAchievements.teamId)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {getTeamName(teamAchievements.teamId)}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {teamAchievements.totalPoints} points • {Math.round(teamAchievements.completionRate)}% complete
                      </Typography>
                    </Box>
                    <Chip
                      label={`${teamAchievements.achievements.filter(a => a.unlocked).length}/${teamAchievements.achievements.length}`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={teamAchievements.completionRate}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />

                  {/* Recent Unlocks */}
                  {teamAchievements.recentUnlocks.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Recently Unlocked
                      </Typography>
                      {teamAchievements.recentUnlocks.map((achievement) => (
                        <Chip
                          key={achievement.id}
                          icon={<span>{achievement.icon}</span>}
                          label={achievement.name}
                          color="success"
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                      <Divider sx={{ my: 2 }} />
                    </>
                  )}

                  {/* Progress Achievements */}
                  {teamAchievements.nextToUnlock.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        Close to Unlocking
                      </Typography>
                      {teamAchievements.nextToUnlock.map((achievement) => (
                        <Box key={achievement.id} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <span style={{ marginRight: 8 }}>{achievement.icon}</span>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {achievement.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(achievement.progress || 0)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={achievement.progress || 0}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Team Personalities Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {personalities.map((personality) => (
            <Grid size={{ xs: 12, lg: 6 }} key={personality.teamId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {getTeamAvatar(personality.teamId)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {getTeamName(personality.teamId)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                          icon={<span>{personality.primaryPersonality.icon}</span>}
                          label={personality.primaryPersonality.name}
                          sx={{ bgcolor: personality.primaryPersonality.color, color: 'white', mr: 1 }}
                        />
                        {personality.secondaryPersonality && (
                          <Chip
                            icon={<span>{personality.secondaryPersonality.icon}</span>}
                            label={personality.secondaryPersonality.name}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                    <Tooltip title={`${personality.confidence}% confidence`}>
                      <Chip
                        label={`${personality.confidence}%`}
                        color={personality.confidence > 80 ? 'success' : 'warning'}
                        size="small"
                      />
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {personality.primaryPersonality.description}
                  </Typography>

                  <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
                    "{personality.overallStrategy}"
                  </Typography>

                  {/* Personality Traits */}
                  {personality.traits.length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Traits
                      </Typography>
                      {personality.traits.map((trait, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <span style={{ marginRight: 8 }}>{trait.icon}</span>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {trait.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(trait.strength)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={trait.strength}
                            sx={{ 
                              height: 4, 
                              borderRadius: 2,
                              '& .MuiLinearProgress-bar': {
                                bgcolor: trait.color
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default EngagementDashboard;