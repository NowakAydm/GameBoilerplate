/**
 * Unit Tests for ActionSystem
 */

import { ActionSystem } from '../../../../packages/shared/src/engine/ActionSystem';
import { GameEngine } from '../../../../packages/shared/src/engine/GameEngine';
import { ActionDefinition, ActionContext, ActionResult } from '../../../../packages/shared/src/engine/types';
import { z } from 'zod';

describe('ActionSystem', () => {
  let engine: GameEngine;
  let actionSystem: ActionSystem;

  beforeEach(async () => {
    engine = new GameEngine();
    await engine.init();
    actionSystem = new ActionSystem(engine);
  });

  afterEach(async () => {
    if (engine.isRunning) {
      await engine.stop();
    }
  });

  describe('Constructor', () => {
    test('should create action system with correct properties', () => {
      expect(actionSystem.name).toBe('ActionSystem');
      expect(actionSystem.priority).toBe(0);
      expect(actionSystem.enabled).toBe(true);
      expect(actionSystem.actions).toBeInstanceOf(Map);
    });
  });

  describe('Action Registration', () => {
    test('should register action successfully', () => {
      const actionDef: ActionDefinition = {
        type: 'test-action',
        schema: z.object({
          value: z.number()
        }),
        handler: jest.fn().mockResolvedValue({ success: true })
      };

      actionSystem.registerAction(actionDef);
      
      expect(actionSystem.actions.has('test-action')).toBe(true);
      expect(actionSystem.actions.get('test-action')).toEqual({
        priority: 0,
        cooldown: 0,
        ...actionDef
      });
    });

    test('should register action with custom priority and cooldown', () => {
      const actionDef: ActionDefinition = {
        type: 'priority-action',
        schema: z.object({ id: z.string() }),
        handler: jest.fn().mockResolvedValue({ success: true }),
        priority: 10,
        cooldown: 5000
      };

      actionSystem.registerAction(actionDef);
      
      const registered = actionSystem.actions.get('priority-action');
      expect(registered?.priority).toBe(10);
      expect(registered?.cooldown).toBe(5000);
    });

    test('should replace existing action with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const action1: ActionDefinition = {
        type: 'duplicate-action',
        schema: z.object({ value: z.number() }),
        handler: jest.fn()
      };

      const action2: ActionDefinition = {
        type: 'duplicate-action',
        schema: z.object({ value: z.string() }),
        handler: jest.fn()
      };

      actionSystem.registerAction(action1);
      actionSystem.registerAction(action2);
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Action duplicate-action already registered, replacing...');
      expect(actionSystem.actions.get('duplicate-action')).toEqual({
        priority: 0,
        cooldown: 0,
        ...action2
      });
      
      consoleSpy.mockRestore();
    });

    test('should throw error for action without schema', () => {
      const invalidAction = {
        type: 'invalid-action',
        handler: jest.fn()
      } as unknown as ActionDefinition;

      expect(() => actionSystem.registerAction(invalidAction)).toThrow('Action invalid-action must have a schema');
    });

    test('should throw error for action without handler', () => {
      const invalidAction = {
        type: 'invalid-action',
        schema: z.object({})
      } as unknown as ActionDefinition;

      expect(() => actionSystem.registerAction(invalidAction)).toThrow('Action invalid-action must have a handler');
    });
  });

  describe('Action Unregistration', () => {
    test('should unregister action successfully', () => {
      const actionDef: ActionDefinition = {
        type: 'test-action',
        schema: z.object({}),
        handler: jest.fn()
      };

      actionSystem.registerAction(actionDef);
      expect(actionSystem.actions.has('test-action')).toBe(true);
      
      actionSystem.unregisterAction('test-action');
      expect(actionSystem.actions.has('test-action')).toBe(false);
    });

    test('should warn when unregistering non-existent action', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      actionSystem.unregisterAction('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Action non-existent not found');
      consoleSpy.mockRestore();
    });
  });

  describe('Action Execution', () => {
    beforeEach(() => {
      const moveAction: ActionDefinition = {
        type: 'move',
        schema: z.object({
          direction: z.enum(['up', 'down', 'left', 'right']),
          distance: z.number().optional()
        }),
        handler: jest.fn().mockResolvedValue({ success: true, message: 'Moved successfully' })
      };

      const errorAction: ActionDefinition = {
        type: 'error-action',
        schema: z.object({}),
        handler: jest.fn().mockRejectedValue(new Error('Action failed'))
      };

      actionSystem.registerAction(moveAction);
      actionSystem.registerAction(errorAction);
    });

    test('should execute action successfully', async () => {
      const context: ActionContext = {
        userId: 'user123',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      const actionData = {
        direction: 'up',
        distance: 5
      };

      const result = await actionSystem.processAction('move', actionData, context);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Moved successfully');
      
      const handler = actionSystem.actions.get('move')?.handler as jest.Mock;
      expect(handler).toHaveBeenCalledWith(actionData, context);
    });

    test('should validate action data with schema', async () => {
      const context: ActionContext = {
        userId: 'user123',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      const invalidData = {
        direction: 'invalid-direction',
        distance: 5
      };

      const result = await actionSystem.processAction('move', invalidData, context);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid action data');
    });

    test('should handle non-existent actions', async () => {
      const context: ActionContext = {
        userId: 'user123',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      const result = await actionSystem.processAction('non-existent-action', {}, context);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown action type: non-existent-action');
    });

    test('should handle action execution errors', async () => {
      const context: ActionContext = {
        userId: 'user123',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      const result = await actionSystem.processAction('error-action', {}, context);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal error processing action');
    });
  });

  describe('Action Cooldowns', () => {
    beforeEach(() => {
      const cooldownAction: ActionDefinition = {
        type: 'cooldown-action',
        schema: z.object({}),
        handler: jest.fn().mockResolvedValue({ success: true }),
        cooldown: 1000 // 1 second cooldown
      };

      actionSystem.registerAction(cooldownAction);
    });

    test('should enforce action cooldowns', async () => {
      const context: ActionContext = {
        userId: 'user123',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      // First execution should succeed
      const result1 = await actionSystem.processAction('cooldown-action', {}, context);
      expect(result1.success).toBe(true);

      // Second execution immediately should fail due to cooldown
      const result2 = await actionSystem.processAction('cooldown-action', {}, context);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('cooldown');
    });

    test('should allow action after cooldown expires', async () => {
      const context: ActionContext = {
        userId: 'user123',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      // First execution
      await actionSystem.processAction('cooldown-action', {}, context);

      // Wait for cooldown to expire (simulate)
      const laterContext = {
        ...context,
        timestamp: Date.now() + 2000 // 2 seconds later
      };

      const result = await actionSystem.processAction('cooldown-action', {}, laterContext);
      expect(result.success).toBe(true);
    });

    test('should handle different users separately for cooldowns', async () => {
      const context1: ActionContext = {
        userId: 'user1',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      const context2: ActionContext = {
        userId: 'user2',
        userRole: 'registered',
        isGuest: false,
        gameState: engine.gameState,
        engine: engine,
        timestamp: Date.now()
      };

      // Both users should be able to execute the action
      const result1 = await actionSystem.processAction('cooldown-action', {}, context1);
      const result2 = await actionSystem.processAction('cooldown-action', {}, context2);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Action Querying', () => {
    beforeEach(() => {
      const actions = [
        { type: 'move', priority: 1 },
        { type: 'attack', priority: 2 },
        { type: 'defend', priority: 1 }
      ];

      actions.forEach(({ type, priority }) => {
        actionSystem.registerAction({
          type,
          schema: z.object({}),
          handler: jest.fn(),
          priority
        });
      });
    });

    test('should get all registered actions', () => {
      const actions = actionSystem.getActions();
      expect(actions).toHaveLength(3);
      expect(actions.map((a: ActionDefinition) => a.type)).toContain('move');
      expect(actions.map((a: ActionDefinition) => a.type)).toContain('attack');
      expect(actions.map((a: ActionDefinition) => a.type)).toContain('defend');
    });

    test('should check if action exists', () => {
      expect(actionSystem.actions.has('move')).toBe(true);
      expect(actionSystem.actions.has('jump')).toBe(false);
    });

    test('should get action by type', () => {
      const moveAction = actionSystem.getAction('move');
      expect(moveAction?.type).toBe('move');
      expect(moveAction?.priority).toBe(1);

      const nonExistent = actionSystem.getAction('jump');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('System Integration', () => {
    test('should work as a system in the engine', () => {
      engine.addSystem(actionSystem);
      
      expect(engine.getSystem('ActionSystem')).toBe(actionSystem);
      expect(actionSystem.enabled).toBe(true);
      expect(actionSystem.name).toBe('ActionSystem');
      expect(actionSystem.priority).toBe(0);
    });

    test('should handle system lifecycle methods if they exist', async () => {
      // ActionSystem implements System interface but may not have all optional methods
      engine.addSystem(actionSystem);
      
      // Test that it can be retrieved and managed
      const retrievedSystem = engine.getSystem<ActionSystem>('ActionSystem');
      expect(retrievedSystem).toBe(actionSystem);
      
      // Test removal
      engine.removeSystem('ActionSystem');
      expect(engine.getSystem('ActionSystem')).toBeUndefined();
    });
  });
});
