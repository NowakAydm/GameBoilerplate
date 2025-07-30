/**
 * Jest Tests for Admin Dashboard Integration
 * Tests the enhanced admin dashboard with guest vs registered user analytics
 */

describe('Admin Dashboard Integration Tests', () => {
  let adminToken = null;

  beforeAll(async () => {
    const serverDown = await skipIfServerDown();
    if (serverDown) {
      return;
    }

    try {
      adminToken = await getAdminToken();
    } catch (error) {
      console.warn('Could not get admin token:', error.message);
    }
  });

  describe('Authentication', () => {
    test('should authenticate admin user successfully', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        test.skip('Server not available');
        return;
      }

      expect(adminToken).toBeTruthy();
      expect(typeof adminToken).toBe('string');
    });

    test('should reject invalid credentials', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
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
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
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
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

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

    test('should block access with invalid tokens', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    test('should respond within reasonable time limits', async () => {
      const serverDown = await skipIfServerDown();
      if (serverDown) {
        pending('Server not available');
        return;
      }

      if (!adminToken) {
        pending('No admin token available');
        return;
      }

      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 second limit
    });
  });
});
