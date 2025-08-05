import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { AntiCheatService } from '../../services/AntiCheatService';
import { gameDataService } from '../../services/GameDataService';
import { metricsTracker } from '../../services/MetricsService';
import { UserService } from '../../services/UserService';

const router = Router();

// All game routes require authentication
router.use(authenticateToken);

// Create a UserService instance
const userService = new UserService();

/**
 * GET /api/game/state - Get current game state for user
 */
router.get('/state', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    // Get current game state from AntiCheatService
    const gameState = AntiCheatService.getUserState(userId);
    
    // Get persisted game data from database
    const gameData = await userService.getUserGameData(userId);

    res.json({
      success: true,
      gameState: gameState || {
        position: { x: 0, y: 0, z: 0 },
        health: 100,
        experience: 0,
        level: 1,
      },
      gameData,
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game state',
    });
  }
});

/**
 * POST /api/game/action - Execute a game action
 */
router.post('/action', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { action } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    if (!action || !action.type) {
      return res.status(400).json({
        success: false,
        error: 'Valid action with type is required',
      });
    }

    // Track the game action in metrics
    metricsTracker.trackGameAction(userId, action.type);

    // For now, we'll handle basic actions directly
    // In a full implementation, this would go through the game engine
    switch (action.type) {
      case 'move':
        if (action.position && typeof action.position === 'object') {
          await userService.updatePlayerPosition(userId, action.position);
          
          res.json({
            success: true,
            action: action.type,
            result: { position: action.position },
            message: 'Move action executed successfully',
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Position is required for move action',
          });
        }
        break;
        
      case 'gainExperience':
        if (typeof action.amount === 'number' && action.amount > 0) {
          const currentData = await userService.getUserGameData(userId);
          const newExperience = (currentData?.experience || 0) + action.amount;
          let newLevel = currentData?.level || 1;
          
          // Simple level calculation (every 1000 exp = 1 level)
          if (newExperience >= newLevel * 1000) {
            newLevel = Math.floor(newExperience / 1000) + 1;
          }
          
          await userService.updatePlayerStats(userId, newLevel, newExperience);
          
          res.json({
            success: true,
            action: action.type,
            result: { level: newLevel, experience: newExperience },
            message: 'Experience gained successfully',
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Valid amount is required for gainExperience action',
          });
        }
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: `Unknown action type: ${action.type}`,
        });
    }
  } catch (error) {
    console.error('Error executing game action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute game action',
    });
  }
});

/**
 * GET /api/game/leaderboard - Get game leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = 10, sortBy = 'level' } = req.query;
    
    // Get all users and sort by specified criteria
    const users = await userService.getAllUsers();
    
    const leaderboard = users
      .filter(user => user.gameData) // Only users with game data
      .sort((a, b) => {
        if (sortBy === 'level') {
          return (b.gameData?.level || 0) - (a.gameData?.level || 0);
        } else if (sortBy === 'experience') {
          return (b.gameData?.experience || 0) - (a.gameData?.experience || 0);
        }
        return 0;
      })
      .slice(0, Number(limit))
      .map((user, index) => ({
        rank: index + 1,
        userId: user._id,
        username: user.username || 'Anonymous',
        level: user.gameData?.level || 1,
        experience: user.gameData?.experience || 0,
        isGuest: user.isGuest,
      }));

    res.json({
      success: true,
      leaderboard,
      sortBy,
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

/**
 * GET /api/game/inventory - Get current user's inventory
 */
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const gameData = await userService.getUserGameData(currentUserId);

    res.json({
      success: true,
      userId: currentUserId,
      inventory: gameData?.inventory || [],
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
});

/**
 * GET /api/game/inventory/:userId - Get specific user's inventory (admin only)
 */
router.get('/inventory/:userId', async (req: Request, res: Response) => {
  try {
    const requestedUserId = req.params.userId;
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    // Allow viewing other users' inventory only for admins
    if (requestedUserId !== currentUserId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view this inventory',
      });
    }

    const gameData = await userService.getUserGameData(requestedUserId);

    res.json({
      success: true,
      userId: requestedUserId,
      inventory: gameData?.inventory || [],
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
});

/**
 * POST /api/game/initialize - Initialize player for first-time play
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    // Initialize player using GameDataService
    await gameDataService.initializePlayer(userId);
    
    // Initialize anti-cheat state
    AntiCheatService.initializeUserState(userId);

    // Get the initialized state
    const gameData = await userService.getUserGameData(userId);
    const gameState = AntiCheatService.getUserState(userId);

    res.json({
      success: true,
      message: 'Player initialized successfully',
      gameData,
      gameState,
    });
  } catch (error) {
    console.error('Error initializing player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize player',
    });
  }
});

/**
 * GET /api/game/stats - Get game statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const gameMetrics = metricsTracker.getGameMetrics();

    res.json({
      success: true,
      stats: {
        totalPlayers: gameMetrics.totalUsers,
        activePlayers: gameMetrics.activeConnections,
        totalGameActions: gameMetrics.totalGameActions,
        registeredPlayers: gameMetrics.registeredUsers,
        guestPlayers: gameMetrics.guestUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game stats',
    });
  }
});

export default router;
