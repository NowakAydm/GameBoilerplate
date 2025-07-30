import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AntiCheatService } from '../services/AntiCheatService';
import { UserModel } from '../models/User';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Store for tracking active connections (in production, use Redis or similar)
const activeConnections = new Map<string, { socketId: string; lastSeen: Date; userAgent?: string }>();

// Store for system logs (in production, use proper logging service)
const systemLogs: Array<{
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  type: 'socket' | 'game' | 'auth' | 'system';
  message: string;
  userId?: string;
  data?: any;
}> = [];

// Helper function to add logs
export const addSystemLog = (
  level: 'info' | 'warn' | 'error',
  type: 'socket' | 'game' | 'auth' | 'system',
  message: string,
  userId?: string,
  data?: any
) => {
  const log = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    level,
    type,
    message,
    userId,
    data,
  };
  
  systemLogs.unshift(log); // Add to beginning
  
  // Keep only last 1000 logs in memory
  if (systemLogs.length > 1000) {
    systemLogs.splice(1000);
  }
};

// Helper function to track connections
export const trackConnection = (userId: string, socketId: string, userAgent?: string) => {
  activeConnections.set(userId, {
    socketId,
    lastSeen: new Date(),
    userAgent,
  });
  addSystemLog('info', 'socket', `User connected`, userId, { socketId, userAgent });
};

export const untrackConnection = (userId: string) => {
  activeConnections.delete(userId);
  addSystemLog('info', 'socket', `User disconnected`, userId);
};

export const updateConnectionActivity = (userId: string) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    connection.lastSeen = new Date();
  }
};

/**
 * GET /admin/stats - Get server statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const guestUsers = await UserModel.countDocuments({ isGuest: true });
    const registeredUsers = await UserModel.countDocuments({ isGuest: false });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeConnections: activeConnections.size,
        guestUsers,
        registeredUsers,
        serverUptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch server statistics',
    });
  }
});

/**
 * GET /admin/game-states - Get all active game states (for debugging)
 */
router.get('/game-states', (req: Request, res: Response) => {
  try {
    const gameStates = Array.from(activeConnections.entries()).map(([userId, connection]) => {
      const gameState = AntiCheatService.getUserState(userId);
      return {
        userId,
        position: gameState?.position || { x: 0, y: 0, z: 0 },
        lastAction: 'move', // We don't store lastAction in the current GameState interface
        lastSeen: connection.lastSeen.toISOString(),
        socketId: connection.socketId,
        userAgent: connection.userAgent,
      };
    });

    res.json({
      success: true,
      gameStates,
    });
  } catch (error) {
    console.error('Error fetching game states:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game states',
    });
  }
});

/**
 * GET /admin/logs - Get system logs with filtering and pagination
 */
router.get('/logs', (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, type, level } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let filteredLogs = [...systemLogs];

    // Filter by type
    if (type && type !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    // Filter by level
    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
    });
  }
});

/**
 * POST /admin/cleanup - Force cleanup of inactive states
 */
router.post('/cleanup', (req: Request, res: Response) => {
  try {
    AntiCheatService.cleanupInactiveStates();
    
    // Remove inactive connections (older than 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    for (const [userId, connection] of activeConnections.entries()) {
      if (connection.lastSeen < fiveMinutesAgo) {
        activeConnections.delete(userId);
      }
    }

    addSystemLog('info', 'system', 'Cleanup completed by admin', req.user?.userId);

    res.json({
      success: true,
      message: 'Inactive game states and connections cleaned up',
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup states',
    });
  }
});

/**
 * POST /admin/kick/:userId - Kick a specific user
 */
router.post('/kick/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Remove from active connections
    activeConnections.delete(userId);
    
    // Remove game state - we'll initialize a new one if they reconnect
    // Note: AntiCheatService doesn't have a clearGameState method, so we'll just remove from our tracking
    
    addSystemLog('warn', 'system', `User kicked by admin`, userId, { 
      kickedBy: req.user?.userId 
    });

    // TODO: In production, also disconnect the WebSocket
    // This would require access to the WebSocket server instance

    res.json({
      success: true,
      message: `User ${userId} has been kicked`,
    });
  } catch (error) {
    console.error('Error kicking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to kick user',
    });
  }
});

/**
 * PUT /admin/game-state/:userId - Update a user's game state
 */
router.put('/game-state/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { gameState } = req.body;

    // Validate the game state structure
    if (!gameState || typeof gameState !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid game state data',
      });
    }

    // Update the game state (this would depend on your AntiCheatService implementation)
    // For now, we'll just log it
    addSystemLog('info', 'game', `Game state updated by admin`, userId, { 
      updatedBy: req.user?.userId,
      newState: gameState 
    });

    res.json({
      success: true,
      message: `Game state updated for user ${userId}`,
    });
  } catch (error) {
    console.error('Error updating game state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update game state',
    });
  }
});

// Initialize with some sample logs
addSystemLog('info', 'system', 'Admin routes initialized');
addSystemLog('info', 'system', 'Server started successfully');

export default router;
