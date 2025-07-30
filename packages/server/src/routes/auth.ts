import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequestSchema } from '@gameboilerplate/shared';

const router = Router();

/**
 * POST /auth/guest - Create a guest user
 */
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { user, token } = await AuthService.createGuestUser();
    res.json({
      success: true,
      user,
      token,
      message: 'Guest user created successfully',
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create guest user',
    });
  }
});

/**
 * POST /auth/register - Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = AuthRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: result.error.issues,
      });
    }

    const { user, token } = await AuthService.registerUser(result.data);
    res.status(201).json({
      success: true,
      user,
      token,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /auth/login - Login existing user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const { user, token } = await AuthService.loginUser(email, password);
    res.json({
      success: true,
      user,
      token,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /auth/upgrade - Upgrade guest to registered user
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { userId, username, email, password } = req.body;

    if (!userId || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'User ID, username, email, and password are required',
      });
    }

    const { user, token } = await AuthService.upgradeGuestToRegistered(
      userId,
      username,
      email,
      password,
    );

    res.json({
      success: true,
      user,
      token,
      message: 'Guest user upgraded successfully',
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    const message = error instanceof Error ? error.message : 'Upgrade failed';
    res.status(400).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /auth/me - Get current user info (requires auth)
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // This route requires auth middleware to be added
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const user = await AuthService.getUserById(userId);

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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
    });
  }
});

export default router;
