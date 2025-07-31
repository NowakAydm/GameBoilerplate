import { 
  GameEngine, 
  SystemManager, 
  SceneManager, 
  ActionSystem,
  PluginSystem,
  SceneFactory,
  CommonActionSchemas,
  IGameEngine,
  NetworkAction,
  NetworkEvent,
  ActionContext,
  ActionResult
} from '@gameboilerplate/shared';
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class ServerGameEngine {
  private engine: GameEngine;
  private systemManager: SystemManager;
  private sceneManager: SceneManager;
  private actionSystem: ActionSystem;
  private pluginSystem: PluginSystem;
  private networkSystem: ServerNetworkSystem;

  constructor(httpServer?: HttpServer) {
    this.engine = new GameEngine({
      tickRate: 20, // Lower tick rate for server
      enableDebug: false,
      autoStart: false
    });

    this.systemManager = new SystemManager(this.engine);
    this.sceneManager = new SceneManager(this.engine);
    this.actionSystem = new ActionSystem(this.engine);
    this.pluginSystem = new PluginSystem(this.engine);
    this.networkSystem = new ServerNetworkSystem(httpServer);
  }

  async initialize(): Promise<void> {
    console.log('🎮 Initializing Server Game Engine...');

    // Add core systems
    this.engine.addSystem(this.actionSystem);
    this.engine.addSystem(this.networkSystem);
    
    // Install game systems for server
    this.systemManager.installGameSystems('rpg');

    // Register standard game actions
    this.registerGameActions();

    // Set up scenes
    this.setupScenes();

    // Initialize engine
    await this.engine.init();

    console.log('✅ Server Game Engine initialized');
  }

  async start(): Promise<void> {
    await this.engine.start();
    console.log('🚀 Server Game Engine started');
  }

  async stop(): Promise<void> {
    await this.engine.stop();
    console.log('⏹️ Server Game Engine stopped');
  }

  getEngine(): IGameEngine {
    return this.engine;
  }

  getActionSystem(): ActionSystem {
    return this.actionSystem;
  }

  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  private registerGameActions(): void {
    // Movement actions
    this.actionSystem.registerAction({
      type: 'move',
      schema: CommonActionSchemas.move,
      cooldown: 100, // 100ms cooldown
      handler: this.handleMoveAction.bind(this)
    });

    this.actionSystem.registerAction({
      type: 'teleport',
      schema: CommonActionSchemas.teleport,
      cooldown: 5000, // 5 second cooldown
      validator: this.validateTeleportAction.bind(this),
      handler: this.handleTeleportAction.bind(this)
    });

    // Combat actions
    this.actionSystem.registerAction({
      type: 'attack',
      schema: CommonActionSchemas.attack,
      cooldown: 1000, // 1 second cooldown
      handler: this.handleAttackAction.bind(this)
    });

    // Inventory actions
    this.actionSystem.registerAction({
      type: 'pickupItem',
      schema: CommonActionSchemas.pickupItem,
      cooldown: 200, // 200ms cooldown
      handler: this.handlePickupAction.bind(this)
    });

    this.actionSystem.registerAction({
      type: 'dropItem',
      schema: CommonActionSchemas.dropItem,
      cooldown: 200, // 200ms cooldown
      handler: this.handleDropAction.bind(this)
    });

    // System actions
    this.actionSystem.registerAction({
      type: 'ping',
      schema: CommonActionSchemas.ping,
      handler: this.handlePingAction.bind(this)
    });

    console.log('📝 Game actions registered');
  }

  private setupScenes(): void {
    // Add default scenes
    const gameplayScene = SceneFactory.createGameplayScene('main-game', 'rpg');
    const lobbyScene = SceneFactory.createLobbyScene('lobby');
    const testScene = SceneFactory.createTestScene('test');

    this.sceneManager.addScene(gameplayScene);
    this.sceneManager.addScene(lobbyScene);
    this.sceneManager.addScene(testScene);

    // Load the default scene
    this.sceneManager.loadScene('main-game').catch(console.error);

    console.log('🎬 Scenes configured');
  }

  // Action Handlers
  private async handleMoveAction(data: any, context: ActionContext): Promise<ActionResult> {
    const player = this.engine.getEntity(context.userId);
    if (!player) {
      return {
        success: false,
        message: 'Player entity not found'
      };
    }

    const moveDistance = data.distance || 1;
    const moveSpeed = data.speed || 1;

    // Apply movement based on direction
    switch (data.direction) {
      case 'up':
        player.position.z -= moveDistance;
        break;
      case 'down':
        player.position.z += moveDistance;
        break;
      case 'left':
        player.position.x -= moveDistance;
        break;
      case 'right':
        player.position.x += moveDistance;
        break;
      case 'forward':
        player.position.y += moveDistance;
        break;
      case 'backward':
        player.position.y -= moveDistance;
        break;
    }

    // Apply world boundaries
    const bounds = this.engine.gameState.settings.worldBounds || { min: -50, max: 50 };
    player.position.x = Math.max(bounds.min, Math.min(bounds.max, player.position.x));
    player.position.z = Math.max(bounds.min, Math.min(bounds.max, player.position.z));

    return {
      success: true,
      data: { newPosition: player.position },
      events: [{
        type: 'player:moved',
        data: { userId: context.userId, position: player.position },
        timestamp: Date.now()
      }]
    };
  }

  private async validateTeleportAction(data: any, context: ActionContext): Promise<boolean> {
    // Only allow teleport for admins or in debug mode
    if (context.userRole === 'admin' || this.engine.gameState.settings.debugMode) {
      return true;
    }

    return false;
  }

  private async handleTeleportAction(data: any, context: ActionContext): Promise<ActionResult> {
    const player = this.engine.getEntity(context.userId);
    if (!player) {
      return {
        success: false,
        message: 'Player entity not found'
      };
    }

    // Validate destination if required
    if (data.validateDestination) {
      const bounds = this.engine.gameState.settings.worldBounds || { min: -50, max: 50 };
      if (data.position.x < bounds.min || data.position.x > bounds.max ||
          data.position.z < bounds.min || data.position.z > bounds.max) {
        return {
          success: false,
          message: 'Teleport destination out of bounds'
        };
      }
    }

    player.position = { ...data.position };

    return {
      success: true,
      data: { newPosition: player.position },
      events: [{
        type: 'player:teleported',
        data: { userId: context.userId, position: player.position },
        timestamp: Date.now()
      }]
    };
  }

  private async handleAttackAction(data: any, context: ActionContext): Promise<ActionResult> {
    const attacker = this.engine.getEntity(context.userId);
    const target = this.engine.getEntity(data.targetId);

    if (!attacker || !target) {
      return {
        success: false,
        message: 'Attacker or target not found'
      };
    }

    // Check range
    const distance = this.calculateDistance(attacker.position, target.position);
    const attackRange = attacker.properties.combat?.attackRange || 2;

    if (distance > attackRange) {
      return {
        success: false,
        message: 'Target out of range'
      };
    }

    // Apply damage
    const damage = data.power || attacker.properties.combat?.attackPower || 10;
    if (!target.properties.combat) {
      target.properties.combat = { health: 100, maxHealth: 100 };
    }

    target.properties.combat.health = Math.max(0, target.properties.combat.health - damage);

    const events = [{
      type: 'combat:damage',
      data: { 
        attackerId: context.userId, 
        targetId: data.targetId, 
        damage,
        targetHealth: target.properties.combat.health
      },
      timestamp: Date.now()
    }];

    // Check for death
    if (target.properties.combat.health <= 0) {
      target.properties.isDead = true;
      events.push({
        type: 'entity:died',
        data: { entityId: data.targetId, killedBy: context.userId } as any,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      data: { damage, targetHealth: target.properties.combat.health },
      events
    };
  }

  private async handlePickupAction(data: any, context: ActionContext): Promise<ActionResult> {
    const player = this.engine.getEntity(context.userId);
    const item = this.engine.getEntity(data.itemId);

    if (!player || !item) {
      return {
        success: false,
        message: 'Player or item not found'
      };
    }

    if (!item.properties.pickupable) {
      return {
        success: false,
        message: 'Item cannot be picked up'
      };
    }

    // Check range
    const distance = this.calculateDistance(player.position, item.position);
    if (distance > 2) {
      return {
        success: false,
        message: 'Item too far away'
      };
    }

    // Add to inventory
    if (!player.properties.inventory) {
      player.properties.inventory = [];
    }

    const maxSlots = player.properties.maxInventorySlots || 20;
    if (player.properties.inventory.length >= maxSlots) {
      return {
        success: false,
        message: 'Inventory full'
      };
    }

    player.properties.inventory.push({
      id: item.id,
      type: item.properties.itemType,
      value: item.properties.value,
      quantity: data.quantity || 1
    });

    // Remove item from world
    this.engine.removeEntity(data.itemId);

    return {
      success: true,
      events: [{
        type: 'item:pickedUp',
        data: { userId: context.userId, itemId: data.itemId },
        timestamp: Date.now()
      }]
    };
  }

  private async handleDropAction(data: any, context: ActionContext): Promise<ActionResult> {
    const player = this.engine.getEntity(context.userId);
    if (!player || !player.properties.inventory) {
      return {
        success: false,
        message: 'Player or inventory not found'
      };
    }

    const itemIndex = player.properties.inventory.findIndex((item: any) => item.id === data.itemId);
    if (itemIndex === -1) {
      return {
        success: false,
        message: 'Item not in inventory'
      };
    }

    const item = player.properties.inventory[itemIndex];
    
    // Remove from inventory
    if (item.quantity > (data.quantity || 1)) {
      item.quantity -= data.quantity || 1;
    } else {
      player.properties.inventory.splice(itemIndex, 1);
    }

    // Create item entity in world
    const dropPosition = data.position || {
      x: player.position.x + (Math.random() - 0.5) * 2,
      y: player.position.y,
      z: player.position.z + (Math.random() - 0.5) * 2
    };

    const droppedItem = this.engine.createEntity('item', dropPosition);
    droppedItem.properties = {
      itemType: item.type,
      value: item.value,
      pickupable: true
    };
    this.engine.addEntity(droppedItem);

    return {
      success: true,
      events: [{
        type: 'item:dropped',
        data: { userId: context.userId, itemId: droppedItem.id, position: dropPosition },
        timestamp: Date.now()
      }]
    };
  }

  private async handlePingAction(data: any, context: ActionContext): Promise<ActionResult> {
    const serverTime = Date.now();
    const roundTripTime = serverTime - data.timestamp;

    return {
      success: true,
      data: { 
        serverTime, 
        clientTime: data.timestamp, 
        roundTripTime 
      }
    };
  }

  private calculateDistance(pos1: any, pos2: any): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Player management
  createPlayer(userId: string, username?: string): void {
    const existingPlayer = this.engine.getEntity(userId);
    if (existingPlayer) {
      console.log(`Player ${userId} already exists`);
      return;
    }

    const player = this.engine.createEntity('player', { x: 0, y: 1, z: 0 });
    player.id = userId; // Use userId as entity ID
    player.properties = {
      username: username || `Player_${userId.slice(-4)}`,
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

    this.engine.addEntity(player);
    console.log(`👤 Player created: ${player.properties.username} (${userId})`);
  }

  removePlayer(userId: string): void {
    this.engine.removeEntity(userId);
    console.log(`👤 Player removed: ${userId}`);
  }

  getPlayerCount(): number {
    return this.engine.getEntitiesByType('player').length;
  }
}

// Server Network System
class ServerNetworkSystem {
  name = 'NetworkSystem';
  priority = 1;
  enabled = true;
  
  private io?: SocketServer;

  constructor(httpServer?: HttpServer) {
    if (httpServer) {
      this.io = new SocketServer(httpServer, {
        cors: {
          origin: process.env.NODE_ENV === 'production' ? false : '*',
          credentials: true,
        },
      });
    }
  }

  async init(engine: IGameEngine): Promise<void> {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      socket.on('gameAction', async (actionData) => {
        // This would integrate with the action system
        console.log('📨 Received game action:', actionData);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  async sendAction(action: NetworkAction): Promise<void> {
    // Implementation would send to specific clients
    console.log('📤 Sending network action:', action);
  }

  async broadcastEvent(event: NetworkEvent): Promise<void> {
    if (!this.io) return;

    if (event.targets && event.targets.length > 0) {
      // Send to specific targets
      event.targets.forEach(targetId => {
        this.io?.to(targetId).emit('gameEvent', event);
      });
    } else {
      // Broadcast to all clients
      this.io.emit('gameEvent', event);
    }
  }

  getSocketServer(): SocketServer | undefined {
    return this.io;
  }
}
