import { UserModel, IUser } from '../models/User';
import { AuthUtils } from '../utils/auth';
import { AuthRequest, User, UserRole } from '@gameboilerplate/shared';
import { Types } from 'mongoose';

export class AuthService {
  /**
   * Create a guest user and return JWT
   */
  static async createGuestUser(): Promise<{ user: User; token: string }> {
    const guestId = AuthUtils.generateGuestId();

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
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const passwordHash = await AuthUtils.hashPassword(password);

    const userDoc = new UserModel({
      username,
      email,
      passwordHash,
      role: 'registered' as UserRole,
      isGuest: false,
      lastLogin: new Date(),
    });

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
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
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

  /**
   * Upgrade guest to registered user
   */
  static async upgradeGuestToRegistered(
    userId: string,
    username: string,
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const userDoc = await UserModel.findById(userId);

    if (!userDoc || !userDoc.isGuest) {
      throw new Error('User not found or not a guest');
    }

    // Check if email/username already taken
    const existingUser = await UserModel.findOne({
      _id: { $ne: userId },
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error('Email or username already taken');
    }

    const passwordHash = await AuthUtils.hashPassword(password);

    userDoc.username = username;
    userDoc.email = email;
    userDoc.passwordHash = passwordHash;
    userDoc.role = 'registered';
    userDoc.isGuest = false;
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
}
