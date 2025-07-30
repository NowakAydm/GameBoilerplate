import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { z, GameActionSchema, GameEventSchema, GameAction, GameEvent } from '@gameboilerplate/shared';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

app.get('/', (_req, res) => {
  const example: ExampleSharedType = { id: 'server', createdAt: new Date() };
  res.json({ message: 'GameBoilerplate Server is running!', example });
});

// --- WebSocket logic ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (socket as any).user = payload;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log('User connected:', user);

  socket.on('gameAction', (action) => {
    // Sanitize and validate input using shared schema
    const result = GameActionSchema.safeParse(action);
    if (!result.success) {
      socket.emit('gameError', { error: 'Invalid action format', details: result.error.issues });
      return;
    }
    const sanitizedAction: GameAction = result.data;
    // Example anti-cheat: reject teleport
    if (sanitizedAction.type === 'move' && sanitizedAction.direction === 'teleport') {
      socket.emit('gameError', { error: 'Teleporting is not allowed!' });
      return;
    }
    // Broadcast valid actions
    io.emit('gameUpdate', { user, action: sanitizedAction });
    // Simulate game events
    if (sanitizedAction.type === 'item_drop') {
      const event: GameEvent = { event: 'item_drop', item: sanitizedAction.item || 'Sword of Testing', by: user };
      io.emit('gameEvent', event);
    }
    if (sanitizedAction.type === 'combat') {
      const event: GameEvent = { event: 'combat', attacker: user, targetId: sanitizedAction.targetId, result: 'win' };
      io.emit('gameEvent', event);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', user);
  });
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
