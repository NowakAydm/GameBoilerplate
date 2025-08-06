import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@gameboilerplate/shared';

export interface IUser extends Document {
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
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      sparse: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['guest', 'registered', 'admin'],
      default: 'guest',
    },
    isGuest: {
      type: Boolean,
      default: true,
    },
    gameData: {
      type: Object,
      default: () => ({
        level: 1,
        experience: 0,
        inventory: [],
        position: { x: 0, y: 0, z: 0 },
        settings: [],
        lastUpdated: new Date()
      })
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Remove duplicate indexes to fix the warning
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ isGuest: 1, createdAt: 1 });

// Mock data for development without MongoDB
const mockUsers: Array<Partial<IUser> & { _id: string; passwordHash?: string }> = [
  {
    _id: 'admin123',
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: '$2b$10$dummyhashforadminuser123456789', // In mock mode, any hash works
    role: 'admin',
    isGuest: false,
    gameData: {
      level: 10,
      experience: 5000,
      inventory: [
        { id: 'item-1', name: 'Admin Sword', type: 'weapon', power: 100 },
        { id: 'item-2', name: 'Admin Shield', type: 'armor', defense: 100 }
      ],
      position: { x: 10, y: 0, z: 10 },
      lastUpdated: new Date()
    },
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    _id: 'user123',
    username: 'testuser',
    email: 'user@example.com',
    passwordHash: '$2b$10$dummyhashfortestuser123456789',
    role: 'registered',
    isGuest: false,
    gameData: {
      level: 5,
      experience: 2500,
      inventory: [
        { id: 'item-3', name: 'Bronze Sword', type: 'weapon', power: 15 },
        { id: 'item-4', name: 'Health Potion', type: 'consumable', health: 50, quantity: 3 }
      ],
      position: { x: 5, y: 0, z: 5 },
      lastUpdated: new Date()
    },
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    _id: 'guest123',
    username: undefined,
    email: undefined,
    role: 'guest',
    isGuest: true,
    gameData: {
      level: 1,
      experience: 0,
      inventory: [],
      position: { x: 0, y: 0, z: 0 },
      lastUpdated: new Date()
    },
    createdAt: new Date(),
  },
];

// Create a mock model for development
class MockUserModel {
  static async countDocuments(filter: any = {}): Promise<number> {
    if (Object.keys(filter).length === 0) {
      return mockUsers.length;
    }
    
    return mockUsers.filter(user => {
      return Object.entries(filter).every(([key, value]) => {
        return user[key as keyof typeof user] === value;
      });
    }).length;
  }

  static async find(filter: any = {}): Promise<any[]> {
    return mockUsers.filter(user => {
      return Object.entries(filter).every(([key, value]) => {
        return user[key as keyof typeof user] === value;
      });
    });
  }

  static async findById(id: string): Promise<any | null> {
    return mockUsers.find(user => user._id === id) || null;
  }

  static async findOne(filter: any): Promise<any | null> {
    return mockUsers.find(user => {
      return Object.entries(filter).every(([key, value]) => {
        return user[key as keyof typeof user] === value;
      });
    }) || null;
  }

  static async create(data: any): Promise<any> {
    const newUser = {
      _id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return newUser;
  }

  static async findByIdAndUpdate(id: string, update: any): Promise<any | null> {
    const userIndex = mockUsers.findIndex(user => user._id === id);
    if (userIndex === -1) return null;
    
    // Handle MongoDB $set operations
    if (update.$set) {
      const setOperations = update.$set;
      const updatedUser = { ...mockUsers[userIndex] } as any;
      
      // Apply dot notation updates
      Object.entries(setOperations).forEach(([key, value]) => {
        if (key.includes('.')) {
          // Handle nested properties like 'gameData.settings'
          const parts = key.split('.');
          let current = updatedUser as any;
          
          // Navigate to the parent object
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          
          // Set the final value
          current[parts[parts.length - 1]] = value;
        } else {
          (updatedUser as any)[key] = value;
        }
      });
      
      mockUsers[userIndex] = updatedUser;
      return updatedUser;
    } else {
      // Simple update without $set
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...update };
      return mockUsers[userIndex];
    }
  }

  static async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const initialLength = mockUsers.length;
    const userIndex = mockUsers.findIndex(user => {
      return Object.entries(filter).every(([key, value]) => {
        return user[key as keyof typeof user] === value;
      });
    });
    
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
    }
    
    return { deletedCount: initialLength - mockUsers.length };
  }
}

// Check if we're in mock mode (no MongoDB connection)
const isMockMode = () => {
  return process.env.MOCK_MODE === 'true' || !mongoose.connection.readyState;
};

// Export either the real model or mock model based on connection state
export const UserModel = new Proxy({}, {
  get(target, prop) {
    if (isMockMode()) {
      return MockUserModel[prop as keyof typeof MockUserModel];
    }
    
    // If MongoDB is connected, use the real model
    const RealUserModel = mongoose.model<IUser>('User', UserSchema);
    return RealUserModel[prop as keyof typeof RealUserModel];
  }
}) as typeof mongoose.Model & typeof MockUserModel;
