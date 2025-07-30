import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AntiCheatService } from '../services/AntiCheatService';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /admin/stats - Get server statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  // This would typically fetch real stats from database
  res.json({
    success: true,
    stats: {
      totalUsers: 0, // TODO: Implement real user count
      activeConnections: 0, // TODO: Track WebSocket connections
      guestUsers: 0,
      registeredUsers: 0,
      serverUptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /admin/game-states - Get all active game states (for debugging)
 */
router.get('/game-states', (req: Request, res: Response) => {
  // Note: In production, this should be paginated and have proper access controls
  res.json({
    success: true,
    message: 'Game states endpoint ready for implementation',
    note: 'This will show active player game states for debugging',
  });
});

/**
 * POST /admin/cleanup - Force cleanup of inactive states
 */
router.post('/cleanup', (req: Request, res: Response) => {
  try {
    AntiCheatService.cleanupInactiveStates();
    res.json({
      success: true,
      message: 'Inactive game states cleaned up',
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup inactive states',
    });
  }
});

export default router;
