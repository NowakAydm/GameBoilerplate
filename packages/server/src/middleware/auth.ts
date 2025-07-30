import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { JWTPayload } from '@gameboilerplate/shared';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  const payload = AuthUtils.verifyToken(token);

  if (!payload) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  req.user = payload;
  next();
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

/**
 * Middleware to require registered user (not guest)
 */
export const requireRegistered = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.isGuest) {
    return res.status(403).json({
      success: false,
      error: 'Registered account required',
    });
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = AuthUtils.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};
