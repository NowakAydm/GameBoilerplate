import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
// Use local types to avoid Three.js conflicts
import type { GameAction } from './types/local';
import { AuthComponent } from './components/AuthComponent';
import { GameVisualization } from './components/GameVisualization';
import { useAuthStore } from './stores/authStore';

export default function App() {
  const { token, isAuthenticated, user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      setConnectionStatus('connecting');
      const newSocket = io('http://localhost:3001', {
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

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GameBoilerplate Client - Phase 3: Auth & Anti-Cheat</h1>

      <AuthComponent />

      {/* Game State Visualization - Available for all users */}
      <GameVisualization 
        gameState={gameState}
        connectionStatus={connectionStatus}
        user={user}
      />

      {isAuthenticated && (
        <div>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              marginTop: '20px',
              marginBottom: '20px',
            }}
          >
            <h3>Connection Status</h3>
            <p>
              Status:{' '}
              <strong style={{ color: connectionStatus === 'connected' ? 'green' : 'red' }}>
                {connectionStatus}
              </strong>
            </p>
            {user && (
              <p>
                Playing as: {user.username} ({user.role})
              </p>
            )}
          </div>

          {connectionStatus === 'connected' && (
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <h3>Game Actions</h3>
              <p>Try these actions to test the anti-cheat system:</p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                <button
                  onClick={() => sendGameAction({ type: 'move', direction: 'up' })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Move Up ✅
                </button>
                <button
                  onClick={() => sendGameAction({ type: 'move', direction: 'teleport' })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Teleport ❌ (Should Fail)
                </button>
                <button
                  onClick={() => sendGameAction({ type: 'item_drop', item: 'Health Potion' })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Drop Item
                </button>
                <button
                  onClick={() => sendGameAction({ type: 'combat', targetId: 'enemy-123' })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Combat
                </button>
              </div>

              <p>
                <small>
                  The anti-cheat system will reject teleport actions and validate all other actions
                  server-side.
                </small>
              </p>
            </div>
          )}

          {gameState && (
            <div
              style={{
                padding: '20px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <h3>Current Game State</h3>
              <pre
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(gameState, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3>Integration Status</h3>
        <ul>
          <li>✅ JWT Authentication (Guest & Registered Users)</li>
          <li>✅ MongoDB User Storage</li>
          <li>✅ WebSocket Authentication</li>
          <li>✅ Anti-Cheat Action Validation</li>
          <li>✅ Server-side Game State Management</li>
          <li>✅ Admin Role Support</li>
          <li>✅ Rate Limiting & Action Validation</li>
          <li>✅ Three.js Game State Visualization</li>
          <li>✅ 2D/3D Mode Switching</li>
        </ul>
      </div>
    </div>
  );
}
