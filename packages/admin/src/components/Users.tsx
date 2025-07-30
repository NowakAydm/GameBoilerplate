import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Refresh,
  PersonRemove,
  Visibility,
  Person,
  SupervisorAccount,
  PersonOutline,
} from '@mui/icons-material';
import { useAdminStore } from '../stores/adminStore';

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
      id={`users-tabpanel-${index}`}
      aria-labelledby={`users-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Users: React.FC = () => {
  const { error, clearError } = useAdminStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:3001/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:3001/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDetail(data.user);
        setUserDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
    }
  };

  const kickUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`http://localhost:3001/admin/kick/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to kick user:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatLastSeen = (date: string | Date | undefined) => {
    if (!date) return 'Never';
    const lastSeen = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <SupervisorAccount color="error" />;
      case 'registered': return <Person color="primary" />;
      case 'guest': return <PersonOutline color="action" />;
      default: return <PersonOutline />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'registered': return 'primary';
      case 'guest': return 'default';
      default: return 'default';
    }
  };

  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);
  const registeredUsers = users.filter(user => user.role === 'registered' || user.role === 'admin');
  const guestUsers = users.filter(user => user.role === 'guest');
  const topPlayers = [...users].sort((a, b) => b.totalPlaytime - a.totalPlaytime).slice(0, 10);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Tooltip title="Refresh Users">
          <IconButton onClick={fetchUsers} color="primary" disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* User Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Users
                  </Typography>
                  <Typography variant="h4">{users.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {registeredUsers.length} registered • {guestUsers.length} guests
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
                    Registered Users
                  </Typography>
                  <Typography variant="h4" color="primary.main">{registeredUsers.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {users.length > 0 ? Math.round((registeredUsers.length / users.length) * 100) : 0}% of total
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
                  <Typography variant="h4" color="secondary.main">{guestUsers.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {users.length > 0 ? Math.round((guestUsers.length / users.length) * 100) : 0}% of total
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
                    Online Now
                  </Typography>
                  <Typography variant="h4" color="success.main">{onlineUsers.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {onlineUsers.filter(u => u.role === 'registered' || u.role === 'admin').length} reg • {onlineUsers.filter(u => u.role === 'guest').length} guests
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional User Type Analytics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Playtime
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(users.reduce((sum, user) => sum + user.totalPlaytime, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reg: {formatTime(registeredUsers.reduce((sum, user) => sum + user.totalPlaytime, 0))} • 
                    Guest: {formatTime(guestUsers.reduce((sum, user) => sum + user.totalPlaytime, 0))}
                  </Typography>
                </Box>
                <Box sx={{ color: 'info.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Box>
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
                    Total Sessions
                  </Typography>
                  <Typography variant="h4">
                    {users.reduce((sum, user) => sum + (user.sessionCount || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reg: {registeredUsers.reduce((sum, user) => sum + (user.sessionCount || 0), 0)} • 
                    Guest: {guestUsers.reduce((sum, user) => sum + (user.sessionCount || 0), 0)}
                  </Typography>
                </Box>
                <Box sx={{ color: 'info.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Box>
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
                    {users.reduce((sum, user) => sum + (user.gameActions || 0), 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reg: {registeredUsers.reduce((sum, user) => sum + (user.gameActions || 0), 0)} • 
                    Guest: {guestUsers.reduce((sum, user) => sum + (user.gameActions || 0), 0)}
                  </Typography>
                </Box>
                <Box sx={{ color: 'warning.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Box>
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
                    Avg Session
                  </Typography>
                  <Typography variant="h4">
                    {formatTime(users.reduce((sum, user) => sum + user.averageSessionLength, 0) / (users.length || 1))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reg: {formatTime(registeredUsers.reduce((sum, user) => sum + user.averageSessionLength, 0) / (registeredUsers.length || 1))} • 
                    Guest: {formatTime(guestUsers.reduce((sum, user) => sum + user.averageSessionLength, 0) / (guestUsers.length || 1))}
                  </Typography>
                </Box>
                <Box sx={{ color: 'warning.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different user views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
          <Tab label={`All Users (${users.length})`} />
          <Tab label={`Registered (${registeredUsers.length})`} />
          <Tab label={`Guests (${guestUsers.length})`} />
          <Tab label={`Online (${onlineUsers.length})`} />
          <Tab label={`Offline (${offlineUsers.length})`} />
          <Tab label="Top Players" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <UserTable users={users} onViewUser={fetchUserDetail} onKickUser={kickUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserTable users={registeredUsers} onViewUser={fetchUserDetail} onKickUser={kickUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <UserTable users={guestUsers} onViewUser={fetchUserDetail} onKickUser={kickUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <UserTable users={onlineUsers} onViewUser={fetchUserDetail} onKickUser={kickUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <UserTable users={offlineUsers} onViewUser={fetchUserDetail} onKickUser={kickUser} />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <TopPlayersTable users={topPlayers} onViewUser={fetchUserDetail} />
        </TabPanel>
      </Paper>

      {/* User Detail Modal */}
      <Dialog open={userDetailOpen} onClose={() => setUserDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          User Details: {userDetail?.username || userDetail?.email || userDetail?.id}
        </DialogTitle>
        <DialogContent>
          {userDetail && <UserDetailView user={userDetail} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const UserTable: React.FC<{
  users: any[];
  onViewUser: (userId: string) => void;
  onKickUser: (userId: string) => void;
}> = ({ users, onViewUser, onKickUser }) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'registered': return 'primary';
      case 'guest': return 'default';
      default: return 'default';
    }
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Current Session</TableCell>
            <TableCell>Total Playtime</TableCell>
            <TableCell>Sessions</TableCell>
            <TableCell>Game Actions</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary">
                  No users found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.userId} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: user.role === 'admin' ? 'error.main' : 
                               user.role === 'registered' ? 'primary.main' : 'grey.400'
                    }}>
                      {user.role === 'admin' ? <SupervisorAccount fontSize="small" /> :
                       user.role === 'registered' ? <Person fontSize="small" /> :
                       <PersonOutline fontSize="small" />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.username || `Guest ${user.userId.slice(0, 4)}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email || `ID: ${user.userId.slice(0, 8)}...`}
                      </Typography>
                      {user.role === 'guest' && (
                        <Typography variant="caption" color="warning.main" display="block">
                          ⚠️ Guest User
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                      color={getRoleColor(user.role) as any}
                      size="small"
                      icon={user.role === 'admin' ? <SupervisorAccount /> :
                            user.role === 'registered' ? <Person /> :
                            <PersonOutline />}
                    />
                    {user.role === 'guest' && (
                      <Typography variant="caption" color="text.secondary">
                        (Anonymous)
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isOnline ? 'Online' : 'Offline'}
                    color={user.isOnline ? 'success' : 'default'}
                    size="small"
                    variant={user.isOnline ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  {user.isOnline ? formatTime(user.currentSessionLength) : '-'}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {formatTime(user.totalPlaytime)}
                    </Typography>
                    {user.role === 'guest' && user.totalPlaytime > 0 && (
                      <Typography variant="caption" color="info.main">
                        High engagement guest
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {user.sessionCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg: {user.sessionCount > 0 ? formatTime(user.totalPlaytime / user.sessionCount) : '0m'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {(user.gameActions || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.sessionCount > 0 ? Math.round((user.gameActions || 0) / user.sessionCount) : 0} per session
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => onViewUser(user.userId)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {user.isOnline && (
                    <Tooltip title="Kick User">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onKickUser(user.userId)}
                      >
                        <PersonRemove />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const TopPlayersTable: React.FC<{
  users: any[];
  onViewUser: (userId: string) => void;
}> = ({ users, onViewUser }) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const maxPlaytime = Math.max(...users.map(u => u.totalPlaytime), 1);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Player</TableCell>
            <TableCell>Total Playtime</TableCell>
            <TableCell>Sessions</TableCell>
            <TableCell>Avg Session</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.userId}>
              <TableCell>
                <Chip 
                  label={`#${index + 1}`} 
                  color={index < 3 ? 'primary' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {(user.username || user.email || user.userId).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {user.username || 'Guest'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email || user.userId.slice(0, 8) + '...'}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {formatTime(user.totalPlaytime)}
                </Typography>
              </TableCell>
              <TableCell>{user.sessionCount}</TableCell>
              <TableCell>{formatTime(user.averageSessionLength)}</TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <LinearProgress
                    variant="determinate"
                    value={(user.totalPlaytime / maxPlaytime) * 100}
                    sx={{ width: 100, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption">
                    {Math.round((user.totalPlaytime / maxPlaytime) * 100)}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View Details">
                  <IconButton 
                    size="small" 
                    onClick={() => onViewUser(user.userId)}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const UserDetailView: React.FC<{ user: any }> = ({ user }) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h6" gutterBottom>Account Information</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Username</Typography>
          <Typography variant="body1">{user.username || 'N/A'}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Email</Typography>
          <Typography variant="body1">{user.email || 'N/A'}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Role</Typography>
          <Chip label={user.role} size="small" />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Account Type</Typography>
          <Typography variant="body1">{user.isGuest ? 'Guest' : 'Registered'}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Created</Typography>
          <Typography variant="body1">
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
          </Typography>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h6" gutterBottom>Session Information</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Status</Typography>
          <Chip 
            label={user.isOnline ? 'Online' : 'Offline'} 
            color={user.isOnline ? 'success' : 'default'}
            size="small"
          />
        </Box>
        {user.currentSession && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Current Session Length</Typography>
              <Typography variant="body1">{formatTime(user.currentSession.sessionLength)}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Game Actions This Session</Typography>
              <Typography variant="body1">{user.currentSession.gameActions}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Game State Requests</Typography>
              <Typography variant="body1">{user.currentSession.gameStateRequests}</Typography>
            </Box>
          </>
        )}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Total Playtime</Typography>
          <Typography variant="body1">{formatTime(user.playtime.totalPlaytime)}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Total Sessions</Typography>
          <Typography variant="body1">{user.playtime.sessionCount}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Average Session Length</Typography>
          <Typography variant="body1">{formatTime(user.playtime.averageSessionLength)}</Typography>
        </Box>
      </Grid>

      {user.gameState && (
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom>Current Game State</Typography>
          <Box component="pre" sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {JSON.stringify(user.gameState, null, 2)}
          </Box>
        </Grid>
      )}
    </Grid>
  );
};
