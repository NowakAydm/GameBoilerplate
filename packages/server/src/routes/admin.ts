import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AntiCheatService } from '../services/AntiCheatService';
import { UserModel } from '../models/User';
import { metricsTracker } from '../services/MetricsService';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

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

// Initialize with some sample data for mock mode
if (process.env.MOCK_MODE === 'true') {
  metricsTracker.initializeMockData();
  
  // Add some mock active sessions
  metricsTracker.trackUserConnection('admin123', 'socket1', 'admin', 'admin@example.com', 'admin', false);
  metricsTracker.trackUserConnection('user123', 'socket2', 'testuser', 'user@example.com', 'registered', false);
  metricsTracker.trackUserConnection('guest123', 'socket3', undefined, undefined, 'guest', true);
}

/**
 * GET /admin/stats - Get comprehensive server statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const dbTotalUsers = await UserModel.countDocuments();
    const dbGuestUsers = await UserModel.countDocuments({ isGuest: true });
    const dbRegisteredUsers = await UserModel.countDocuments({ isGuest: false });

    const gameMetrics = metricsTracker.getGameMetrics();

    res.json({
      success: true,
      stats: {
        // Database stats (real or mock)
        totalUsersDB: dbTotalUsers,
        registeredUsersDB: dbRegisteredUsers,
        guestUsersDB: dbGuestUsers,
        
        // Real-time metrics
        ...gameMetrics,
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
 * GET /admin/users - Get all users with playtime and session data
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const activeSessions = metricsTracker.getUserSessions();
    const userPlaytimes = metricsTracker.getUserPlaytimes();
    const currentSessionLengths = metricsTracker.getCurrentSessionLengths();

    // Combine active sessions with historical playtime data
    const users = userPlaytimes.map(playtime => {
      const activeSession = activeSessions.find(s => s.userId === playtime.userId);
      const currentSession = currentSessionLengths.find(s => s.userId === playtime.userId);
      
      return {
        ...playtime,
        isOnline: !!activeSession,
        currentSessionLength: currentSession?.sessionLength || 0,
        lastActivity: activeSession?.lastActivity,
        gameActions: activeSession?.totalGameActions || 0,
        gameStateRequests: activeSession?.gameStateRequests || 0,
        role: activeSession?.role || 'unknown',
        socketId: activeSession?.socketId,
      };
    });

    res.json({
      success: true,
      users,
      summary: {
        total: users.length,
        online: activeSessions.length,
        offline: users.length - activeSessions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

/**
 * GET /admin/game-states - Get all active game states with enhanced data
 */
router.get('/game-states', (req: Request, res: Response) => {
  try {
    const activeSessions = metricsTracker.getUserSessions();
    
    const gameStates = activeSessions.map(session => {
      const gameState = AntiCheatService.getUserState(session.userId);
      const sessionLength = Math.floor((Date.now() - session.connectedAt.getTime()) / (1000 * 60));
      
      return {
        userId: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        position: gameState?.position || { x: 0, y: 0, z: 0 },
        health: gameState?.health || 100,
        level: gameState?.level || 1,
        experience: gameState?.experience || 0,
        gold: gameState?.gold || 0,
        lastAction: 'move', // We don't store lastAction in the current GameState interface
        lastSeen: session.lastActivity.toISOString(),
        sessionLength,
        gameActions: session.totalGameActions,
        gameStateRequests: session.gameStateRequests,
        socketId: session.socketId,
        userAgent: session.userAgent,
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
 * GET /admin/metrics/user-types - Get metrics broken down by user type (guest vs registered)
 */
router.get('/metrics/user-types', (req: Request, res: Response) => {
  try {
    const gameMetrics = metricsTracker.getGameMetrics();
    
    const userTypeMetrics = {
      totals: {
        totalUsers: gameMetrics.totalUsers,
        registeredUsers: gameMetrics.registeredUsers,
        guestUsers: gameMetrics.guestUsers,
      },
      sessions: {
        totalSessions: gameMetrics.totalGameSessions,
        registeredSessions: gameMetrics.registeredSessions,
        guestSessions: gameMetrics.guestSessions,
      },
      gameActions: {
        totalGameActions: gameMetrics.totalGameActions,
        registeredGameActions: gameMetrics.registeredGameActions,
        guestGameActions: gameMetrics.guestGameActions,
      },
      playtime: {
        totalPlaytime: gameMetrics.totalPlaytime,
        registeredPlaytime: gameMetrics.registeredPlaytime,
        guestPlaytime: gameMetrics.guestPlaytime,
      },
      percentages: {
        registeredUserPercentage: gameMetrics.totalUsers > 0 ? Math.round((gameMetrics.registeredUsers / gameMetrics.totalUsers) * 100) : 0,
        guestUserPercentage: gameMetrics.totalUsers > 0 ? Math.round((gameMetrics.guestUsers / gameMetrics.totalUsers) * 100) : 0,
        registeredSessionPercentage: gameMetrics.totalGameSessions > 0 ? Math.round((gameMetrics.registeredSessions / gameMetrics.totalGameSessions) * 100) : 0,
        guestSessionPercentage: gameMetrics.totalGameSessions > 0 ? Math.round((gameMetrics.guestSessions / gameMetrics.totalGameSessions) * 100) : 0,
        registeredActionPercentage: gameMetrics.totalGameActions > 0 ? Math.round((gameMetrics.registeredGameActions / gameMetrics.totalGameActions) * 100) : 0,
        guestActionPercentage: gameMetrics.totalGameActions > 0 ? Math.round((gameMetrics.guestGameActions / gameMetrics.totalGameActions) * 100) : 0,
      },
    };

    res.json({
      success: true,
      metrics: userTypeMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user type metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user type metrics',
    });
  }
});

/**
 * GET /admin/metrics/charts - Get chart data for analytics
 */
router.get('/metrics/charts', (req: Request, res: Response) => {
  try {
    const connectionHistory = metricsTracker.getConnectionHistory();
    const gameActionHistory = metricsTracker.getGameActionHistory();
    const gameStateRequestHistory = metricsTracker.getGameStateRequestHistory();
    const actionTypeDistribution = metricsTracker.getActionTypeDistribution();

    // Process data for different chart types
    const playerCountOverTime = connectionHistory.map(point => ({
      time: point.timestamp.toISOString(),
      players: point.value,
    }));

    // Aggregate game actions by hour
    const gameActionsPerHour: { [hour: string]: number } = {};
    gameActionHistory.forEach(action => {
      const hour = action.timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      gameActionsPerHour[hour] = (gameActionsPerHour[hour] || 0) + 1;
    });

    const gameActivityTimeline = Object.entries(gameActionsPerHour).map(([hour, count]) => ({
      time: hour + ':00:00.000Z',
      actions: count,
    }));

    // Aggregate game state requests by hour
    const gameStateRequestsPerHour: { [hour: string]: number } = {};
    gameStateRequestHistory.forEach(request => {
      const hour = request.timestamp.toISOString().slice(0, 13);
      gameStateRequestsPerHour[hour] = (gameStateRequestsPerHour[hour] || 0) + 1;
    });

    const gameStateRequestTimeline = Object.entries(gameStateRequestsPerHour).map(([hour, count]) => ({
      time: hour + ':00:00.000Z',
      requests: count,
    }));

    res.json({
      success: true,
      charts: {
        playerCountOverTime,
        gameActivityTimeline,
        gameStateRequestTimeline,
        actionTypeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data',
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
    
    addSystemLog('info', 'system', 'Cleanup completed by admin', req.user?.userId);

    res.json({
      success: true,
      message: 'Inactive game states cleaned up',
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
    
    // Remove from active sessions
    metricsTracker.trackUserDisconnection(userId);
    
    addSystemLog('warn', 'system', `User kicked by admin`, userId, { 
      kickedBy: req.user?.userId 
    });

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
 * GET /admin/user/:userId - Get detailed user information
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get user from database (or mock data)
    const userDoc = await UserModel.findById(userId);
    if (!userDoc && process.env.MOCK_MODE !== 'true') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get session and playtime data
    const activeSessions = metricsTracker.getUserSessions();
    const userPlaytimes = metricsTracker.getUserPlaytimes();
    
    const activeSession = activeSessions.find(s => s.userId === userId);
    const playtimeData = userPlaytimes.find(p => p.userId === userId);
    const gameState = activeSession ? AntiCheatService.getUserState(userId) : null;

    const userDetails = {
      id: userId,
      username: userDoc?.username || activeSession?.username,
      email: userDoc?.email || activeSession?.email,
      role: userDoc?.role || activeSession?.role,
      isGuest: userDoc?.isGuest ?? activeSession?.isGuest,
      createdAt: userDoc?.createdAt,
      lastLogin: userDoc?.lastLogin,
      
      // Session data
      isOnline: !!activeSession,
      currentSession: activeSession ? {
        connectedAt: activeSession.connectedAt,
        lastActivity: activeSession.lastActivity,
        sessionLength: Math.floor((Date.now() - activeSession.connectedAt.getTime()) / (1000 * 60)),
        gameActions: activeSession.totalGameActions,
        gameStateRequests: activeSession.gameStateRequests,
        socketId: activeSession.socketId,
        userAgent: activeSession.userAgent,
      } : null,
      
      // Playtime data
      playtime: playtimeData || {
        totalPlaytime: 0,
        sessionCount: 0,
        averageSessionLength: 0,
        lastSession: null,
      },
      
      // Game state
      gameState,
    };

    res.json({
      success: true,
      user: userDetails,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
    });
  }
});

// Initialize with some sample logs
addSystemLog('info', 'system', 'Admin routes initialized');
addSystemLog('info', 'system', 'Enhanced metrics tracking started');

export default router;
