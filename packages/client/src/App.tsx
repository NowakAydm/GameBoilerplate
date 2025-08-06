import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
// Use local types to avoid Three.js conflicts
import type { GameAction } from './types/local';
import { AuthComponent } from './components/AuthComponent';
import { SettingsModal } from './components/SettingsModal';
import { useAuthStore } from './stores/authStore';
import { useControlsStore } from './stores/controlsStore';
import { useGameKeyboardControls } from './components/shared/useGameKeyboardControls';
import { useGameTouchControls } from './components/shared/useGameTouchControls';
import { R3FScene, SimpleEntity } from './components/shared/R3FRenderer';
import { transformGameStateToEntities } from './components/shared/gameUtils';

export default function App() {
  const { token, isAuthenticated, user, logout } = useAuthStore();
  const { 
    controlSettings, 
    loadSettingsFromServer,
    setSettings 
  } = useControlsStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [is3DMode, setIs3DMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      setConnectionStatus('connecting');
      const newSocket = io('http://localhost:3000', {
        auth: { token },
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnectionStatus('connected');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnectionStatus('disconnected');
      });

      newSocket.on('gameUpdate', (data) => {
        console.log('Game update:', data);
        if (data.gameState) {
          setGameState(data.gameState);
        }
        
        // Load settings from user's game data if available
        if (data.user?.gameData) {
          loadSettingsFromServer(data.user.gameData);
        }
      });

      newSocket.on('gameError', (error) => {
        console.error('Game error:', error);
        alert(`Game Error: ${error.error} ${error.reason ? `- ${error.reason}` : ''}`);
      });

      newSocket.on('gameEvent', (event) => {
        console.log('Game event:', event);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
      }
    }
  }, [isAuthenticated, token]);

  const sendGameAction = (action: GameAction) => {
    if (socket && connectionStatus === 'connected') {
      socket.emit('gameAction', action);
    } else {
      alert('Not connected to server');
    }
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    sendGameAction({ type: 'move', direction, distance: 1, speed: 1 });
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

  // Transform game state to entities for R3F rendering
  const entities = transformGameStateToEntities(gameState, user, connectionStatus);

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Game Visualization with R3F */}
      <div style={{ width: '100%', height: '100%' }}>
        <div style={{ 
          width: '100%',
          height: '100%',
          position: 'relative' // Add relative positioning for the auth modal
        }}>
          {/* R3F Scene */}
          <R3FScene
            mode={is3DMode ? '3d' : '2d'}
            entities={entities}
            connectionStatus={connectionStatus}
            onModeSwitch={() => setIs3DMode(!is3DMode)}
            onMove={handleMove}
            showMoveButtons={isAuthenticated && connectionStatus === 'connected'}
            playerName={user?.username}
            showStatusInfo={true}
            isAuthenticated={isAuthenticated}
            onLogout={logout}
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
          
          {/* Authentication Modal - Center of canvas when not authenticated */}
          {!isAuthenticated && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '350px'
            }}>
              <AuthComponent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}