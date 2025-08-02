import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
// Use local types to avoid Three.js conflicts
import type { GameAction } from './types/local';
import { AuthComponent } from './components/AuthComponent';
import { useAuthStore } from './stores/authStore';
import { R3FScene, SimpleEntity } from './components/shared/R3FRenderer';
import { transformGameStateToEntities } from './components/shared/gameUtils';

export default function App() {
  const { token, isAuthenticated, user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [is3DMode, setIs3DMode] = useState(false);

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

  // Transform game state to entities for R3F rendering
  const entities = transformGameStateToEntities(gameState, user, connectionStatus);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GameBoilerplate Client - R3F-Powered Rendering</h1>

      <AuthComponent />

      {/* Game Visualization with R3F */}
      <div style={{ marginTop: '20px' }}>
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

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px'
        }}>
          {/* R3F Scene */}
          <R3FScene
            mode={is3DMode ? '3d' : '2d'}
            entities={entities}
            connectionStatus={connectionStatus}
          />
          
          {/* Game State Info */}
          <div style={{ 
            textAlign: 'center', 
            color: '#2c3e50', 
            marginTop: '15px',
            marginBottom: '15px'
          }}>
            <p><strong>Status:</strong> {connectionStatus}</p>
            {user && <p><strong>Player:</strong> {user.username}</p>}
            <p><strong>Mode:</strong> {is3DMode ? '3D' : '2D'} (R3F)</p>
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
                onClick={() => sendGameAction({ type: 'move', direction: 'up', distance: 1, speed: 1 })}
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
                Move Up
              </button>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'down', distance: 1, speed: 1 })}
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
                Move Down
              </button>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'left', distance: 1, speed: 1 })}
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
                Move Left
              </button>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'right', distance: 1, speed: 1 })}
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
                Move Right
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}