import { GameEngine } from '../../../../packages/shared/src/engine/GameEngine';
import { System, GameEntity, GameState } from '../../../../packages/shared/src/engine/types';

describe('Game Engine Tests', () => {
  let engine: GameEngine;

  beforeEach(async () => {
    engine = new GameEngine();
    await engine.init();
  });

  afterEach(() => {
    engine.stop();
  });

  describe('GameEngine Core', () => {
    it('should initialize successfully', () => {
      expect(engine).toBeDefined();
      expect(engine.isRunning()).toBe(false);
    });

    it('should start and stop properly', () => {
      engine.start();
      expect(engine.isRunning()).toBe(true);
      
      engine.stop();
      expect(engine.isRunning()).toBe(false);
    });

    it('should create entities with proper structure', () => {
      const entity = engine.createEntity('player', { x: 10, y: 20, z: 0 });
      
      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('type', 'player');
      expect(entity).toHaveProperty('position');
      expect(entity.position).toEqual({ x: 10, y: 20, z: 0 });
      expect(entity).toHaveProperty('properties');
      expect(entity).toHaveProperty('metadata');
    });

    it('should add and retrieve entities', () => {
      const entity = engine.createEntity('npc', { x: 0, y: 0, z: 0 });
      engine.addEntity(entity);
      
      const retrieved = engine.getEntity(entity.id);
      expect(retrieved).toBe(entity);
      
      const allEntities = engine.getAllEntities();
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
  });

  describe('Action System', () => {
    it('should register and execute actions', async () => {
      let actionExecuted = false;
      
      engine.registerAction({
        type: 'testAction',
        schema: z.object({
          value: z.number()
        }),
        cooldown: 0,
        handler: async (data, context) => {
          actionExecuted = true;
          return { 
            success: true, 
            data: { received: data.value } 
          };
        }
      });

      const result = await engine.executeAction(
        'testAction',
        { value: 42 },
        { userId: 'test-user', engine }
      );

      expect(actionExecuted).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data?.received).toBe(42);
    });

    it('should validate action data with schema', async () => {
      engine.registerAction({
        type: 'strictAction',
        schema: z.object({
          requiredString: z.string(),
          requiredNumber: z.number().min(1)
        }),
        cooldown: 0,
        handler: async () => ({ success: true })
      });

      // Valid data should work
      const validResult = await engine.executeAction(
        'strictAction',
        { requiredString: 'test', requiredNumber: 5 },
        { userId: 'test-user', engine }
      );
      expect(validResult.success).toBe(true);

      // Invalid data should fail
      const invalidResult = await engine.executeAction(
        'strictAction',
        { requiredString: 'test', requiredNumber: -1 },
        { userId: 'test-user', engine }
      );
      expect(invalidResult.success).toBe(false);
    });

    it('should respect action cooldowns', async () => {
      engine.registerAction({
        type: 'cooldownAction',
        schema: z.object({}),
        cooldown: 1000, // 1 second
        handler: async () => ({ success: true })
      });

      const context = { userId: 'test-user', engine };
      
      // First execution should succeed
      const result1 = await engine.executeAction('cooldownAction', {}, context);
      expect(result1.success).toBe(true);

      // Second execution immediately should fail due to cooldown
      const result2 = await engine.executeAction('cooldownAction', {}, context);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('cooldown');
    });

    it('should generate events from actions', async () => {
      engine.registerAction({
        type: 'eventAction',
        schema: z.object({ message: z.string() }),
        cooldown: 0,
        handler: async (data, context) => ({
          success: true,
          events: [{
            type: 'custom:event',
            data: { message: data.message },
            timestamp: Date.now()
          }]
        })
      });

      const result = await engine.executeAction(
        'eventAction',
        { message: 'Hello World' },
        { userId: 'test-user', engine }
      );

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events![0].type).toBe('custom:event');
      expect(result.events![0].data.message).toBe('Hello World');
    });
  });

  describe('System Management', () => {
    it('should add and retrieve systems', () => {
      const mockSystem = {
        name: 'TestSystem',
        priority: 10,
        enabled: true,
        init: jest.fn(),
        update: jest.fn()
      };

      engine.addSystem(mockSystem);
      
      const retrieved = engine.getSystem('TestSystem');
      expect(retrieved).toBe(mockSystem);
      expect(mockSystem.init).toHaveBeenCalled();
    });

    it('should remove systems', () => {
      const mockSystem = {
        name: 'RemoveableSystem',
        priority: 10,
        enabled: true,
        init: jest.fn(),
        update: jest.fn()
      };

      engine.addSystem(mockSystem);
      expect(engine.getSystem('RemoveableSystem')).toBe(mockSystem);
      
      engine.removeSystem('RemoveableSystem');
      expect(engine.getSystem('RemoveableSystem')).toBeUndefined();
    });

    it('should update systems in priority order', () => {
      const updateOrder: string[] = [];
      
      const lowPrioritySystem = {
        name: 'LowPriority',
        priority: 100,
        enabled: true,
        init: jest.fn(),
        update: jest.fn(() => updateOrder.push('low'))
      };

      const highPrioritySystem = {
        name: 'HighPriority',
        priority: 1,
        enabled: true,
        init: jest.fn(),
        update: jest.fn(() => updateOrder.push('high'))
      };

      engine.addSystem(lowPrioritySystem);
      engine.addSystem(highPrioritySystem);

      // Manually trigger update to test order
      const gameState = {
        entities: new Map(),
        currentTime: Date.now(),
        deltaTime: 16.67
      };
      
      engine.getSystem('SystemManager')?.update(16.67, gameState);

      expect(updateOrder).toEqual(['high', 'low']);
    });
  });

  describe('Plugin System', () => {
    it('should install and uninstall plugins', async () => {
      const farmingPlugin = new FarmingPlugin();
      
      await engine.installPlugin(farmingPlugin);
      
      // Check if farming system was added
      const farmingSystem = engine.getSystem('FarmingSystem');
      expect(farmingSystem).toBeDefined();

      await engine.uninstallPlugin('FarmingPlugin');
      
      // Check if farming system was removed
      const removedSystem = engine.getSystem('FarmingSystem');
      expect(removedSystem).toBeUndefined();
    });

    it('should handle plugin dependencies', async () => {
      const mockPlugin = {
        name: 'DependentPlugin',
        version: '1.0.0',
        dependencies: ['NonExistentSystem'],
        install: jest.fn(),
        uninstall: jest.fn()
      };

      // Should fail to install due to missing dependency
      await expect(engine.installPlugin(mockPlugin)).rejects.toThrow();
      expect(mockPlugin.install).not.toHaveBeenCalled();
    });
  });

  describe('Scene Management', () => {
    it('should manage scene transitions', async () => {
      const sceneManager = engine.getSystem('SceneManager');
      expect(sceneManager).toBeDefined();

      // Create a test scene
      const testScene = {
        id: 'test-scene',
        name: 'Test Scene',
        entities: new Map(),
        systems: ['ActionSystem', 'SystemManager'],
        metadata: { description: 'A test scene' }
      };

      await sceneManager?.loadScene(testScene);
      
      const currentScene = sceneManager?.getCurrentScene();
      expect(currentScene?.id).toBe('test-scene');
    });
  });

  describe('Game Type Presets', () => {
    it('should initialize RPG preset', async () => {
      const rpgEngine = new GameEngine();
      await rpgEngine.init('rpg');
      
      // Should have character-related systems
      expect(rpgEngine.getSystem('ActionSystem')).toBeDefined();
      expect(rpgEngine.getSystem('SystemManager')).toBeDefined();
      
      rpgEngine.stop();
    });

    it('should initialize RTS preset', async () => {
      const rtsEngine = new GameEngine();
      await rtsEngine.init('rts');
      
      // Should have unit management systems
      expect(rtsEngine.getSystem('ActionSystem')).toBeDefined();
      expect(rtsEngine.getSystem('SystemManager')).toBeDefined();
      
      rtsEngine.stop();
    });

    it('should initialize MMO preset', async () => {
      const mmoEngine = new GameEngine();
      await mmoEngine.init('mmo');
      
      // Should have multiplayer systems
      expect(mmoEngine.getSystem('ActionSystem')).toBeDefined();
      expect(mmoEngine.getSystem('SystemManager')).toBeDefined();
      
      mmoEngine.stop();
    });
  });

  describe('Performance and Stats', () => {
    it('should track performance metrics', () => {
      const stats = engine.getStats();
      
      expect(stats).toHaveProperty('entityCount');
      expect(stats).toHaveProperty('systemCount');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('lastUpdateTime');
      expect(stats).toHaveProperty('averageFrameTime');
    });

    it('should handle large numbers of entities efficiently', () => {
      const startTime = Date.now();
      
      // Create many entities
      for (let i = 0; i < 1000; i++) {
        const entity = engine.createEntity('test', { x: i, y: i, z: 0 });
        engine.addEntity(entity);
      }
      
      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(1000); // Should take less than 1 second
      
      const entities = engine.getAllEntities();
      expect(entities).toHaveLength(1000);
    });
  });
});
