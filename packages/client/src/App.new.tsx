import React, { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuthStore } from './stores/authStore';
import { AuthComponent } from './components/AuthComponent';
import { GameScene, GameStats, GameControls, useGameEngine } from './components/GameEngine';
import { GameAction } from '@gameboilerplate/shared';

export default function App() {
  const { token, isAuthenticated, user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [useNewEngine, setUseNewEngine] = useState(true);

  // Initialize game engine
  const gameEngine = useGameEngine({
    tickRate: 60,
    enableDebug: true,
    autoStart: true
  });

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

      newSocket.on('gameEvent', (event) => {
        console.log('Game event:', event);
      });

      newSocket.on('gameError', (error) => {
        console.error('Game error:', error);
        alert(`Game Error: ${error.error} ${error.reason ? `- ${error.reason}` : ''}`);
      });

      newSocket.on('actionError', (error) => {
        console.error('Action error:', error);
        alert(`Action Error: ${error.error} ${error.message ? `- ${error.message}` : ''}`);
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
      if (useNewEngine) {
        socket.emit('engineAction', action);
      } else {
        socket.emit('gameAction', action);
      }
    } else {
      alert('Not connected to server');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>GameBoilerplate Client - Phase 5: Engine Framework</h1>
        <AuthComponent />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>
          GameBoilerplate - Phase 5: Game Engine Framework
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>
            Status: <strong style={{ color: connectionStatus === 'connected' ? 'green' : 'red' }}>
              {connectionStatus}
            </strong>
          </span>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={useNewEngine}
              onChange={(e) => setUseNewEngine(e.target.checked)}
            />
            Use New Engine
          </label>
          
          {user && (
            <span>
              Player: {user.username} ({user.role})
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {/* Game Engine Status */}
        {gameEngine.isInitialized && (
          <GameStats engine={gameEngine.engine} />
        )}

        {/* Game Controls */}
        {gameEngine.isInitialized && connectionStatus === 'connected' && (
          <GameControls engine={gameEngine.engine} />
        )}

        {/* Action Test Panel */}
        {connectionStatus === 'connected' && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '15px',
            borderRadius: '5px',
            zIndex: 1000,
            maxWidth: '300px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Action Testing</h3>
            
            <div style={{ marginBottom: '10px' }}>
              <small>
                Engine: {useNewEngine ? '🎮 New Game Engine' : '⚠️ Legacy System'}
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px' }}>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'up' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Move Up ✅
              </button>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'down' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Move Down ✅
              </button>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'left' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Move Left ✅
              </button>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'right' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Move Right ✅
              </button>
            </div>

            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                onClick={() => sendGameAction({ type: 'move', direction: 'teleport' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Teleport ❌
              </button>
              <button
                onClick={() => sendGameAction({ type: 'item_drop', item: 'Health Potion' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px' }}
              >
                Drop Item
              </button>
              <button
                onClick={() => sendGameAction({ type: 'combat', targetId: 'enemy-123' })}
                style={{ padding: '5px', fontSize: '12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Combat
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#666' }}>
              The new engine provides enhanced validation, action system, and 3D rendering integration.
            </div>
          </div>
        )}

        {/* 3D Game Scene */}
        {gameEngine.isInitialized ? (
          <GameScene engine={gameEngine.engine}>
            {/* Add custom 3D elements here */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#90EE90" />
            </mesh>
          </GameScene>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            backgroundColor: '#f0f0f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2>🎮 Initializing Game Engine...</h2>
              <p>Setting up systems, actions, and 3D rendering...</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Information */}
      {gameState && (
        <div style={{
          position: 'absolute',
          top: 60,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          maxWidth: '300px',
          maxHeight: '200px',
          overflow: 'auto',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>Server State</h4>
          <pre style={{ margin: 0, fontSize: '10px' }}>
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      )}

      {/* Implementation Status */}
      <div style={{
        padding: '10px',
        backgroundColor: '#e8f5e8',
        borderTop: '1px solid #ddd',
        fontSize: '12px'
      }}>
        <strong>Phase 5 Implementation Status:</strong>
        <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
          <span>✅ Game Engine Architecture</span>
          <span>✅ Action System</span>
          <span>✅ System Manager</span>
          <span>✅ Scene Management</span>
          <span>✅ Plugin System</span>
          <span>✅ 3D Integration (R3F)</span>
          <span>✅ Server Engine</span>
          <span>✅ Extensible Framework</span>
        </div>
      </div>
    </div>
  );
}
