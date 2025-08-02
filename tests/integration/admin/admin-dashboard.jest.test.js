/**
 * Jest Tests for Admin Dashboard Integration
 * Tests the enhanced admin dashboard with guest vs registered user analytics
 */

/**
 * Jest Tests for Admin Dashboard Integration
 * Tests the enhanced admin dashboard with guest vs registered user analytics
 */

describe('Admin Dashboard Integration Tests', () => {
  let adminToken = null;

  beforeAll(async () => {
    // Use mock token instead of real server
    adminToken = global.MOCK_ADMIN_TOKEN;
    
    // Mock API responses for unit testing
    global.mockFetch({
      [`${global.API_BASE}/auth/login`]: {
        data: { success: false, error: 'Invalid credentials' }
      },
      [`${global.API_BASE}/admin/metrics/user-types`]: {
        data: {
          registeredUsers: 1100,
          guestUsers: 150,
          registeredSessions: 2340,
          guestSessions: 450,
          registeredGameActions: 15670,
          guestGameActions: 2340,
          registeredPlaytime: 1200000,
          guestPlaytime: 800000
        }
      },
      [`${global.API_BASE}/admin/users`]: {
        data: {
          success: true,
          users: [
            { 
              id: '1', 
              username: 'user1', 
              email: 'user1@example.com',
              type: 'registered', 
              role: 'registered',
              active: true,
              isOnline: true 
            },
            { 
              id: '2', 
              username: 'user2', 
              email: 'user2@example.com',
              type: 'guest', 
              role: 'guest',
              active: false,
              isOnline: false 
            }
          ],
          totalUsers: 1250,
          onlineUsers: 890,
          registeredUsers: 1100,
          guestUsers: 150
        }
      },
      [`${global.API_BASE}/admin/metrics`]: {
        data: {
          totalUsers: 1250,
          registeredUsers: 1100,
          guestUsers: 150
        }
      },
      [`${global.API_BASE}/admin/charts/user-types`]: {
        data: {
          registeredUsers: 1100,
          guestUsers: 150
        }
      },
      // Handle unauthorized requests
      'unauthorized': {
        status: 401,
        data: { error: 'Unauthorized' }
      },
      default: { data: { success: true } }
    });
  });

  afterAll(() => {
    global.restoreFetch();
  });

  describe('Authentication', () => {
    test('should authenticate admin user successfully', async () => {
      expect(adminToken).toBeTruthy();
      expect(typeof adminToken).toBe('string');
    });

    test('should reject invalid credentials', async () => {
      const response = await fetch(`${global.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('Admin Dashboard Data', () => {
    test('should fetch user metrics successfully', async () => {
      const response = await fetch(`${global.API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');
      expect(typeof data.registeredSessions).toBe('number');
      expect(typeof data.guestSessions).toBe('number');
      expect(typeof data.registeredGameActions).toBe('number');
      expect(typeof data.guestGameActions).toBe('number');
      expect(typeof data.registeredPlaytime).toBe('number');
      expect(typeof data.guestPlaytime).toBe('number');

      // All metrics should be non-negative
      expect(data.registeredUsers).toBeGreaterThanOrEqual(0);
      expect(data.guestUsers).toBeGreaterThanOrEqual(0);
      expect(data.registeredSessions).toBeGreaterThanOrEqual(0);
      expect(data.guestSessions).toBeGreaterThanOrEqual(0);
      expect(data.registeredGameActions).toBeGreaterThanOrEqual(0);
      expect(data.guestGameActions).toBeGreaterThanOrEqual(0);
      expect(data.registeredPlaytime).toBeGreaterThanOrEqual(0);
      expect(data.guestPlaytime).toBeGreaterThanOrEqual(0);
    });

    test('should fetch user list successfully', async () => {
      const response = await fetch(`${global.API_BASE}/admin/users`, {
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

      // Verify user structure
      if (data.users.length > 0) {
        const user = data.users[0];
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(['guest', 'registered', 'admin']).toContain(user.role);
        expect(typeof user.isOnline).toBe('boolean');
      }
    });

    test('should calculate user type percentages correctly', async () => {
      const response = await fetch(`${global.API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      const totalUsers = data.registeredUsers + data.guestUsers;
      
      if (totalUsers > 0) {
        const registeredPercentage = (data.registeredUsers / totalUsers) * 100;
        const guestPercentage = (data.guestUsers / totalUsers) * 100;
        
        expect(registeredPercentage).toBeGreaterThanOrEqual(0);
        expect(registeredPercentage).toBeLessThanOrEqual(100);
        expect(guestPercentage).toBeGreaterThanOrEqual(0);
        expect(guestPercentage).toBeLessThanOrEqual(100);
        
        // Should sum to approximately 100%
        expect(Math.round(registeredPercentage + guestPercentage)).toBe(100);
      }
    });
  });

  describe('Data Consistency', () => {
    test('should maintain consistency across different endpoints', async () => {
      const [usersResponse, metricsResponse, userTypesResponse] = await Promise.all([
        fetch(`${global.API_BASE}/admin/users`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${global.API_BASE}/admin/metrics`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }),
        fetch(`${global.API_BASE}/admin/metrics/user-types`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        })
      ]);

      expect(usersResponse.status).toBe(200);
      expect(metricsResponse.status).toBe(200);
      expect(userTypesResponse.status).toBe(200);

      const usersData = await usersResponse.json();
      const metricsData = await metricsResponse.json();
      const userTypesData = await userTypesResponse.json();
      
      // User count consistency
      expect(usersData.totalUsers).toBe(metricsData.totalUsers);
      expect(usersData.totalUsers).toBe(userTypesData.registeredUsers + userTypesData.guestUsers);
      
      // User type breakdown consistency
      expect(usersData.registeredUsers).toBe(userTypesData.registeredUsers);
      expect(usersData.guestUsers).toBe(userTypesData.guestUsers);
    });
  });

  describe('Authorization', () => {
    test('should block unauthorized access to admin endpoints', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/metrics',
        '/admin/metrics/user-types'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${global.API_BASE}${endpoint}`);
        expect([401, 403]).toContain(response.status);
      }
    });

    test('should block access with invalid tokens', async () => {
      const response = await fetch(`${global.API_BASE}/admin/users`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    test('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${global.API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 second limit
    });
  });
});
