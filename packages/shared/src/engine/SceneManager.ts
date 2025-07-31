import {
  ISceneManager,
  Scene,
  IGameEngine,
  GameEntity,
  Vector3
} from './types';

export class SceneManager implements ISceneManager {
  public currentScene: Scene | null = null;
  public scenes: Map<string, Scene> = new Map();
  
  private engine: IGameEngine;
  private isTransitioning: boolean = false;

  constructor(engine: IGameEngine) {
    this.engine = engine;
  }

  addScene(scene: Scene): void {
    if (this.scenes.has(scene.id)) {
      console.warn(`⚠️ Scene ${scene.id} already exists, replacing...`);
    }

    this.scenes.set(scene.id, scene);
    console.log(`🎬 Scene added: ${scene.name} (${scene.id})`);
    this.engine.emit('scene:added', scene);
  }

  removeScene(id: string): void {
    const scene = this.scenes.get(id);
    if (!scene) {
      console.warn(`⚠️ Scene ${id} not found`);
      return;
    }

    // Don't remove current scene
    if (this.currentScene?.id === id) {
      console.warn(`⚠️ Cannot remove current scene ${id}`);
      return;
    }

    this.scenes.delete(id);
    console.log(`🗑️ Scene removed: ${scene.name} (${id})`);
    this.engine.emit('scene:removed', { id, name: scene.name });
  }

  async loadScene(id: string): Promise<void> {
    if (this.isTransitioning) {
      throw new Error('Scene transition already in progress');
    }

    const scene = this.scenes.get(id);
    if (!scene) {
      throw new Error(`Scene ${id} not found`);
    }

    console.log(`🎬 Loading scene: ${scene.name} (${id})`);
    this.isTransitioning = true;

    try {
      // Unload current scene first
      if (this.currentScene) {
        await this.unloadCurrentScene();
      }

      // Load new scene
      this.currentScene = scene;
      
      // Enable required systems
      for (const systemName of scene.systems) {
        const system = this.engine.getSystem(systemName);
        if (system) {
          system.enabled = true;
        } else {
          console.warn(`⚠️ System ${systemName} not found for scene ${scene.name}`);
        }
      }

      // Load scene entities
      for (const entityId of scene.entities) {
        const entity = this.engine.getEntity(entityId);
        if (entity) {
          entity.properties.sceneId = scene.id;
        } else {
          console.warn(`⚠️ Entity ${entityId} not found for scene ${scene.name}`);
        }
      }

      // Apply scene settings
      Object.assign(this.engine.gameState.settings, scene.settings);

      // Custom scene load logic
      if (scene.load) {
        await scene.load(this.engine);
      }

      this.engine.emit('scene:loaded', scene);
      console.log(`✅ Scene loaded: ${scene.name}`);

    } finally {
      this.isTransitioning = false;
    }
  }

  async unloadCurrentScene(): Promise<void> {
    if (!this.currentScene) {
      console.warn('⚠️ No current scene to unload');
      return;
    }

    const scene = this.currentScene;
    console.log(`🎬 Unloading scene: ${scene.name} (${scene.id})`);

    try {
      // Custom scene unload logic
      if (scene.unload) {
        await scene.unload(this.engine);
      }

      // Remove scene entities from active state
      for (const entityId of scene.entities) {
        const entity = this.engine.getEntity(entityId);
        if (entity && entity.properties.sceneId === scene.id) {
          delete entity.properties.sceneId;
        }
      }

      // Disable scene-specific systems
      for (const systemName of scene.systems) {
        const system = this.engine.getSystem(systemName);
        if (system) {
          system.enabled = false;
        }
      }

      this.engine.emit('scene:unloaded', scene);
      console.log(`✅ Scene unloaded: ${scene.name}`);

    } catch (error) {
      console.error(`❌ Error unloading scene ${scene.name}:`, error);
      throw error;
    } finally {
      this.currentScene = null;
    }
  }

  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  isSceneLoaded(id: string): boolean {
    return this.currentScene?.id === id;
  }

  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }
}

// Scene Factory for common scene types
export class SceneFactory {
  static createMenuScene(id: string = 'main-menu'): Scene {
    return {
      id,
      name: 'Main Menu',
      entities: [],
      systems: ['RenderSystem'],
      settings: {
        backgroundColor: '#2c3e50',
        camera: {
          type: 'orthographic',
          position: { x: 0, y: 0, z: 10 }
        }
      }
    };
  }

  static createGameplayScene(id: string = 'gameplay', gameType: 'platformer' | 'rpg' | 'shooter' = 'rpg'): Scene {
    const baseSystems = ['RenderSystem', 'NetworkSystem'];
    
    const systems = [...baseSystems];
    
    switch (gameType) {
      case 'platformer':
        systems.push('MovementSystem', 'PhysicsSystem');
        break;
      case 'rpg':
        systems.push('MovementSystem', 'CombatSystem', 'InventorySystem');
        break;
      case 'shooter':
        systems.push('MovementSystem', 'PhysicsSystem', 'CombatSystem');
        break;
    }

    return {
      id,
      name: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Scene`,
      entities: [],
      systems,
      settings: {
        backgroundColor: '#87CEEB',
        worldBounds: { min: -50, max: 50 },
        camera: {
          type: 'perspective',
          position: { x: 0, y: 5, z: 10 },
          target: { x: 0, y: 0, z: 0 }
        }
      }
    };
  }

  static createTestScene(id: string = 'test-scene'): Scene {
    return {
      id,
      name: 'Test Scene',
      entities: ['test-player', 'test-enemy', 'test-item'],
      systems: ['MovementSystem', 'RenderSystem', 'CombatSystem'],
      settings: {
        backgroundColor: '#ff6b6b',
        worldBounds: { min: -20, max: 20 },
        debugMode: true
      },
      load: async (engine) => {
        // Create test entities
        SceneFactory.createTestEntities(engine);
      },
      unload: async (engine) => {
        // Clean up test entities
        SceneFactory.cleanupTestEntities(engine);
      }
    };
  }

  static createLobbyScene(id: string = 'lobby'): Scene {
    return {
      id,
      name: 'Game Lobby',
      entities: [],
      systems: ['RenderSystem', 'NetworkSystem'],
      settings: {
        backgroundColor: '#34495e',
        maxPlayers: 8,
        camera: {
          type: 'orthographic',
          position: { x: 0, y: 0, z: 5 }
        }
      }
    };
  }

  // Helper methods
  private static createTestEntities(engine: IGameEngine): void {
    // Create test player
    const player = engine.createEntity('player', { x: 0, y: 1, z: 0 });
    player.id = 'test-player';
    player.properties = {
      health: 100,
      maxHealth: 100,
      speed: 5,
      inventory: [],
      combat: {
        attackPower: 20,
        attackRange: 2,
        attackCooldown: 0
      }
    };
    engine.addEntity(player);

    // Create test enemy
    const enemy = engine.createEntity('enemy', { x: 5, y: 1, z: 0 });
    enemy.id = 'test-enemy';
    enemy.properties = {
      health: 50,
      maxHealth: 50,
      speed: 2,
      ai: 'aggressive',
      combat: {
        attackPower: 15,
        attackRange: 1.5,
        attackCooldown: 0
      }
    };
    engine.addEntity(enemy);

    // Create test item
    const item = engine.createEntity('item', { x: -3, y: 0.5, z: 2 });
    item.id = 'test-item';
    item.properties = {
      itemType: 'health_potion',
      value: 25,
      pickupable: true
    };
    engine.addEntity(item);

    console.log('✅ Test entities created');
  }

  private static cleanupTestEntities(engine: IGameEngine): void {
    engine.removeEntity('test-player');
    engine.removeEntity('test-enemy');
    engine.removeEntity('test-item');
    console.log('🧹 Test entities cleaned up');
  }
}

// Scene Transition Effects
export class SceneTransitions {
  static async fadeTransition(
    sceneManager: SceneManager,
    fromSceneId: string | null,
    toSceneId: string,
    duration: number = 1000
  ): Promise<void> {
    console.log(`🎭 Fade transition: ${fromSceneId} → ${toSceneId} (${duration}ms)`);
    
    // Fade out
    if (fromSceneId) {
      await new Promise(resolve => setTimeout(resolve, duration / 2));
    }
    
    // Load new scene
    await sceneManager.loadScene(toSceneId);
    
    // Fade in
    await new Promise(resolve => setTimeout(resolve, duration / 2));
  }

  static async slideTransition(
    sceneManager: SceneManager,
    fromSceneId: string | null,
    toSceneId: string,
    direction: 'left' | 'right' | 'up' | 'down' = 'right'
  ): Promise<void> {
    console.log(`🎭 Slide transition ${direction}: ${fromSceneId} → ${toSceneId}`);
    
    // Implementation would depend on the rendering system
    await sceneManager.loadScene(toSceneId);
  }

  static async instantTransition(
    sceneManager: SceneManager,
    toSceneId: string
  ): Promise<void> {
    console.log(`🎭 Instant transition → ${toSceneId}`);
    await sceneManager.loadScene(toSceneId);
  }
}
