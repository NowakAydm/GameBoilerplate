// Example usage of UserService for game data
import { UserService } from '../services/UserService';
import type { Position, GameItem } from '@gameboilerplate/shared';

/**
 * Example service showing how to use UserService for game data operations
 */
export class GameDataService {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
  
  /**
   * Initialize a player in the game world
   */
  async initializePlayer(userId: string): Promise<void> {
    const gameData = await this.userService.getUserGameData(userId);
    
    if (!gameData) {
      // Set default starting position and stats
      await this.userService.updateUserGameData(userId, {
        level: 1,
        experience: 0,
        inventory: [],
        position: { x: 0, y: 0, z: 0 }
      });
    }
  }
  
  /**
   * Move player to a new position
   */
  async movePlayer(userId: string, position: Position): Promise<boolean> {
    return await this.userService.updatePlayerPosition(userId, position);
  }
  
  /**
   * Award experience to player and level up if necessary
   */
  async awardExperience(userId: string, exp: number): Promise<boolean> {
    const gameData = await this.userService.getUserGameData(userId);
    if (!gameData) return false;
    
    const newExp = gameData.experience + exp;
    let newLevel = gameData.level;
    
    // Simple level up logic (100 * level^2 XP needed for next level)
    const requiredXp = 100 * Math.pow(newLevel, 2);
    if (newExp >= requiredXp) {
      newLevel++;
    }
    
    return await this.userService.updatePlayerStats(userId, newLevel, newExp);
  }
  
  /**
   * Give an item to a player
   */
  async giveItem(userId: string, item: GameItem): Promise<boolean> {
    return await this.userService.addToInventory(userId, item);
  }
  
  /**
   * Remove an item from player inventory
   */
  async removeItem(userId: string, itemId: string): Promise<boolean> {
    return await this.userService.removeFromInventory(userId, itemId);
  }
  
  /**
   * Get all data for a player
   */
  async getPlayerData(userId: string): Promise<any> {
    const gameData = await this.userService.getUserGameData(userId);
    return gameData;
  }
  
  /**
   * Get player position
   */
  async getPlayerPosition(userId: string): Promise<Position | null> {
    const gameData = await this.userService.getUserGameData(userId);
    return gameData?.position || null;
  }
}

export const gameDataService = new GameDataService();
