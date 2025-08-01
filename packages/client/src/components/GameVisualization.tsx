import React, { useState } from 'react';
import type { GameAction } from '../types/local';
import { R3FScene } from './shared/R3FRenderer';
import { 
  transformGameStateToEntities, 
  formatPosition, 
  getEntitiesCount 
} from './shared/gameUtils';

interface GameVisualizationProps {
  gameState: any;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  user: any;
  sendGameAction: (action: GameAction) => void;
  isAuthenticated: boolean;
}

// Unified R3F View component that works for both 2D and 3D modes
function UnifiedR3FView({ 
  gameState, 
  connectionStatus, 
  user, 
  sendGameAction, 
  isAuthenticated,
  mode 
}: GameVisualizationProps & { mode: '2d' | '3d' }) {
  // Transform game state into entities for R3F rendering
  const entities = transformGameStateToEntities(gameState, user, connectionStatus);

  const handleGameAction = (action: GameAction) => {
    if (isAuthenticated && connectionStatus === 'connected') {
      sendGameAction(action);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: mode === '2d' ? '#ecf0f1' : '#f8f9fa',
      borderRadius: '8px',
      padding: '20px'
    }}>
      {/* R3F Scene */}
      <R3FScene
        mode={mode}
        entities={entities}
        connectionStatus={connectionStatus}
      />
      
      {/* Game State Text */}
      <div style={{ 
        textAlign: 'center', 
        color: '#2c3e50', 
        marginTop: '15px',
        marginBottom: '15px',
        minHeight: '60px'
      }}>
        <p><strong>Status:</strong> {connectionStatus}</p>
        {user && <p><strong>Player:</strong> {user.username}</p>}
        {connectionStatus === 'connected' && gameState && (
          <p><strong>Position:</strong> {formatPosition(gameState, user)}</p>
        )}
        <p><strong>Mode:</strong> {mode.toUpperCase()}</p>
      </div>

      {/* Game Action Buttons - Only show when connected */}
      {isAuthenticated && connectionStatus === 'connected' && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          maxWidth: '400px'
        }}>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'up', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {mode === '2d' ? '↑ Up' : 'Move Up'}
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'down', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {mode === '2d' ? '↓ Down' : 'Move Down'}
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'left', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {mode === '2d' ? '← Left' : 'Move Left'}
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'right', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {mode === '2d' ? '→ Right' : 'Move Right'}
          </button>
          <button
            onClick={() => handleGameAction({ type: 'item_drop', item: 'Health Potion' })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Drop Item
          </button>
          <button
            onClick={() => handleGameAction({ type: 'combat', targetId: 'enemy-123' })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Combat
          </button>
        </div>
      )}
    </div>
  );
}

// Legacy 2D status display - now replaced with R3F-based rendering
// Keeping this for reference - it used Canvas 2D API
function GameStatus2DLegacy({ gameState, connectionStatus, user, sendGameAction, isAuthenticated }: GameVisualizationProps) {
  const entitiesCount = getEntitiesCount(gameState);
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Legacy Canvas 2D display - now using R3F instead */}
      <div style={{
        width: '300px',
        height: '200px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        marginBottom: '15px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px'
      }}>
        <p>2D Mode Now Uses R3F - See Above</p>
      </div>
      
      {/* Connection Status */}
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>
        {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'}
      </div>
      
      <h3 style={{ margin: '0 0 10px 0' }}>Connection: {connectionStatus}</h3>
      
      {user && (
        <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          Player: {user.username} ({user.role})
        </p>
      )}

      {/* Game State Info */}
      {connectionStatus === 'connected' && gameState && (
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            Position: {formatPosition(gameState, user)}
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            Entities: {entitiesCount} | Uptime: {gameState?.totalTime ? Math.floor(gameState.totalTime / 1000) : 0}s
          </p>
        </div>
      )}
    </div>
  );
}

export const GameVisualization: React.FC<GameVisualizationProps> = ({ 
  gameState, 
  connectionStatus, 
  user,
  sendGameAction,
  isAuthenticated
}) => {
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <div style={{ marginTop: '20px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          Game State Visualization (R3F-Powered)
        </h2>
        
        <button
          onClick={() => setIs3DMode(!is3DMode)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: is3DMode ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          {is3DMode ? '📊 Switch to 2D (R3F)' : '🎮 Switch to 3D (R3F)'}
        </button>
      </div>

      {/* Both modes now use R3F for consistency */}
      <UnifiedR3FView 
        gameState={gameState} 
        connectionStatus={connectionStatus} 
        user={user} 
        sendGameAction={sendGameAction}
        isAuthenticated={isAuthenticated}
        mode={is3DMode ? '3d' : '2d'}
      />
    </div>
  );
};