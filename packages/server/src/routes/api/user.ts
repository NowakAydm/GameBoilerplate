import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { UserModel } from '../../models/User';
import { UserService } from '../../services/UserService';
import { gameDataService } from '../../services/GameDataService';
import { metricsTracker } from '../../services/MetricsService';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Create a UserService instance
const userService = new UserService();

/**
 * GET /api/user/profile - Get current user's profile
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

/**
 * PUT /api/user/profile - Update user profile
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { username, email } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const updatedUser = await userService.updateUserProfile(userId, {
      username,
      email,
    });

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
});

/**
 * GET /api/user/game-data - Get user's game data
 */
router.get('/game-data', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const gameData = await userService.getUserGameData(userId);

    res.json({
      success: true,
      gameData,
    });
  } catch (error) {
    console.error('Error fetching game data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game data',
    });
  }
});

/**
 * PUT /api/user/game-data - Update user's game data
 */
router.put('/game-data', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { gameData } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const updatedGameData = await userService.updateUserGameData(userId, gameData);

    res.json({
      success: true,
      gameData: updatedGameData,
      message: 'Game data updated successfully',
    });
  } catch (error) {
    console.error('Error updating game data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update game data',
    });
  }
});

/**
 * PUT /api/user/position - Update user's position
 */
router.put('/position', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { position } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Valid position coordinates (x, y, z) are required',
      });
    }

    await userService.updatePlayerPosition(userId, position);

    res.json({
      success: true,
      position,
      message: 'Position updated successfully',
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update position',
    });
  }
});

/**
 * PUT /api/user/stats - Update user's stats (level, experience)
 */
router.put('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { level, experience } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const result = await userService.updatePlayerStats(userId, level, experience);

    res.json({
      success: true,
      stats: { level, experience },
      updated: result,
      message: 'Stats updated successfully',
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stats',
    });
  }
});

/**
 * POST /api/user/inventory/add - Add item to user's inventory
 */
router.post('/inventory/add', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { item } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    if (!item || !item.id || !item.name) {
      return res.status(400).json({
        success: false,
        error: 'Valid item with id and name is required',
      });
    }

    const result = await userService.addToInventory(userId, item);

    res.json({
      success: true,
      item,
      added: result,
      message: 'Item added to inventory successfully',
    });
  } catch (error) {
    console.error('Error adding to inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to inventory',
    });
  }
});

/**
 * DELETE /api/user/inventory/:itemId - Remove item from user's inventory
 */
router.delete('/inventory/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const result = await userService.removeFromInventory(userId, itemId);

    res.json({
      success: true,
      itemId,
      removed: result,
      message: 'Item removed from inventory successfully',
    });
  } catch (error) {
    console.error('Error removing from inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from inventory',
    });
  }
});

/**
 * GET /api/user/sessions - Get user's session history
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token',
      });
    }

    const userPlaytimes = metricsTracker.getUserPlaytimes();
    const userSession = userPlaytimes.find(p => p.userId === userId);

    res.json({
      success: true,
      sessions: userSession || {
        userId,
        totalPlaytime: 0,
        sessionCount: 0,
        averageSessionLength: 0,
        lastSession: null,
      },
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user sessions',
    });
  }
});

export default router;
