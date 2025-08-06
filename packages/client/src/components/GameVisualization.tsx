import React, { useState } from 'react';
import type { GameAction } from '../types/local';
import { R3FScene } from './shared/R3FRenderer';
import { SettingsModal } from './SettingsModal';
import { useGameKeyboardControls } from './shared/useGameKeyboardControls';
import { useGameTouchControls } from './shared/useGameTouchControls';
import { useControlsStore } from '../stores/controlsStore';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { 
    controlSettings, 
    setSettings 
  } = useControlsStore();
  
  // Transform game state into entities for R3F rendering
  const entities = transformGameStateToEntities(gameState, user, connectionStatus);

  const handleGameAction = (action: GameAction) => {
    if (isAuthenticated && connectionStatus === 'connected') {
      sendGameAction(action);
    }
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    handleGameAction({ type: 'move', direction, distance: 1, speed: 1 });
  };

  // Set up keyboard controls
  useGameKeyboardControls({
    controls: controlSettings.keyboard,
    onMove: handleMove,
    enabled: isAuthenticated && connectionStatus === 'connected' && !isSettingsOpen,
  });

  // Set up touch controls
  const { getOrbitControlsProps } = useGameTouchControls({
    controls: controlSettings.touch,
    enabled: !isSettingsOpen,
  });

  const orbitControlsProps = getOrbitControlsProps();

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
        onOpenSettings={() => setIsSettingsOpen(true)}
        orbitControlsProps={orbitControlsProps}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        controlSettings={controlSettings}
        onControlSettingsChange={(settings) => setSettings(settings, true)}
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
        {isAuthenticated && connectionStatus === 'connected' && (
          <p style={{ fontSize: '12px', color: '#666' }}>
            Use {controlSettings.keyboard.up.replace('Key', '').replace('Arrow', '→')}/
            {controlSettings.keyboard.down.replace('Key', '').replace('Arrow', '↓')}/
            {controlSettings.keyboard.left.replace('Key', '').replace('Arrow', '←')}/
            {controlSettings.keyboard.right.replace('Key', '').replace('Arrow', '→')} to move
          </p>
        )}
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