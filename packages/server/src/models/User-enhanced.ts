import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@gameboilerplate/shared';

export interface IUser extends Document {
  username?: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  isGuest: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      unique: true,
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
const mockUsers: Array<Partial<IUser> & { _id: string }> = [
  {
    _id: 'admin123',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    isGuest: false,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    _id: 'user123',
    username: 'testuser',
    email: 'user@example.com',
    role: 'registered',
    isGuest: false,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    _id: 'guest123',
    username: undefined,
    email: undefined,
    role: 'guest',
    isGuest: true,
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
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...update };
    return mockUsers[userIndex];
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
