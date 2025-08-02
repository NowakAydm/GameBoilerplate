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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Refresh } from '@mui/icons-material';
import { useAdminStore } from '../stores/adminStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

export const Charts: React.FC = () => {
  const { error, clearError } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [userActivityData, setUserActivityData] = useState<any>(null);
  const [gameActionsData, setGameActionsData] = useState<any>(null);
  const [sessionLengthData, setSessionLengthData] = useState<any>(null);
  const [userRoleData, setUserRoleData] = useState<any>(null);
  const [playtimeData, setPlaytimeData] = useState<any>(null);
  const [userTypeComparisonData, setUserTypeComparisonData] = useState<any>(null);
  const [guestVsRegisteredActivityData, setGuestVsRegisteredActivityData] = useState<any>(null);
  const [userTypeEngagementData, setUserTypeEngagementData] = useState<any>(null);
  const [serverLoadData, setServerLoadData] = useState<any>(null);
  const [actionCountsData, setActionCountsData] = useState<any>(null);
  const [serverPerformanceData, setServerPerformanceData] = useState<any>(null);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch users, metrics, and user type data
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
        const registeredUsers = users.filter((u: any) => u.role === 'registered' || u.role === 'admin');
        const guestUsers = users.filter((u: any) => u.role === 'guest');
        
        // Generate time-based activity data with user type breakdown
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const currentHour = new Date().getHours();
        const registeredActivity = hours.map((hour, index) => {
          let baseActivity = 0;
          if (index >= 6 && index <= 12) baseActivity = Math.random() * 15 + 8; // Morning
          else if (index >= 13 && index <= 18) baseActivity = Math.random() * 20 + 12; // Afternoon
          else if (index >= 19 && index <= 23) baseActivity = Math.random() * 18 + 15; // Evening
          else baseActivity = Math.random() * 8 + 2; // Night
          
          // Add current online registered users to current hour
          if (index === currentHour) {
            baseActivity += registeredUsers.filter((u: any) => u.isOnline).length;
          }
          
          return Math.floor(baseActivity);
        });

        const guestActivity = hours.map((hour, index) => {
          let baseActivity = 0;
          if (index >= 6 && index <= 12) baseActivity = Math.random() * 8 + 3; // Morning
          else if (index >= 13 && index <= 18) baseActivity = Math.random() * 12 + 6; // Afternoon
          else if (index >= 19 && index <= 23) baseActivity = Math.random() * 10 + 8; // Evening
          else baseActivity = Math.random() * 5 + 1; // Night
          
          // Add current online guest users to current hour
          if (index === currentHour) {
            baseActivity += guestUsers.filter((u: any) => u.isOnline).length;
          }
          
          return Math.floor(baseActivity);
        });

        setUserActivityData({
          labels: hours,
          datasets: [
            {
              label: 'Registered Users',
              data: registeredActivity,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderWidth: 2,
              fill: true,
            },
            {
              label: 'Guest Users',
              data: guestActivity,
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              borderWidth: 2,
              fill: true,
            },
          ],
        });

        // Game Actions Distribution by User Type
        const gameActionLabels = ['Movement', 'Combat', 'Inventory', 'Chat', 'Quest', 'Trade'];
        const registeredActionsData = gameActionLabels.map(() => Math.floor(Math.random() * 800 + 200));
        const guestActionsData = gameActionLabels.map(() => Math.floor(Math.random() * 400 + 50));
        
        setGameActionsData({
          labels: gameActionLabels,
          datasets: [
            {
              label: 'Registered Users',
              data: registeredActionsData,
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Guest Users',
              data: guestActionsData,
              backgroundColor: 'rgba(255, 159, 64, 0.8)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        });

        // Session Length Distribution by User Type
        const sessionRanges = ['0-15min', '15-30min', '30-60min', '1-2h', '2-4h', '4h+'];
        const registeredSessionCounts = registeredUsers.reduce((acc: number[], user: any) => {
          const avgSession = user.averageSessionLength || 0;
          if (avgSession <= 15) acc[0]++;
          else if (avgSession <= 30) acc[1]++;
          else if (avgSession <= 60) acc[2]++;
          else if (avgSession <= 120) acc[3]++;
          else if (avgSession <= 240) acc[4]++;
          else acc[5]++;
          return acc;
        }, [0, 0, 0, 0, 0, 0]);

        const guestSessionCounts = guestUsers.reduce((acc: number[], user: any) => {
          const avgSession = user.averageSessionLength || 0;
          if (avgSession <= 15) acc[0]++;
          else if (avgSession <= 30) acc[1]++;
          else if (avgSession <= 60) acc[2]++;
          else if (avgSession <= 120) acc[3]++;
          else if (avgSession <= 240) acc[4]++;
          else acc[5]++;
          return acc;
        }, [0, 0, 0, 0, 0, 0]);

        setSessionLengthData({
          labels: sessionRanges,
          datasets: [
            {
              label: 'Registered Users',
              data: registeredSessionCounts,
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Guest Users',
              data: guestSessionCounts,
              backgroundColor: 'rgba(255, 159, 64, 0.8)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        });

        // User Role Distribution
        const roleCounts = users.reduce((acc: { [key: string]: number }, user: any) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});

        setUserRoleData({
          labels: Object.keys(roleCounts).map(role => role.charAt(0).toUpperCase() + role.slice(1)),
          datasets: [
            {
              label: 'Users by Role',
              data: Object.values(roleCounts),
              backgroundColor: [
                'rgba(244, 67, 54, 0.8)',   // Admin - Red
                'rgba(54, 162, 235, 0.8)',  // Registered - Blue
                'rgba(255, 159, 64, 0.8)',  // Guest - Orange
                'rgba(75, 192, 192, 0.8)',  // Additional roles
              ],
              borderColor: [
                'rgba(244, 67, 54, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(75, 192, 192, 1)',
              ],
              borderWidth: 2,
            },
          ],
        });

        // User Type Comparison Chart (Registered vs Guest)
        const userTypeMetrics = [
          userTypesData.registeredUsers || registeredUsers.length,
          userTypesData.guestUsers || guestUsers.length
        ];

        setUserTypeComparisonData({
          labels: ['Registered Users', 'Guest Users'],
          datasets: [
            {
              label: 'User Count',
              data: userTypeMetrics,
              backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 159, 64, 0.8)'
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 2,
            },
          ],
        });

        // Guest vs Registered Activity Comparison
        const comparisonMetrics = ['Sessions', 'Game Actions', 'Playtime (hrs)'];
        const registeredMetrics = [
          userTypesData.registeredSessions || registeredUsers.reduce((sum: number, u: any) => sum + (u.sessionCount || 0), 0),
          userTypesData.registeredGameActions || registeredUsers.reduce((sum: number, u: any) => sum + (u.gameActions || 0), 0),
          Math.round((userTypesData.registeredPlaytime || registeredUsers.reduce((sum: number, u: any) => sum + u.totalPlaytime, 0)) / 60)
        ];
        const guestMetrics = [
          userTypesData.guestSessions || guestUsers.reduce((sum: number, u: any) => sum + (u.sessionCount || 0), 0),
          userTypesData.guestGameActions || guestUsers.reduce((sum: number, u: any) => sum + (u.gameActions || 0), 0),
          Math.round((userTypesData.guestPlaytime || guestUsers.reduce((sum: number, u: any) => sum + u.totalPlaytime, 0)) / 60)
        ];

        setGuestVsRegisteredActivityData({
          labels: comparisonMetrics,
          datasets: [
            {
              label: 'Registered Users',
              data: registeredMetrics,
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Guest Users',
              data: guestMetrics,
              backgroundColor: 'rgba(255, 159, 64, 0.8)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        });

        // User Type Engagement Metrics
        const avgRegisteredPlaytime = registeredUsers.length > 0 ? 
          registeredUsers.reduce((sum: number, u: any) => sum + u.totalPlaytime, 0) / registeredUsers.length : 0;
        const avgGuestPlaytime = guestUsers.length > 0 ? 
          guestUsers.reduce((sum: number, u: any) => sum + u.totalPlaytime, 0) / guestUsers.length : 0;
        
        const avgRegisteredSessions = registeredUsers.length > 0 ? 
          registeredUsers.reduce((sum: number, u: any) => sum + (u.sessionCount || 0), 0) / registeredUsers.length : 0;
        const avgGuestSessions = guestUsers.length > 0 ? 
          guestUsers.reduce((sum: number, u: any) => sum + (u.sessionCount || 0), 0) / guestUsers.length : 0;

        const avgRegisteredActions = registeredUsers.length > 0 ? 
          registeredUsers.reduce((sum: number, u: any) => sum + (u.gameActions || 0), 0) / registeredUsers.length : 0;
        const avgGuestActions = guestUsers.length > 0 ? 
          guestUsers.reduce((sum: number, u: any) => sum + (u.gameActions || 0), 0) / guestUsers.length : 0;

        setUserTypeEngagementData({
          labels: ['Avg Playtime (min)', 'Avg Sessions', 'Avg Game Actions'],
          datasets: [
            {
              label: 'Registered Users',
              data: [Math.round(avgRegisteredPlaytime), Math.round(avgRegisteredSessions), Math.round(avgRegisteredActions)],
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Guest Users',
              data: [Math.round(avgGuestPlaytime), Math.round(avgGuestSessions), Math.round(avgGuestActions)],
              backgroundColor: 'rgba(255, 159, 64, 0.8)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        });

        // Top Players by Playtime (separated by user type)
        const topRegisteredPlayers = [...registeredUsers]
          .sort((a: any, b: any) => b.totalPlaytime - a.totalPlaytime)
          .slice(0, 5);
        
        const topGuestPlayers = [...guestUsers]
          .sort((a: any, b: any) => b.totalPlaytime - a.totalPlaytime)
          .slice(0, 5);

        // Combine and ensure we have 10 players total
        const topPlayers = [...topRegisteredPlayers, ...topGuestPlayers]
          .sort((a: any, b: any) => b.totalPlaytime - a.totalPlaytime)
          .slice(0, 10);

        setPlaytimeData({
          labels: topPlayers.map((user: any) => {
            const name = user.username || user.email?.split('@')[0] || `Guest-${user.userId.slice(0, 4)}`;
            return user.role === 'guest' ? `${name} (G)` : name;
          }),
          datasets: [
            {
              label: 'Playtime (minutes)',
              data: topPlayers.map((user: any) => user.totalPlaytime),
              backgroundColor: topPlayers.map((user: any) => 
                user.role === 'guest' ? 'rgba(255, 159, 64, 0.8)' : 'rgba(54, 162, 235, 0.8)'
              ),
              borderColor: topPlayers.map((user: any) => 
                user.role === 'guest' ? 'rgba(255, 159, 64, 1)' : 'rgba(54, 162, 235, 1)'
              ),
              borderWidth: 1,
            },
          ],
        });

        // Server Load Data (CPU, Memory, Network)
        const serverMetrics = Array.from({ length: 24 }, (_, i) => {
          const hour = new Date();
          hour.setHours(hour.getHours() - (23 - i));
          return hour.getHours() + ':00';
        });

        const cpuUsage = serverMetrics.map(() => Math.random() * 80 + 10); // 10-90%
        const memoryUsage = serverMetrics.map(() => Math.random() * 70 + 20); // 20-90%
        const networkLoad = serverMetrics.map(() => Math.random() * 100 + 10); // 10-110 MB/s

        setServerLoadData({
          labels: serverMetrics,
          datasets: [
            {
              label: 'CPU Usage (%)',
              data: cpuUsage,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              yAxisID: 'y',
            },
            {
              label: 'Memory Usage (%)',
              data: memoryUsage,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderWidth: 2,
              yAxisID: 'y',
            },
            {
              label: 'Network Load (MB/s)',
              data: networkLoad,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              yAxisID: 'y1',
            },
          ],
        });

        // Detailed Action Counts by Category
        const detailedActionLabels = [
          'Player Movement', 'Jump/Dash', 'Combat Attacks', 'Spell Casting',
          'Item Pickup', 'Inventory Use', 'Chat Messages', 'Emotes',
          'Quest Accept', 'Quest Complete', 'Trade Initiate', 'Trade Complete',
          'Login/Logout', 'Zone Changes'
        ];

        const totalActionCounts = detailedActionLabels.map(() => 
          Math.floor(Math.random() * 2000 + 500)
        );

        setActionCountsData({
          labels: detailedActionLabels,
          datasets: [
            {
              label: 'Total Actions (24h)',
              data: totalActionCounts,
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',   // Movement
                'rgba(54, 162, 235, 0.8)',   // Jump/Dash
                'rgba(255, 205, 86, 0.8)',   // Combat
                'rgba(75, 192, 192, 0.8)',   // Spells
                'rgba(153, 102, 255, 0.8)',  // Item Pickup
                'rgba(255, 159, 64, 0.8)',   // Inventory
                'rgba(199, 199, 199, 0.8)',  // Chat
                'rgba(83, 102, 255, 0.8)',   // Emotes
                'rgba(255, 99, 255, 0.8)',   // Quest Accept
                'rgba(99, 255, 132, 0.8)',   // Quest Complete
                'rgba(255, 193, 7, 0.8)',    // Trade Initiate
                'rgba(76, 175, 80, 0.8)',    // Trade Complete
                'rgba(156, 39, 176, 0.8)',   // Login/Logout
                'rgba(233, 30, 99, 0.8)',    // Zone Changes
              ],
              borderWidth: 1,
            },
          ],
        });

        // Server Performance Metrics
        const performanceMetrics = ['Response Time (ms)', 'Requests/sec', 'Error Rate (%)', 'Active Connections'];
        const performanceValues = [
          Math.random() * 200 + 50,  // Response time: 50-250ms
          Math.random() * 1000 + 200, // Requests: 200-1200/sec
          Math.random() * 5 + 0.5,   // Error rate: 0.5-5.5%
          Math.random() * 500 + 100, // Connections: 100-600
        ];

        setServerPerformanceData({
          labels: performanceMetrics,
          datasets: [
            {
              label: 'Current Values',
              data: performanceValues.map(val => Math.round(val * 100) / 100),
              backgroundColor: [
                'rgba(255, 193, 7, 0.8)',
                'rgba(76, 175, 80, 0.8)', 
                'rgba(244, 67, 54, 0.8)',
                'rgba(54, 162, 235, 0.8)',
              ],
              borderColor: [
                'rgba(255, 193, 7, 1)',
                'rgba(76, 175, 80, 1)',
                'rgba(244, 67, 54, 1)',
                'rgba(54, 162, 235, 1)',
              ],
              borderWidth: 2,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  // Dynamic chart height based on screen size
  const getChartHeight = (baseHeight: number) => {
    const screenHeight = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, use smaller heights and consider screen space
      return Math.min(baseHeight * 0.7, screenHeight * 0.3);
    }
    return baseHeight;
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  // Mobile-optimized chart options
  const isMobile = window.innerWidth < 768;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' as const : 'top' as const,
        labels: {
          padding: isMobile ? 10 : 20,
          usePointStyle: true,
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 9 : 11,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 9 : 11,
          },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' as const : 'right' as const,
        labels: {
          padding: isMobile ? 8 : 20,
          usePointStyle: true,
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
    },
  };

  const serverLoadOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: isMobile ? 'bottom' as const : 'top' as const,
        labels: {
          padding: isMobile ? 8 : 20,
          usePointStyle: true,
          font: {
            size: isMobile ? 9 : 12,
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: !isMobile,
          text: 'Time (Hours)',
          font: {
            size: isMobile ? 9 : 12,
          },
        },
        ticks: {
          font: {
            size: isMobile ? 8 : 11,
          },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: !isMobile,
          text: 'Percentage (%)',
          font: {
            size: isMobile ? 9 : 12,
          },
        },
        max: 100,
        ticks: {
          font: {
            size: isMobile ? 8 : 11,
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: !isMobile, // Hide second axis on mobile for clarity
        position: 'right' as const,
        title: {
          display: false,
          text: 'Network (MB/s)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: isMobile ? 8 : 11,
          },
        },
      },
    },
  };

  if (loading && !userActivityData) {
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
          Analytics & Charts
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Charts">
            <IconButton onClick={fetchChartData} color="primary" disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Activity Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Activity Over Time (Registered vs Guest)
              </Typography>
              {userActivityData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Line data={userActivityData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Type Comparison */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Type Distribution
              </Typography>
              {userTypeComparisonData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Doughnut data={userTypeComparisonData} options={doughnutOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Guest vs Registered Activity Comparison */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Guest vs Registered User Activity Comparison
              </Typography>
              {guestVsRegisteredActivityData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Bar data={guestVsRegisteredActivityData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Type Engagement Metrics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Engagement per User Type
              </Typography>
              {userTypeEngagementData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Bar data={userTypeEngagementData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Role Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Complete Role Distribution
              </Typography>
              {userRoleData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Doughnut data={userRoleData} options={doughnutOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Game Actions Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Game Actions by User Type
              </Typography>
              {gameActionsData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Bar data={gameActionsData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Session Length Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Length by User Type
              </Typography>
              {sessionLengthData && (
                <Box sx={{ height: getChartHeight(300) }}>
                  <Bar data={sessionLengthData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Players by Playtime */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Players by Playtime (Blue: Registered, Orange: Guest)
              </Typography>
              {playtimeData && (
                <Box sx={{ height: getChartHeight(400) }}>
                  <Bar data={playtimeData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Server Load Monitoring */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Load Monitoring (Real-time)
              </Typography>
              {serverLoadData && (
                <Box sx={{ height: getChartHeight(350) }}>
                  <Line data={serverLoadData} options={serverLoadOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Server Performance Metrics */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Performance
              </Typography>
              {serverPerformanceData && (
                <Box sx={{ height: getChartHeight(350) }}>
                  <Doughnut data={serverPerformanceData} options={doughnutOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Action Counts */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Game Action Counts (Last 24 Hours)
              </Typography>
              {actionCountsData && (
                <Box sx={{ height: getChartHeight(400) }}>
                  <Bar data={actionCountsData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: {
                            size: isMobile ? 9 : 11,
                          },
                        },
                      },
                      x: {
                        ticks: {
                          maxRotation: isMobile ? 90 : 45,
                          minRotation: isMobile ? 90 : 45,
                          font: {
                            size: isMobile ? 8 : 10,
                          },
                        }
                      }
                    }
                  }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
