/**
 * Unit Tests for Engine Types and Utilities
 */

import {
  Vector3,
  GameEntity,
  GameState,
  System,
  EngineConfig,
  ActionDefinition,
  ActionContext,
  ActionResult,
  GameEngineEvent,
  EngineStats
} from '../../../packages/shared/src/engine/types';

describe('Engine Types', () => {
  describe('Vector3', () => {
    test('should define Vector3 interface correctly', () => {
      const vector: Vector3 = { x: 1, y: 2, z: 3 };
      expect(vector.x).toBe(1);
      expect(vector.y).toBe(2);
      expect(vector.z).toBe(3);
    });

    test('should allow decimal values', () => {
      const vector: Vector3 = { x: 1.5, y: -2.7, z: 0.0 };
      expect(vector.x).toBe(1.5);
      expect(vector.y).toBe(-2.7);
      expect(vector.z).toBe(0.0);
    });
  });

  describe('GameEntity', () => {
    test('should define GameEntity interface correctly', () => {
      const entity: GameEntity = {
        id: 'test-entity-123',
        position: { x: 10, y: 20, z: 30 },
        rotation: { x: 0, y: 45, z: 90 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'player',
        properties: {
          health: 100,
          mana: 50,
          level: 5,
          inventory: ['sword', 'potion']
        }
      };

      expect(entity.id).toBe('test-entity-123');
      expect(entity.position.x).toBe(10);
      expect(entity.rotation.y).toBe(45);
      expect(entity.scale.z).toBe(1);
      expect(entity.type).toBe('player');
      expect(entity.properties.health).toBe(100);
      expect(entity.properties.inventory).toEqual(['sword', 'potion']);
    });

    test('should allow empty properties', () => {
      const entity: GameEntity = {
        id: 'minimal-entity',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'empty',
        properties: {}
      };

      expect(entity.properties).toEqual({});
      expect(Object.keys(entity.properties)).toHaveLength(0);
    });
  });

  describe('GameState', () => {
    test('should define GameState interface correctly', () => {
      const entities = new Map<string, GameEntity>();
      const systems = new Map<string, System>();
      
      const gameState: GameState = {
        entities,
        systems,
        deltaTime: 16.67,
        totalTime: 1000.5,
        gameMode: 'battle',
        settings: {
          difficulty: 'hard',
          enablePvP: true,
          maxPlayers: 10
        }
      };

      expect(gameState.entities).toBe(entities);
      expect(gameState.systems).toBe(systems);
      expect(gameState.deltaTime).toBe(16.67);
      expect(gameState.totalTime).toBe(1000.5);
      expect(gameState.gameMode).toBe('battle');
      expect(gameState.settings.difficulty).toBe('hard');
      expect(gameState.settings.enablePvP).toBe(true);
    });
  });

  describe('System', () => {
    test('should define System interface correctly', () => {
      const mockInit = jest.fn().mockResolvedValue(undefined);
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockDestroy = jest.fn().mockResolvedValue(undefined);

      const system: System = {
        name: 'TestSystem',
        priority: 5,
        enabled: true,
        init: mockInit,
        update: mockUpdate,
        destroy: mockDestroy,
        data: {
          customProperty: 'test-value',
          counter: 42
        }
      };

      expect(system.name).toBe('TestSystem');
      expect(system.priority).toBe(5);
      expect(system.enabled).toBe(true);
      expect(system.init).toBe(mockInit);
      expect(system.update).toBe(mockUpdate);
      expect(system.destroy).toBe(mockDestroy);
      expect(system.data?.customProperty).toBe('test-value');
      expect(system.data?.counter).toBe(42);
    });

    test('should work with minimal system definition', () => {
      const minimalSystem: System = {
        name: 'MinimalSystem',
        priority: 0,
        enabled: false
      };

      expect(minimalSystem.name).toBe('MinimalSystem');
      expect(minimalSystem.priority).toBe(0);
      expect(minimalSystem.enabled).toBe(false);
      expect(minimalSystem.init).toBeUndefined();
      expect(minimalSystem.update).toBeUndefined();
      expect(minimalSystem.destroy).toBeUndefined();
      expect(minimalSystem.data).toBeUndefined();
    });
  });

  describe('ActionResult', () => {
    test('should define ActionResult interface correctly', () => {
      const result: ActionResult = {
        success: true,
        message: 'Action completed successfully',
        data: {
          experience: 100,
          items: ['gold_coin', 'health_potion']
        },
        stateChanges: {
          deltaTime: 16.67,
          totalTime: 2000,
          gameMode: 'exploration',
          settings: { difficulty: 'medium' }
        },
        events: [
          {
            type: 'player:level_up',
            data: { newLevel: 6 },
            timestamp: Date.now(),
            source: 'action_system'
          },
          {
            type: 'inventory:item_added',
            data: { item: 'health_potion', quantity: 1 },
            timestamp: Date.now(),
            source: 'action_system'
          }
        ]
      };

      expect(result.success).toBe(true);
      expect(result.message).toBe('Action completed successfully');
      expect(result.data?.experience).toBe(100);
      expect(result.data?.items).toEqual(['gold_coin', 'health_potion']);
      expect(result.stateChanges?.gameMode).toBe('exploration');
      expect(result.events).toHaveLength(2);
      expect(result.events?.[0].type).toBe('player:level_up');
    });

    test('should work with minimal result', () => {
      const minimalResult: ActionResult = {
        success: false
      };

      expect(minimalResult.success).toBe(false);
      expect(minimalResult.message).toBeUndefined();
      expect(minimalResult.data).toBeUndefined();
      expect(minimalResult.stateChanges).toBeUndefined();
      expect(minimalResult.events).toBeUndefined();
    });
  });

  describe('GameEngineEvent', () => {
    test('should define GameEngineEvent interface correctly', () => {
      const event: GameEngineEvent = {
        type: 'entity:spawned',
        data: {
          entityId: 'player_123',
          entityType: 'player',
          position: { x: 0, y: 0, z: 0 }
        },
        timestamp: 1640995200000,
        source: 'spawn_system'
      };

      expect(event.type).toBe('entity:spawned');
      expect(event.data?.entityId).toBe('player_123');
      expect(event.data?.position.x).toBe(0);
      expect(event.timestamp).toBe(1640995200000);
      expect(event.source).toBe('spawn_system');
    });

    test('should work with minimal event', () => {
      const minimalEvent: GameEngineEvent = {
        type: 'simple:event',
        timestamp: Date.now()
      };

      expect(minimalEvent.type).toBe('simple:event');
      expect(typeof minimalEvent.timestamp).toBe('number');
      expect(minimalEvent.data).toBeUndefined();
      expect(minimalEvent.source).toBeUndefined();
    });
  });

  describe('EngineStats', () => {
    test('should define EngineStats interface correctly', () => {
      const stats: EngineStats = {
        isRunning: true,
        entityCount: 42,
        systemCount: 8,
        totalTime: 15000.5,
        deltaTime: 16.67,
        fps: 60,
        memory: {
          rss: 50000000,
          heapTotal: 30000000,
          heapUsed: 20000000,
          external: 1000000
        }
      };

      expect(stats.isRunning).toBe(true);
      expect(stats.entityCount).toBe(42);
      expect(stats.systemCount).toBe(8);
      expect(stats.totalTime).toBe(15000.5);
      expect(stats.deltaTime).toBe(16.67);
      expect(stats.fps).toBe(60);
      expect(stats.memory?.rss).toBe(50000000);
    });

    test('should work without memory stats', () => {
      const stats: EngineStats = {
        isRunning: false,
        entityCount: 0,
        systemCount: 0,
        totalTime: 0,
        deltaTime: 0,
        fps: 0
      };

      expect(stats.isRunning).toBe(false);
      expect(stats.memory).toBeUndefined();
    });
  });

  describe('Type Compatibility', () => {
    test('should ensure Vector3 compatibility across different contexts', () => {
      const position: Vector3 = { x: 1, y: 2, z: 3 };
      const rotation: Vector3 = { x: 0, y: 0, z: 0 };
      const scale: Vector3 = { x: 1, y: 1, z: 1 };

      const entity: GameEntity = {
        id: 'test',
        position,
        rotation,
        scale,
        type: 'test',
        properties: {}
      };

      // Verify all Vector3 properties are compatible
      expect(entity.position).toEqual(position);
      expect(entity.rotation).toEqual(rotation);
      expect(entity.scale).toEqual(scale);
    });

    test('should ensure Map type compatibility in GameState', () => {
      const entityMap = new Map<string, GameEntity>();
      const systemMap = new Map<string, System>();

      const gameState: GameState = {
        entities: entityMap,
        systems: systemMap,
        deltaTime: 0,
        totalTime: 0,
        gameMode: 'test',
        settings: {}
      };

      // Verify Map types work correctly
      expect(gameState.entities).toBeInstanceOf(Map);
      expect(gameState.systems).toBeInstanceOf(Map);
      expect(gameState.entities.size).toBe(0);
      expect(gameState.systems.size).toBe(0);
    });
  });
});
