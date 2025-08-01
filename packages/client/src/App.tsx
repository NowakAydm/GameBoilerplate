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

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GameBoilerplate Client - Phase 3: Auth & Anti-Cheat</h1>

      <AuthComponent />

      {/* Game State Visualization - Available for all users */}
      <GameVisualization 
        gameState={gameState}
        connectionStatus={connectionStatus}
        user={user}
        sendGameAction={sendGameAction}
        isAuthenticated={isAuthenticated}
      />


    </div>
  );
}
