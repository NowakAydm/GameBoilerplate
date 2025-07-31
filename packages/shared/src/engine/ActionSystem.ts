import { z } from 'zod';
import {
  IActionSystem,
  ActionDefinition,
  ActionContext,
  ActionResult,
  IGameEngine,
  System
} from './types';

export class ActionSystem implements IActionSystem, System {
  public name = 'ActionSystem';
  public priority = 0;
  public enabled = true;
  public actions: Map<string, ActionDefinition> = new Map();
  private engine: IGameEngine;
  private actionCooldowns: Map<string, Map<string, number>> = new Map(); // userId -> actionType -> lastUsed

  constructor(engine: IGameEngine) {
    this.engine = engine;
  }

  registerAction(definition: ActionDefinition): void {
    if (this.actions.has(definition.type)) {
      console.warn(`⚠️ Action ${definition.type} already registered, replacing...`);
    }

    // Validate the definition
    if (!definition.schema) {
      throw new Error(`Action ${definition.type} must have a schema`);
    }

    if (!definition.handler) {
      throw new Error(`Action ${definition.type} must have a handler`);
    }

    this.actions.set(definition.type, {
      priority: 0,
      cooldown: 0,
      ...definition
    });

    console.log(`📝 Action registered: ${definition.type}`);
    this.engine.emit('action:registered', { type: definition.type });
  }

  unregisterAction(type: string): void {
    if (!this.actions.has(type)) {
      console.warn(`⚠️ Action ${type} not found`);
      return;
    }

    this.actions.delete(type);
    console.log(`🗑️ Action unregistered: ${type}`);
    this.engine.emit('action:unregistered', { type });
  }

  async processAction(type: string, data: any, context: ActionContext): Promise<ActionResult> {
    const definition = this.actions.get(type);
    
    if (!definition) {
      return {
        success: false,
        message: `Unknown action type: ${type}`
      };
    }

    try {
      // 1. Schema validation
      const validationResult = definition.schema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          message: 'Invalid action data',
          data: validationResult.error.issues
        };
      }

      const validatedData = validationResult.data;

      // 2. Cooldown check
      if (definition.cooldown && definition.cooldown > 0) {
        const cooldownKey = `${context.userId}:${type}`;
        const lastUsed = this.getLastActionTime(context.userId, type);
        const timeSinceLastUse = context.timestamp - lastUsed;

        if (timeSinceLastUse < definition.cooldown) {
          return {
            success: false,
            message: `Action on cooldown. ${definition.cooldown - timeSinceLastUse}ms remaining.`
          };
        }
      }

      // 3. Custom validation
      if (definition.validator) {
        const isValid = await definition.validator(validatedData, context);
        if (!isValid) {
          return {
            success: false,
            message: 'Action failed custom validation'
          };
        }
      }

      // 4. Update cooldown before processing
      if (definition.cooldown && definition.cooldown > 0) {
        this.setLastActionTime(context.userId, type, context.timestamp);
      }

      // 5. Execute action handler
      const result = await definition.handler(validatedData, context);

      // 6. Apply state changes if any
      if (result.stateChanges) {
        Object.assign(context.gameState, result.stateChanges);
      }

      // 7. Emit events if any
      if (result.events) {
        for (const event of result.events) {
          this.engine.emit(event.type, event.data);
        }
      }

      // 8. Emit action processed event
      this.engine.emit('action:processed', {
        type,
        userId: context.userId,
        success: result.success,
        result
      });

      return result;

    } catch (error) {
      console.error(`❌ Error processing action ${type}:`, error);
      
      this.engine.emit('action:error', {
        type,
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Internal error processing action'
      };
    }
  }

  getActions(): ActionDefinition[] {
    return Array.from(this.actions.values())
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  getAction(type: string): ActionDefinition | undefined {
    return this.actions.get(type);
  }

  // Cooldown management
  private getLastActionTime(userId: string, actionType: string): number {
    const userCooldowns = this.actionCooldowns.get(userId);
    if (!userCooldowns) {
      return 0;
    }
    return userCooldowns.get(actionType) || 0;
  }

  private setLastActionTime(userId: string, actionType: string, timestamp: number): void {
    let userCooldowns = this.actionCooldowns.get(userId);
    if (!userCooldowns) {
      userCooldowns = new Map();
      this.actionCooldowns.set(userId, userCooldowns);
    }
    userCooldowns.set(actionType, timestamp);
  }

  // Utility methods
  clearUserCooldowns(userId: string): void {
    this.actionCooldowns.delete(userId);
  }

  getUserCooldowns(userId: string): Map<string, number> {
    return this.actionCooldowns.get(userId) || new Map();
  }

  getRemainingCooldown(userId: string, actionType: string, currentTime: number): number {
    const definition = this.actions.get(actionType);
    if (!definition || !definition.cooldown) {
      return 0;
    }

    const lastUsed = this.getLastActionTime(userId, actionType);
    const timeSinceLastUse = currentTime - lastUsed;
    
    return Math.max(0, definition.cooldown - timeSinceLastUse);
  }

  // Batch action processing
  async processActions(actions: Array<{ type: string; data: any; context: ActionContext }>): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    // Sort by priority
    const sortedActions = actions.sort((a, b) => {
      const defA = this.actions.get(a.type);
      const defB = this.actions.get(b.type);
      return (defA?.priority || 0) - (defB?.priority || 0);
    });

    for (const action of sortedActions) {
      const result = await this.processAction(action.type, action.data, action.context);
      results.push(result);
      
      // Stop processing if a critical action fails
      if (!result.success && this.actions.get(action.type)?.priority === 0) {
        break;
      }
    }

    return results;
  }
}

// Predefined Action Schemas
export const CommonActionSchemas = {
  // Movement actions
  move: z.object({
    direction: z.enum(['up', 'down', 'left', 'right', 'forward', 'backward']),
    distance: z.number().min(0).max(10).optional().default(1),
    speed: z.number().min(0.1).max(5).optional().default(1)
  }),

  teleport: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number()
    }),
    validateDestination: z.boolean().optional().default(true)
  }),

  // Combat actions
  attack: z.object({
    targetId: z.string(),
    attackType: z.enum(['melee', 'ranged', 'magic']),
    power: z.number().min(1).max(100).optional().default(10)
  }),

  defend: z.object({
    duration: z.number().min(100).max(5000).optional().default(1000)
  }),

  // Inventory actions
  pickupItem: z.object({
    itemId: z.string(),
    quantity: z.number().min(1).optional().default(1)
  }),

  dropItem: z.object({
    itemId: z.string(),
    quantity: z.number().min(1).optional().default(1),
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number()
    }).optional()
  }),

  useItem: z.object({
    itemId: z.string(),
    targetId: z.string().optional()
  }),

  // Social actions
  chat: z.object({
    message: z.string().min(1).max(500),
    channel: z.enum(['global', 'local', 'party', 'whisper']).optional().default('global'),
    targetId: z.string().optional()
  }),

  // System actions
  ping: z.object({
    timestamp: z.number()
  }),

  heartbeat: z.object({
    clientTime: z.number(),
    fps: z.number().optional()
  })
};
