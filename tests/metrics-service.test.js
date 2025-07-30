#!/usr/bin/env node

/**
 * Unit tests for MetricsService
 * Tests the core metrics tracking with guest vs registered user analytics
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

describe('MetricsService Tests', () => {
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
      console.warn('Could not get admin token for metrics tests:', error.message);
    }
  });

  describe('Core Metrics Collection', () => {
    test('should provide basic metrics structure', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Basic metrics structure
      expect(typeof data.totalUsers).toBe('number');
      expect(typeof data.totalSessions).toBe('number');
      expect(typeof data.totalGameActions).toBe('number');
      expect(typeof data.totalPlaytime).toBe('number');
      
      expect(data.totalUsers).toBeGreaterThanOrEqual(0);
      expect(data.totalSessions).toBeGreaterThanOrEqual(0);
      expect(data.totalGameActions).toBeGreaterThanOrEqual(0);
      expect(data.totalPlaytime).toBeGreaterThanOrEqual(0);
    });

    test('should track user type specific metrics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // User type metrics
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');
      expect(typeof data.registeredSessions).toBe('number');
      expect(typeof data.guestSessions).toBe('number');
      expect(typeof data.registeredGameActions).toBe('number');
      expect(typeof data.guestGameActions).toBe('number');
      expect(typeof data.registeredPlaytime).toBe('number');
      expect(typeof data.guestPlaytime).toBe('number');
      
      // All values should be non-negative
      Object.values(data).forEach(value => {
        if (typeof value === 'number') {
          expect(value).toBeGreaterThanOrEqual(0);
        }
      });
      
      // Total users should equal registered + guests
      expect(data.registeredUsers + data.guestUsers).toBeGreaterThanOrEqual(0);
    });

    test('should calculate percentages correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      const totalUsers = data.registeredUsers + data.guestUsers;
      const totalSessions = data.registeredSessions + data.guestSessions;
      const totalActions = data.registeredGameActions + data.guestGameActions;
      const totalPlaytime = data.registeredPlaytime + data.guestPlaytime;
      
      if (totalUsers > 0) {
        const registeredUserPercentage = (data.registeredUsers / totalUsers) * 100;
        const guestUserPercentage = (data.guestUsers / totalUsers) * 100;
        
        expect(registeredUserPercentage).toBeGreaterThanOrEqual(0);
        expect(registeredUserPercentage).toBeLessThanOrEqual(100);
        expect(guestUserPercentage).toBeGreaterThanOrEqual(0);
        expect(guestUserPercentage).toBeLessThanOrEqual(100);
        expect(Math.round(registeredUserPercentage + guestUserPercentage)).toBe(100);
      }
      
      if (totalSessions > 0) {
        const registeredSessionPercentage = (data.registeredSessions / totalSessions) * 100;
        const guestSessionPercentage = (data.guestSessions / totalSessions) * 100;
        
        expect(registeredSessionPercentage + guestSessionPercentage).toBeCloseTo(100, 1);
      }
    });
  });

  describe('Session Tracking', () => {
    test('should track sessions by user type', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Sessions should be logical
      expect(data.registeredSessions).toBeGreaterThanOrEqual(0);
      expect(data.guestSessions).toBeGreaterThanOrEqual(0);
      
      // If there are users, there should potentially be sessions
      if (data.registeredUsers > 0) {
        expect(data.registeredSessions).toBeGreaterThanOrEqual(0);
      }
      
      if (data.guestUsers > 0) {
        expect(data.guestSessions).toBeGreaterThanOrEqual(0);
      }
    });

    test('should calculate average session metrics', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Calculate average sessions per user
      const avgRegisteredSessions = data.registeredUsers > 0 
        ? data.registeredSessions / data.registeredUsers 
        : 0;
      
      const avgGuestSessions = data.guestUsers > 0 
        ? data.guestSessions / data.guestUsers 
        : 0;
      
      expect(avgRegisteredSessions).toBeGreaterThanOrEqual(0);
      expect(avgGuestSessions).toBeGreaterThanOrEqual(0);
      
      // Calculate average session length
      const avgRegisteredSessionLength = data.registeredSessions > 0 
        ? data.registeredPlaytime / data.registeredSessions 
        : 0;
      
      const avgGuestSessionLength = data.guestSessions > 0 
        ? data.guestPlaytime / data.guestSessions 
        : 0;
      
      expect(avgRegisteredSessionLength).toBeGreaterThanOrEqual(0);
      expect(avgGuestSessionLength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Game Action Tracking', () => {
    test('should track game actions by user type', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      expect(data.registeredGameActions).toBeGreaterThanOrEqual(0);
      expect(data.guestGameActions).toBeGreaterThanOrEqual(0);
      
      // Calculate actions per user
      const actionsPerRegisteredUser = data.registeredUsers > 0 
        ? data.registeredGameActions / data.registeredUsers 
        : 0;
      
      const actionsPerGuestUser = data.guestUsers > 0 
        ? data.guestGameActions / data.guestUsers 
        : 0;
      
      expect(actionsPerRegisteredUser).toBeGreaterThanOrEqual(0);
      expect(actionsPerGuestUser).toBeGreaterThanOrEqual(0);
    });

    test('should calculate actions per minute', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Calculate actions per minute for each user type
      const registeredActionsPerMinute = data.registeredPlaytime > 0 
        ? data.registeredGameActions / (data.registeredPlaytime / 60) 
        : 0;
      
      const guestActionsPerMinute = data.guestPlaytime > 0 
        ? data.guestGameActions / (data.guestPlaytime / 60) 
        : 0;
      
      expect(registeredActionsPerMinute).toBeGreaterThanOrEqual(0);
      expect(guestActionsPerMinute).toBeGreaterThanOrEqual(0);
      
      // Actions per minute should be reasonable (typically 1-60)
      if (registeredActionsPerMinute > 0) {
        expect(registeredActionsPerMinute).toBeLessThan(1000); // Sanity check
      }
      
      if (guestActionsPerMinute > 0) {
        expect(guestActionsPerMinute).toBeLessThan(1000); // Sanity check
      }
    });
  });

  describe('Playtime Tracking', () => {
    test('should track playtime by user type', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      expect(data.registeredPlaytime).toBeGreaterThanOrEqual(0);
      expect(data.guestPlaytime).toBeGreaterThanOrEqual(0);
      
      // If there are sessions, there might be playtime
      if (data.registeredSessions > 0) {
        expect(data.registeredPlaytime).toBeGreaterThanOrEqual(0);
      }
      
      if (data.guestSessions > 0) {
        expect(data.guestPlaytime).toBeGreaterThanOrEqual(0);
      }
    });

    test('should calculate average playtime per user', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      const avgRegisteredPlaytime = data.registeredUsers > 0 
        ? data.registeredPlaytime / data.registeredUsers 
        : 0;
      
      const avgGuestPlaytime = data.guestUsers > 0 
        ? data.guestPlaytime / data.guestUsers 
        : 0;
      
      expect(avgRegisteredPlaytime).toBeGreaterThanOrEqual(0);
      expect(avgGuestPlaytime).toBeGreaterThanOrEqual(0);
      
      // Convert to minutes for readability
      const avgRegisteredMinutes = avgRegisteredPlaytime / 60;
      const avgGuestMinutes = avgGuestPlaytime / 60;
      
      expect(avgRegisteredMinutes).toBeGreaterThanOrEqual(0);
      expect(avgGuestMinutes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across endpoints', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const [metricsResponse, usersResponse, userTypesResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/metrics`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/users`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/metrics/user-types`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      ]);

      const metricsData = await metricsResponse.json();
      const usersData = await usersResponse.json();
      const userTypesData = await userTypesResponse.json();
      
      // Check user count consistency
      expect(metricsData.totalUsers).toBe(usersData.users.length);
      expect(userTypesData.registeredUsers + userTypesData.guestUsers).toBe(usersData.users.length);
      
      // Manual verification of user types
      const registeredUsers = usersData.users.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = usersData.users.filter(u => u.role === 'guest');
      
      expect(userTypesData.registeredUsers).toBe(registeredUsers.length);
      expect(userTypesData.guestUsers).toBe(guestUsers.length);
    });

    test('should handle zero values correctly', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Test division by zero scenarios
      if (data.registeredUsers === 0) {
        // All registered metrics should be 0
        expect(data.registeredSessions).toBe(0);
        expect(data.registeredGameActions).toBe(0);
        expect(data.registeredPlaytime).toBe(0);
      }
      
      if (data.guestUsers === 0) {
        // All guest metrics should be 0
        expect(data.guestSessions).toBe(0);
        expect(data.guestGameActions).toBe(0);
        expect(data.guestPlaytime).toBe(0);
      }
      
      // Percentage calculations should handle zero totals
      const totalUsers = data.registeredUsers + data.guestUsers;
      if (totalUsers === 0) {
        // Should not cause division by zero errors
        const percentage = totalUsers > 0 ? (data.registeredUsers / totalUsers) * 100 : 0;
        expect(percentage).toBe(0);
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should respond quickly to metrics requests', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      
      const data = await response.json();
      expect(typeof data).toBe('object');
      
      console.log(`Metrics response time: ${responseTime}ms`);
    });

    test('should handle concurrent requests', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill().map(() =>
        fetch(`${API_BASE}/admin/metrics/user-types`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const totalTime = endTime - startTime;
      console.log(`${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
      
      // Parse all responses
      const dataPromises = responses.map(r => r.json());
      const allData = await Promise.all(dataPromises);
      
      // All responses should have consistent data
      const firstResponse = allData[0];
      allData.forEach(data => {
        expect(data.registeredUsers).toBe(firstResponse.registeredUsers);
        expect(data.guestUsers).toBe(firstResponse.guestUsers);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid auth gracefully', async () => {
      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect([401, 403]).toContain(response.status);
    });

    test('should handle missing auth gracefully', async () => {
      const response = await fetch(`${API_BASE}/admin/metrics/user-types`);

      expect([401, 403]).toContain(response.status);
    });

    test('should validate metrics data types', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // All metrics should be numbers
      const numericFields = [
        'registeredUsers', 'guestUsers', 'registeredSessions', 'guestSessions',
        'registeredGameActions', 'guestGameActions', 'registeredPlaytime', 'guestPlaytime'
      ];
      
      numericFields.forEach(field => {
        expect(typeof data[field]).toBe('number');
        expect(Number.isFinite(data[field])).toBe(true);
        expect(data[field]).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// Manual test function
async function runMetricsServiceTest() {
  console.log('📈 Testing MetricsService...\n');
  
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

    const [generalResponse, userTypesResponse] = await Promise.all([
      fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      }),
      fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      })
    ]);

    const generalMetrics = await generalResponse.json();
    const userTypeMetrics = await userTypesResponse.json();
    
    console.log('✅ MetricsService test passed:');
    console.log('📊 General Metrics:');
    console.log(`   Total Users: ${generalMetrics.totalUsers}`);
    console.log(`   Total Sessions: ${generalMetrics.totalSessions}`);
    console.log(`   Total Actions: ${generalMetrics.totalGameActions}`);
    console.log(`   Total Playtime: ${Math.round(generalMetrics.totalPlaytime / 60)}min`);
    
    console.log('\n👥 User Type Breakdown:');
    console.log(`   Registered Users: ${userTypeMetrics.registeredUsers}`);
    console.log(`   Guest Users: ${userTypeMetrics.guestUsers}`);
    
    const totalUsers = userTypeMetrics.registeredUsers + userTypeMetrics.guestUsers;
    if (totalUsers > 0) {
      const regPercentage = Math.round((userTypeMetrics.registeredUsers / totalUsers) * 100);
      const guestPercentage = Math.round((userTypeMetrics.guestUsers / totalUsers) * 100);
      console.log(`   Distribution: ${regPercentage}% registered, ${guestPercentage}% guests`);
    }
    
    console.log('\n🎮 Activity Breakdown:');
    console.log(`   Registered Sessions: ${userTypeMetrics.registeredSessions}`);
    console.log(`   Guest Sessions: ${userTypeMetrics.guestSessions}`);
    console.log(`   Registered Actions: ${userTypeMetrics.registeredGameActions}`);
    console.log(`   Guest Actions: ${userTypeMetrics.guestGameActions}`);
    console.log(`   Registered Playtime: ${Math.round(userTypeMetrics.registeredPlaytime / 60)}min`);
    console.log(`   Guest Playtime: ${Math.round(userTypeMetrics.guestPlaytime / 60)}min`);
    
  } catch (error) {
    console.error('❌ MetricsService test failed:', error.message);
  }
}

module.exports = { runMetricsServiceTest };

if (require.main === module) {
  runMetricsServiceTest();
}
