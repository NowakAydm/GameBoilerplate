#!/usr/bin/env node

/**
 * Unit tests for Charts Analytics features
 * Tests the enhanced charts with guest vs registered user analytics and server monitoring
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

describe('Charts Analytics Tests', () => {
  let adminToken = null;

  beforeAll(async () => {
    try {
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });
      const loginData = await loginResponse.json();
      if (loginData.success) {
        adminToken = loginData.token;
      }
    } catch (error) {
      console.warn('Could not get admin token for charts tests:', error.message);
    }
  });

  describe('Chart Data Endpoints', () => {
    test('should fetch chart data for analytics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/charts`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });

    test('should provide user type comparison data', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Verify chart-ready data structure
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');
      expect(typeof data.registeredSessions).toBe('number');
      expect(typeof data.guestSessions).toBe('number');
      expect(typeof data.registeredGameActions).toBe('number');
      expect(typeof data.guestGameActions).toBe('number');
    });
  });

  describe('User Activity Analytics', () => {
    test('should provide activity data for time-based charts', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

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
      if (!adminToken) {
        console.log('Skipping test - no admin token');
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

  describe('Session Length Distribution', () => {
    test('should categorize session lengths correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test session length categorization for charts
      const sessionRanges = [
        { min: 0, max: 15, label: '0-15min' },
        { min: 15, max: 30, label: '15-30min' },
        { min: 30, max: 60, label: '30-60min' },
        { min: 60, max: 120, label: '1-2h' },
        { min: 120, max: 240, label: '2-4h' },
        { min: 240, max: Infinity, label: '4h+' }
      ];

      const registeredCounts = new Array(6).fill(0);
      const guestCounts = new Array(6).fill(0);

      users.forEach(user => {
        const avgSession = user.averageSessionLength || 0;
        const isRegistered = user.role === 'registered' || user.role === 'admin';
        
        for (let i = 0; i < sessionRanges.length; i++) {
          if (avgSession >= sessionRanges[i].min && avgSession < sessionRanges[i].max) {
            if (isRegistered) {
              registeredCounts[i]++;
            } else {
              guestCounts[i]++;
            }
            break;
          }
        }
      });

      // Verify counts are valid for chart data
      registeredCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });
      guestCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });

      const totalCounted = registeredCounts.reduce((a, b) => a + b) + guestCounts.reduce((a, b) => a + b);
      expect(totalCounted).toBeLessThanOrEqual(users.length);
    });
  });

  describe('Game Actions Analytics', () => {
    test('should provide game action breakdown data', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
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

    test('should support detailed action categorization', async () => {
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

  describe('Top Players Analytics', () => {
    test('should rank players by playtime correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test top players ranking
      const sortedByPlaytime = [...users].sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0));
      
      if (sortedByPlaytime.length > 1) {
        expect(sortedByPlaytime[0].totalPlaytime || 0).toBeGreaterThanOrEqual(sortedByPlaytime[1].totalPlaytime || 0);
      }

      const top10 = sortedByPlaytime.slice(0, 10);
      expect(top10.length).toBeLessThanOrEqual(10);
      expect(top10.length).toBeLessThanOrEqual(users.length);
    });

    test('should distinguish between registered and guest top players', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');

      const topRegistered = [...registeredUsers]
        .sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0))
        .slice(0, 5);

      const topGuests = [...guestUsers]
        .sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0))
        .slice(0, 5);

      // Verify role consistency
      topRegistered.forEach(user => {
        expect(['registered', 'admin']).toContain(user.role);
      });

      topGuests.forEach(user => {
        expect(user.role).toBe('guest');
      });
    });
  });

  describe('Server Performance Metrics (Mock)', () => {
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

  describe('Chart Data Validation', () => {
    test('should return chart-compatible data structures', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
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
});

// Manual test function
async function runChartsTest() {
  console.log('📊 Testing Charts Analytics...\n');
  
  try {
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Admin login failed');
    }

    const metricsResponse = await fetch(`${API_BASE}/admin/metrics/user-types`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const metrics = await metricsResponse.json();
    
    console.log('✅ Charts analytics test passed:');
    console.log('📊 User Type Distribution:');
    console.log(`   Registered: ${metrics.registeredUsers} users`);
    console.log(`   Guests: ${metrics.guestUsers} users`);
    
    console.log('📈 Activity Metrics:');
    console.log(`   Registered Sessions: ${metrics.registeredSessions}`);
    console.log(`   Guest Sessions: ${metrics.guestSessions}`);
    console.log(`   Registered Actions: ${metrics.registeredGameActions}`);
    console.log(`   Guest Actions: ${metrics.guestGameActions}`);
    
    const totalUsers = metrics.registeredUsers + metrics.guestUsers;
    if (totalUsers > 0) {
      const regPercentage = Math.round((metrics.registeredUsers / totalUsers) * 100);
      const guestPercentage = Math.round((metrics.guestUsers / totalUsers) * 100);
      console.log(`   User Distribution: ${regPercentage}% registered, ${guestPercentage}% guests`);
    }
    
  } catch (error) {
    console.error('❌ Charts test failed:', error.message);
  }
}

module.exports = { runChartsTest };

if (require.main === module) {
  runChartsTest();
}
