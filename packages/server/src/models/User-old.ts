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
      required: function (this: IUser) {
        return !this.isGuest;
      },
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

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ isGuest: 1, createdAt: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
