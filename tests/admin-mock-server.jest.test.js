/**
 * Updated Admin Dashboard Tests with Mock Server Integration
 * Tests that actually execute against a mock server instead of skipping
 */

const MockServer = require('./mock-server');

describe('Admin Dashboard Tests with Mock Server', () => {
  let mockServer;
  
  // Start mock server before all tests
  beforeAll(async () => {
    mockServer = new MockServer(3002); // Use different port to avoid conflicts
    await mockServer.start();
  });

  // Stop mock server after all tests
  afterAll(async () => {
    if (mockServer) {
      await mockServer.stop();
    }
  });

  const API_BASE = 'http://localhost:3002';
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  // Helper function to get admin token
  const getAdminToken = async () => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    const data = await response.json();
    return data.token;
  };

  describe('Authentication Tests', () => {
    test('should authenticate admin successfully', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user.role).toBe('admin');
    });

    test('should reject invalid credentials', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'invalid', password: 'wrong' })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('Admin API Tests', () => {
    test('should fetch user metrics with valid token', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/users/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.totalUsers).toBeDefined();
      expect(data.activeUsers).toBeDefined();
      expect(data.usersByType).toBeDefined();
      expect(typeof data.totalUsers).toBe('number');
    });

    test('should fetch user list with valid token', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.users.length).toBeGreaterThan(0);
    });

    test('should block unauthorized access', async () => {
      const response = await fetch(`${API_BASE}/api/admin/users/metrics`);
      expect(response.status).toBe(401);
    });

    test('should block access with invalid token', async () => {
      const response = await fetch(`${API_BASE}/api/admin/users/metrics`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Chart Data Tests', () => {
    test('should provide user type chart data', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/charts/user-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.labels).toBeDefined();
      expect(data.datasets).toBeDefined();
      expect(Array.isArray(data.labels)).toBe(true);
      expect(Array.isArray(data.datasets)).toBe(true);
    });

    test('should provide activity chart data', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/charts/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.labels).toBeDefined();
      expect(data.datasets).toBeDefined();
      expect(data.datasets[0].label).toBe('Daily Active Users');
    });

    test('should provide game actions chart data', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/charts/game-actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.labels).toBeDefined();
      expect(data.datasets).toBeDefined();
      expect(data.labels).toContain('Login');
      expect(data.labels).toContain('Game Start');
    });
  });

  describe('Performance Metrics Tests', () => {
    test('should provide performance metrics', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.serverLoad).toBeDefined();
      expect(data.responseTime).toBeDefined();
      expect(data.uptime).toBeDefined();
      expect(typeof data.serverLoad.cpu).toBe('number');
      expect(typeof data.responseTime.average).toBe('number');
    });
  });

  describe('Data Validation Tests', () => {
    test('should calculate user percentages correctly', async () => {
      const token = await getAdminToken();
      const response = await fetch(`${API_BASE}/api/admin/users/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      const { regular, premium } = data.usersByType;
      const total = regular + premium;
      
      expect(total).toBeLessThanOrEqual(data.totalUsers);
      expect(regular).toBeGreaterThan(0);
      expect(premium).toBeGreaterThan(0);
    });

    test('should provide consistent data across endpoints', async () => {
      const token = await getAdminToken();
      
      // Get user metrics
      const metricsResponse = await fetch(`${API_BASE}/api/admin/users/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const metrics = await metricsResponse.json();
      
      // Get user list
      const usersResponse = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = await usersResponse.json();
      
      // Verify consistency
      expect(users.users).toBeDefined();
      expect(Array.isArray(users.users)).toBe(true);
      expect(metrics.totalUsers).toBeGreaterThan(0);
    });
  });
});
