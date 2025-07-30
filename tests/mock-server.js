const express = require('express');
const cors = require('cors');

// Mock server for testing
class MockServer {
  constructor(port = 3001) {
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

    // Mock authentication
    this.app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      
      if (username === 'admin' && password === 'admin123') {
        res.json({
          token: 'mock-admin-token-12345',
          user: {
            id: 1,
            username: 'admin',
            role: 'admin'
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    // Mock admin user metrics
    this.app.get('/api/admin/users/metrics', this.requireAuth, (req, res) => {
      res.json({
        totalUsers: 1250,
        activeUsers: 890,
        newUsersToday: 23,
        usersByType: {
          regular: 1100,
          premium: 150
        },
        userGrowth: [
          { date: '2024-01-01', users: 1000 },
          { date: '2024-01-02', users: 1050 },
          { date: '2024-01-03', users: 1100 },
          { date: '2024-01-04', users: 1150 },
          { date: '2024-01-05', users: 1200 },
          { date: '2024-01-06', users: 1250 }
        ]
      });
    });

    // Mock admin user list
    this.app.get('/api/admin/users', this.requireAuth, (req, res) => {
      res.json({
        users: [
          { id: 1, username: 'admin', role: 'admin', createdAt: '2024-01-01' },
          { id: 2, username: 'user1', role: 'user', createdAt: '2024-01-02' },
          { id: 3, username: 'user2', role: 'user', createdAt: '2024-01-03' },
          { id: 4, username: 'premium1', role: 'premium', createdAt: '2024-01-04' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 4,
          pages: 1
        }
      });
    });

    // Mock chart data endpoints
    this.app.get('/api/admin/charts/user-types', this.requireAuth, (req, res) => {
      res.json({
        labels: ['Regular Users', 'Premium Users', 'Admin Users'],
        datasets: [{
          data: [1100, 150, 5],
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
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

    // Unauthorized access (no token)
    this.app.get('/api/admin/*', (req, res) => {
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
      return res.status(401).json({ error: 'Invalid token' });
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
