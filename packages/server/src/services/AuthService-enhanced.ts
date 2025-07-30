import { UserModel, IUser } from '../models/User';
import { AuthUtils } from '../utils/auth';
import { AuthRequest, User, UserRole } from '@gameboilerplate/shared';
import { Types } from 'mongoose';

const isMockMode = () => process.env.MOCK_MODE === 'true';

export class AuthService {
  /**
   * Create a guest user and return JWT
   */
  static async createGuestUser(): Promise<{ user: User; token: string }> {
    const guestId = AuthUtils.generateGuestId();

    if (isMockMode()) {
      const user: User = {
        id: `guest_${Date.now()}`,
        username: guestId,
        role: 'guest' as UserRole,
        isGuest: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const token = AuthUtils.generateToken({
        userId: user.id,
        role: user.role,
        isGuest: user.isGuest,
      });

      return { user, token };
    }

    const userDoc = new UserModel({
      username: guestId,
      role: 'guest' as UserRole,
      isGuest: true,
      lastLogin: new Date(),
    });

    await userDoc.save();

    const user: User = {
      id: (userDoc._id as Types.ObjectId).toString(),
      username: userDoc.username,
      role: userDoc.role,
      isGuest: userDoc.isGuest,
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
    };

    const token = AuthUtils.generateToken({
      userId: user.id,
      role: user.role,
      isGuest: user.isGuest,
    });

    return { user, token };
  }

  /**
   * Register a new user
   */
  static async registerUser(authRequest: AuthRequest): Promise<{ user: User; token: string }> {
    const { username, email, password } = authRequest;

    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required for registration');
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
      isGuest: false,
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    const userData = {
      username,
      email,
      passwordHash,
      role: 'registered' as UserRole,
      isGuest: false,
      lastLogin: new Date(),
    };

    if (isMockMode()) {
      const user: User = {
        id: `user_${Date.now()}`,
        username,
        email,
        role: 'registered' as UserRole,
        isGuest: false,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const token = AuthUtils.generateToken({
        userId: user.id,
        role: user.role,
        isGuest: user.isGuest,
      });

      return { user, token };
    }

    const userDoc = new UserModel(userData);
    await userDoc.save();

    const user: User = {
      id: (userDoc._id as Types.ObjectId).toString(),
      username: userDoc.username,
      email: userDoc.email,
      role: userDoc.role,
      isGuest: userDoc.isGuest,
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
    };

    const token = AuthUtils.generateToken({
      userId: user.id,
      role: user.role,
      isGuest: user.isGuest,
    });

    return { user, token };
  }

  /**
   * Login existing user
   */
  static async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    if (isMockMode()) {
      // In mock mode, simplified authentication
      if (email === 'admin@example.com') {
        const user: User = {
          id: 'admin123',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isGuest: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const token = AuthUtils.generateToken({
          userId: user.id,
          role: user.role,
          isGuest: user.isGuest,
        });

        return { user, token };
      } else if (email === 'user@example.com') {
        const user: User = {
          id: 'user123',
          username: 'testuser',
          email: 'user@example.com',
          role: 'registered',
          isGuest: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const token = AuthUtils.generateToken({
          userId: user.id,
          role: user.role,
          isGuest: user.isGuest,
        });

        return { user, token };
      } else {
        throw new Error('Invalid email or password');
      }
    }

    const userDoc = await UserModel.findOne({ email, isGuest: false });

    if (!userDoc || !userDoc.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await AuthUtils.verifyPassword(password, userDoc.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    userDoc.lastLogin = new Date();
    await userDoc.save();

    const user: User = {
      id: (userDoc._id as Types.ObjectId).toString(),
      username: userDoc.username,
      email: userDoc.email,
      role: userDoc.role,
      isGuest: userDoc.isGuest,
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
    };

    const token = AuthUtils.generateToken({
      userId: user.id,
      role: user.role,
      isGuest: user.isGuest,
    });

    return { user, token };
  }

  /**
   * Verify and refresh a JWT token
   */
  static async verifyToken(token: string): Promise<User> {
    const payload = AuthUtils.verifyToken(token);

    if (!payload) {
      throw new Error('Invalid token');
    }

    if (isMockMode()) {
      // In mock mode, return mock user data based on payload
      return {
        id: payload.userId,
        username: payload.userId === 'admin123' ? 'admin' : 'testuser',
        email: payload.userId === 'admin123' ? 'admin@example.com' : 'user@example.com',
        role: payload.role,
        isGuest: payload.isGuest,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
    }

    const userDoc = await UserModel.findById(payload.userId);

    if (!userDoc) {
      throw new Error('User not found');
    }

    return {
      id: (userDoc._id as Types.ObjectId).toString(),
      username: userDoc.username,
      email: userDoc.email,
      role: userDoc.role,
      isGuest: userDoc.isGuest,
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    if (isMockMode()) {
      // Return mock user data
      if (userId === 'admin123') {
        return {
          id: 'admin123',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isGuest: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
      } else if (userId === 'user123') {
        return {
          id: 'user123',
          username: 'testuser',
          email: 'user@example.com',
          role: 'registered',
          isGuest: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
      }
      return null;
    }

    const userDoc = await UserModel.findById(userId);

    if (!userDoc) {
      return null;
    }

    return {
      id: (userDoc._id as Types.ObjectId).toString(),
      username: userDoc.username,
      email: userDoc.email,
      role: userDoc.role,
      isGuest: userDoc.isGuest,
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
    };
  }
}
