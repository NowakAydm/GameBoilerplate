# Game Data Management in UserService

The `UserService` has been enhanced to handle user game data as JSON. This feature adds persistence for player game state, including inventory, position, level, and experience, allowing for a complete gaming experience with data that persists between sessions.

## Table of Contents

- [Overview](#overview)
- [Game Data Structure](#game-data-structure)
- [UserService Game Data Methods](#userservice-game-data-methods)
- [GameDataService](#gamedataservice)
- [PersistenceSystem](#persistencesystem)
- [Implementation Details](#implementation-details)
- [Usage in Practice](#usage-in-practice)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)

## Overview

The game data system provides:

- **Persistence**: Player data persists between sessions
- **Flexibility**: JSON structure allows for evolving game mechanics
- **Type Safety**: TypeScript types and Zod schemas ensure data integrity
- **Abstraction**: High-level APIs for common game operations
- **Integration**: Seamless integration with authentication and anti-cheat systems

## Game Data Structure

The user's game data is stored as a flexible JSON object with the following core structure:

```typescript
gameData: {
  // Player progression
  level: number;       // Player's level (default: 1)
  experience: number;  // Player's XP (default: 0)
  
  // Inventory system
  inventory: [
    {
      id: string;      // Unique identifier for the item
      name: string;    // Display name
      type: string;    // Item type (weapon, armor, consumable, etc.)
      ...              // Additional item-specific properties
    }
  ],
  
  // Positioning
  position: {          // Player's position in the game world
    x: number;         // X coordinate (default: 0)
    y: number;         // Y coordinate (default: 0)
    z: number;         // Z coordinate (default: 0)
  };
  
  // Metadata
  lastUpdated: Date;   // When the data was last updated
}
```

The JSON structure is stored in MongoDB, allowing for flexible schema evolution as the game mechanics develop.

## UserService Game Data Methods

The `UserService` provides the following methods to manage game data:

### Basic Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getUserGameData(userId)` | Get a user's game data | `GameData or null` |
| `updateUserGameData(userId, gameData)` | Update a user's game data with partial data | `IUser or null` |
| `getAllUsers()` | Get all users with their game data | `IUser[]` |

### Position Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `updatePlayerPosition(userId, position)` | Update only the player's position | `boolean` |

### Stats Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `updatePlayerStats(userId, level?, experience?)` | Update player's level and/or experience | `boolean` |

### Inventory Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `addToInventory(userId, item)` | Add an item to player's inventory | `boolean` |
| `removeFromInventory(userId, itemId)` | Remove an item from player's inventory | `boolean` |

### User Management

| Method | Description | Returns |
|--------|-------------|---------|
| `createGuestUser()` | Create a new guest user with default game data | `IUser` |
| `upgradeGuestToRegistered(userId, username, email, password)` | Upgrade a guest to registered while preserving game data | `IUser` |

## GameDataService

A higher-level `GameDataService` is provided to abstract common game operations:

```typescript
// Initialize player game data
await gameDataService.initializePlayer(userId);

// Award experience to player (returns true if player leveled up)
const didLevelUp = await gameDataService.awardExperience(userId, 100);

// Give item to player
await gameDataService.giveItem(userId, {
  id: 'sword-123',
  name: 'Excalibur',
  type: 'weapon',
  power: 50
});

// Move player to new position
await gameDataService.movePlayer(userId, { x: 10, y: 0, z: 20 });

// Remove item from player's inventory
await gameDataService.removeItem(userId, 'item-123');

// Get player's complete game data
const playerData = await gameDataService.getPlayerData(userId);
```

## PersistenceSystem

The `PersistenceSystem` automatically saves game data from memory to the database at regular intervals.

```typescript
// This runs automatically every minute
setInterval(() => {
  const gameState = AntiCheatService.getAllGameStates();
  persistenceSystem.update(60000, gameState);
}, 60 * 1000);
```

## Implementation Details

### Database Storage
- Game data is stored as a flexible JSON object in MongoDB
- The schema allows for extension with new game properties without requiring database migrations
- Uses MongoDB's efficient dot notation for partial updates

### User Management
- Default values are provided for new users (level 1, 0 XP, empty inventory)
- Guest users keep their game data when upgraded to registered accounts
- Game data is initialized when users connect via WebSocket

### Data Persistence
- In-memory game state is automatically saved to the database at regular intervals
- The PersistenceSystem runs every minute to save active player data
- Critical operations (item acquisition, level ups) trigger immediate saves

### Type Safety
- Shared TypeScript types ensure consistency between server and client
- Zod schemas provide runtime validation for game data
- Type inference generates TypeScript types from Zod schemas

### Integration
- Seamlessly integrates with the existing AntiCheatService
- Works with both real MongoDB and mock implementations for testing
- Provides both low-level (UserService) and high-level (GameDataService) APIs

## Usage in Practice

### Initializing Players
When a user connects to the WebSocket server, their game data is automatically initialized:

```typescript
io.on('connection', async (socket) => {
  const user = (socket as any).user;
  
  // Initialize user's game state
  AntiCheatService.initializeUserState(user.userId);
  
  // Initialize player game data (loads from database or creates defaults)
  await gameDataService.initializePlayer(user.userId);
  
  // Now the player is ready for game actions
});
```

### Handling Game Actions
Game actions can trigger updates to the player's game data:

```typescript
socket.on('gameAction', async (action) => {
  // Validate action with AntiCheatService
  // ...
  
  if (action.type === 'collect_item') {
    // Give the item to the player
    await gameDataService.giveItem(user.userId, {
      id: action.itemId,
      name: action.itemName,
      type: action.itemType,
      // Additional item properties
    });
  }
  
  if (action.type === 'defeat_enemy') {
    // Award experience for defeating an enemy
    const didLevelUp = await gameDataService.awardExperience(user.userId, action.experienceGained);
    
    // Notify player if they leveled up
    if (didLevelUp) {
      socket.emit('level_up', await gameDataService.getPlayerData(user.userId));
    }
  }
});
```

### Admin Operations
The UserService can be used in admin routes to manage player data:

```typescript
router.post('/admin/reset-player/:userId', authenticateAdmin, async (req, res) => {
  const userId = req.params.userId;
  
  await userService.updateUserGameData(userId, {
    level: 1,
    experience: 0,
    inventory: [],
    position: { x: 0, y: 0, z: 0 }
  });
  
  res.json({ success: true, message: 'Player data reset successfully' });
});
```

## Testing

Comprehensive tests have been added for the UserService game data functionality:

```typescript
describe('UserService Game Data', () => {
  // Tests getUserGameData functionality
  it('should get user game data', async () => {
    const gameData = await userService.getUserGameData(mockUserId);
    expect(gameData).toBeDefined();
    expect(gameData?.level).toBe(5);
  });
  
  // Tests updatePlayerPosition functionality
  it('should update player position', async () => {
    const result = await userService.updatePlayerPosition(mockUserId, {
      x: 15, y: 0, z: 20
    });
    expect(result).toBe(true);
  });
  
  // Tests inventory management
  it('should add and remove items from inventory', async () => {
    const addResult = await userService.addToInventory(mockUserId, { 
      id: 'potion-1', name: 'Health Potion' 
    });
    expect(addResult).toBe(true);
    
    const removeResult = await userService.removeFromInventory(mockUserId, 'potion-1');
    expect(removeResult).toBe(true);
  });
});
```

## Future Enhancements

Potential improvements for the game data system:

1. **Caching Layer**: Implement Redis caching for frequently accessed game data
2. **Inventory System**: Add inventory slots, weight limits, and item stacking
3. **Achievement System**: Track player achievements and milestones
4. **Crafting System**: Allow players to combine inventory items to create new ones
5. **Data Migration**: Add tools for migrating game data when schemas change
6. **Analytics**: Track detailed statistics about player progression and item usage
7. **Game Balance**: Add tools for analyzing and adjusting game progression curves
8. **Backup & Restore**: Add functionality to backup and restore individual player data
