import { GameEngine } from '../../../../packages/shared/src/engine/GameEngine';
import { System, GameEntity, GameState } from '../../../../packages/shared/src/engine/types';

// Mock browser environment for Node.js tests
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16) as any; // ~60fps
  };
}

if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

describe('Game Engine Tests', () => {
  let engine: GameEngine;

  beforeEach(async () => {
    engine = new GameEngine();
    await engine.init();
  });

  afterEach(async () => {
    await engine.stop();
  });

  describe('GameEngine Core', () => {
    it('should initialize successfully', () => {
      expect(engine).toBeDefined();
      expect(engine.isRunning).toBe(false);
    });

    it('should start and stop properly', async () => {
      await engine.start();
      expect(engine.isRunning).toBe(true);
      
      await engine.stop();
      expect(engine.isRunning).toBe(false);
    });

    it('should create entities with proper structure', () => {
      const entity = engine.createEntity('player', { x: 10, y: 20, z: 0 });
      
      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('type', 'player');
      expect(entity).toHaveProperty('position');
      expect(entity.position).toEqual({ x: 10, y: 20, z: 0 });
      expect(entity).toHaveProperty('properties');
    });

    it('should add and retrieve entities', () => {
      const entity = engine.createEntity('npc', { x: 0, y: 0, z: 0 });
      engine.addEntity(entity);
      
      const retrieved = engine.getEntity(entity.id);
      expect(retrieved).toBe(entity);
      
      const allEntities = engine.getEntitiesByType('npc');
      expect(allEntities).toContain(entity);
    });

    it('should remove entities', () => {
      const entity = engine.createEntity('item', { x: 5, y: 5, z: 0 });
      engine.addEntity(entity);
      
      expect(engine.getEntity(entity.id)).toBe(entity);
      
      engine.removeEntity(entity.id);
      expect(engine.getEntity(entity.id)).toBeUndefined();
    });

    it('should filter entities by type', () => {
      const player = engine.createEntity('player', { x: 0, y: 0, z: 0 });
      const npc1 = engine.createEntity('npc', { x: 1, y: 1, z: 0 });
      const npc2 = engine.createEntity('npc', { x: 2, y: 2, z: 0 });
      
      engine.addEntity(player);
      engine.addEntity(npc1);
      engine.addEntity(npc2);
      
      const npcs = engine.getEntitiesByType('npc');
      expect(npcs).toHaveLength(2);
      expect(npcs).toContain(npc1);
      expect(npcs).toContain(npc2);
      
      const players = engine.getEntitiesByType('player');
      expect(players).toHaveLength(1);
      expect(players).toContain(player);
    });

    it('should get engine configuration', () => {
      const config = engine.getConfig();
      expect(config).toHaveProperty('tickRate');
      expect(config).toHaveProperty('maxEntities');
      expect(config).toHaveProperty('enableDebug');
    });

    it('should get engine stats', () => {
      const stats = engine.getStats();
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('entityCount');
      expect(stats).toHaveProperty('systemCount');
      expect(stats).toHaveProperty('totalTime');
      expect(stats.isRunning).toBe(false);
    });

    it('should change game mode', () => {
      engine.setGameMode('test');
      expect(engine.gameState.gameMode).toBe('test');
    });
  });

  describe('System Management', () => {
    it('should add and retrieve systems', () => {
      const mockSystem: System = {
        name: 'TestSystem',
        priority: 0,
        enabled: true,
        init: jest.fn(),
        update: jest.fn()
      };

      engine.addSystem(mockSystem);
      
      const retrieved = engine.getSystem('TestSystem');
      expect(retrieved).toBe(mockSystem);
    });

    it('should remove systems', async () => {
      const mockSystem: System = {
        name: 'RemoveableSystem',
        priority: 0,
        enabled: true,
        destroy: jest.fn()
      };

      engine.addSystem(mockSystem);
      expect(engine.getSystem('RemoveableSystem')).toBe(mockSystem);
      
      engine.removeSystem('RemoveableSystem');
      expect(engine.getSystem('RemoveableSystem')).toBeUndefined();
    });

    it('should work with ActionSystem as a system', async () => {
      const { ActionSystem } = await import('../../../../packages/shared/src/engine/ActionSystem');
      const actionSystem = new ActionSystem(engine);
      engine.addSystem(actionSystem);

      const retrievedSystem = engine.getSystem('ActionSystem');
      expect(retrievedSystem).toBe(actionSystem);
      expect(retrievedSystem?.name).toBe('ActionSystem');
    });
  });
});
