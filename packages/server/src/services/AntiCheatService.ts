import { GameAction } from '@gameboilerplate/shared';

export interface GameState {
  position: { x: number; y: number; z: number };
  health: number;
  level: number;
  experience: number;
  gold: number;
  inventory: string[];
  lastActionTime: number;
}

export interface AntiCheatContext {
  userId: string;
  userRole: string;
  isGuest: boolean;
  gameState: GameState;
  action: GameAction;
}

export class AntiCheatService {
  private static gameStates = new Map<string, GameState>();

  /**
   * Initialize game state for a user
   */
  static initializeUserState(userId: string): GameState {
    const initialState: GameState = {
      position: { x: 0, y: 0, z: 0 },
      health: 100,
      level: 1,
      experience: 0,
      gold: 0,
      inventory: [],
      lastActionTime: Date.now(),
    };

    this.gameStates.set(userId, initialState);
    return initialState;
  }

  /**
   * Get user's current game state
   */
  static getUserState(userId: string): GameState {
    return this.gameStates.get(userId) || this.initializeUserState(userId);
  }

  /**
   * Update user's game state
   */
  static updateUserState(userId: string, updates: Partial<GameState>): void {
    const currentState = this.getUserState(userId);
    const newState = { ...currentState, ...updates, lastActionTime: Date.now() };
    this.gameStates.set(userId, newState);
  }

  /**
   * Validate a game action against anti-cheat rules
   */
  static validateAction(context: AntiCheatContext): { valid: boolean; reason?: string } {
    const { userId, action, gameState } = context;
    const now = Date.now();

    // Rate limiting - prevent spam actions
    if (now - gameState.lastActionTime < 100) {
      // 100ms cooldown
      return { valid: false, reason: 'Action rate limit exceeded' };
    }

    switch (action.type) {
      case 'move':
        return this.validateMoveAction(action, gameState);
      case 'combat':
        return this.validateCombatAction(action, gameState);
      case 'item_drop':
        return this.validateItemDropAction(action, gameState);
      default:
        return { valid: true };
    }
  }

  /**
   * Validate move actions
   */
  private static validateMoveAction(
    action: GameAction,
    gameState: GameState,
  ): { valid: boolean; reason?: string } {
    if (action.type !== 'move') return { valid: true };

    // Prevent teleportation
    if (action.direction === 'teleport') {
      return { valid: false, reason: 'Teleportation is not allowed' };
    }

    // Validate movement speed (simple check)
    const maxMoveDistance = 10; // units per action
    const currentPos = gameState.position;

    // Calculate expected new position based on direction
    let expectedPos = { ...currentPos };
    switch (action.direction) {
      case 'up':
        expectedPos.z += 1;
        break;
      case 'down':
        expectedPos.z -= 1;
        break;
      case 'left':
        expectedPos.x -= 1;
        break;
      case 'right':
        expectedPos.x += 1;
        break;
    }

    // Check if movement is within reasonable bounds
    const distance = Math.sqrt(
      Math.pow(expectedPos.x - currentPos.x, 2) + Math.pow(expectedPos.z - currentPos.z, 2),
    );

    if (distance > maxMoveDistance) {
      return { valid: false, reason: 'Movement speed too high' };
    }

    return { valid: true };
  }

  /**
   * Validate combat actions
   */
  private static validateCombatAction(
    action: GameAction,
    gameState: GameState,
  ): { valid: boolean; reason?: string } {
    if (action.type !== 'combat') return { valid: true };

    // Check if user has enough health to fight
    if (gameState.health <= 0) {
      return { valid: false, reason: 'Cannot fight with 0 health' };
    }

    // Check if target ID is provided and valid
    if (!action.targetId || action.targetId.length === 0) {
      return { valid: false, reason: 'Invalid target for combat' };
    }

    // Prevent self-targeting
    if (action.targetId === gameState.position.toString()) {
      return { valid: false, reason: 'Cannot target yourself' };
    }

    return { valid: true };
  }

  /**
   * Validate item drop actions
   */
  private static validateItemDropAction(
    action: GameAction,
    gameState: GameState,
  ): { valid: boolean; reason?: string } {
    if (action.type !== 'item_drop') return { valid: true };

    // Check if item exists in inventory (if item is specified)
    if (action.item) {
      if (!gameState.inventory.includes(action.item)) {
        return { valid: false, reason: 'Item not in inventory' };
      }
    }

    return { valid: true };
  }

  /**
   * Apply action effects to game state
   */
  static applyActionEffects(userId: string, action: GameAction): void {
    const currentState = this.getUserState(userId);
    const updates: Partial<GameState> = {};

    switch (action.type) {
      case 'move':
        if (action.direction !== 'teleport') {
          const newPos = { ...currentState.position };
          switch (action.direction) {
            case 'up':
              newPos.z += 1;
              break;
            case 'down':
              newPos.z -= 1;
              break;
            case 'left':
              newPos.x -= 1;
              break;
            case 'right':
              newPos.x += 1;
              break;
          }
          updates.position = newPos;
        }
        break;

      case 'combat':
        // Simple combat effect - gain experience
        updates.experience = currentState.experience + 10;
        if (updates.experience && updates.experience >= currentState.level * 100) {
          updates.level = currentState.level + 1;
          updates.health = 100; // Full heal on level up
        }
        break;

      case 'item_drop':
        if (action.item) {
          const newInventory = currentState.inventory.filter((item) => item !== action.item);
          updates.inventory = newInventory;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      this.updateUserState(userId, updates);
    }
  }

  /**
   * Clean up inactive user states (call periodically)
   */
  static cleanupInactiveStates(inactiveTimeMs: number = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [userId, state] of this.gameStates.entries()) {
      if (now - state.lastActionTime > inactiveTimeMs) {
        this.gameStates.delete(userId);
      }
    }
  }
}
