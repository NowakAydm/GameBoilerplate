import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Container,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  Gamepad,
  Article,
  BarChart,
  ExitToApp,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../stores/adminStore';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Users', path: '/users', icon: <People /> },
  { text: 'Game States', path: '/game-states', icon: <Gamepad /> },
  { text: 'Logs', path: '/logs', icon: <Article /> },
  { text: 'Charts', path: '/charts', icon: <BarChart /> },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            GameBoilerplate Admin Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              Welcome, {user?.username || user?.email || 'Admin'}
            </Typography>
            <Button color="inherit" onClick={handleLogout} startIcon={<ExitToApp />}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Admin Panel
          </Typography>
        </Toolbar>
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleMenuClick(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
};
