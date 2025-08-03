import { UserService } from '../services/UserService';
import type { GameState } from '@gameboilerplate/shared';
import type { System } from '@gameboilerplate/shared/engine';

/**
 * PersistenceSystem handles saving player game data to the database
 */
export class PersistenceSystem implements System {
  name = 'PersistenceSystem';
  priority = 100; // Run last
  enabled = true;
  private userService: UserService;
  private lastSaveTime = 0;
  private saveInterval = 30000; // Save every 30 seconds
  
  constructor() {
    this.userService = new UserService();
  }

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // Track total time
    this.lastSaveTime += deltaTime;
    
    // Save player data every 30 seconds or as configured
    if (this.lastSaveTime >= this.saveInterval) {
      await this.savePlayerData(gameState);
      this.lastSaveTime = 0;
    }
  }

  private async savePlayerData(gameState: GameState): Promise<void> {
    if (!gameState.entities) return;
    
    for (const [id, entity] of Object.entries(gameState.entities)) {
      if (entity.type === 'player') {
        // Save player data to database
        await this.userService.updateUserGameData(id, {
          level: entity.properties?.level || 1,
          experience: entity.properties?.experience || 0,
          inventory: entity.properties?.inventory || [],
          position: entity.position || { x: 0, y: 0, z: 0 }
        });
      }
    }
  }
}

// Export a singleton instance for easy use
export const persistenceSystem = new PersistenceSystem();
