import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import gameRoutes from './game';
import adminRoutes from './admin';

const router = Router();

// Mount all API route modules under their respective paths
router.use('/auth', authRoutes);
router.use('/user', userRoutes); 
router.use('/game', gameRoutes);
router.use('/admin', adminRoutes);

// API Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GameBoilerplate API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      user: '/api/user/*',
      game: '/api/game/*', 
      admin: '/api/admin/*',
    },
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      auth: {
        description: 'Authentication and user registration endpoints',
        endpoints: [
          'POST /api/auth/guest - Create guest user',
          'POST /api/auth/register - Register new user',
          'POST /api/auth/login - Login existing user',
          'POST /api/auth/upgrade - Upgrade guest to registered',
          'GET /api/auth/me - Get current user info',
        ],
      },
      user: {
        description: 'User profile and game data management',
        endpoints: [
          'GET /api/user/profile - Get user profile',
          'PUT /api/user/profile - Update user profile',
          'GET /api/user/game-data - Get user game data',
          'PUT /api/user/game-data - Update user game data',
          'PUT /api/user/position - Update user position',
          'PUT /api/user/stats - Update user stats',
          'POST /api/user/inventory/add - Add item to inventory',
          'DELETE /api/user/inventory/:itemId - Remove item from inventory',
          'GET /api/user/sessions - Get user session history',
        ],
      },
      game: {
        description: 'Game state and action management',
        endpoints: [
          'GET /api/game/state - Get current game state',
          'POST /api/game/action - Execute game action',
          'GET /api/game/leaderboard - Get game leaderboard',
          'GET /api/game/inventory/:userId? - Get player inventory',
          'POST /api/game/initialize - Initialize player',
          'GET /api/game/stats - Get game statistics',
        ],
      },
      admin: {
        description: 'Administrative endpoints (requires admin role)',
        endpoints: [
          'GET /api/admin/stats - Get server statistics',
          'GET /api/admin/users - Get all users',
          'GET /api/admin/game-states - Get active game states',
          'GET /api/admin/metrics/user-types - Get user type metrics',
          'GET /api/admin/metrics/charts - Get chart data',
          'GET /api/admin/logs - Get system logs',
          'POST /api/admin/actions/cleanup - Cleanup inactive states',
          'POST /api/admin/actions/kick/:userId - Kick user',
          'GET /api/admin/user/:userId - Get detailed user info',
          'GET /api/admin/backups - List backups',
          'POST /api/admin/backups/create - Create backup',
        ],
      },
    },
  });
});

export default router;
