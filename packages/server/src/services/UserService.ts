import { UserModel } from '../models/User';
import type { Document } from 'mongoose';

import type { UserRole } from '@gameboilerplate/shared';
export interface IUser {
  _id: string;
  username?: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  isGuest: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

export interface IUserService {
  registerUser(username: string, email: string, password: string): Promise<IUser>;
  authenticateUser(email: string, password: string): Promise<IUser | null>;
  getUserById(userId: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  updateUserProfile(userId: string, updates: Partial<IUser>): Promise<IUser | null>;
  upgradeGuestToRegistered(userId: string, username: string, email: string, password: string): Promise<IUser>;
}

export class UserService implements IUserService {
  async upgradeGuestToRegistered(userId: string, username: string, email: string, password: string): Promise<IUser> {
    // Find the guest user
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
    const { AuthUtils } = await import('../utils/auth');
    const passwordHash = await AuthUtils.hashPassword(password);
    userDoc.username = username;
    userDoc.email = email;
    userDoc.passwordHash = passwordHash;
    userDoc.role = 'registered';
    userDoc.isGuest = false;
    userDoc.lastLogin = new Date();
    await userDoc.save();
    return userDoc.toObject();
  }
  async registerUser(username: string, email: string, password: string): Promise<IUser> {
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
    const { AuthUtils } = await import('../utils/auth');
    const passwordHash = await AuthUtils.hashPassword(password);
    
    // Create a new user document - using create() to support both real MongoDB and our test mocks
    const userData = {
      username,
      email,
      passwordHash,
      role: 'registered' as const,
      isGuest: false,
      lastLogin: new Date(),
    };
    
    // Try to use UserModel.create() if available (for testing), otherwise use new UserModel()
    let userDoc;
    try {
      userDoc = await UserModel.create(userData);
    } catch (error) {
      // If create() doesn't work, fall back to new UserModel() + save()
      userDoc = new UserModel(userData);
      await userDoc.save();
    }
    
    return userDoc.toObject();
  }

  async authenticateUser(email: string, password: string): Promise<IUser | null> {
    const userDoc = await UserModel.findOne({ email, isGuest: false });
    if (!userDoc || !userDoc.passwordHash) {
      return null;
    }
    const { AuthUtils } = await import('../utils/auth');
    const isPasswordValid = await AuthUtils.verifyPassword(password, userDoc.passwordHash);
    if (!isPasswordValid) {
      return null;
    }
    userDoc.lastLogin = new Date();
    await userDoc.save();
    return userDoc.toObject();
  }

  async getUserById(userId: string): Promise<IUser | null> {
    const userDoc = await UserModel.findById(userId);
    return userDoc ? userDoc.toObject() : null;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    const userDoc = await UserModel.findOne({ email });
    return userDoc ? userDoc.toObject() : null;
  }

  async updateUserProfile(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    const userDoc = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
    return userDoc ? userDoc.toObject() : null;
  }
}
