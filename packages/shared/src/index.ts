import { z } from 'zod';

// Shared types, schemas, and utilities will go here.

export type ExampleSharedType = {
  id: string;
  createdAt: Date;
};

export const GameActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('move'), direction: z.enum(['up', 'down', 'left', 'right', 'teleport']) }),
  z.object({ type: z.literal('item_drop'), item: z.string().optional() }),
  z.object({ type: z.literal('combat'), targetId: z.string() }),
]);

export type GameAction = z.infer<typeof GameActionSchema>;

export const GameEventSchema = z.discriminatedUnion('event', [
  z.object({ event: z.literal('item_drop'), item: z.string(), by: z.any() }),
  z.object({ event: z.literal('combat'), attacker: z.any(), targetId: z.string(), result: z.string() }),
]);

export type GameEvent = z.infer<typeof GameEventSchema>;
