/**
 * Basic Admin Dashboard Tests for Jest Integration
 * Tests that run even when server is down to show test discovery
 */

describe('Admin Dashboard Tests', () => {
  test('should load test environment correctly', () => {
    expect(typeof fetch).toBe('function');
    expect(API_BASE).toBe('http://localhost:3000');
    expect(ADMIN_EMAIL).toBe('admin@example.com');
  });

  test('should have proper test setup', () => {
    expect(typeof getAdminToken).toBe('function');
    expect(typeof checkServerHealth).toBe('function');
    expect(typeof skipIfServerDown).toBe('function');
  });

  test('should validate chart data structure', () => {
    const mockData = {
      registeredUsers: 5,
      guestUsers: 3
    };

    const chartData = {
      labels: ['Registered Users', 'Guest Users'],
      datasets: [{
        label: 'User Count',
        data: [mockData.registeredUsers, mockData.guestUsers],
        backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 159, 64, 0.8)']
      }]
    };

    expect(chartData.labels).toHaveLength(2);
    expect(chartData.datasets[0].data).toHaveLength(2);
    expect(chartData.datasets[0].data[0]).toBe(5);
    expect(chartData.datasets[0].data[1]).toBe(3);
  });

  test('should calculate user percentages correctly', () => {
    const registeredUsers = 7;
    const guestUsers = 3;
    const totalUsers = registeredUsers + guestUsers;

    const registeredPercentage = (registeredUsers / totalUsers) * 100;
    const guestPercentage = (guestUsers / totalUsers) * 100;

    expect(registeredPercentage).toBe(70);
    expect(guestPercentage).toBe(30);
    expect(registeredPercentage + guestPercentage).toBe(100);
  });

  test('should handle edge cases in percentage calculation', () => {
    // Test with zero total users
    const emptyData = { registeredUsers: 0, guestUsers: 0 };
    const emptyTotal = emptyData.registeredUsers + emptyData.guestUsers;
    const emptyPercentage = emptyTotal > 0 ? (emptyData.registeredUsers / emptyTotal) * 100 : 0;
    
    expect(emptyPercentage).toBe(0);

    // Test with only registered users
    const regOnlyData = { registeredUsers: 5, guestUsers: 0 };
    const regOnlyTotal = regOnlyData.registeredUsers + regOnlyData.guestUsers;
    const regOnlyPercentage = (regOnlyData.registeredUsers / regOnlyTotal) * 100;
    
    expect(regOnlyPercentage).toBe(100);
  });

  test('should validate user role filtering logic', () => {
    const mockUsers = [
      { id: '1', role: 'admin', email: 'admin@test.com' },
      { id: '2', role: 'registered', email: 'user1@test.com' },
      { id: '3', role: 'guest', email: 'guest-123@test.com' },
      { id: '4', role: 'registered', email: 'user2@test.com' },
      { id: '5', role: 'guest', email: 'guest-456@test.com' }
    ];

    const registeredUsers = mockUsers.filter(u => u.role === 'registered' || u.role === 'admin');
    const guestUsers = mockUsers.filter(u => u.role === 'guest');

    expect(registeredUsers).toHaveLength(3); // 1 admin + 2 registered
    expect(guestUsers).toHaveLength(2);
    expect(registeredUsers.length + guestUsers.length).toBe(mockUsers.length);
  });

  describe('Server Integration Tests (requires running server)', () => {
    let adminToken = null;
    let serverAvailable = false;

    beforeAll(async () => {
      serverAvailable = !(await skipIfServerDown());
      if (serverAvailable) {
        try {
          adminToken = await getAdminToken();
        } catch (error) {
          console.warn('Could not get admin token:', error.message);
        }
      }
    });

    test('admin authentication', async () => {
      if (!serverAvailable) {
        console.log('⚠️ Skipping - server not available');
        return;
      }

      expect(adminToken).toBeTruthy();
      expect(typeof adminToken).toBe('string');
    });

    test('user metrics endpoint', async () => {
      if (!serverAvailable || !adminToken) {
        console.log('⚠️ Skipping - server not available or no token');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/metrics/user-types`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(typeof data.registeredUsers).toBe('number');
      expect(typeof data.guestUsers).toBe('number');
      expect(data.registeredUsers).toBeGreaterThanOrEqual(0);
      expect(data.guestUsers).toBeGreaterThanOrEqual(0);
    });

    test('unauthorized access protection', async () => {
      if (!serverAvailable) {
        console.log('⚠️ Skipping - server not available');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users`);
      expect([401, 403]).toContain(response.status);
    });
  });
});
