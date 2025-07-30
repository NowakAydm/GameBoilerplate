# Phase 3: Authentication & Anti-Cheat Implementation

This document outlines the implementation of Phase 3 features including JWT authentication, MongoDB user management, and server-side anti-cheat validation.

## 🎯 Features Implemented

### 👤 Authentication System

#### Guest Users

- **Temporary JWT tokens** - No database storage required
- **Instant access** - Click "Login as Guest" to start playing immediately
- **Auto-generated usernames** - Format: `guest_timestamp_randomid`
- **Upgrade path** - Can convert to registered account later

#### Registered Users

- **Full MongoDB storage** - Persistent user profiles
- **Email/password authentication** - Secure bcrypt password hashing
- **Username validation** - 3-20 characters, unique across platform
- **Email validation** - Proper email format and uniqueness

#### Admin Users

- **Special role in JWT** - `role: 'admin'` in token payload
- **Protected admin routes** - Access to `/admin/*` endpoints
- **Enhanced permissions** - Can access admin dashboard and tools

### 🛡️ Anti-Cheat System

#### Server-Side Validation

- **Action validation** - All game actions validated against server rules
- **Rate limiting** - Prevents spam actions (100ms cooldown between actions)
- **Movement validation** - Prevents teleportation and speed hacking
- **Combat validation** - Ensures valid targets and health requirements
- **Inventory validation** - Checks item ownership before allowing drops

#### Game State Management

- **Server-side state** - Authoritative game state stored on server
- **Position tracking** - Validates movement against physics rules
- **Health & level tracking** - Server controls health, experience, and leveling
- **Inventory management** - Server-side inventory validation

## 🏗️ Architecture

### Backend Components

```
packages/server/src/
├── models/
│   └── User.ts              # MongoDB user model
├── services/
│   ├── AuthService.ts       # Authentication business logic
│   └── AntiCheatService.ts  # Game validation and state management
├── routes/
│   ├── auth.ts             # Authentication endpoints
│   └── admin.ts            # Admin-only endpoints
├── middleware/
│   └── auth.ts             # JWT authentication middleware
├── utils/
│   ├── auth.ts             # JWT and password utilities
│   └── database.ts         # MongoDB connection management
└── index.ts                # Main server with WebSocket handling
```

### Frontend Components

```
packages/client/src/
├── stores/
│   └── authStore.ts        # Zustand auth state management
├── components/
│   └── AuthComponent.tsx   # Login/register UI component
├── App.tsx                 # Main app with WebSocket integration
└── main.tsx                # App entry point
```

## 🔒 Security Features

### JWT Implementation

- **Secure tokens** - Contains user ID, role, and guest status
- **Expiration handling** - Configurable token lifetime (default: 24h)
- **WebSocket authentication** - Tokens required for socket connections
- **Role-based access** - Different permissions for guest/registered/admin

### Password Security

- **bcrypt hashing** - Salt rounds: 12 (industry standard)
- **No plaintext storage** - Passwords never stored in plain text
- **Secure validation** - Constant-time comparison prevents timing attacks

### Anti-Cheat Validation

- **Movement limits** - Maximum movement distance per action
- **Action cooldowns** - Prevents rapid-fire actions
- **Health validation** - Cannot fight with 0 health
- **Teleport prevention** - Rejects teleportation actions
- **Inventory checks** - Validates item ownership

## 🌐 API Endpoints

### Authentication Routes (`/auth/`)

#### `POST /auth/guest`

Create a temporary guest account.

```json
Response: {
  "success": true,
  "user": { ... },
  "token": "jwt_token_here",
  "message": "Guest user created successfully"
}
```

#### `POST /auth/register`

Register a new permanent account.

```json
Request: {
  "username": "player123",
  "email": "player@example.com",
  "password": "securePassword"
}
```

#### `POST /auth/login`

Login to existing account.

```json
Request: {
  "email": "player@example.com",
  "password": "securePassword"
}
```

#### `POST /auth/upgrade`

Convert guest account to registered.

```json
Request: {
  "userId": "guest_user_id",
  "username": "newUsername",
  "email": "new@example.com",
  "password": "newPassword"
}
```

#### `GET /auth/me`

Get current user information (requires authentication).

### Admin Routes (`/admin/`)

#### `GET /admin/stats`

Get server statistics (admin only).

#### `GET /admin/game-states`

View active game states for debugging (admin only).

#### `POST /admin/cleanup`

Force cleanup of inactive game states (admin only).

## 🎮 WebSocket Events

### Client → Server

#### `gameAction`

Send a game action to the server.

```typescript
{
  type: 'move' | 'combat' | 'item_drop',
  direction?: 'up' | 'down' | 'left' | 'right',
  targetId?: string,
  item?: string
}
```

### Server → Client

#### `gameUpdate`

Broadcast valid game action to all clients.

```typescript
{
  user: { id, role, isGuest },
  action: GameAction,
  gameState: CurrentGameState
}
```

#### `gameError`

Send error message for rejected actions.

```typescript
{
  error: string,
  reason?: string,
  details?: ValidationError[]
}
```

#### `gameEvent`

Broadcast game events (item drops, combat results).

```typescript
{
  event: 'item_drop' | 'combat',
  // ... event-specific data
}
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Install server dependencies (includes bcrypt for password hashing)
cd packages/server
npm install

# Client dependencies already include zustand for state management
cd ../client
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings:
# MONGODB_URI=mongodb://localhost:27017/gameboilerplate
# JWT_SECRET=your_super_secure_secret_here
```

### 3. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# https://docs.mongodb.com/manual/installation/
```

### 4. Run the Application

```bash
# Start server (from packages/server)
npm run dev

# Start client (from packages/client)
npm run dev
```

### 5. Test the System

1. **Open client** at `http://localhost:5173`
2. **Login as guest** to test immediate access
3. **Try game actions** - movement works, teleport fails
4. **Register account** to test persistent authentication
5. **Monitor console** for anti-cheat validation messages

## 🧪 Testing Anti-Cheat

The client includes test buttons that demonstrate the anti-cheat system:

- ✅ **Move Up** - Valid action, should succeed
- ❌ **Teleport** - Invalid action, will be rejected
- ✅ **Drop Item** - Valid if item exists in inventory
- ✅ **Combat** - Valid if target ID provided

Watch the browser console and server logs to see validation in action.

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001                    # Server port
JWT_SECRET=your_secret       # JWT signing secret
JWT_EXPIRES_IN=24h          # Token expiration time

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/gameboilerplate

# Development/Production
NODE_ENV=development
```

### Anti-Cheat Settings

In `AntiCheatService.ts`, you can adjust:

- **Rate limit cooldown** - Currently 100ms between actions
- **Movement speed limits** - Currently 10 units per action
- **Cleanup interval** - Currently 30 minutes for inactive states

## 🛠️ Next Steps

Phase 3 provides a solid foundation for:

- **Phase 4**: Admin Dashboard with user management and game monitoring
- **Phase 5**: Advanced game mechanics and plugin architecture
- **Phase 6**: Mobile optimization and PWA features

The authentication and anti-cheat systems are production-ready and can scale to support thousands of concurrent users.
