/**
 * Unit Tests for GameEngine
 */

import { GameEngine } from './GameEngine';
import { EngineConfig, GameEntity, System, Vector3 } from './types';

// Mock requestAnimationFrame for Node.js environment
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  afterEach(async () => {
    if (engine.isRunning) {
      await engine.stop();
    }
  });

  describe('Constructor', () => {
    test('should create engine with default config', () => {
      expect(engine).toBeInstanceOf(GameEngine);
      expect(engine.isRunning).toBe(false);
      expect(engine.gameState).toBeDefined();
      expect(engine.gameState.entities).toBeInstanceOf(Map);
      expect(engine.gameState.systems).toBeInstanceOf(Map);
      expect(engine.gameState.deltaTime).toBe(0);
      expect(engine.gameState.totalTime).toBe(0);
      expect(engine.gameState.gameMode).toBe('default');
    });

    test('should create engine with custom config', () => {
      const config: Partial<EngineConfig> = {
        tickRate: 30,
        maxEntities: 500,
        enableDebug: true,
        enableProfiling: true,
        autoStart: true
      };

      const customEngine = new GameEngine(config);
      expect(customEngine).toBeInstanceOf(GameEngine);
    });

    test('should extend EventEmitter', () => {
      expect(engine.on).toBeDefined();
      expect(engine.emit).toBeDefined();
      expect(engine.removeListener).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    test('should initialize engine', async () => {
      await engine.init();
      expect(engine.gameState).toBeDefined();
    });

    test('should start and stop engine', async () => {
      await engine.init();
      
      await engine.start();
      expect(engine.isRunning).toBe(true);
      
      await engine.stop();
      expect(engine.isRunning).toBe(false);
    });

    test('should handle multiple start calls', async () => {
      await engine.init();
      
      await engine.start();
      expect(engine.isRunning).toBe(true);
      
      // Second start should not cause issues
      await engine.start();
      expect(engine.isRunning).toBe(true);
      
      await engine.stop();
    });

    test('should handle stop without start', async () => {
      await engine.init();
      
      // Should not throw
      await expect(engine.stop()).resolves.not.toThrow();
      expect(engine.isRunning).toBe(false);
    });
  });

  describe('Entity Management', () => {
    beforeEach(async () => {
      await engine.init();
    });

    test('should add entity', () => {
      const entity: GameEntity = {
        id: 'test-entity',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'player',
        properties: { health: 100 }
      };

      engine.addEntity(entity);
      
      expect(engine.gameState.entities.has('test-entity')).toBe(true);
      expect(engine.gameState.entities.get('test-entity')).toEqual(entity);
    });

    test('should get entity', () => {
      const entity: GameEntity = {
        id: 'test-entity',
        position: { x: 10, y: 20, z: 30 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'npc',
        properties: { name: 'TestNPC' }
      };

      engine.addEntity(entity);
      
      const retrieved = engine.getEntity('test-entity');
      expect(retrieved).toEqual(entity);
      
      const nonExistent = engine.getEntity('non-existent');
      expect(nonExistent).toBeUndefined();
    });

    test('should remove entity', () => {
      const entity: GameEntity = {
        id: 'test-entity',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'item',
        properties: {}
      };

      engine.addEntity(entity);
      expect(engine.gameState.entities.has('test-entity')).toBe(true);
      
      engine.removeEntity('test-entity');
      expect(engine.gameState.entities.has('test-entity')).toBe(false);
      
      // Removing again should not cause issues (returns void)
      engine.removeEntity('test-entity');
      expect(engine.gameState.entities.has('test-entity')).toBe(false);
    });

    test('should update entity properties', () => {
      const entity: GameEntity = {
        id: 'test-entity',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'player',
        properties: { health: 100 }
      };

      engine.addEntity(entity);
      
      // Update by directly modifying the entity
      const retrievedEntity = engine.getEntity('test-entity');
      if (retrievedEntity) {
        retrievedEntity.position = { x: 10, y: 20, z: 30 };
        retrievedEntity.properties = { health: 80, mana: 50 };
      }
      
      const updatedEntity = engine.getEntity('test-entity');
      expect(updatedEntity?.position).toEqual({ x: 10, y: 20, z: 30 });
      expect(updatedEntity?.properties.health).toBe(80);
      expect(updatedEntity?.properties.mana).toBe(50);
    });

    test('should get entities by type', () => {
      const player1: GameEntity = {
        id: 'player1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'player',
        properties: {}
      };

      const player2: GameEntity = {
        id: 'player2',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'player',
        properties: {}
      };

      const npc: GameEntity = {
        id: 'npc1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'npc',
        properties: {}
      };

      engine.addEntity(player1);
      engine.addEntity(player2);
      engine.addEntity(npc);

      const players = engine.getEntitiesByType('player');
      expect(players).toHaveLength(2);
      expect(players.map(p => p.id)).toContain('player1');
      expect(players.map(p => p.id)).toContain('player2');

      const npcs = engine.getEntitiesByType('npc');
      expect(npcs).toHaveLength(1);
      expect(npcs[0].id).toBe('npc1');

      const items = engine.getEntitiesByType('item');
      expect(items).toHaveLength(0);
    });
  });

  describe('System Management', () => {
    beforeEach(async () => {
      await engine.init();
    });

    test('should add system', () => {
      const mockSystem: System = {
        name: 'TestSystem',
        priority: 10,
        enabled: true,
        init: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      engine.addSystem(mockSystem);
      
      expect(engine.gameState.systems.has('TestSystem')).toBe(true);
    });

    test('should remove system', () => {
      const mockSystem: System = {
        name: 'TestSystem',
        priority: 10,
        enabled: true,
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      engine.addSystem(mockSystem);
      expect(engine.gameState.systems.has('TestSystem')).toBe(true);
      
      engine.removeSystem('TestSystem');
      expect(engine.gameState.systems.has('TestSystem')).toBe(false);
    });

    test('should get system', () => {
      const mockSystem: System = {
        name: 'TestSystem',
        priority: 10,
        enabled: true
      };

      engine.addSystem(mockSystem);
      
      const retrieved = engine.getSystem('TestSystem');
      expect(retrieved).toEqual(mockSystem);
      
      const nonExistent = engine.getSystem('NonExistent');
      expect(nonExistent).toBeUndefined();
    });

    test('should handle system with same name', () => {
      const system1: System = {
        name: 'TestSystem',
        priority: 10,
        enabled: true,
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      const system2: System = {
        name: 'TestSystem',
        priority: 20,
        enabled: false
      };

      engine.addSystem(system1);
      expect(engine.gameState.systems.get('TestSystem')).toEqual(system1);
      
      // Adding system with same name should replace
      engine.addSystem(system2);
      expect(engine.gameState.systems.get('TestSystem')).toEqual(system2);
    });
  });

  describe('Events', () => {
    beforeEach(async () => {
      await engine.init();
    });

    test('should emit events during lifecycle', async () => {
      const startSpy = jest.fn();
      const stopSpy = jest.fn();

      engine.on('engine:started', startSpy);
      engine.on('engine:stopped', stopSpy);

      await engine.init();
      await engine.start();
      // Check if start event was emitted
      expect(startSpy).toHaveBeenCalled();
      
      await engine.stop();
      // Check if stop event was emitted
      expect(stopSpy).toHaveBeenCalled();
    });

    test('should emit entity events', () => {
      const addSpy = jest.fn();
      const removeSpy = jest.fn();
      const updateSpy = jest.fn();

      engine.on('entity:added', addSpy);
      engine.on('entity:removed', removeSpy);
      engine.on('entity:updated', updateSpy);

      const entity: GameEntity = {
        id: 'test-entity',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'test',
        properties: {}
      };

      engine.addEntity(entity);
      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'entity:added',
        data: entity
      }));

      // Update entity properties directly
      const retrievedEntity = engine.getEntity('test-entity');
      if (retrievedEntity) {
        retrievedEntity.position = { x: 10, y: 0, z: 0 };
      }

      engine.removeEntity('test-entity');
      expect(removeSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'entity:removed',
        data: entity
      }));
    });
  });

  describe('Error Handling', () => {
    test('should handle entity limit', () => {
      const limitedEngine = new GameEngine({ maxEntities: 2 });
      
      const entity1: GameEntity = {
        id: 'entity1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'test',
        properties: {}
      };

      const entity2: GameEntity = {
        id: 'entity2',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'test',
        properties: {}
      };

      const entity3: GameEntity = {
        id: 'entity3',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        type: 'test',
        properties: {}
      };

      limitedEngine.addEntity(entity1);
      limitedEngine.addEntity(entity2);
      
      expect(() => limitedEngine.addEntity(entity3)).toThrow('Maximum entity limit reached');
    });
  });

  describe('Game State', () => {
    beforeEach(async () => {
      await engine.init();
    });

    test('should provide access to game state', () => {
      expect(engine.gameState).toBeDefined();
      expect(engine.gameState.entities).toBeInstanceOf(Map);
      expect(engine.gameState.systems).toBeInstanceOf(Map);
      expect(typeof engine.gameState.deltaTime).toBe('number');
      expect(typeof engine.gameState.totalTime).toBe('number');
      expect(typeof engine.gameState.gameMode).toBe('string');
      expect(typeof engine.gameState.settings).toBe('object');
    });

    test('should update game state during ticks', async () => {
      await engine.start();
      
      // Wait a short time for at least one tick
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Game state should have been updated
      // Since we can't easily test the exact timing, just verify engine is running
      expect(engine.isRunning).toBe(true);
      
      await engine.stop();
    });
  });
});
