/**
 * Unit Tests for Shared Package Core Types and Schemas
 */

import {
  UserRoleSchema,
  UserRole,
  UserSchema,
  User,
  AuthRequestSchema,
  AuthRequest,
  JWTPayloadSchema,
  JWTPayload,
  GameActionSchema,
  GameAction,
  GameEventSchema,
  GameEvent,
  ExampleSharedType
} from '../../packages/shared/src/index';
import { z } from 'zod';

describe('Shared Package Core', () => {
  describe('UserRoleSchema', () => {
    test('should validate valid user roles', () => {
      expect(UserRoleSchema.parse('guest')).toBe('guest');
      expect(UserRoleSchema.parse('registered')).toBe('registered');
      expect(UserRoleSchema.parse('admin')).toBe('admin');
    });

    test('should reject invalid user roles', () => {
      expect(() => UserRoleSchema.parse('invalid')).toThrow();
      expect(() => UserRoleSchema.parse('')).toThrow();
      expect(() => UserRoleSchema.parse(null)).toThrow();
      expect(() => UserRoleSchema.parse(undefined)).toThrow();
    });

    test('should provide correct TypeScript types', () => {
      const role: UserRole = 'admin';
      expect(role).toBe('admin');
      
      // Type check - these should compile without errors
      const validRoles: UserRole[] = ['guest', 'registered', 'admin'];
      expect(validRoles).toHaveLength(3);
    });
  });

  describe('UserSchema', () => {
    const validUser = {
      id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'registered' as UserRole,
      isGuest: false,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    test('should validate complete user object', () => {
      const result = UserSchema.parse(validUser);
      expect(result.id).toBe('user123');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('registered');
      expect(result.isGuest).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastLogin).toBeInstanceOf(Date);
    });

    test('should validate minimal user object', () => {
      const minimalUser = {
        id: 'user123',
        role: 'guest' as UserRole,
        isGuest: true,
        createdAt: new Date()
      };

      const result = UserSchema.parse(minimalUser);
      expect(result.id).toBe('user123');
      expect(result.role).toBe('guest');
      expect(result.isGuest).toBe(true);
      expect(result.username).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.lastLogin).toBeUndefined();
    });

    test('should reject invalid user objects', () => {
      // Missing required fields
      expect(() => UserSchema.parse({})).toThrow();
      expect(() => UserSchema.parse({ id: 'test' })).toThrow();
      
      // Invalid email
      expect(() => UserSchema.parse({
        ...validUser,
        email: 'invalid-email'
      })).toThrow();
      
      // Invalid role
      expect(() => UserSchema.parse({
        ...validUser,
        role: 'invalid-role'
      })).toThrow();
      
      // Invalid types
      expect(() => UserSchema.parse({
        ...validUser,
        isGuest: 'not-boolean'
      })).toThrow();
    });
  });

  describe('AuthRequestSchema', () => {
    test('should validate guest auth request', () => {
      const guestAuth = {
        isGuest: true
      };

      const result = AuthRequestSchema.parse(guestAuth);
      expect(result.isGuest).toBe(true);
      expect(result.username).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    test('should validate registered user auth request', () => {
      const registeredAuth = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isGuest: false
      };

      const result = AuthRequestSchema.parse(registeredAuth);
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('password123');
      expect(result.isGuest).toBe(false);
    });

    test('should apply default isGuest value', () => {
      const authWithoutGuest = {
        username: 'testuser',
        password: 'password123'
      };

      const result = AuthRequestSchema.parse(authWithoutGuest);
      expect(result.isGuest).toBe(false); // Default value
    });

    test('should validate username constraints', () => {
      const validAuth = { username: 'abc', password: 'password123' };
      expect(() => AuthRequestSchema.parse(validAuth)).not.toThrow();

      const validAuth2 = { username: 'a'.repeat(20), password: 'password123' };
      expect(() => AuthRequestSchema.parse(validAuth2)).not.toThrow();

      // Too short
      expect(() => AuthRequestSchema.parse({
        username: 'ab',
        password: 'password123'
      })).toThrow();

      // Too long
      expect(() => AuthRequestSchema.parse({
        username: 'a'.repeat(21),
        password: 'password123'
      })).toThrow();
    });

    test('should validate password constraints', () => {
      const validAuth = { username: 'testuser', password: '123456' };
      expect(() => AuthRequestSchema.parse(validAuth)).not.toThrow();

      // Too short
      expect(() => AuthRequestSchema.parse({
        username: 'testuser',
        password: '12345'
      })).toThrow();
    });

    test('should validate email format', () => {
      const validAuth = { email: 'test@example.com', password: 'password123' };
      expect(() => AuthRequestSchema.parse(validAuth)).not.toThrow();

      // Invalid email
      expect(() => AuthRequestSchema.parse({
        email: 'invalid-email',
        password: 'password123'
      })).toThrow();
    });
  });

  describe('JWTPayloadSchema', () => {
    const validPayload = {
      userId: 'user123',
      role: 'registered' as UserRole,
      isGuest: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    test('should validate complete JWT payload', () => {
      const result = JWTPayloadSchema.parse(validPayload);
      expect(result.userId).toBe('user123');
      expect(result.role).toBe('registered');
      expect(result.isGuest).toBe(false);
      expect(typeof result.iat).toBe('number');
      expect(typeof result.exp).toBe('number');
    });

    test('should validate minimal JWT payload', () => {
      const minimalPayload = {
        userId: 'user123',
        role: 'guest' as UserRole,
        isGuest: true
      };

      const result = JWTPayloadSchema.parse(minimalPayload);
      expect(result.userId).toBe('user123');
      expect(result.role).toBe('guest');
      expect(result.isGuest).toBe(true);
      expect(result.iat).toBeUndefined();
      expect(result.exp).toBeUndefined();
    });

    test('should reject invalid JWT payload', () => {
      // Missing required fields
      expect(() => JWTPayloadSchema.parse({})).toThrow();
      expect(() => JWTPayloadSchema.parse({ userId: 'test' })).toThrow();
      
      // Invalid role
      expect(() => JWTPayloadSchema.parse({
        ...validPayload,
        role: 'invalid-role'
      })).toThrow();
    });
  });

  describe('GameActionSchema', () => {
    test('should validate move action', () => {
      const moveAction = {
        type: 'move' as const,
        direction: 'up' as const
      };

      const result = GameActionSchema.parse(moveAction);
      expect(result.type).toBe('move');
      if (result.type === 'move') {
        expect(result.direction).toBe('up');
      }
    });

    test('should validate all move directions', () => {
      const directions = ['up', 'down', 'left', 'right', 'teleport'] as const;
      
      directions.forEach(direction => {
        const action = { type: 'move' as const, direction };
        const result = GameActionSchema.parse(action);
        expect(result.type).toBe('move');
        if (result.type === 'move') {
          expect(result.direction).toBe(direction);
        }
      });

      // Invalid direction
      expect(() => GameActionSchema.parse({
        type: 'move',
        direction: 'invalid'
      })).toThrow();
    });

    test('should validate item_drop action', () => {
      // With item
      const itemDropAction = {
        type: 'item_drop' as const,
        item: 'sword'
      };

      const result = GameActionSchema.parse(itemDropAction);
      expect(result.type).toBe('item_drop');
      if (result.type === 'item_drop') {
        expect(result.item).toBe('sword');
      }

      // Without item
      const itemDropNoItem = {
        type: 'item_drop' as const
      };

      const result2 = GameActionSchema.parse(itemDropNoItem);
      expect(result2.type).toBe('item_drop');
      if (result2.type === 'item_drop') {
        expect(result2.item).toBeUndefined();
      }
    });

    test('should validate combat action', () => {
      const combatAction = {
        type: 'combat' as const,
        targetId: 'enemy123'
      };

      const result = GameActionSchema.parse(combatAction);
      expect(result.type).toBe('combat');
      if (result.type === 'combat') {
        expect(result.targetId).toBe('enemy123');
      }
    });

    test('should reject invalid action types', () => {
      expect(() => GameActionSchema.parse({
        type: 'invalid_action'
      })).toThrow();

      expect(() => GameActionSchema.parse({})).toThrow();
    });
  });

  describe('GameEventSchema', () => {
    test('should validate item_drop event', () => {
      const itemDropEvent = {
        event: 'item_drop' as const,
        item: 'sword',
        by: { id: 'player123', name: 'TestPlayer' }
      };

      const result = GameEventSchema.parse(itemDropEvent);
      expect(result.event).toBe('item_drop');
      if (result.event === 'item_drop') {
        expect(result.item).toBe('sword');
        expect(result.by).toEqual({ id: 'player123', name: 'TestPlayer' });
      }
    });

    test('should validate combat event', () => {
      const combatEvent = {
        event: 'combat' as const,
        attacker: { id: 'player123', name: 'TestPlayer' },
        targetId: 'enemy123',
        result: 'hit'
      };

      const result = GameEventSchema.parse(combatEvent);
      expect(result.event).toBe('combat');
      if (result.event === 'combat') {
        expect(result.attacker).toEqual({ id: 'player123', name: 'TestPlayer' });
        expect(result.targetId).toBe('enemy123');
        expect(result.result).toBe('hit');
      }
    });

    test('should reject invalid event types', () => {
      expect(() => GameEventSchema.parse({
        event: 'invalid_event'
      })).toThrow();

      expect(() => GameEventSchema.parse({})).toThrow();
    });
  });

  describe('Type Exports', () => {
    test('should export ExampleSharedType correctly', () => {
      const example: ExampleSharedType = {
        id: 'test123',
        createdAt: new Date()
      };

      expect(example.id).toBe('test123');
      expect(example.createdAt).toBeInstanceOf(Date);
    });

    test('should re-export zod', () => {
      const { z } = require('../../packages/shared/src/index');
      expect(z.string).toBeDefined();
      expect(z.object).toBeDefined();
      expect(z.array).toBeDefined();
    });
  });
});
