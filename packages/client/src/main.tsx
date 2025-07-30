import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { io } from 'socket.io-client';
import { GameAction } from '@gameboilerplate/shared';

const token = localStorage.getItem('jwt') || '';
const socket = io('http://localhost:3001', {
  auth: { token },
});

// Example: emit a move, item_drop, and combat action after connecting
socket.on('connect', () => {
  const moveAction: GameAction = { type: 'move', direction: 'up' };
  socket.emit('gameAction', moveAction);
  setTimeout(() => {
    const itemDropAction: GameAction = { type: 'item_drop', item: 'Health Potion' };
    socket.emit('gameAction', itemDropAction);
  }, 1000);
  setTimeout(() => {
    const combatAction: GameAction = { type: 'combat', targetId: 'enemy-123' };
    socket.emit('gameAction', combatAction);
  }, 2000);
});

socket.on('gameUpdate', (data) => {
  console.log('Game update:', data);
});
socket.on('gameError', (err) => {
  console.error('Game error:', err);
});
socket.on('gameEvent', (event) => {
  console.log('Game event:', event);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
