import { z } from 'zod';

// Re-export zod for convenience
export { z };

// Export engine components
export * from './engine';

// Shared types, schemas, and utilities will go here.

export type ExampleSharedType = {
  id: string;
  createdAt: Date;
};

// User types and schemas
export const UserRoleSchema = z.enum(['guest', 'registered', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Game data related schemas
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export type Position = z.infer<typeof PositionSchema>;

export const GameItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  // Additional properties can be any type
}).passthrough();

export type GameItem = z.infer<typeof GameItemSchema>;

// Control settings for keyboard and touch controls
export const KeyboardControlsSchema = z.object({
  up: z.string().default('ArrowUp'),
  down: z.string().default('ArrowDown'),
  left: z.string().default('ArrowLeft'),
  right: z.string().default('ArrowRight'),
});

export type KeyboardControls = z.infer<typeof KeyboardControlsSchema>;

export const TouchControlsSchema = z.object({
  panEnabled: z.boolean().default(true),
  rotateEnabled: z.boolean().default(true),
  zoomEnabled: z.boolean().default(true),
  // Gesture sensitivity settings
  panSensitivity: z.number().min(0.1).max(5).default(1),
  rotateSensitivity: z.number().min(0.1).max(5).default(1),
  zoomSensitivity: z.number().min(0.1).max(5).default(1),
});

export type TouchControls = z.infer<typeof TouchControlsSchema>;

export const ControlSettingsSchema = z.object({
  keyboard: KeyboardControlsSchema.default({
    up: 'ArrowUp',
    down: 'ArrowDown', 
    left: 'ArrowLeft',
    right: 'ArrowRight',
  }),
  touch: TouchControlsSchema.default({
    panEnabled: true,
    rotateEnabled: true,
    zoomEnabled: true,
    panSensitivity: 1,
    rotateSensitivity: 1,
    zoomSensitivity: 1,
  }),
});

export type ControlSettings = z.infer<typeof ControlSettingsSchema>;

export const GameDataSchema = z.object({
  level: z.number().default(1),
  experience: z.number().default(0),
  inventory: z.array(GameItemSchema).default([]),
  position: PositionSchema.default({ x: 0, y: 0, z: 0 }),
  controlSettings: ControlSettingsSchema.default({
    keyboard: {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    },
    touch: {
      panEnabled: true,
      rotateEnabled: true,
      zoomEnabled: true,
      panSensitivity: 1,
      rotateSensitivity: 1,
      zoomSensitivity: 1,
    },
  }),
  lastUpdated: z.date().optional(),
});

export type GameData = z.infer<typeof GameDataSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema,
  isGuest: z.boolean(),
  gameData: GameDataSchema.optional(),
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
