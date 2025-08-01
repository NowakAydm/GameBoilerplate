import {
  System,
  IGameEngine,
  GameState,
  GameEntity,
  Vector3,
  INetworkSystem,
  NetworkAction,
  NetworkEvent
} from './types.js';

export class SystemManager {
  private engine: IGameEngine;

  constructor(engine: IGameEngine) {
    this.engine = engine;
  }

  // Factory methods for common systems
  createMovementSystem(): MovementSystem {
    return new MovementSystem();
  }

  createPhysicsSystem(): PhysicsSystem {
    return new PhysicsSystem();
  }

  createRenderSystem(): RenderSystem {
    return new RenderSystem();
  }

  createNetworkSystem(): NetworkSystem {
    return new NetworkSystem();
  }

  createInventorySystem(): InventorySystem {
    return new InventorySystem();
  }

  createCombatSystem(): CombatSystem {
    return new CombatSystem();
  }

  // Install a set of systems for a specific game type
  installGameSystems(gameType: 'platformer' | 'rpg' | 'shooter' | 'puzzle'): void {
    switch (gameType) {
      case 'platformer':
        this.engine.addSystem(this.createMovementSystem());
        this.engine.addSystem(this.createPhysicsSystem());
        this.engine.addSystem(this.createRenderSystem());
        break;
      
      case 'rpg':
        this.engine.addSystem(this.createMovementSystem());
        this.engine.addSystem(this.createCombatSystem());
        this.engine.addSystem(this.createInventorySystem());
        this.engine.addSystem(this.createRenderSystem());
        break;
      
      case 'shooter':
        this.engine.addSystem(this.createMovementSystem());
        this.engine.addSystem(this.createPhysicsSystem());
        this.engine.addSystem(this.createCombatSystem());
        this.engine.addSystem(this.createRenderSystem());
        break;
      
      case 'puzzle':
        this.engine.addSystem(this.createRenderSystem());
        break;
    }

    // Always add network system for multiplayer
    this.engine.addSystem(this.createNetworkSystem());
  }
}

// Basic Movement System
export class MovementSystem implements System {
  name = 'MovementSystem';
  priority = 10;
  enabled = true;

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // Update all entities with movement components
    for (const entity of gameState.entities.values()) {
      if (entity.properties.velocity) {
        const velocity = entity.properties.velocity as Vector3;
        
        // Apply velocity to position
        entity.position.x += velocity.x * deltaTime;
        entity.position.y += velocity.y * deltaTime;
        entity.position.z += velocity.z * deltaTime;

        // Apply friction if specified
        if (entity.properties.friction) {
          const friction = entity.properties.friction as number;
          velocity.x *= Math.pow(friction, deltaTime);
          velocity.y *= Math.pow(friction, deltaTime);
          velocity.z *= Math.pow(friction, deltaTime);
        }
      }
    }
  }
}

// Basic Physics System
export class PhysicsSystem implements System {
  name = 'PhysicsSystem';
  priority = 5;
  enabled = true;
  private gravity = -9.81;

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    for (const entity of gameState.entities.values()) {
      if (entity.properties.physics && entity.properties.velocity) {
        const velocity = entity.properties.velocity as Vector3;
        
        // Apply gravity
        if (entity.properties.affectedByGravity !== false) {
          velocity.y += this.gravity * deltaTime;
        }

        // Ground collision (simple)
        if (entity.position.y <= 0 && velocity.y < 0) {
          entity.position.y = 0;
          velocity.y = 0;
          
          // Bounce if specified
          if (entity.properties.bouncy) {
            velocity.y = Math.abs(velocity.y) * (entity.properties.bounciness || 0.5);
          }
        }

        // World boundaries
        const bounds = gameState.settings.worldBounds || { min: -100, max: 100 };
        entity.position.x = Math.max(bounds.min, Math.min(bounds.max, entity.position.x));
        entity.position.z = Math.max(bounds.min, Math.min(bounds.max, entity.position.z));
      }
    }
  }
}

// Render System (client-side interface)
export class RenderSystem implements System {
  name = 'RenderSystem';
  priority = 100;
  enabled = true;

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // This would be implemented differently on client vs server
    // Server version might just track what needs to be rendered
    // Client version would handle actual Three.js rendering
    
    if (typeof window !== 'undefined') {
      // Client-side rendering logic would go here
      this.updateClientRender(deltaTime, gameState);
    } else {
      // Server-side render tracking
      this.updateServerRender(deltaTime, gameState);
    }
  }

  private updateClientRender(deltaTime: number, gameState: GameState): void {
    // Update visual representations of entities
    // This would integrate with Three.js scene
  }

  private updateServerRender(deltaTime: number, gameState: GameState): void {
    // Track what entities are visible to what players
    // Prepare render data for client synchronization
  }
}

// Network System
export class NetworkSystem implements System, INetworkSystem {
  name = 'NetworkSystem';
  priority = 1;
  enabled = true;
  
  private actionCallbacks: ((action: NetworkAction) => void)[] = [];
  private eventCallbacks: ((event: NetworkEvent) => void)[] = [];

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // Handle pending network operations
    // Batch network updates for efficiency
  }

  async sendAction(action: NetworkAction): Promise<void> {
    // Implementation would depend on the networking layer
    console.log('Sending network action:', action);
  }

  async broadcastEvent(event: NetworkEvent): Promise<void> {
    // Implementation would depend on the networking layer
    console.log('Broadcasting network event:', event);
  }

  onAction(callback: (action: NetworkAction) => void): void {
    this.actionCallbacks.push(callback);
  }

  onEvent(callback: (event: NetworkEvent) => void): void {
    this.eventCallbacks.push(callback);
  }
}

// Inventory System
export class InventorySystem implements System {
  name = 'InventorySystem';
  priority = 20;
  enabled = true;

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // Update inventory-related logic
    // Item durability, expiration, etc.
    
    for (const entity of gameState.entities.values()) {
      if (entity.properties.inventory) {
        this.updateInventory(entity, deltaTime);
      }
    }
  }

  private updateInventory(entity: GameEntity, deltaTime: number): void {
    const inventory = entity.properties.inventory as any[];
    
    for (const item of inventory) {
      // Update item durability
      if (item.durability !== undefined && item.durabilityDecay) {
        item.durability = Math.max(0, item.durability - item.durabilityDecay * deltaTime);
        
        // Remove broken items
        if (item.durability <= 0) {
          const index = inventory.indexOf(item);
          if (index > -1) {
            inventory.splice(index, 1);
          }
        }
      }

      // Update item expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        const index = inventory.indexOf(item);
        if (index > -1) {
          inventory.splice(index, 1);
        }
      }
    }
  }

  // Utility methods for inventory management
  addItem(entity: GameEntity, item: any): boolean {
    if (!entity.properties.inventory) {
      entity.properties.inventory = [];
    }

    const inventory = entity.properties.inventory as any[];
    const maxSlots = entity.properties.maxInventorySlots || 20;

    if (inventory.length >= maxSlots) {
      return false; // Inventory full
    }

    inventory.push(item);
    return true;
  }

  removeItem(entity: GameEntity, itemId: string): any | null {
    if (!entity.properties.inventory) {
      return null;
    }

    const inventory = entity.properties.inventory as any[];
    const index = inventory.findIndex(item => item.id === itemId);
    
    if (index > -1) {
      return inventory.splice(index, 1)[0];
    }

    return null;
  }
}

// Combat System
export class CombatSystem implements System {
  name = 'CombatSystem';
  priority = 15;
  enabled = true;

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // Update combat-related logic
    // Cooldowns, damage over time, etc.
    
    for (const entity of gameState.entities.values()) {
      if (entity.properties.combat) {
        this.updateCombatEntity(entity, deltaTime);
      }
    }
  }

  private updateCombatEntity(entity: GameEntity, deltaTime: number): void {
    const combat = entity.properties.combat;

    // Update cooldowns
    if (combat.attackCooldown > 0) {
      combat.attackCooldown = Math.max(0, combat.attackCooldown - deltaTime * 1000);
    }

    // Update damage over time effects
    if (combat.dots) { // damage over time effects
      for (const dot of combat.dots) {
        dot.duration -= deltaTime * 1000;
        
        if (dot.duration <= 0) {
          // Remove expired DOT
          const index = combat.dots.indexOf(dot);
          if (index > -1) {
            combat.dots.splice(index, 1);
          }
        } else {
          // Apply DOT damage
          if (dot.tickTimer <= 0) {
            this.applyDamage(entity, dot.damage);
            dot.tickTimer = dot.tickInterval;
          } else {
            dot.tickTimer -= deltaTime * 1000;
          }
        }
      }
    }

    // Health regeneration
    if (combat.healthRegen && combat.health < combat.maxHealth) {
      combat.health = Math.min(
        combat.maxHealth,
        combat.health + combat.healthRegen * deltaTime
      );
    }
  }

  private applyDamage(entity: GameEntity, damage: number): void {
    if (!entity.properties.combat) return;

    entity.properties.combat.health = Math.max(0, entity.properties.combat.health - damage);
    
    // Entity death
    if (entity.properties.combat.health <= 0) {
      entity.properties.isDead = true;
      // Emit death event
    }
  }

  // Combat utility methods
  canAttack(attacker: GameEntity, target: GameEntity): boolean {
    if (!attacker.properties.combat || !target.properties.combat) {
      return false;
    }

    if (attacker.properties.combat.attackCooldown > 0) {
      return false;
    }

    if (target.properties.isDead) {
      return false;
    }

    // Check range
    const distance = this.calculateDistance(attacker.position, target.position);
    const attackRange = attacker.properties.combat.attackRange || 1;
    
    return distance <= attackRange;
  }

  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
