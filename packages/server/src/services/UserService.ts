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
  gameData?: {
    level: number;
    experience: number;
    inventory: any[];
    position: {
      x: number;
      y: number;
      z: number;
    };
    settings?: any[];
    lastUpdated?: Date;
  };
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

export interface IUserService {
  registerUser(username: string, email: string, password: string): Promise<IUser>;
  createGuestUser(): Promise<IUser>;
  authenticateUser(email: string, password: string): Promise<IUser | null>;
  getUserById(userId: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  updateUserProfile(userId: string, updates: Partial<IUser>): Promise<IUser | null>;
  upgradeGuestToRegistered(userId: string, username: string, email: string, password: string): Promise<IUser>;
  getAllUsers(): Promise<IUser[]>;
  
  // Game data methods
  getUserGameData(userId: string): Promise<IUser['gameData'] | null>;
  updateUserGameData(userId: string, gameData: Partial<IUser['gameData']>): Promise<IUser | null>;
  updatePlayerPosition(userId: string, position: { x: number; y: number; z: number }): Promise<boolean>;
  updatePlayerStats(userId: string, level?: number, experience?: number): Promise<boolean>;
  addToInventory(userId: string, item: any): Promise<boolean>;
  removeFromInventory(userId: string, itemId: string): Promise<boolean>;
}

export class UserService implements IUserService {
  async createGuestUser(): Promise<IUser> {
    // Create a new guest user with default game data
    const userData = {
      role: 'guest' as const,
      isGuest: true,
      gameData: {
        level: 1,
        experience: 0,
        inventory: [],
        position: { x: 0, y: 0, z: 0 },
        lastUpdated: new Date()
      }
    };
    
    let userDoc;
    try {
      userDoc = await UserModel.create(userData);
    } catch (error) {
      userDoc = new UserModel(userData);
      await userDoc.save();
    }
    
    return userDoc.toObject();
  }

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
    
    // Ensure gameData exists and update lastUpdated
    if (!userDoc.gameData) {
      userDoc.gameData = {
        level: 1,
        experience: 0,
        inventory: [],
        position: { x: 0, y: 0, z: 0 },
        lastUpdated: new Date()
      };
    } else {
      userDoc.gameData.lastUpdated = new Date();
    }
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
      gameData: {
        level: 1,
        experience: 0,
        inventory: [],
        position: { x: 0, y: 0, z: 0 },
        lastUpdated: new Date()
      },
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
  
  async getAllUsers(): Promise<IUser[]> {
    const userDocs = await UserModel.find({});
    return userDocs.map(doc => doc.toObject());
  }

  async updateUserProfile(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    const userDoc = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
    return userDoc ? userDoc.toObject() : null;
  }

  // Game data methods
  
  /**
   * Get the user's game data
   */
  async getUserGameData(userId: string): Promise<IUser['gameData'] | null> {
    const userDoc = await UserModel.findById(userId);
    if (!userDoc) {
      return null;
    }
    return userDoc.gameData || null;
  }

  /**
   * Update user's game data
   */
  async updateUserGameData(userId: string, gameData: Partial<NonNullable<IUser['gameData']>>): Promise<IUser | null> {
    // Create update object with dot notation for MongoDB
    const updateData: Record<string, any> = {};
    
    // Handle each field separately to allow partial updates
    if (gameData) {
      Object.entries(gameData as Record<string, any>).forEach(([key, value]) => {
        if (key === 'position' && typeof value === 'object') {
          // Handle nested position object
          Object.entries(value).forEach(([posKey, posValue]) => {
            updateData[`gameData.position.${posKey}`] = posValue;
          });
        } else {
          updateData[`gameData.${key}`] = value;
        }
      });
    }
    
    // Always update the lastUpdated timestamp
    updateData['gameData.lastUpdated'] = new Date();

    const userDoc = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    // Handle both mock and real Mongoose models
    if (!userDoc) return null;
    
    // If it's a Mongoose document, convert to object
    if (typeof userDoc.toObject === 'function') {
      return userDoc.toObject();
    }
    
    // If it's already a plain object (mock model), return as is
    return userDoc;
  }

  /**
   * Update player's position in the game
   */
  async updatePlayerPosition(userId: string, position: { x: number; y: number; z: number }): Promise<boolean> {
    const updateData = {
      'gameData.position': position,
      'gameData.lastUpdated': new Date()
    };
    
    const userDoc = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    return !!userDoc;
  }

  /**
   * Update player's stats (level and experience)
   */
  async updatePlayerStats(userId: string, level?: number, experience?: number): Promise<boolean> {
    const updateData: Record<string, any> = {
      'gameData.lastUpdated': new Date()
    };
    
    if (level !== undefined) {
      updateData['gameData.level'] = level;
    }
    
    if (experience !== undefined) {
      updateData['gameData.experience'] = experience;
    }
    
    const userDoc = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    return !!userDoc;
  }

  /**
   * Add an item to player's inventory
   */
  async addToInventory(userId: string, item: any): Promise<boolean> {
    // Add unique id to the item if it doesn't have one
    const itemToAdd = {
      ...item,
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    
    const userDoc = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $push: { 'gameData.inventory': itemToAdd },
        $set: { 'gameData.lastUpdated': new Date() }
      },
      { new: true }
    );
    
    return !!userDoc;
  }

  /**
   * Remove an item from player's inventory
   */
  async removeFromInventory(userId: string, itemId: string): Promise<boolean> {
    const userDoc = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $pull: { 'gameData.inventory': { id: itemId } },
        $set: { 'gameData.lastUpdated': new Date() }
      },
      { new: true }
    );
    
    return !!userDoc;
  }
}
