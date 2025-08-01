import { SimpleEntity } from './R3FRenderer';

// Utility function to transform game state to R3F entities
export function transformGameStateToEntities(
  gameState: any,
  user: any,
  connectionStatus: string
): SimpleEntity[] {
  const entities: SimpleEntity[] = [];

  if (connectionStatus === 'connected' && user) {
    // Get player position from various possible locations in game state
    const playerPos =
      gameState?.player?.position ||
      gameState?.entities?.[user.id]?.position ||
      gameState?.position ||
      { x: 0, y: 0, z: 0 };

    // Add player entity
    entities.push({
      id: user.id,
      type: 'player',
      position: { x: playerPos.x, y: 0.25, z: playerPos.z },
      scale: { x: 1, y: 1, z: 1 },
      color: '#3498db'
    });

    // Add other entities if any
    if (gameState?.entities) {
      Object.entries(gameState.entities).forEach(([id, entity]: [string, any]) => {
        if (id !== user.id && entity.position) {
          entities.push({
            id,
            type: entity.type || 'enemy',
            position: { x: entity.position.x, y: 0.3, z: entity.position.z },
            scale: { x: 1, y: 1, z: 1 },
            color: entity.color || '#e74c3c'
          });
        }
      });
    }
  }

  return entities;
}

// Utility function to get player position for camera following
export function getPlayerPosition(
  gameState: any,
  user: any
): { x: number; y: number; z: number } | undefined {
  if (!gameState || !user) return undefined;

  const playerPos =
    gameState?.position ||
    gameState?.player?.position ||
    gameState?.entities?.[user.id]?.position;

  return playerPos ? {
    x: playerPos.x,
    y: playerPos.y || 0,
    z: playerPos.z
  } : undefined;
}

// Format position for display
export function formatPosition(
  gameState: any,
  user: any
): string {
  const pos = getPlayerPosition(gameState, user) || { x: 0, y: 0, z: 0 };
  return `(${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`;
}

// Calculate entities count safely
export function getEntitiesCount(gameState: any): number {
  if (!gameState?.entities) return 0;
  
  try {
    if (gameState.entities instanceof Map) {
      return gameState.entities.size;
    } else if (typeof gameState.entities === 'object') {
      return Object.keys(gameState.entities).length;
    }
  } catch (error) {
    console.warn('Error counting entities:', error);
  }
  
  return 0;
}