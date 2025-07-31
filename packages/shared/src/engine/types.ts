import { z } from 'zod';

// Core Engine Types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GameEntity {
  id: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  type: string;
  properties: Record<string, any>;
}

export interface GameState {
  entities: Map<string, GameEntity>;
  systems: Map<string, System>;
  deltaTime: number;
  totalTime: number;
  gameMode: string;
  settings: Record<string, any>;
}

// System Interface
export interface System {
  name: string;
  priority: number;
  enabled: boolean;
  
  init?(engine: IGameEngine): Promise<void>;
  update?(deltaTime: number, gameState: GameState): Promise<void>;
  destroy?(): Promise<void>;
  
  // System-specific data
  data?: Record<string, any>;
}

// Game Engine Interface
export interface IGameEngine {
  gameState: GameState;
  isRunning: boolean;
  
  // Core lifecycle
  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  update(deltaTime: number): Promise<void>;
  
  // System management
  addSystem(system: System): void;
  removeSystem(name: string): void;
  getSystem<T extends System>(name: string): T | undefined;
  
  // Entity management
  addEntity(entity: GameEntity): void;
  removeEntity(id: string): void;
  getEntity(id: string): GameEntity | undefined;
  getEntitiesByType(type: string): GameEntity[];
  createEntity(type: string, position?: Vector3): GameEntity;
  
  // Event system
  emit(event: string, data?: any): void;
  on(event: string, callback: (data?: any) => void): void;
  off(event: string, callback: (data?: any) => void): void;
  
  // Stats and debugging
  getStats(): EngineStats;
}

// Engine Statistics
export interface EngineStats {
  isRunning: boolean;
  entityCount: number;
  systemCount: number;
  totalTime: number;
  deltaTime: number;
  fps: number;
  memory?: any;
}

// Plugin Interface
export interface GamePlugin {
  name: string;
  version: string;
  dependencies?: string[];
  
  install(engine: IGameEngine): Promise<void>;
  uninstall(engine: IGameEngine): Promise<void>;
}

// Scene Management
export interface Scene {
  id: string;
  name: string;
  entities: string[];
  systems: string[];
  settings: Record<string, any>;
  
  load?(engine: IGameEngine): Promise<void>;
  unload?(engine: IGameEngine): Promise<void>;
}

export interface ISceneManager {
  currentScene: Scene | null;
  scenes: Map<string, Scene>;
  
  addScene(scene: Scene): void;
  removeScene(id: string): void;
  loadScene(id: string): Promise<void>;
  unloadCurrentScene(): Promise<void>;
}

// Action System Types
export interface ActionDefinition {
  type: string;
  schema: z.ZodSchema;
  validator?: (action: any, context: ActionContext) => Promise<boolean>;
  handler: (action: any, context: ActionContext) => Promise<ActionResult>;
  priority?: number;
  cooldown?: number;
}

export interface ActionContext {
  userId: string;
  userRole: string;
  isGuest: boolean;
  gameState: GameState;
  engine: IGameEngine;
  timestamp: number;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
  stateChanges?: Partial<GameState>;
  events?: GameEngineEvent[];
}

export interface IActionSystem {
  actions: Map<string, ActionDefinition>;
  
  registerAction(definition: ActionDefinition): void;
  unregisterAction(type: string): void;
  processAction(type: string, data: any, context: ActionContext): Promise<ActionResult>;
  getActions(): ActionDefinition[];
}

// Event System
export interface GameEngineEvent {
  type: string;
  data?: any;
  timestamp: number;
  source?: string;
}

export interface IEventSystem {
  emit(event: GameEngineEvent): void;
  on(eventType: string, callback: (event: GameEngineEvent) => void): void;
  off(eventType: string, callback: (event: GameEngineEvent) => void): void;
  once(eventType: string, callback: (event: GameEngineEvent) => void): void;
}

// Tick System
export interface ITickSystem {
  targetFPS: number;
  actualFPS: number;
  deltaTime: number;
  totalTime: number;
  
  start(): void;
  stop(): void;
  onTick(callback: (deltaTime: number) => void): void;
}

// Configuration
export interface EngineConfig {
  tickRate: number;
  maxEntities: number;
  enableDebug: boolean;
  enableProfiling: boolean;
  autoStart: boolean;
  plugins: string[];
  systems: string[];
  scenes: string[];
}

// Network Integration Types
export interface NetworkAction {
  type: string;
  data: any;
  userId: string;
  timestamp: number;
}

export interface NetworkEvent {
  type: string;
  data: any;
  targets?: string[]; // specific user IDs, empty for broadcast
  timestamp: number;
}

export interface INetworkSystem extends System {
  sendAction(action: NetworkAction): Promise<void>;
  broadcastEvent(event: NetworkEvent): Promise<void>;
  onAction(callback: (action: NetworkAction) => void): void;
  onEvent(callback: (event: NetworkEvent) => void): void;
}
