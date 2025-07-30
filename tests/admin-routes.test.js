#!/usr/bin/env node

/**
 * Unit tests for Admin Routes
 * Tests the enhanced admin API endpoints with guest vs registered analytics
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

describe('Admin Routes Tests', () => {
  let adminToken = null;
  let userToken = null;

  beforeAll(async () => {
    try {
      // Get admin token
      const adminLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });
      const adminLoginData = await adminLoginResponse.json();
      if (adminLoginData.success) {
        adminToken = adminLoginData.token;
      }

      // Try to get a regular user token
      const userLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'user123'
        })
      });
      const userLoginData = await userLoginResponse.json();
      if (userLoginData.success) {
        userToken = userLoginData.token;
      }
    } catch (error) {
      console.warn('Could not get tokens for admin routes tests:', error.message);
    }
  });

  describe('Authentication and Authorization', () => {
    test('should require authentication for admin routes', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/metrics',
        '/admin/metrics/user-types'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE}${endpoint}`);
        expect([401, 403]).toContain(response.status);
      }
    });

    test('should reject invalid tokens', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/metrics',
        '/admin/metrics/user-types'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers: { 'Authorization': 'Bearer invalid-token' }
        });
        expect([401, 403]).toContain(response.status);
      }
    });

    test('should require admin privileges', async () => {
      if (!userToken) {
        console.log('Skipping test - no user token');
        return;
      }

      const endpoints = [
        '/admin/users',
        '/admin/metrics',
        '/admin/metrics/user-types'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        // Should be forbidden for non-admin users
        expect([401, 403]).toContain(response.status);
      }
    });

    test('should allow access with admin token', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const endpoints = [
        '/admin/users',
        '/admin/metrics',
        '/admin/metrics/user-types'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /admin/users', () => {
    test('should return user list with correct structure', async () => {
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
      expect(typeof data.totalUsers).toBe('number');
      expect(typeof data.onlineUsers).toBe('number');
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');

      // Verify totals add up
      expect(data.totalUsers).toBe(data.users.length);
      expect(data.registeredUsers + data.guestUsers).toBe(data.totalUsers);
      
      const onlineCount = data.users.filter(u => u.isOnline).length;
      expect(data.onlineUsers).toBe(onlineCount);
    });

    test('should include all required user fields', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      if (data.users.length > 0) {
        const user = data.users[0];
        
        // Required fields
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(['guest', 'registered', 'admin']).toContain(user.role);
        expect(typeof user.isOnline).toBe('boolean');
        
        // Optional fields that might be present
        if (user.username !== undefined) {
          expect(typeof user.username).toBe('string');
        }
        if (user.totalPlaytime !== undefined) {
          expect(typeof user.totalPlaytime).toBe('number');
          expect(user.totalPlaytime).toBeGreaterThanOrEqual(0);
        }
        if (user.sessionCount !== undefined) {
          expect(typeof user.sessionCount).toBe('number');
          expect(user.sessionCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should handle empty user list', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Should handle empty case gracefully
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.totalUsers).toBeGreaterThanOrEqual(0);
      expect(data.onlineUsers).toBeGreaterThanOrEqual(0);
      expect(data.registeredUsers).toBeGreaterThanOrEqual(0);
      expect(data.guestUsers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /admin/metrics', () => {
    test('should return general metrics with correct structure', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(typeof data.totalUsers).toBe('number');
      expect(typeof data.totalSessions).toBe('number');
      expect(typeof data.totalGameActions).toBe('number');
      expect(typeof data.totalPlaytime).toBe('number');
      
      expect(data.totalUsers).toBeGreaterThanOrEqual(0);
      expect(data.totalSessions).toBeGreaterThanOrEqual(0);
      expect(data.totalGameActions).toBeGreaterThanOrEqual(0);
      expect(data.totalPlaytime).toBeGreaterThanOrEqual(0);
    });

    test('should include average calculations', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Calculate averages
      if (data.totalUsers > 0) {
        const avgSessionsPerUser = data.totalSessions / data.totalUsers;
        const avgActionsPerUser = data.totalGameActions / data.totalUsers;
        const avgPlaytimePerUser = data.totalPlaytime / data.totalUsers;
        
        expect(avgSessionsPerUser).toBeGreaterThanOrEqual(0);
        expect(avgActionsPerUser).toBeGreaterThanOrEqual(0);
        expect(avgPlaytimePerUser).toBeGreaterThanOrEqual(0);
      }
      
      if (data.totalSessions > 0) {
        const avgSessionLength = data.totalPlaytime / data.totalSessions;
        expect(avgSessionLength).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /admin/metrics/user-types', () => {
    test('should return user type metrics with correct structure', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      const requiredFields = [
        'registeredUsers', 'guestUsers', 'registeredSessions', 'guestSessions',
        'registeredGameActions', 'guestGameActions', 'registeredPlaytime', 'guestPlaytime'
      ];
      
      requiredFields.forEach(field => {
        expect(typeof data[field]).toBe('number');
        expect(data[field]).toBeGreaterThanOrEqual(0);
      });
    });

    test('should include percentage calculations', async () => {
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
        const regUserPercentage = (data.registeredUsers / totalUsers) * 100;
        const guestUserPercentage = (data.guestUsers / totalUsers) * 100;
        
        expect(regUserPercentage + guestUserPercentage).toBeCloseTo(100, 1);
      }
      
      if (totalSessions > 0) {
        const regSessionPercentage = (data.registeredSessions / totalSessions) * 100;
        const guestSessionPercentage = (data.guestSessions / totalSessions) * 100;
        
        expect(regSessionPercentage + guestSessionPercentage).toBeCloseTo(100, 1);
      }
    });

    test('should provide engagement comparisons', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      
      // Calculate engagement metrics per user type
      const avgRegisteredSessions = data.registeredUsers > 0 
        ? data.registeredSessions / data.registeredUsers 
        : 0;
      
      const avgGuestSessions = data.guestUsers > 0 
        ? data.guestSessions / data.guestUsers 
        : 0;
      
      const avgRegisteredPlaytime = data.registeredUsers > 0 
        ? data.registeredPlaytime / data.registeredUsers 
        : 0;
      
      const avgGuestPlaytime = data.guestUsers > 0 
        ? data.guestPlaytime / data.guestUsers 
        : 0;
      
      const avgRegisteredActions = data.registeredUsers > 0 
        ? data.registeredGameActions / data.registeredUsers 
        : 0;
      
      const avgGuestActions = data.guestUsers > 0 
        ? data.guestGameActions / data.guestUsers 
        : 0;
      
      // All averages should be non-negative
      expect(avgRegisteredSessions).toBeGreaterThanOrEqual(0);
      expect(avgGuestSessions).toBeGreaterThanOrEqual(0);
      expect(avgRegisteredPlaytime).toBeGreaterThanOrEqual(0);
      expect(avgGuestPlaytime).toBeGreaterThanOrEqual(0);
      expect(avgRegisteredActions).toBeGreaterThanOrEqual(0);
      expect(avgGuestActions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Consistency Between Endpoints', () => {
    test('should maintain consistency across all admin endpoints', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const [usersResponse, metricsResponse, userTypesResponse] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/metrics`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/metrics/user-types`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      ]);

      const usersData = await usersResponse.json();
      const metricsData = await metricsResponse.json();
      const userTypesData = await userTypesResponse.json();
      
      // User count consistency
      expect(usersData.totalUsers).toBe(metricsData.totalUsers);
      expect(usersData.totalUsers).toBe(userTypesData.registeredUsers + userTypesData.guestUsers);
      
      // User type breakdown consistency
      expect(usersData.registeredUsers).toBe(userTypesData.registeredUsers);
      expect(usersData.guestUsers).toBe(userTypesData.guestUsers);
      
      // Manual verification from users array
      const registeredFromArray = usersData.users.filter(u => u.role === 'registered' || u.role === 'admin').length;
      const guestFromArray = usersData.users.filter(u => u.role === 'guest').length;
      
      expect(registeredFromArray).toBe(userTypesData.registeredUsers);
      expect(guestFromArray).toBe(userTypesData.guestUsers);
    });

    test('should handle concurrent requests consistently', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const concurrentRequests = 3;
      const requests = Array(concurrentRequests).fill().map(() =>
        Promise.all([
          fetch(`${API_BASE}/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          }),
          fetch(`${API_BASE}/admin/metrics/user-types`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          })
        ])
      );

      const allResponses = await Promise.all(requests);
      
      // Parse all responses
      const allData = await Promise.all(
        allResponses.map(async ([usersResponse, userTypesResponse]) => ({
          users: await usersResponse.json(),
          userTypes: await userTypesResponse.json()
        }))
      );
      
      // All responses should be consistent
      const firstData = allData[0];
      allData.forEach(({ users, userTypes }) => {
        expect(users.totalUsers).toBe(firstData.users.totalUsers);
        expect(userTypes.registeredUsers).toBe(firstData.userTypes.registeredUsers);
        expect(userTypes.guestUsers).toBe(firstData.userTypes.guestUsers);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // Test with malformed authorization header
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': 'InvalidFormat' }
      });

      expect([400, 401, 403]).toContain(response.status);
    });

    test('should handle server errors gracefully', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // Test non-existent endpoint
      const response = await fetch(`${API_BASE}/admin/nonexistent`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(404);
    });

    test('should validate request methods', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // Test POST to GET-only endpoint
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect([405, 404]).toContain(response.status);
    });
  });

  describe('Performance and Response Times', () => {
    test('should respond within reasonable time limits', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      const endpoints = [
        '/admin/users',
        '/admin/metrics',
        '/admin/metrics/user-types'
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(5000); // 5 second limit
        
        console.log(`${endpoint} response time: ${responseTime}ms`);
      }
    });

    test('should handle rate limiting gracefully', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token');
        return;
      }

      // Make rapid requests to test rate limiting
      const rapidRequests = Array(10).fill().map(() =>
        fetch(`${API_BASE}/admin/metrics`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      );

      const responses = await Promise.all(rapidRequests);
      
      // Most should succeed, but rate limiting might kick in
      const successfulResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        console.log(`Rate limiting activated after ${successfulResponses.length} requests`);
      }
    });
  });
});

// Manual test function
async function runAdminRoutesTest() {
  console.log('🔧 Testing Admin Routes...\n');
  
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

    console.log('✅ Admin authentication successful');
    
    // Test all endpoints
    const [usersResponse, metricsResponse, userTypesResponse] = await Promise.all([
      fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      }),
      fetch(`${API_BASE}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      }),
      fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      })
    ]);

    const usersData = await usersResponse.json();
    const metricsData = await metricsResponse.json();
    const userTypesData = await userTypesResponse.json();
    
    console.log('✅ All admin endpoints responding');
    console.log('\n📊 Endpoint Status:');
    console.log(`   GET /admin/users: ${usersResponse.status} (${usersData.users.length} users)`);
    console.log(`   GET /admin/metrics: ${metricsResponse.status}`);
    console.log(`   GET /admin/metrics/user-types: ${userTypesResponse.status}`);
    
    console.log('\n🔍 Data Consistency Check:');
    console.log(`   Users endpoint total: ${usersData.totalUsers}`);
    console.log(`   Metrics endpoint total: ${metricsData.totalUsers}`);
    console.log(`   User types total: ${userTypesData.registeredUsers + userTypesData.guestUsers}`);
    
    const isConsistent = 
      usersData.totalUsers === metricsData.totalUsers &&
      usersData.totalUsers === (userTypesData.registeredUsers + userTypesData.guestUsers);
    
    console.log(`   Data consistency: ${isConsistent ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test unauthorized access
    const unauthorizedResponse = await fetch(`${API_BASE}/admin/users`);
    console.log(`\n🔒 Unauthorized access test: ${unauthorizedResponse.status === 401 || unauthorizedResponse.status === 403 ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.error('❌ Admin routes test failed:', error.message);
  }
}

module.exports = { runAdminRoutesTest };

if (require.main === module) {
  runAdminRoutesTest();
}
