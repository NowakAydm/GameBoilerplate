import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Games,
  Timeline,
  TrendingUp,
  Refresh,
  Person,
  SupervisorAccount,
  PersonOutline,
  AccessTime,
  BarChart
} from '@mui/icons-material';
import { useAdminStore } from '../stores/adminStore';

interface DashboardMetrics {
  totalUsers: number;
  onlineUsers: number;
  totalSessions: number;
  totalPlaytime: number;
  averageSessionLength: number;
  totalGameActions: number;
  recentSessions: any[];
  topUsers: any[];
  hourlyActivity: { hour: number; users: number; actions: number }[];
  registeredUsers: number;
  guestUsers: number;
  registeredSessions: number;
  guestSessions: number;
  registeredGameActions: number;
  guestGameActions: number;
  registeredPlaytime: number;
  guestPlaytime: number;
}

export const Dashboard: React.FC = () => {
  const { error, clearError } = useAdminStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch users, metrics, and user types data
      const [usersResponse, metricsResponse, userTypesResponse] = await Promise.all([
        fetch('http://localhost:3000/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/admin/metrics/charts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/admin/metrics/user-types', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (usersResponse.ok && metricsResponse.ok && userTypesResponse.ok) {
        const usersData = await usersResponse.json();
        const metricsData = await metricsResponse.json();
        const userTypesData = await userTypesResponse.json();
        
        const users = usersData.users || [];
        const onlineUsers = users.filter((u: any) => u.isOnline);
        const totalPlaytime = users.reduce((sum: number, user: any) => sum + user.totalPlaytime, 0);
        const totalSessions = users.reduce((sum: number, user: any) => sum + user.sessionCount, 0);
        const totalGameActions = users.reduce((sum: number, user: any) => sum + (user.gameActions || 0), 0);
        const averageSessionLength = totalSessions > 0 ? 
          users.reduce((sum: number, user: any) => sum + user.averageSessionLength, 0) / users.length : 0;

        // Get top users by playtime
        const topUsers = [...users]
          .sort((a: any, b: any) => b.totalPlaytime - a.totalPlaytime)
          .slice(0, 5);

        // Get recent sessions (online users)
        const recentSessions = onlineUsers
          .sort((a: any, b: any) => b.currentSessionLength - a.currentSessionLength)
          .slice(0, 10);

        // Mock hourly activity data (in a real app, this would come from the backend)
        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          users: Math.floor(Math.random() * onlineUsers.length + 1),
          actions: Math.floor(Math.random() * 100 + 10)
        }));

        setMetrics({
          totalUsers: users.length,
          onlineUsers: onlineUsers.length,
          totalSessions,
          totalPlaytime,
          averageSessionLength,
          totalGameActions,
          recentSessions,
          topUsers,
          hourlyActivity,
          registeredUsers: userTypesData.registeredUsers || 0,
          guestUsers: userTypesData.guestUsers || 0,
          registeredSessions: userTypesData.registeredSessions || 0,
          guestSessions: userTypesData.guestSessions || 0,
          registeredGameActions: userTypesData.registeredGameActions || 0,
          guestGameActions: userTypesData.guestGameActions || 0,
          registeredPlaytime: userTypesData.registeredPlaytime || 0,
          guestPlaytime: userTypesData.guestPlaytime || 0
        });
        
        // Debug logging for guest connection troubleshooting
        console.log('📊 Dashboard metrics updated:', {
          totalUsers: users.length,
          onlineUsers: onlineUsers.length,
          guestUsers: userTypesData.guestUsers || 0,
          guestSessions: userTypesData.guestSessions || 0,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // Troubleshooting: Log specific error details for debugging guest connection issues
      if (error instanceof Error) {
        console.error('📊 Dashboard fetch error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
    // Reduced interval from 30s to 5s for more real-time guest connection updates
    const interval = setInterval(fetchDashboardMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <SupervisorAccount color="error" />;
      case 'registered': return <Person color="primary" />;
      case 'guest': return <PersonOutline color="action" />;
      default: return <PersonOutline />;
    }
  };

  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchDashboardMetrics} color="primary" disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {loading && (
        <LinearProgress sx={{ mb: 3 }} />
      )}

      {/* Troubleshooting Alert for Guest Connection Issues */}
      {metrics && metrics.guestUsers === 0 && metrics.onlineUsers > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Guest Connection Debug:</strong> No guest users detected, but {metrics.onlineUsers} users are online. 
          This may indicate:
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>All online users are registered (normal)</li>
            <li>WebSocket connection tracking is not working properly</li>
            <li>Guest authentication tokens are not being generated correctly</li>
          </ul>
          Check browser console and server logs for connection details.
        </Alert>
      )}
      
      {metrics && metrics.onlineUsers === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>No Active Connections:</strong> No users (guest or registered) are currently connected. 
          Start a client session to see real-time connection data appear.
        </Alert>
      )}
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registered players
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Online Now
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {metrics?.onlineUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active sessions
                  </Typography>
                </Box>
                <PersonAdd color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Playtime
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(metrics?.totalPlaytime || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time combined
                  </Typography>
                </Box>
                <AccessTime color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Game Actions
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.totalGameActions?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total interactions
                  </Typography>
                </Box>
                <Games color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Average Session
              </Typography>
              <Typography variant="h5">
                {formatTime(metrics?.averageSessionLength || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Per user session length
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Total Sessions
              </Typography>
              <Typography variant="h5">
                {metrics?.totalSessions?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Engagement Rate
              </Typography>
              <Typography variant="h5">
                {metrics?.totalUsers ? Math.round((metrics.onlineUsers / metrics.totalUsers) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Online vs total users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Type Analytics */}
      <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 2, fontWeight: 'bold' }}>
        User Type Analytics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Registered Users
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {metrics?.registeredUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metrics?.totalUsers ? Math.round(((metrics.registeredUsers || 0) / metrics.totalUsers) * 100) : 0}% of total
                  </Typography>
                </Box>
                <Person color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Guest Users
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {metrics?.guestUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metrics?.totalUsers ? Math.round(((metrics.guestUsers || 0) / metrics.totalUsers) * 100) : 0}% of total
                  </Typography>
                </Box>
                <PersonOutline color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Registered Sessions
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {metrics?.registeredSessions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metrics?.totalSessions ? Math.round(((metrics.registeredSessions || 0) / metrics.totalSessions) * 100) : 0}% of sessions
                  </Typography>
                </Box>
                <Timeline color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Guest Sessions
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {metrics?.guestSessions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metrics?.totalSessions ? Math.round(((metrics.guestSessions || 0) / metrics.totalSessions) * 100) : 0}% of sessions
                  </Typography>
                </Box>
                <AccessTime color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Game Activity by User Type */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Registered Game Actions
              </Typography>
              <Typography variant="h5" color="primary.main">
                {metrics?.registeredGameActions?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metrics?.totalGameActions ? Math.round(((metrics.registeredGameActions || 0) / metrics.totalGameActions) * 100) : 0}% of actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Guest Game Actions
              </Typography>
              <Typography variant="h5" color="secondary.main">
                {metrics?.guestGameActions?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metrics?.totalGameActions ? Math.round(((metrics.guestGameActions || 0) / metrics.totalGameActions) * 100) : 0}% of actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="h6">
                Avg Actions per User
              </Typography>
              <Typography variant="h5">
                {metrics?.registeredUsers && metrics?.registeredGameActions ? 
                  Math.round(metrics.registeredGameActions / metrics.registeredUsers) : 0} / 
                {metrics?.guestUsers && metrics?.guestGameActions ? 
                  Math.round(metrics.guestGameActions / metrics.guestUsers) : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered / Guest users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity and Top Users */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Sessions
              </Typography>
              <List>
                {metrics?.recentSessions.slice(0, 8).map((session, index) => (
                  <ListItem key={session.userId} divider={index < 7}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {(session.username || session.email || session.userId).charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={session.username || 'Guest'}
                      secondary={`${formatTime(session.currentSessionLength)} • ${session.gameActions || 0} actions`}
                    />
                    <Chip 
                      label={session.role} 
                      size="small" 
                      color={session.role === 'admin' ? 'error' : session.role === 'registered' ? 'primary' : 'default'}
                    />
                  </ListItem>
                ))}
                {(!metrics?.recentSessions || metrics.recentSessions.length === 0) && (
                  <ListItem>
                    <ListItemText 
                      primary="No active sessions"
                      secondary="No users are currently online"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Players by Playtime
              </Typography>
              <List>
                {metrics?.topUsers.map((user, index) => (
                  <ListItem key={user.userId} divider={index < 4}>
                    <ListItemAvatar>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small"
                          color={index < 3 ? 'primary' : 'default'}
                        />
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {(user.username || user.email || user.userId).charAt(0).toUpperCase()}
                        </Avatar>
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username || 'Guest'}
                      secondary={`${formatTime(user.totalPlaytime)} • ${user.sessionCount} sessions`}
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                      {user.isOnline && (
                        <Chip label="Online" color="success" size="small" />
                      )}
                      {getRoleIcon(user.role)}
                    </Box>
                  </ListItem>
                ))}
                {(!metrics?.topUsers || metrics.topUsers.length === 0) && (
                  <ListItem>
                    <ListItemText 
                      primary="No player data"
                      secondary="No users have played yet"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
