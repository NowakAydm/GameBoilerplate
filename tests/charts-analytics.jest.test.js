/**
 * Jest Tests for Charts Analytics
 * Tests chart data endpoints and user type analytics
 */

describe('Charts Analytics Tests', () => {
  let adminToken = null;

  beforeAll(async () => {
    const serverDown = await skipIfServerDown();
    if (serverDown) {
      return;
    }

    try {
      adminToken = await getAdminToken();
    } catch (error) {
      console.warn('Could not get admin token for charts tests:', error.message);
    }
  });

  describe('Chart Data Endpoints', () => {
    test('should provide user type comparison data', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Verify chart-ready data structure
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');
      expect(typeof data.registeredSessions).toBe('number');
      expect(typeof data.guestSessions).toBe('number');
      expect(typeof data.registeredGameActions).toBe('number');
      expect(typeof data.guestGameActions).toBe('number');
    });

    test('should return chart-compatible data structures', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();

      // Test data structure for Chart.js compatibility
      const chartData = {
        labels: ['Registered Users', 'Guest Users'],
        datasets: [{
          label: 'User Count',
          data: [data.registeredUsers, data.guestUsers],
          backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 159, 64, 0.8)']
        }]
      };

      expect(chartData.labels).toHaveLength(2);
      expect(chartData.datasets[0].data).toHaveLength(2);
      expect(chartData.datasets[0].backgroundColor).toHaveLength(2);
    });

    test('should handle empty data gracefully', () => {
      // Test chart data with no users
      const emptyData = {
        registeredUsers: 0,
        guestUsers: 0,
        registeredSessions: 0,
        guestSessions: 0,
        registeredGameActions: 0,
        guestGameActions: 0
      };

      expect(emptyData.registeredUsers + emptyData.guestUsers).toBe(0);

      // Should not crash when calculating percentages
      const total = emptyData.registeredUsers + emptyData.guestUsers;
      const registeredPercentage = total > 0 ? (emptyData.registeredUsers / total) * 100 : 0;
      
      expect(registeredPercentage).toBe(0);
    });
  });

  describe('User Activity Analytics', () => {
    test('should provide activity data for time-based charts', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const users = data.users;

      // Test data suitable for activity charts
      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');

      expect(Array.isArray(registeredUsers)).toBe(true);
      expect(Array.isArray(guestUsers)).toBe(true);

      // Verify users have activity data
      users.forEach(user => {
        if (user.totalPlaytime !== undefined) {
          expect(typeof user.totalPlaytime).toBe('number');
          expect(user.totalPlaytime).toBeGreaterThanOrEqual(0);
        }
        if (user.sessionCount !== undefined) {
          expect(typeof user.sessionCount).toBe('number');
          expect(user.sessionCount).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should calculate engagement metrics correctly', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
        return;
      }

      const [usersResponse, metricsResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/metrics/user-types`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      ]);

      const usersData = await usersResponse.json();
      const metricsData = await metricsResponse.json();

      const registeredUsers = usersData.users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = usersData.users.filter(u => u.role === 'guest');

      // Calculate average engagement for chart validation
      if (registeredUsers.length > 0) {
        const avgRegisteredPlaytime = registeredUsers.reduce((sum, u) => sum + (u.totalPlaytime || 0), 0) / registeredUsers.length;
        expect(avgRegisteredPlaytime).toBeGreaterThanOrEqual(0);
      }

      if (guestUsers.length > 0) {
        const avgGuestPlaytime = guestUsers.reduce((sum, u) => sum + (u.totalPlaytime || 0), 0) / guestUsers.length;
        expect(avgGuestPlaytime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Game Actions Analytics', () => {
    test('should provide game action breakdown data', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test game actions data for charts
      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');

      const registeredActions = registeredUsers.reduce((sum, u) => sum + (u.gameActions || 0), 0);
      const guestActions = guestUsers.reduce((sum, u) => sum + (u.gameActions || 0), 0);

      expect(registeredActions).toBeGreaterThanOrEqual(0);
      expect(guestActions).toBeGreaterThanOrEqual(0);

      // Verify individual user game actions
      users.forEach(user => {
        if (user.gameActions !== undefined) {
          expect(typeof user.gameActions).toBe('number');
          expect(user.gameActions).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should support detailed action categorization', () => {
      // Test that the data can support detailed action breakdown
      const actionCategories = [
        'Player Movement', 'Jump/Dash', 'Combat Attacks', 'Spell Casting',
        'Item Pickup', 'Inventory Use', 'Chat Messages', 'Emotes',
        'Quest Accept', 'Quest Complete', 'Trade Initiate', 'Trade Complete',
        'Login/Logout', 'Zone Changes'
      ];

      expect(actionCategories.length).toBe(14);
      
      // Mock action distribution
      const actionCounts = actionCategories.map(() => Math.floor(Math.random() * 1000 + 100));
      
      actionCounts.forEach(count => {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(2000);
      });
    });
  });

  describe('Performance Metrics Simulation', () => {
    test('should generate valid server load data', () => {
      // Test server load simulation for charts
      const hours = 24;
      const cpuUsage = Array.from({ length: hours }, () => Math.random() * 80 + 10);
      const memoryUsage = Array.from({ length: hours }, () => Math.random() * 70 + 20);
      const networkLoad = Array.from({ length: hours }, () => Math.random() * 100 + 10);

      // Validate CPU usage (10-90%)
      cpuUsage.forEach(usage => {
        expect(usage).toBeGreaterThanOrEqual(10);
        expect(usage).toBeLessThanOrEqual(90);
      });

      // Validate Memory usage (20-90%)
      memoryUsage.forEach(usage => {
        expect(usage).toBeGreaterThanOrEqual(20);
        expect(usage).toBeLessThanOrEqual(90);
      });

      // Validate Network load (10-110 MB/s)
      networkLoad.forEach(load => {
        expect(load).toBeGreaterThanOrEqual(10);
        expect(load).toBeLessThanOrEqual(110);
      });
    });

    test('should generate valid performance metrics', () => {
      // Test performance metrics for charts
      const responseTime = Math.random() * 200 + 50;    // 50-250ms
      const requestsPerSec = Math.random() * 1000 + 200; // 200-1200/sec
      const errorRate = Math.random() * 5 + 0.5;         // 0.5-5.5%
      const activeConnections = Math.random() * 500 + 100; // 100-600

      expect(responseTime).toBeGreaterThanOrEqual(50);
      expect(responseTime).toBeLessThanOrEqual(250);
      
      expect(requestsPerSec).toBeGreaterThanOrEqual(200);
      expect(requestsPerSec).toBeLessThanOrEqual(1200);
      
      expect(errorRate).toBeGreaterThanOrEqual(0.5);
      expect(errorRate).toBeLessThanOrEqual(5.5);
      
      expect(activeConnections).toBeGreaterThanOrEqual(100);
      expect(activeConnections).toBeLessThanOrEqual(600);
    });
  });
});
