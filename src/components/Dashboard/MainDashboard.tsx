/**
 * Main Dashboard Component for Dookie Dynasty
 * Serves as the primary layout and navigation hub
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  History as HistoryIcon,
  Casino as CasinoIcon,
  TrendingUp as TrendingUpIcon,
  SwapHoriz as SwapHorizIcon,
  Sports as SportsIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  School as SchoolIcon,
  Bolt,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Import components (we'll create these next)
import OverviewDashboard from './OverviewDashboard';
import TeamsExplorer from '../Teams/TeamsExplorer';
import LeagueHistory from '../History/LeagueHistory';
import DraftLottery from '../Draft/DraftLottery';
import TankathonView from '../Draft/TankathonView';
import PlayersAnalysis from '../Players/PlayersAnalysis';
import TradingHub from '../Trading/TradingHub';
import EnhancedTradingHub from '../Trading/EnhancedTradingHub';
import HistoricalTradeTracker from '../Trading/HistoricalTradeTracker';
import TeamAnalytics from '../Analytics/TeamAnalytics';
import LeagueRecords from '../Analytics/LeagueRecords';
import ImpactfulPerformances from '../Analytics/ImpactfulPerformances';
import EngagementDashboard from '../Engagement/EngagementDashboard';

// Services
import { sleeperAPI } from '../../services/SleeperAPI';
import { DookieTeam, NavigationItem, DashboardStats } from '../../types';

const drawerWidth = 280;

// Create dark theme for dynasty feel
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5',
      dark: '#1565c0',
      light: '#42a5f5',
    },
    secondary: {
      main: '#ff9800',
      dark: '#f57c00',
      light: '#ffb74d',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    }
  },
  shape: {
    borderRadius: 12,
  }
});

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/',
    description: 'League overview and key stats'
  },
  {
    id: 'teams',
    label: 'Team Explorer',
    icon: 'group',
    path: '/teams',
    description: 'Explore all league teams and rosters'
  },
  {
    id: 'history',
    label: 'League History',
    icon: 'history',
    path: '/history',
    description: 'Past seasons and championships'
  },
  {
    id: 'lottery',
    label: 'Draft Lottery',
    icon: 'casino',
    path: '/lottery',
    description: 'Weighted lottery system'
  },
  {
    id: 'tankathon',
    label: 'Tankathon',
    icon: 'trending_up',
    path: '/tankathon',
    description: 'Draft positioning tracker'
  },
  {
    id: 'players',
    label: 'Player Analysis',
    icon: 'sports',
    path: '/players',
    description: 'Player stats and values'
  },
  {
    id: 'trading',
    label: 'Trading Hub',
    icon: 'swap_horiz',
    path: '/trading',
    description: 'Trade analyzer and values'
  },
  {
    id: 'historical_trades',
    label: 'Historical Trades',
    icon: 'history',
    path: '/historical-trades',
    description: 'Track trades over time: immediate vs long-term winners'
  },
  {
    id: 'engagement',
    label: 'Dynasty Hub',
    icon: 'psychology',
    path: '/engagement',
    description: 'Trade wars, achievements, and team personalities'
  },
  {
    id: 'team_analytics',
    label: 'Team Analytics',
    icon: 'assessment',
    path: '/team-analytics',
    description: 'Advanced team performance metrics'
  },
  {
    id: 'league_records',
    label: 'League Records',
    icon: 'trophy',
    path: '/league-records',
    description: 'Historical records and milestones'
  },
  {
    id: 'impactful_performances',
    label: 'Impact Plays',
    icon: 'bolt',
    path: '/impact-plays',
    description: 'Game-winning and clutch performances'
  }
];

const iconMap: { [key: string]: React.ReactNode } = {
  dashboard: <DashboardIcon />,
  group: <GroupIcon />,
  history: <HistoryIcon />,
  casino: <CasinoIcon />,
  trending_up: <TrendingUpIcon />,
  sports: <SportsIcon />,
  swap_horiz: <SwapHorizIcon />,
  assessment: <AssessmentIcon />,
  trophy: <TrophyIcon />,
  school: <SchoolIcon />,
  bolt: <Bolt />,
  psychology: <PsychologyIcon />
};

interface MainDashboardProps {}

const MainDashboard: React.FC<MainDashboardProps> = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [teams, setTeams] = useState<DookieTeam[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useMediaQuery(darkTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const teamsData = await sleeperAPI.getTeams();
      setTeams(teamsData);

      // Get league information for accurate season/week data
      const leagueInfo = await sleeperAPI.getLeague();
      
      // Generate dashboard stats with real data
      const stats: DashboardStats = {
        total_teams: teamsData.length,
        current_week: leagueInfo.status === 'pre_draft' ? 0 : 1, // Pre-draft = week 0
        season_status: (leagueInfo.status || 'pre_draft') as any,
        lottery_eligible_teams: 6,
        total_trades: 0, // Would be calculated from trade data when season starts
        most_active_trader: teamsData[0], // Will be calculated when season starts
        highest_scoring_team: teamsData.reduce((highest, team) => 
          (team.points_for || 0) > (highest.points_for || 0) ? team : highest
        ),
        longest_win_streak: {
          team: teamsData[0],
          streak: 0 // No streaks in pre-draft
        }
      };

      setDashboardStats(stats);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ 
              bgcolor: 'primary.main',
              width: 40,
              height: 40,
              fontSize: '1.2rem'
            }}
          >
            🏈
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              Dookie Dynasty
            </Typography>
            <Typography variant="caption" color="text.secondary">
              2026 Season
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      
      {dashboardStats && (
        <Box sx={{ p: 2 }}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                League Status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`Week ${dashboardStats.current_week}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`${dashboardStats.total_teams} Teams`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                  },
                },
              }}
            >
              <ListItemIcon>
                {iconMap[item.icon]}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                secondary={item.description}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: { opacity: 0.7 }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Created by Grace 🐐
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Commissioner: CookieDonker
        </Typography>
      </Box>
    </Box>
  );

  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            bgcolor: 'background.default'
          }}
        >
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Error Loading Dashboard
            </Typography>
            <Typography color="text.secondary" paragraph>
              {error}
            </Typography>
            <IconButton onClick={loadInitialData} color="primary">
              Retry
            </IconButton>
          </Card>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
          elevation={0}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </Typography>

            {loading && (
              <Box sx={{ width: 100 }}>
                <LinearProgress />
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="navigation"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                bgcolor: 'background.paper'
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                bgcolor: 'background.paper'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: '64px',
            minHeight: 'calc(100vh - 64px)',
            bgcolor: 'background.default'
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <OverviewDashboard
                  teams={teams}
                  stats={dashboardStats}
                  loading={loading}
                />
              }
            />
            <Route
              path="/teams"
              element={<TeamsExplorer teams={teams} loading={loading} />}
            />
            <Route
              path="/history"
              element={<LeagueHistory />}
            />
            <Route
              path="/lottery"
              element={<DraftLottery teams={teams} />}
            />
            <Route
              path="/tankathon"
              element={<TankathonView teams={teams} />}
            />
            <Route
              path="/players"
              element={<PlayersAnalysis />}
            />
            <Route
              path="/trading"
              element={<EnhancedTradingHub />}
            />
            <Route
              path="/historical-trades"
              element={<HistoricalTradeTracker teams={teams} loading={loading} />}
            />
            <Route
              path="/engagement"
              element={<EngagementDashboard teams={teams} loading={loading} />}
            />
            <Route
              path="/team-analytics"
              element={<TeamAnalytics teams={teams} loading={loading} />}
            />
            <Route
              path="/league-records"
              element={<LeagueRecords teams={teams} loading={loading} />}
            />
            <Route
              path="/impact-plays"
              element={<ImpactfulPerformances teams={teams} loading={loading} />}
            />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// Wrapper component to provide Router context
const MainDashboardWrapper: React.FC = () => {
  return (
    <Router>
      <MainDashboard />
    </Router>
  );
};

export default MainDashboardWrapper;