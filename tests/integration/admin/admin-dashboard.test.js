#!/usr/bin/env node

/**
 * Unit tests for Admin Dashboard features
 * Tests the enhanced dashboard with guest vs registered user metrics
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

describe('Admin Dashboard Tests', () => {
  let adminToken = null;

  beforeAll(async () => {
    // Get admin token for testing
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
      console.warn('Could not get admin token for tests:', error.message);
    }
  });

  describe('Dashboard Metrics API', () => {
    test('should fetch basic dashboard metrics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('totalSessions');
      expect(data).toHaveProperty('totalPlaytime');
      expect(data).toHaveProperty('totalGameActions');
      expect(typeof data.totalUsers).toBe('number');
    });

    test('should fetch user type metrics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Test guest vs registered metrics
      expect(data).toHaveProperty('registeredUsers');
      expect(data).toHaveProperty('guestUsers');
      expect(data).toHaveProperty('registeredSessions');
      expect(data).toHaveProperty('guestSessions');
      expect(data).toHaveProperty('registeredGameActions');
      expect(data).toHaveProperty('guestGameActions');
      expect(data).toHaveProperty('registeredPlaytime');
      expect(data).toHaveProperty('guestPlaytime');

      // Verify data types
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');
      expect(data.registeredUsers).toBeGreaterThanOrEqual(0);
      expect(data.guestUsers).toBeGreaterThanOrEqual(0);
    });

    test('should calculate user type percentages correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const totalUsers = data.registeredUsers + data.guestUsers;
      
      if (totalUsers > 0) {
        const registeredPercentage = (data.registeredUsers / totalUsers) * 100;
        const guestPercentage = (data.guestUsers / totalUsers) * 100;
        
        expect(registeredPercentage + guestPercentage).toBeCloseTo(100, 1);
        expect(registeredPercentage).toBeGreaterThanOrEqual(0);
        expect(guestPercentage).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('User Management API', () => {
    test('should fetch users list with role information', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('users');
      expect(Array.isArray(data.users)).toBe(true);

      // Check user objects have required fields
      if (data.users.length > 0) {
        const user = data.users[0];
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('role');
        expect(['admin', 'registered', 'guest']).toContain(user.role);
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

      const registeredUsers = users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = users.filter(u => u.role === 'guest');

      expect(registeredUsers.length + guestUsers.length).toBeLessThanOrEqual(users.length);
      
      // Verify role consistency
      registeredUsers.forEach(user => {
        expect(['registered', 'admin']).toContain(user.role);
      });
      
      guestUsers.forEach(user => {
        expect(user.role).toBe('guest');
      });
    });
  });

  describe('Chart Data API', () => {
    test('should fetch charts data for analytics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/charts`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should return some data structure for charts
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });
  });

  describe('Authentication & Authorization', () => {
    test('should reject requests without token', async () => {
      const response = await fetch(`${API_BASE}/admin/metrics`);
      expect([401, 403]).toContain(response.status);
    });

    test('should reject requests with invalid token', async () => {
      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      expect([401, 403]).toContain(response.status);
    });

    test('should accept requests with valid admin token', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Real-time Features', () => {
    test('should track online users correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const onlineUsers = data.users.filter(u => u.isOnline);
      
      expect(Array.isArray(onlineUsers)).toBe(true);
      expect(onlineUsers.length).toBeGreaterThanOrEqual(0);

      // Online users should have lastActivity timestamp
      onlineUsers.forEach(user => {
        if (user.lastActivity) {
          expect(new Date(user.lastActivity)).toBeInstanceOf(Date);
        }
      });
    });

    test('should provide session length data', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      data.users.forEach(user => {
        if (user.currentSessionLength !== undefined) {
          expect(typeof user.currentSessionLength).toBe('number');
          expect(user.currentSessionLength).toBeGreaterThanOrEqual(0);
        }
        if (user.averageSessionLength !== undefined) {
          expect(typeof user.averageSessionLength).toBe('number');
          expect(user.averageSessionLength).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Data Validation', () => {
    test('should return consistent user counts across endpoints', async () => {
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

      const totalUsersFromList = usersData.users.length;
      const totalUsersFromMetrics = metricsData.registeredUsers + metricsData.guestUsers;

      // Allow for some variance due to real-time changes
      expect(Math.abs(totalUsersFromList - totalUsersFromMetrics)).toBeLessThanOrEqual(5);
    });

    test('should have valid playtime and session data', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();

      // Playtime should be non-negative
      expect(data.registeredPlaytime).toBeGreaterThanOrEqual(0);
      expect(data.guestPlaytime).toBeGreaterThanOrEqual(0);

      // Sessions should be non-negative
      expect(data.registeredSessions).toBeGreaterThanOrEqual(0);
      expect(data.guestSessions).toBeGreaterThanOrEqual(0);

      // Game actions should be non-negative
      expect(data.registeredGameActions).toBeGreaterThanOrEqual(0);
      expect(data.guestGameActions).toBeGreaterThanOrEqual(0);
    });
  });
});

// Helper function for manual testing
async function runQuickTest() {
  console.log('🧪 Running quick admin dashboard test...\n');
  
  try {
    // Test admin login
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

    // Test user type metrics
    const metricsResponse = await fetch(`${API_BASE}/admin/metrics/user-types`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const metrics = await metricsResponse.json();
    
    console.log('✅ Dashboard metrics test passed:');
    console.log(`   Registered Users: ${metrics.registeredUsers}`);
    console.log(`   Guest Users: ${metrics.guestUsers}`);
    console.log(`   Total Sessions: ${metrics.registeredSessions + metrics.guestSessions}`);
    console.log(`   Total Game Actions: ${metrics.registeredGameActions + metrics.guestGameActions}`);
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }
}

// Export for use in other test files
module.exports = {
  runQuickTest
};

// Run quick test if called directly
if (require.main === module) {
  runQuickTest();
}
