import {
  GamePlugin,
  IGameEngine,
  System,
  ActionDefinition,
  Scene
} from './types';

export class PluginSystem {
  private engine: IGameEngine;
  private plugins: Map<string, GamePlugin> = new Map();
  private pluginStates: Map<string, 'installed' | 'error'> = new Map();

  constructor(engine: IGameEngine) {
    this.engine = engine;
  }

  async installPlugin(plugin: GamePlugin): Promise<void> {
    console.log(`🔌 Installing plugin: ${plugin.name} v${plugin.version}`);

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin dependency not found: ${dep}`);
        }
        
        if (this.pluginStates.get(dep) !== 'installed') {
          throw new Error(`Plugin dependency not installed: ${dep}`);
        }
      }
    }

    // Check for conflicts
    if (this.plugins.has(plugin.name)) {
      console.warn(`⚠️ Plugin ${plugin.name} already installed, replacing...`);
      await this.uninstallPlugin(plugin.name);
    }

    try {
      // Install the plugin
      await plugin.install(this.engine);
      
      this.plugins.set(plugin.name, plugin);
      this.pluginStates.set(plugin.name, 'installed');
      
      this.engine.emit('plugin:installed', plugin);
      console.log(`✅ Plugin installed: ${plugin.name}`);

    } catch (error) {
      this.pluginStates.set(plugin.name, 'error');
      this.engine.emit('plugin:error', { plugin, error });
      
      console.error(`❌ Failed to install plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async uninstallPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`⚠️ Plugin ${name} not found`);
      return;
    }

    console.log(`🔌 Uninstalling plugin: ${name}`);

    try {
      // Check for dependent plugins
      const dependents = this.getDependentPlugins(name);
      if (dependents.length > 0) {
        throw new Error(`Cannot uninstall plugin ${name}. Dependent plugins: ${dependents.join(', ')}`);
      }

      await plugin.uninstall(this.engine);
      
      this.plugins.delete(name);
      this.pluginStates.delete(name);
      
      this.engine.emit('plugin:uninstalled', { name });
      console.log(`✅ Plugin uninstalled: ${name}`);

    } catch (error) {
      console.error(`❌ Failed to uninstall plugin ${name}:`, error);
      throw error;
    }
  }

  getPlugin(name: string): GamePlugin | undefined {
    return this.plugins.get(name);
  }

  getInstalledPlugins(): GamePlugin[] {
    return Array.from(this.plugins.values());
  }

  isPluginInstalled(name: string): boolean {
    return this.pluginStates.get(name) === 'installed';
  }

  private getDependentPlugins(pluginName: string): string[] {
    const dependents: string[] = [];
    
    for (const [name, plugin] of this.plugins) {
      if (plugin.dependencies?.includes(pluginName)) {
        dependents.push(name);
      }
    }
    
    return dependents;
  }

  // Plugin discovery and loading
  async loadPluginFromModule(modulePath: string): Promise<GamePlugin> {
    try {
      const module = await import(modulePath);
      const plugin = module.default || module;
      
      if (!this.isValidPlugin(plugin)) {
        throw new Error(`Invalid plugin structure: ${modulePath}`);
      }
      
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to load plugin from ${modulePath}:`, error);
      throw error;
    }
  }

  private isValidPlugin(plugin: any): plugin is GamePlugin {
    return (
      plugin &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.install === 'function' &&
      typeof plugin.uninstall === 'function'
    );
  }
}

// Base Plugin Class for easy plugin development
export abstract class BasePlugin implements GamePlugin {
  abstract name: string;
  abstract version: string;
  dependencies?: string[];

  abstract install(engine: IGameEngine): Promise<void>;
  abstract uninstall(engine: IGameEngine): Promise<void>;

  // Helper methods for common plugin operations
  protected addSystem(engine: IGameEngine, system: System): void {
    engine.addSystem(system);
  }

  protected removeSystem(engine: IGameEngine, systemName: string): void {
    engine.removeSystem(systemName);
  }

  protected addAction(engine: IGameEngine, action: ActionDefinition): void {
    const actionSystem = engine.getSystem('ActionSystem');
    if (actionSystem && 'registerAction' in actionSystem) {
      (actionSystem as any).registerAction(action);
    }
  }

  protected removeAction(engine: IGameEngine, actionType: string): void {
    const actionSystem = engine.getSystem('ActionSystem');
    if (actionSystem && 'unregisterAction' in actionSystem) {
      (actionSystem as any).unregisterAction(actionType);
    }
  }
}

// Example Plugin Implementations
export class DebugPlugin extends BasePlugin {
  name = 'DebugPlugin';
  version = '1.0.0';

  async install(engine: IGameEngine): Promise<void> {
    const debugSystem = new DebugSystem();
    this.addSystem(engine, debugSystem);
    
    console.log('🐛 Debug plugin installed');
  }

  async uninstall(engine: IGameEngine): Promise<void> {
    this.removeSystem(engine, 'DebugSystem');
    console.log('🐛 Debug plugin uninstalled');
  }
}

export class AIPlugin extends BasePlugin {
  name = 'AIPlugin';
  version = '1.0.0';

  async install(engine: IGameEngine): Promise<void> {
    const aiSystem = new AISystem();
    this.addSystem(engine, aiSystem);
    
    console.log('🤖 AI plugin installed');
  }

  async uninstall(engine: IGameEngine): Promise<void> {
    this.removeSystem(engine, 'AISystem');
    console.log('🤖 AI plugin uninstalled');
  }
}

export class AudioPlugin extends BasePlugin {
  name = 'AudioPlugin';
  version = '1.0.0';

  async install(engine: IGameEngine): Promise<void> {
    const audioSystem = new AudioSystem();
    this.addSystem(engine, audioSystem);
    
    console.log('🔊 Audio plugin installed');
  }

  async uninstall(engine: IGameEngine): Promise<void> {
    this.removeSystem(engine, 'AudioSystem');
    console.log('🔊 Audio plugin uninstalled');
  }
}

// Example System implementations for plugins
class DebugSystem implements System {
  name = 'DebugSystem';
  priority = 1000;
  enabled = true;

  async update(deltaTime: number, gameState: any): Promise<void> {
    // Debug overlay, performance monitoring, etc.
    if (typeof window !== 'undefined' && gameState.settings.debugMode) {
      this.updateDebugOverlay(deltaTime, gameState);
    }
  }

  private updateDebugOverlay(deltaTime: number, gameState: any): void {
    // Update debug information display
    console.debug(`FPS: ${(1 / deltaTime).toFixed(1)}, Entities: ${gameState.entities.size}`);
  }
}

class AISystem implements System {
  name = 'AISystem';
  priority = 25;
  enabled = true;

  async update(deltaTime: number, gameState: any): Promise<void> {
    // Update AI for entities with AI components
    for (const entity of gameState.entities.values()) {
      if (entity.properties.ai) {
        this.updateEntityAI(entity, deltaTime, gameState);
      }
    }
  }

  private updateEntityAI(entity: any, deltaTime: number, gameState: any): void {
    const aiType = entity.properties.ai;
    
    switch (aiType) {
      case 'aggressive':
        this.updateAggressiveAI(entity, deltaTime, gameState);
        break;
      case 'passive':
        this.updatePassiveAI(entity, deltaTime, gameState);
        break;
      case 'patrol':
        this.updatePatrolAI(entity, deltaTime, gameState);
        break;
    }
  }

  private updateAggressiveAI(entity: any, deltaTime: number, gameState: any): void {
    // Find nearest player and move towards them
    const players = Array.from(gameState.entities.values())
      .filter((e: any) => e.type === 'player');
    
    if (players.length > 0) {
      const nearestPlayer = players[0] as any; // Type assertion for simplicity
      const direction = {
        x: nearestPlayer.position.x - entity.position.x,
        z: nearestPlayer.position.z - entity.position.z
      };
      
      // Normalize and apply movement
      const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
      if (length > 0) {
        const speed = entity.properties.speed || 2;
        entity.position.x += (direction.x / length) * speed * deltaTime;
        entity.position.z += (direction.z / length) * speed * deltaTime;
      }
    }
  }

  private updatePassiveAI(entity: any, deltaTime: number, gameState: any): void {
    // Random wandering behavior
    if (!entity.properties.aiState) {
      entity.properties.aiState = {
        nextDirectionChange: Date.now() + Math.random() * 3000,
        direction: { x: 0, z: 0 }
      };
    }

    const aiState = entity.properties.aiState;
    
    if (Date.now() > aiState.nextDirectionChange) {
      aiState.direction.x = (Math.random() - 0.5) * 2;
      aiState.direction.z = (Math.random() - 0.5) * 2;
      aiState.nextDirectionChange = Date.now() + Math.random() * 3000;
    }

    const speed = (entity.properties.speed || 1) * 0.5;
    entity.position.x += aiState.direction.x * speed * deltaTime;
    entity.position.z += aiState.direction.z * speed * deltaTime;
  }

  private updatePatrolAI(entity: any, deltaTime: number, gameState: any): void {
    // Follow waypoints
    if (!entity.properties.patrolPoints || entity.properties.patrolPoints.length === 0) {
      return;
    }

    if (!entity.properties.aiState) {
      entity.properties.aiState = {
        currentWaypoint: 0,
        direction: 1
      };
    }

    const patrolPoints = entity.properties.patrolPoints;
    const aiState = entity.properties.aiState;
    const targetPoint = patrolPoints[aiState.currentWaypoint];
    
    // Move towards current waypoint
    const direction = {
      x: targetPoint.x - entity.position.x,
      z: targetPoint.z - entity.position.z
    };
    
    const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    
    if (distance < 0.5) {
      // Reached waypoint, move to next
      aiState.currentWaypoint += aiState.direction;
      
      if (aiState.currentWaypoint >= patrolPoints.length || aiState.currentWaypoint < 0) {
        aiState.direction *= -1;
        aiState.currentWaypoint += aiState.direction;
      }
    } else {
      // Move towards waypoint
      const speed = entity.properties.speed || 2;
      entity.position.x += (direction.x / distance) * speed * deltaTime;
      entity.position.z += (direction.z / distance) * speed * deltaTime;
    }
  }
}

class AudioSystem implements System {
  name = 'AudioSystem';
  priority = 50;
  enabled = true;

  async update(deltaTime: number, gameState: any): Promise<void> {
    // Update 3D audio, music, sound effects
    if (typeof window !== 'undefined') {
      this.updateClientAudio(deltaTime, gameState);
    }
  }

  private updateClientAudio(deltaTime: number, gameState: any): void {
    // Update audio listener position, handle sound events, etc.
    // This would integrate with Web Audio API or a library like Howler.js
  }
}
