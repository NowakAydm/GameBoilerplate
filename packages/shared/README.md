# @gameboilerplate/shared

> Comprehensive game engine framework with ECS architecture, action system, and plugin support.

## Tech Stack

- **TypeScript-first** - Full type safety and IntelliSense
- **Zod** - Runtime validation for actions and data
- **ECS Architecture** - Entity-Component-System pattern
- **Plugin System** - Extensible architecture
- **React Three Fiber** - 3D rendering integration

## Features

### 🎮 Game Engine Core
- **Entity-Component-System (ECS)** - Modular game object architecture
- **Action System** - Type-safe game actions with validation and cooldowns
- **System Manager** - Update loop management with priorities
- **Scene Management** - Scene transitions with state persistence
- **Plugin Architecture** - Extensible system for custom game mechanics

### 🌐 Network & Real-time
- **WebSocket Integration** - Real-time multiplayer support
- **Action Broadcasting** - Synchronized game state across clients
- **Event System** - Custom game events with metadata

### 🎨 Rendering & 3D
- **React Three Fiber** - Automatic 3D visualization
- **Entity Rendering** - Visual representation of game entities
- **Real-time Updates** - Live synchronization between game state and visuals

## Quick Start

### Basic Game Engine Setup

```typescript
import { GameEngine, ActionSystem, SystemManager } from '@gameboilerplate/shared/engine';

// Create a new game engine
const engine = new GameEngine();

// Initialize with default systems
await engine.init();

// Create a player entity
const player = engine.createEntity('player', { x: 0, y: 0, z: 0 });
player.properties = {
  health: 100,
  level: 1,
  inventory: []
};

engine.addEntity(player);

// Start the game loop
engine.start();
```

### Action System Usage

```typescript
import { z } from 'zod';

// Register a custom action
engine.registerAction({
  type: 'movePlayer',
  schema: z.object({
    direction: z.enum(['north', 'south', 'east', 'west']),
    distance: z.number().min(1).max(10)
  }),
  cooldown: 1000, // 1 second cooldown
  handler: async (data, context) => {
    const player = context.engine.getEntity(context.userId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Update player position
    switch (data.direction) {
      case 'north': player.position.z -= data.distance; break;
      case 'south': player.position.z += data.distance; break;
      case 'east': player.position.x += data.distance; break;
      case 'west': player.position.x -= data.distance; break;
    }

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
});

// Execute an action
const result = await engine.executeAction('movePlayer', {
  direction: 'north',
  distance: 5
}, { userId: 'player123', engine });
```

### React Three Fiber Integration

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { GameEngine, useGameEngine, GameScene } from '@gameboilerplate/shared/engine';

function GameComponent() {
  const { engine, isLoading } = useGameEngine({
    gameType: 'rpg',
    userId: 'player123'
  });

  if (isLoading) return <div>Loading game...</div>;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <GameScene engine={engine} />
      </Canvas>
    </div>
  );
}
```

### Custom System Development

```typescript
import { System, GameState, IGameEngine } from '@gameboilerplate/shared/engine';

class HealthRegenSystem implements System {
  name = 'HealthRegenSystem';
  priority = 20;
  enabled = true;

  async init(engine: IGameEngine): Promise<void> {
    console.log('Health regeneration system initialized');
  }

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    for (const entity of gameState.entities.values()) {
      if (entity.type === 'player' && entity.properties.health < 100) {
        // Regenerate 1 health per second
        entity.properties.health = Math.min(100, 
          entity.properties.health + deltaTime
        );
      }
    }
  }
}

// Add to engine
engine.addSystem(new HealthRegenSystem());
```

### Plugin Development

```typescript
import { GamePlugin, IGameEngine } from '@gameboilerplate/shared/engine';

export class CombatPlugin implements GamePlugin {
  name = 'CombatPlugin';
  version = '1.0.0';
  dependencies = ['HealthSystem'];

  async install(engine: IGameEngine): Promise<void> {
    // Add combat system
    engine.addSystem(new CombatSystem());

    // Register combat actions
    engine.registerAction({
      type: 'attack',
      schema: z.object({
        targetId: z.string(),
        attackType: z.enum(['melee', 'ranged', 'magic'])
      }),
      cooldown: 2000,
      handler: this.handleAttack.bind(this)
    });
  }

  async uninstall(engine: IGameEngine): Promise<void> {
    engine.removeSystem('CombatSystem');
  }

  private async handleAttack(data: any, context: any) {
    // Combat logic here
    return { success: true };
  }
}

// Install plugin
const combatPlugin = new CombatPlugin();
await engine.installPlugin(combatPlugin);
```

### Server-Side Integration

```typescript
import { ServerGameEngine } from '@gameboilerplate/shared/engine';
import { Server } from 'socket.io';

const io = new Server(server);
const gameEngine = new ServerGameEngine();

await gameEngine.init();

io.on('connection', (socket) => {
  // Handle engine actions
  socket.on('engineAction', async (data) => {
    const result = await gameEngine.executeAction(
      data.type,
      data.payload,
      { userId: socket.userId, engine: gameEngine }
    );

    socket.emit('actionResult', result);

    // Broadcast events to all clients
    if (result.events) {
      result.events.forEach(event => {
        io.emit('gameEvent', event);
      });
    }
  });

  // Add player to game
  gameEngine.addPlayer(socket.userId);
});
```

### Game Type Presets

```typescript
// RPG Game Setup
const rpgEngine = new GameEngine();
await rpgEngine.init('rpg'); // Includes character, inventory, quest systems

// RTS Game Setup  
const rtsEngine = new GameEngine();
await rtsEngine.init('rts'); // Includes unit, resource, building systems

// MMO Game Setup
const mmoEngine = new GameEngine();
await mmoEngine.init('mmo'); // Includes player, guild, world systems

// Custom Game Setup
const customEngine = new GameEngine();
await customEngine.init('custom'); // Minimal setup, add your own systems
```

## API Reference

### Core Classes

#### GameEngine
- `init(gameType?: string)` - Initialize engine with optional game type preset
- `start()` - Start the game loop
- `stop()` - Stop the game loop
- `createEntity(type, position)` - Create a new game entity
- `addEntity(entity)` - Add entity to game state
- `removeEntity(id)` - Remove entity from game state
- `executeAction(type, data, context)` - Execute a game action
- `registerAction(definition)` - Register a new action type

#### ActionSystem
- `registerAction(definition)` - Register action with validation schema
- `executeAction(type, data, context)` - Execute action with validation
- `isOnCooldown(userId, actionType)` - Check if action is on cooldown

#### SystemManager
- `addSystem(system)` - Add system to update loop
- `removeSystem(name)` - Remove system by name
- `getSystem(name)` - Get system instance
- `update(deltaTime)` - Update all systems

### Plugin System

#### Creating Plugins
```typescript
interface GamePlugin {
  name: string;
  version: string;
  dependencies?: string[];
  install(engine: IGameEngine): Promise<void>;
  uninstall(engine: IGameEngine): Promise<void>;
}
```

#### Built-in Plugins
- **FarmingPlugin** - Complete farming system with crops, growth, and harvesting

## Examples

### Complete RPG Character System

```typescript
import { GameEngine, FarmingPlugin } from '@gameboilerplate/shared/engine';

// Setup RPG with farming
const engine = new GameEngine();
await engine.init('rpg');

// Install farming plugin
await engine.installPlugin(new FarmingPlugin());

// Create character
const character = engine.createEntity('player', { x: 0, y: 0, z: 0 });
character.properties = {
  name: 'Hero',
  level: 1,
  experience: 0,
  stats: { strength: 10, agility: 8, intelligence: 12 },
  inventory: [
    { type: 'wheat_seed', quantity: 5 },
    { type: 'sword', damage: 15 }
  ]
};

engine.addEntity(character);

// Player actions
await engine.executeAction('plantSeed', {
  seedType: 'wheat',
  position: { x: 2, y: 0, z: 0 }
}, { userId: character.id, engine });

await engine.executeAction('movePlayer', {
  direction: 'east',
  distance: 3
}, { userId: character.id, engine });
```

### Multiplayer Battle System

```typescript
// Server setup
const battleEngine = new ServerGameEngine();
await battleEngine.init('mmo');

// Register battle action
battleEngine.registerAction({
  type: 'castSpell',
  schema: z.object({
    spellId: z.string(),
    targetId: z.string(),
    position: z.object({ x: z.number(), y: z.number(), z: z.number() })
  }),
  cooldown: 3000,
  handler: async (data, context) => {
    const caster = context.engine.getEntity(context.userId);
    const target = context.engine.getEntity(data.targetId);
    
    if (!caster || !target) {
      return { success: false, message: 'Invalid targets' };
    }

    // Spell logic
    const damage = calculateSpellDamage(data.spellId, caster.properties.level);
    target.properties.health -= damage;

    return {
      success: true,
      data: { damage, targetHealth: target.properties.health },
      events: [{
        type: 'spell:cast',
        data: {
          casterId: context.userId,
          targetId: data.targetId,
          spellId: data.spellId,
          damage,
          position: data.position
        },
        timestamp: Date.now()
      }]
    };
  }
});
```

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

## Contributing

1. Add new systems in `src/engine/systems/`
2. Add new plugins in `src/engine/plugins/`
3. Update types in `src/engine/types.ts`
4. Add tests for new functionality
5. Update documentation
