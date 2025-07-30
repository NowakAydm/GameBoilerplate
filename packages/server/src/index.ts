import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import {
  GameActionSchema,
  GameEventSchema,
  GameAction,
  GameEvent,
  ExampleSharedType,
  JWTPayload,
} from '@gameboilerplate/shared';
import { DatabaseConnection } from './utils/database';
import { AuthUtils } from './utils/auth';
import { AntiCheatService } from './services/AntiCheatService';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true,
  },
});
const port = process.env.PORT || 3001;

// Initialize database connection
const db = DatabaseConnection.getInstance();

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

app.get('/', (_req, res) => {
  const example: ExampleSharedType = { id: 'server', createdAt: new Date() };
  res.json({
    message: 'GameBoilerplate Server is running!',
    example,
    features: {
      authentication: true,
      antiCheat: true,
      websockets: true,
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: db.getConnectionStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Protected route example
app.get('/profile', authenticateToken, (_req, res) => {
  res.json({
    message: 'This is a protected route',
    user: (res.req as any).user,
  });
});

// --- WebSocket logic with Authentication & Anti-Cheat ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token provided'));

  const payload = AuthUtils.verifyToken(token);
  if (!payload) return next(new Error('Invalid token'));

  (socket as any).user = payload;
  next();
});

io.on('connection', (socket) => {
  const user: JWTPayload = (socket as any).user;
  console.log('User connected:', { userId: user.userId, role: user.role, isGuest: user.isGuest });

  // Initialize user's game state
  AntiCheatService.initializeUserState(user.userId);

  socket.on('gameAction', (action) => {
    // Sanitize and validate input using shared schema
    const result = GameActionSchema.safeParse(action);
    if (!result.success) {
      socket.emit('gameError', {
        error: 'Invalid action format',
        details: result.error.issues,
      });
      return;
    }

    const sanitizedAction: GameAction = result.data;
    const gameState = AntiCheatService.getUserState(user.userId);

    // Anti-cheat validation
    const validation = AntiCheatService.validateAction({
      userId: user.userId,
      userRole: user.role,
      isGuest: user.isGuest,
      gameState,
      action: sanitizedAction,
    });

    if (!validation.valid) {
      socket.emit('gameError', {
        error: 'Action rejected by anti-cheat',
        reason: validation.reason,
      });
      console.log(`Anti-cheat rejection for user ${user.userId}: ${validation.reason}`);
      return;
    }

    // Apply action effects to game state
    AntiCheatService.applyActionEffects(user.userId, sanitizedAction);

    // Broadcast valid actions
    io.emit('gameUpdate', {
      user: {
        id: user.userId,
        role: user.role,
        isGuest: user.isGuest,
      },
      action: sanitizedAction,
      gameState: AntiCheatService.getUserState(user.userId),
    });

    // Simulate game events
    if (sanitizedAction.type === 'item_drop') {
      const event: GameEvent = {
        event: 'item_drop',
        item: sanitizedAction.item || 'Sword of Testing',
        by: user,
      };
      io.emit('gameEvent', event);
    }

    if (sanitizedAction.type === 'combat') {
      const event: GameEvent = {
        event: 'combat',
        attacker: user,
        targetId: sanitizedAction.targetId,
        result: 'win',
      };
      io.emit('gameEvent', event);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', { userId: user.userId, role: user.role });
  });
});

// Cleanup inactive game states every 5 minutes
setInterval(
  () => {
    AntiCheatService.cleanupInactiveStates();
  },
  5 * 60 * 1000,
);

// Cleanup inactive game states every 5 minutes
setInterval(
  () => {
    AntiCheatService.cleanupInactiveStates();
  },
  5 * 60 * 1000,
);

// Start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();

    server.listen(port, () => {
      console.log(`🚀 GameBoilerplate Server running at http://localhost:${port}`);
      console.log(`📊 Features: Authentication ✅ Anti-Cheat ✅ WebSockets ✅`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
