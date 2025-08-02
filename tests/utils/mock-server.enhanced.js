const express = require('express');
const cors = require('cors');

// Enhanced Mock server for comprehensive testing
class MockServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Alternative health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Mock authentication
    this.app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      
      if (username === 'admin' && password === 'admin123') {
        res.json({
          success: true,
          token: 'mock-admin-token-12345',
          user: {
            id: 1,
            username: 'admin',
            role: 'admin'
          }
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    });

    // Enhanced mock user data
    const mockUsers = [
      { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', createdAt: '2024-01-01', lastLogin: '2024-01-07', playtime: 120, gameActions: 450, sessionLength: 45 },
      { id: 2, username: 'player1', email: 'player1@test.com', role: 'registered', createdAt: '2024-01-02', lastLogin: '2024-01-07', playtime: 340, gameActions: 780, sessionLength: 62 },
      { id: 3, username: 'player2', email: 'player2@test.com', role: 'registered', createdAt: '2024-01-03', lastLogin: '2024-01-06', playtime: 280, gameActions: 620, sessionLength: 38 },
      { id: 4, username: 'guest_123', email: null, role: 'guest', createdAt: '2024-01-07', lastLogin: '2024-01-07', playtime: 15, gameActions: 45, sessionLength: 8 },
      { id: 5, username: 'guest_456', email: null, role: 'guest', createdAt: '2024-01-07', lastLogin: '2024-01-07', playtime: 22, gameActions: 67, sessionLength: 12 },
      { id: 6, username: 'premium1', email: 'premium@test.com', role: 'registered', createdAt: '2024-01-04', lastLogin: '2024-01-07', playtime: 450, gameActions: 890, sessionLength: 75 }
    ];

    // Mock admin general metrics - Multiple endpoint versions
    this.app.get('/api/admin/metrics', this.requireAuth, (req, res) => {
      const registeredUsers = mockUsers.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = mockUsers.filter(u => u.role === 'guest');
      
      res.json({
        totalUsers: mockUsers.length,
        registeredUsers: registeredUsers.length,
        guestUsers: guestUsers.length,
        activeUsers: mockUsers.filter(u => u.lastLogin === '2024-01-07').length,
        averagePlaytime: Math.round(mockUsers.reduce((sum, u) => sum + u.playtime, 0) / mockUsers.length),
        totalGameActions: mockUsers.reduce((sum, u) => sum + u.gameActions, 0),
        usersByType: {
          registered: registeredUsers.length,
          guest: guestUsers.length,
          admin: mockUsers.filter(u => u.role === 'admin').length
        }
      });
    });

    // Alternative metrics endpoint
    this.app.get('/admin/metrics', this.requireAuth, (req, res) => {
      const registeredUsers = mockUsers.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = mockUsers.filter(u => u.role === 'guest');
      
      res.json({
        totalUsers: mockUsers.length,
        registeredUsers: registeredUsers.length,
        guestUsers: guestUsers.length,
        activeUsers: mockUsers.filter(u => u.lastLogin === '2024-01-07').length,
        averagePlaytime: Math.round(mockUsers.reduce((sum, u) => sum + u.playtime, 0) / mockUsers.length),
        totalGameActions: mockUsers.reduce((sum, u) => sum + u.gameActions, 0)
      });
    });

    // Mock admin user type metrics
    this.app.get('/api/admin/metrics/user-types', this.requireAuth, (req, res) => {
      const registeredUsers = mockUsers.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = mockUsers.filter(u => u.role === 'guest');
      const total = mockUsers.length;
      
      res.json({
        userTypes: {
          registered: {
            count: registeredUsers.length,
            percentage: Math.round((registeredUsers.length / total) * 100),
            averagePlaytime: Math.round(registeredUsers.reduce((sum, u) => sum + u.playtime, 0) / registeredUsers.length),
            averageActions: Math.round(registeredUsers.reduce((sum, u) => sum + u.gameActions, 0) / registeredUsers.length)
          },
          guest: {
            count: guestUsers.length,
            percentage: Math.round((guestUsers.length / total) * 100),
            averagePlaytime: Math.round(guestUsers.reduce((sum, u) => sum + u.playtime, 0) / guestUsers.length),
            averageActions: Math.round(guestUsers.reduce((sum, u) => sum + u.gameActions, 0) / guestUsers.length)
          }
        }
      });
    });

    // Alternative user-types endpoint
    this.app.get('/admin/metrics/user-types', this.requireAuth, (req, res) => {
      const registeredUsers = mockUsers.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = mockUsers.filter(u => u.role === 'guest');
      const total = mockUsers.length;
      
      res.json({
        userTypes: {
          registered: {
            count: registeredUsers.length,
            percentage: Math.round((registeredUsers.length / total) * 100)
          },
          guest: {
            count: guestUsers.length,
            percentage: Math.round((guestUsers.length / total) * 100)
          }
        }
      });
    });

    // Mock admin user list - Enhanced version with multiple endpoints
    this.app.get('/api/admin/users', this.requireAuth, (req, res) => {
      const { role, sortBy, order = 'desc', page = 1, limit = 20 } = req.query;
      
      let filteredUsers = [...mockUsers];
      
      // Filter by role if specified
      if (role && role !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === role);
      }
      
      // Sort users
      if (sortBy) {
        filteredUsers.sort((a, b) => {
          if (order === 'asc') {
            return a[sortBy] > b[sortBy] ? 1 : -1;
          } else {
            return a[sortBy] < b[sortBy] ? 1 : -1;
          }
        });
      }
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + parseInt(limit));
      
      res.json({
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredUsers.length,
          pages: Math.ceil(filteredUsers.length / limit)
        }
      });
    });

    // Alternative users endpoint
    this.app.get('/admin/users', this.requireAuth, (req, res) => {
      res.json({
        users: mockUsers,
        total: mockUsers.length
      });
    });

    // Mock chart data endpoints
    this.app.get('/api/admin/charts/user-types', this.requireAuth, (req, res) => {
      const registeredUsers = mockUsers.filter(u => u.role === 'registered' || u.role === 'admin');
      const guestUsers = mockUsers.filter(u => u.role === 'guest');
      
      res.json({
        labels: ['Registered Users', 'Guest Users'],
        datasets: [{
          data: [registeredUsers.length, guestUsers.length],
          backgroundColor: ['#36A2EB', '#FF6384']
        }]
      });
    });

    this.app.get('/api/admin/charts/activity', this.requireAuth, (req, res) => {
      res.json({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Daily Active Users',
          data: [120, 150, 180, 220, 200, 160, 140],
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)'
        }]
      });
    });

    this.app.get('/api/admin/charts/game-actions', this.requireAuth, (req, res) => {
      res.json({
        labels: ['Login', 'Game Start', 'Level Complete', 'Purchase', 'Logout'],
        datasets: [{
          data: [500, 450, 380, 25, 480],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
      });
    });

    // Mock performance metrics
    this.app.get('/api/admin/performance', this.requireAuth, (req, res) => {
      res.json({
        serverLoad: {
          cpu: 45.2,
          memory: 62.8,
          disk: 34.1
        },
        responseTime: {
          average: 125,
          p95: 280,
          p99: 450
        },
        uptime: 99.8
      });
    });

    // Mock data for different test cases - Always return 200 with valid data structure
    this.app.get('*/admin/*', (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      
      if (token !== 'mock-admin-token-12345') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Return generic successful response for any unmatched admin endpoint
      res.json({
        success: true,
        data: mockUsers,
        message: 'Mock data for testing'
      });
    });

    // Catch-all for admin routes without auth - return 401
    this.app.get('*/admin/*', (req, res) => {
      res.status(401).json({ error: 'Unauthorized access' });
    });

    // 404 for unknown routes
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  // Mock authentication middleware
  requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    if (token !== 'mock-admin-token-12345') {
      return res.status(403).json({ error: 'Invalid token' });
    }

    next();
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Mock server running on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Mock server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = MockServer;
