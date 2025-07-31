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
import { ServerGameEngine } from './engine/ServerGameEngine';
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

// Initialize Game Engine
const gameEngine = new ServerGameEngine(server);

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gameEngine: {
      isRunning: gameEngine.getEngine().isRunning,
      stats: gameEngine.getEngine().getStats()
    },
    timestamp: new Date().toISOString(),
  });
});

// Game Engine Status endpoint
app.get('/api/game/status', (req, res) => {
  const stats = gameEngine.getEngine().getStats();
  const playerCount = gameEngine.getPlayerCount();
  
  res.json({
    engine: stats,
    playerCount,
    currentScene: gameEngine.getSceneManager().getCurrentScene()?.name,
    availableScenes: gameEngine.getSceneManager().getAllScenes().map(s => ({
      id: s.id,
      name: s.name
    }))
  });
});

// --- Enhanced WebSocket logic with Game Engine Integration ---
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

  // Create player entity in game engine
  gameEngine.createPlayer(user.userId, user.userId);

  // Initialize legacy anti-cheat state for backward compatibility
  AntiCheatService.initializeUserState(user.userId);

  // Handle new engine-based actions
  socket.on('engineAction', async (actionData) => {
    try {
      // Validate action schema
      const result = GameActionSchema.safeParse(actionData);
      if (!result.success) {
        socket.emit('actionError', {
          error: 'Invalid action format',
          details: result.error.issues,
        });
        return;
      }

      // Process action through game engine
      const actionSystem = gameEngine.getActionSystem();
      const actionResult = await actionSystem.processAction(
        result.data.type,
        result.data,
        {
          userId: user.userId,
          userRole: user.role,
          isGuest: user.isGuest,
          gameState: gameEngine.getEngine().gameState,
          engine: gameEngine.getEngine(),
          timestamp: Date.now()
        }
      );

      if (actionResult.success) {
        // Broadcast successful actions to all clients
        io.emit('gameUpdate', {
          user: {
            id: user.userId,
            role: user.role,
            isGuest: user.isGuest,
          },
          action: result.data,
          result: actionResult,
          gameState: {
            playerCount: gameEngine.getPlayerCount(),
            currentScene: gameEngine.getSceneManager().getCurrentScene()?.name
          }
        });

        // Emit any generated events
        if (actionResult.events) {
          actionResult.events.forEach(event => {
            io.emit('gameEvent', event);
          });
        }
      } else {
        socket.emit('actionError', {
          error: 'Action failed',
          message: actionResult.message,
          data: actionResult.data
        });
      }

    } catch (error) {
      console.error(`Error processing engine action:`, error);
      socket.emit('actionError', {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy gameAction handler (backward compatibility)
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
    console.log(`Game action from ${user.userId}:`, sanitizedAction);

    // Get current game state from legacy system
    const gameState = AntiCheatService.getUserState(user.userId);

    // Legacy anti-cheat validation
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

    // Apply action effects to legacy game state
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

    // Simulate game events for legacy system
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
    
    // Remove player from game engine
    gameEngine.removePlayer(user.userId);
  });
});

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

    // Initialize and start game engine
    await gameEngine.initialize();
    await gameEngine.start();

    server.listen(port, () => {
      console.log(`🚀 GameBoilerplate Server running at http://localhost:${port}`);
      console.log(`📊 Features: Authentication ✅ Anti-Cheat ✅ WebSockets ✅ Game Engine ✅`);
      console.log(`🎮 Game Engine: ${gameEngine.getEngine().isRunning ? 'Running' : 'Stopped'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
