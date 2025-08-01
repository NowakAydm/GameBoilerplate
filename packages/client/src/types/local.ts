// Local type definitions to avoid shared package conflicts with Three.js
export type UserRole = 'guest' | 'registered' | 'admin';

export interface User {
  id: string;
  username?: string;
  email?: string;
  role: UserRole;
  isGuest: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthRequest {
  username?: string;
  email?: string;
  password?: string;
  isGuest?: boolean;
}

export interface GameAction {
  type: string;
  direction?: string;
  targetId?: string;
  item?: string;
}
