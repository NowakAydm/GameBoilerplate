import { z } from 'zod';

// Re-export zod for convenience
export { z };

// Shared types, schemas, and utilities will go here.

export type ExampleSharedType = {
  id: string;
  createdAt: Date;
};

// User types and schemas
export const UserRoleSchema = z.enum(['guest', 'registered', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema,
  isGuest: z.boolean(),
  createdAt: z.date(),
  lastLogin: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthRequestSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  isGuest: z.boolean().default(false),
});

export type AuthRequest = z.infer<typeof AuthRequestSchema>;

export const JWTPayloadSchema = z.object({
  userId: z.string(),
  role: UserRoleSchema,
  isGuest: z.boolean(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const GameActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('move'),
    direction: z.enum(['up', 'down', 'left', 'right', 'teleport']),
  }),
  z.object({ type: z.literal('item_drop'), item: z.string().optional() }),
  z.object({ type: z.literal('combat'), targetId: z.string() }),
]);

export type GameAction = z.infer<typeof GameActionSchema>;

export const GameEventSchema = z.discriminatedUnion('event', [
  z.object({ event: z.literal('item_drop'), item: z.string(), by: z.any() }),
  z.object({
    event: z.literal('combat'),
    attacker: z.any(),
    targetId: z.string(),
    result: z.string(),
  }),
]);

export type GameEvent = z.infer<typeof GameEventSchema>;
