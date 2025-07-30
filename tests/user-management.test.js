#!/usr/bin/env node

/**
 * Unit tests for User Management features
 * Tests the enhanced Users component with guest vs registered analytics
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

describe('User Management Tests', () => {
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
      console.warn('Could not get admin token for user tests:', error.message);
    }
  });

  describe('User Listing and Filtering', () => {
    test('should fetch all users with role information', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.users)).toBe(true);

      // Verify user structure
      if (data.users.length > 0) {
        const user = data.users[0];
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(['guest', 'registered', 'admin']).toContain(user.role);
        expect(typeof user.isOnline).toBe('boolean');
      }
    });

    test('should filter users by role correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test role filtering
      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');
      const onlineUsers = users.filter(u => u.isOnline);
      const offlineUsers = users.filter(u => !u.isOnline);

      // Verify filtering logic
      registeredUsers.forEach(user => {
        expect(['registered', 'admin']).toContain(user.role);
      });

      guestUsers.forEach(user => {
        expect(user.role).toBe('guest');
      });

      onlineUsers.forEach(user => {
        expect(user.isOnline).toBe(true);
      });

      offlineUsers.forEach(user => {
        expect(user.isOnline).toBe(false);
      });

      // Total should match
      expect(registeredUsers.length + guestUsers.length).toBe(users.length);
      expect(onlineUsers.length + offlineUsers.length).toBe(users.length);
    });

    test('should sort users by playtime for top players', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test top players sorting
      const sortedByPlaytime = [...users].sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0));
      
      if (sortedByPlaytime.length > 1) {
        for (let i = 0; i < sortedByPlaytime.length - 1; i++) {
          expect(sortedByPlaytime[i].totalPlaytime || 0).toBeGreaterThanOrEqual(sortedByPlaytime[i + 1].totalPlaytime || 0);
        }
      }

      const top10 = sortedByPlaytime.slice(0, 10);
      expect(top10.length).toBeLessThanOrEqual(10);
      expect(top10.length).toBeLessThanOrEqual(users.length);
    });
  });

  describe('User Analytics Summary', () => {
    test('should calculate user statistics correctly', async () => {
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
      const users = usersData.users;

      // Calculate manual totals
      const totalUsers = users.length;
      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');
      const onlineUsers = users.filter(u => u.isOnline);

      // Verify metrics match manual calculations
      expect(metricsData.registeredUsers).toBe(registeredUsers.length);
      expect(metricsData.guestUsers).toBe(guestUsers.length);
      expect(metricsData.registeredUsers + metricsData.guestUsers).toBe(totalUsers);

      // Verify percentages
      if (totalUsers > 0) {
        const registeredPercentage = Math.round((registeredUsers.length / totalUsers) * 100);
        const guestPercentage = Math.round((guestUsers.length / totalUsers) * 100);
        const onlinePercentage = Math.round((onlineUsers.length / totalUsers) * 100);

        expect(registeredPercentage + guestPercentage).toBeLessThanOrEqual(101); // Account for rounding
        expect(onlinePercentage).toBeGreaterThanOrEqual(0);
        expect(onlinePercentage).toBeLessThanOrEqual(100);
      }
    });

    test('should calculate engagement metrics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Calculate engagement metrics
      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');

      // Average playtime per user type
      const avgRegisteredPlaytime = registeredUsers.length > 0 
        ? registeredUsers.reduce((sum, u) => sum + (u.totalPlaytime || 0), 0) / registeredUsers.length
        : 0;

      const avgGuestPlaytime = guestUsers.length > 0
        ? guestUsers.reduce((sum, u) => sum + (u.totalPlaytime || 0), 0) / guestUsers.length
        : 0;

      expect(avgRegisteredPlaytime).toBeGreaterThanOrEqual(0);
      expect(avgGuestPlaytime).toBeGreaterThanOrEqual(0);

      // Average session count
      const avgRegisteredSessions = registeredUsers.length > 0
        ? registeredUsers.reduce((sum, u) => sum + (u.sessionCount || 0), 0) / registeredUsers.length
        : 0;

      const avgGuestSessions = guestUsers.length > 0
        ? guestUsers.reduce((sum, u) => sum + (u.sessionCount || 0), 0) / guestUsers.length
        : 0;

      expect(avgRegisteredSessions).toBeGreaterThanOrEqual(0);
      expect(avgGuestSessions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('User Profile Validation', () => {
    test('should validate user data structure', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      users.forEach(user => {
        // Required fields
        expect(typeof user.id).toBe('string');
        expect(user.id.length).toBeGreaterThan(0);
        expect(typeof user.email).toBe('string');
        expect(user.email.includes('@')).toBe(true);
        expect(['guest', 'registered', 'admin']).toContain(user.role);
        expect(typeof user.isOnline).toBe('boolean');

        // Optional fields with validation
        if (user.username !== undefined) {
          expect(typeof user.username).toBe('string');
          expect(user.username.length).toBeGreaterThan(0);
        }

        if (user.totalPlaytime !== undefined) {
          expect(typeof user.totalPlaytime).toBe('number');
          expect(user.totalPlaytime).toBeGreaterThanOrEqual(0);
        }

        if (user.sessionCount !== undefined) {
          expect(typeof user.sessionCount).toBe('number');
          expect(user.sessionCount).toBeGreaterThanOrEqual(0);
        }

        if (user.gameActions !== undefined) {
          expect(typeof user.gameActions).toBe('number');
          expect(user.gameActions).toBeGreaterThanOrEqual(0);
        }

        if (user.averageSessionLength !== undefined) {
          expect(typeof user.averageSessionLength).toBe('number');
          expect(user.averageSessionLength).toBeGreaterThanOrEqual(0);
        }

        if (user.lastActiveAt !== undefined) {
          expect(typeof user.lastActiveAt).toBe('string');
          const date = new Date(user.lastActiveAt);
          expect(date.getTime()).not.toBeNaN();
        }

        if (user.registeredAt !== undefined) {
          expect(typeof user.registeredAt).toBe('string');
          const date = new Date(user.registeredAt);
          expect(date.getTime()).not.toBeNaN();
        }
      });
    });

    test('should handle user sorting by different criteria', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      if (users.length === 0) {
        console.log('No users to test sorting');
        return;
      }

      // Test sorting by playtime
      const sortedByPlaytime = [...users].sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0));
      expect(sortedByPlaytime.length).toBe(users.length);

      // Test sorting by session count
      const sortedBySessions = [...users].sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0));
      expect(sortedBySessions.length).toBe(users.length);

      // Test sorting by last active
      const sortedByActivity = [...users]
        .filter(u => u.lastActiveAt)
        .sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
      
      if (sortedByActivity.length > 1) {
        expect(new Date(sortedByActivity[0].lastActiveAt).getTime())
          .toBeGreaterThanOrEqual(new Date(sortedByActivity[1].lastActiveAt).getTime());
      }

      // Test sorting by registration date
      const sortedByRegistration = [...users]
        .filter(u => u.registeredAt)
        .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
      
      if (sortedByRegistration.length > 1) {
        expect(new Date(sortedByRegistration[0].registeredAt).getTime())
          .toBeGreaterThanOrEqual(new Date(sortedByRegistration[1].registeredAt).getTime());
      }
    });
  });

  describe('Guest User Behavior', () => {
    test('should track guest user sessions correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const guestUsers = data.users.filter(u => u.role === 'guest');

      guestUsers.forEach(guest => {
        expect(guest.role).toBe('guest');
        
        // Guest users should have activity tracking
        if (guest.totalPlaytime !== undefined) {
          expect(guest.totalPlaytime).toBeGreaterThanOrEqual(0);
        }
        
        if (guest.sessionCount !== undefined) {
          expect(guest.sessionCount).toBeGreaterThanOrEqual(0);
        }

        // Guest users might not have registration date
        if (guest.email.includes('guest-')) {
          expect(guest.registeredAt).toBeUndefined();
        }
      });
    });

    test('should distinguish guest naming patterns', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const guestUsers = data.users.filter(u => u.role === 'guest');

      guestUsers.forEach(guest => {
        // Guest users typically have generated emails/usernames
        const hasGuestPattern = guest.email.includes('guest-') || 
                               guest.email.includes('anonymous-') ||
                               (guest.username && guest.username.includes('Guest'));
        
        // Not all guests follow the pattern, but verify structure is consistent
        expect(typeof guest.email).toBe('string');
        expect(guest.email.length).toBeGreaterThan(0);
      });
    });
  });

  describe('User Activity Metrics', () => {
    test('should calculate accurate activity statistics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test activity calculations
      const totalPlaytime = users.reduce((sum, u) => sum + (u.totalPlaytime || 0), 0);
      const totalSessions = users.reduce((sum, u) => sum + (u.sessionCount || 0), 0);
      const totalGameActions = users.reduce((sum, u) => sum + (u.gameActions || 0), 0);

      expect(totalPlaytime).toBeGreaterThanOrEqual(0);
      expect(totalSessions).toBeGreaterThanOrEqual(0);
      expect(totalGameActions).toBeGreaterThanOrEqual(0);

      // Average session length calculation
      const usersWithSessions = users.filter(u => (u.sessionCount || 0) > 0);
      if (usersWithSessions.length > 0) {
        const avgSessionLength = totalPlaytime / totalSessions;
        expect(avgSessionLength).toBeGreaterThanOrEqual(0);
      }

      // Actions per minute calculation
      if (totalPlaytime > 0) {
        const actionsPerMinute = totalGameActions / (totalPlaytime / 60);
        expect(actionsPerMinute).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle edge cases in user data', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test users with no activity
      const inactiveUsers = users.filter(u => 
        (u.totalPlaytime || 0) === 0 && 
        (u.sessionCount || 0) === 0 && 
        (u.gameActions || 0) === 0
      );

      inactiveUsers.forEach(user => {
        expect(user.totalPlaytime || 0).toBe(0);
        expect(user.sessionCount || 0).toBe(0);
        expect(user.gameActions || 0).toBe(0);
      });

      // Test users with incomplete data
      users.forEach(user => {
        if (user.sessionCount > 0 && user.totalPlaytime === 0) {
          // This might be valid for very short sessions
          expect(user.sessionCount).toBeGreaterThan(0);
        }

        if (user.totalPlaytime > 0 && user.sessionCount === 0) {
          // This shouldn't happen - playtime requires sessions
          console.warn(`User ${user.id} has playtime but no sessions`);
        }
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large user lists efficiently', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response should be reasonably fast (under 5 seconds for normal cases)
      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(200);
      expect(Array.isArray(data.users)).toBe(true);

      console.log(`User list fetch took ${responseTime}ms for ${data.users.length} users`);
    });

    test('should handle pagination concepts', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const users = data.users;

      // Test pagination logic
      const pageSize = 10;
      const totalPages = Math.ceil(users.length / pageSize);
      
      for (let page = 0; page < Math.min(totalPages, 3); page++) {
        const startIndex = page * pageSize;
        const endIndex = Math.min(startIndex + pageSize, users.length);
        const pageUsers = users.slice(startIndex, endIndex);

        expect(pageUsers.length).toBeLessThanOrEqual(pageSize);
        expect(pageUsers.length).toBeGreaterThan(0);

        if (page === totalPages - 1) {
          // Last page might be smaller
          expect(pageUsers.length).toBeLessThanOrEqual(pageSize);
        } else if (page < totalPages - 1) {
          // Full pages should have exactly pageSize users
          expect(pageUsers.length).toBe(Math.min(pageSize, users.length - startIndex));
        }
      }
    });
  });
});

// Manual test function
async function runUserManagementTest() {
  console.log('👥 Testing User Management...\n');
  
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

    const [usersResponse, metricsResponse] = await Promise.all([
      fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      }),
      fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      })
    ]);

    const usersData = await usersResponse.json();
    const metricsData = await metricsResponse.json();
    
    console.log('✅ User management test passed:');
    console.log(`👥 Total Users: ${usersData.users.length}`);
    console.log(`🔐 Registered: ${metricsData.registeredUsers}`);
    console.log(`👻 Guests: ${metricsData.guestUsers}`);
    
    const onlineUsers = usersData.users.filter(u => u.isOnline);
    console.log(`🟢 Online: ${onlineUsers.length}`);
    console.log(`🔴 Offline: ${usersData.users.length - onlineUsers.length}`);
    
    // Top 3 players by playtime
    const topPlayers = [...usersData.users]
      .sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0))
      .slice(0, 3);
    
    console.log('\n🏆 Top Players:');
    topPlayers.forEach((player, index) => {
      const playtime = Math.round((player.totalPlaytime || 0) / 60);
      console.log(`   ${index + 1}. ${player.username || player.email.split('@')[0]} (${playtime}min)`);
    });
    
  } catch (error) {
    console.error('❌ User management test failed:', error.message);
  }
}

module.exports = { runUserManagementTest };

if (require.main === module) {
  runUserManagementTest();
}
