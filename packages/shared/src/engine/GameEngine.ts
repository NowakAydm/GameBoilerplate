import { EventEmitter } from 'events';
import {
  IGameEngine,
  GameState,
  System,
  GameEntity,
  EngineConfig,
  ITickSystem,
  GameEngineEvent,
  Vector3,
  EngineStats
} from './types';

export class GameEngine extends EventEmitter implements IGameEngine {
  public gameState: GameState;
  public isRunning: boolean = false;
  private config: EngineConfig;
  private tickSystem: ITickSystem;
  private lastUpdateTime: number = 0;

  constructor(config: Partial<EngineConfig> = {}) {
    super();
    
    this.config = {
      tickRate: 60,
      maxEntities: 1000,
      enableDebug: false,
      enableProfiling: false,
      autoStart: false,
      plugins: [],
      systems: [],
      scenes: [],
      ...config
    };

    this.gameState = {
      entities: new Map(),
      systems: new Map(),
      deltaTime: 0,
      totalTime: 0,
      gameMode: 'default',
      settings: {}
    };

    this.tickSystem = new TickSystem(this.config.tickRate);
  }

  async init(): Promise<void> {
    console.log('🎮 Initializing Game Engine...');
    
    // Initialize systems in priority order
    const systems = Array.from(this.gameState.systems.values())
      .sort((a, b) => a.priority - b.priority);
    
    for (const system of systems) {
      if (system.init) {
        await system.init(this);
        console.log(`✅ System initialized: ${system.name}`);
      }
    }

    // Setup tick system
    this.tickSystem.onTick((deltaTime: number) => {
      this.update(deltaTime);
    });

    this.emit('engine:initialized');
    console.log('🚀 Game Engine initialized successfully');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Engine is already running');
      return;
    }

    console.log('▶️ Starting Game Engine...');
    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    
    this.tickSystem.start();
    this.emit('engine:started');
    console.log('✅ Game Engine started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Engine is not running');
      return;
    }

    console.log('⏹️ Stopping Game Engine...');
    this.isRunning = false;
    
    this.tickSystem.stop();
    
    // Cleanup systems
    for (const system of this.gameState.systems.values()) {
      if (system.destroy) {
        await system.destroy();
      }
    }

    this.emit('engine:stopped');
    console.log('✅ Game Engine stopped');
  }

  async update(deltaTime: number): Promise<void> {
    if (!this.isRunning) return;

    this.gameState.deltaTime = deltaTime;
    this.gameState.totalTime += deltaTime;

    // Update all enabled systems in priority order
    const systems = Array.from(this.gameState.systems.values())
      .filter(system => system.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const system of systems) {
      try {
        if (system.update) {
          await system.update(deltaTime, this.gameState);
        }
      } catch (error) {
        console.error(`❌ Error updating system ${system.name}:`, error);
        this.emit('system:error', { system: system.name, error });
      }
    }

    this.emit('engine:updated', { deltaTime, totalTime: this.gameState.totalTime });
  }

  // System Management
  addSystem(system: System): void {
    if (this.gameState.systems.has(system.name)) {
      console.warn(`⚠️ System ${system.name} already exists, replacing...`);
    }
    
    this.gameState.systems.set(system.name, system);
    console.log(`📦 System added: ${system.name} (priority: ${system.priority})`);
    this.emit('system:added', system);
  }

  removeSystem(name: string): void {
    const system = this.gameState.systems.get(name);
    if (!system) {
      console.warn(`⚠️ System ${name} not found`);
      return;
    }

    if (system.destroy) {
      try {
        const result = system.destroy();
        // Handle both sync and async destroy methods
        if (result && typeof result.catch === 'function') {
          result.catch(error => {
            console.error(`❌ Error destroying system ${name}:`, error);
          });
        }
      } catch (error) {
        console.error(`❌ Error destroying system ${name}:`, error);
      }
    }

    this.gameState.systems.delete(name);
    console.log(`🗑️ System removed: ${name}`);
    this.emit('system:removed', { name });
  }

  getSystem<T extends System>(name: string): T | undefined {
    return this.gameState.systems.get(name) as T | undefined;
  }

  // Entity Management
  addEntity(entity: GameEntity): void {
    if (this.gameState.entities.size >= this.config.maxEntities) {
      throw new Error(`Maximum entity limit reached (${this.config.maxEntities})`);
    }

    if (this.gameState.entities.has(entity.id)) {
      console.warn(`⚠️ Entity ${entity.id} already exists, replacing...`);
    }

    this.gameState.entities.set(entity.id, entity);
    this.emit('entity:added', entity);
  }

  removeEntity(id: string): void {
    const entity = this.gameState.entities.get(id);
    if (!entity) {
      console.warn(`⚠️ Entity ${id} not found`);
      return;
    }

    this.gameState.entities.delete(id);
    this.emit('entity:removed', entity);
  }

  getEntity(id: string): GameEntity | undefined {
    return this.gameState.entities.get(id);
  }

  getEntitiesByType(type: string): GameEntity[] {
    return Array.from(this.gameState.entities.values())
      .filter(entity => entity.type === type);
  }

  // Event System (enhanced EventEmitter)
  emit(event: string, data?: any): boolean {
    const gameEvent: GameEngineEvent = {
      type: event,
      data,
      timestamp: Date.now(),
      source: 'engine'
    };

    return super.emit(event, gameEvent);
  }

  // Utility methods
  createEntity(type: string, position: Vector3 = { x: 0, y: 0, z: 0 }): GameEntity {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      type,
      properties: {}
    };
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  setGameMode(mode: string): void {
    const oldMode = this.gameState.gameMode;
    this.gameState.gameMode = mode;
    this.emit('gameMode:changed', { oldMode, newMode: mode });
  }

  // Debug and profiling
  getStats(): EngineStats {
    return {
      isRunning: this.isRunning,
      entityCount: this.gameState.entities.size,
      systemCount: this.gameState.systems.size,
      totalTime: this.gameState.totalTime,
      deltaTime: this.gameState.deltaTime,
      fps: this.tickSystem.actualFPS,
      memory: process.memoryUsage ? process.memoryUsage() : undefined
    };
  }
}

// Tick System Implementation
class TickSystem implements ITickSystem {
  public targetFPS: number;
  public actualFPS: number = 0;
  public deltaTime: number = 0;
  public totalTime: number = 0;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private callbacks: ((deltaTime: number) => void)[] = [];
  private animationFrameId?: number;

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.fpsUpdateTime = this.lastTime;
    this.frameCount = 0;
    
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  onTick(callback: (deltaTime: number) => void): void {
    this.callbacks.push(callback);
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.totalTime += this.deltaTime;
    this.lastTime = currentTime;

    // Update FPS calculation
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) { // Update FPS every second
      this.actualFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    // Call all tick callbacks
    for (const callback of this.callbacks) {
      try {
        callback(this.deltaTime);
      } catch (error) {
        console.error('❌ Error in tick callback:', error);
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
