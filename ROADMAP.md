# Project Roadmap

## Phase 1: ⚙️ Setup & Scaffolding ✅ COMPLETED

### 🛠️ Repository Foundation

- ✅ Turborepo monorepo configuration with workspace management
- ✅ TypeScript setup with shared configurations across packages
- ✅ ESLint and Prettier with Husky pre-commit hooks
- ✅ Environment file management and configuration

### 🎮 Client Application

- ✅ React + Vite setup with TypeScript and hot reloading
- ✅ React Three Fiber (R3F) for 3D graphics rendering
- ✅ Zustand state management with persistence
- ✅ Performance monitoring with r3f-perf and Leva debug controls

### 🖥️ Server Infrastructure

- ✅ Express.js backend with TypeScript and route versioning
- ✅ MongoDB integration with Mongoose ODM
- ✅ Socket.io WebSocket foundation
- ✅ Middleware stack (CORS, auth preparation, rate limiting)

### 📦 Shared Package

- ✅ TypeScript interfaces and type definitions
- ✅ Zod validation schemas for type safety
- ✅ Utility functions and game constants
- ✅ Testing setup with Jest across all packages

**Implementation Details:**

- Complete monorepo architecture with Turborepo for efficient builds
- Modern development tooling with automated quality gates
- Cross-platform development support with consistent configurations
- Scalable foundation for multiplayer game development

**📖 [View Phase 1 Implementation Guide](./PHASE1_README.md)**

---

## Phase 2: WebSocket ✅ COMPLETED

- **User connects with JWT**
- **Game emits actions**
- **Server broadcasts updates or errors** (for anti-cheat)
- Optionally add game events (combat, item drop)

**📖 [View Phase 2 Implementation Guide](./PHASE2_README.md)**

---

## Phase 3: Authentication & Anti-Cheat ✅ COMPLETED

### 👤 Auth System

- ✅ Guest users → temp JWT, no DB entry
- ✅ Registered users → JWT + MongoDB storage
- ✅ Admins → special role in JWT

### 🛡️ Anti-Cheat Middleware

- ✅ On gameAction WebSocket/event:
  - ✅ Validate request using server-side game rules
  - ✅ Reject illegal actions (e.g., teleport, infinite gold)

**Implementation Details:**

- Complete JWT authentication system with bcrypt password hashing
- MongoDB user management with guest/registered/admin roles
- Server-side game state management and validation
- Rate limiting and movement validation
- Full WebSocket integration with auth middleware
- Client-side auth store with Zustand
- Admin API endpoints for game management

**📖 [View Phase 3 Implementation Guide](./PHASE3_README.md)**

---

## Phase 4: Admin Dashboard

### 📋 Access

- Auth only if `user.role === 'admin'`
- Launch from game menu if logged in as admin

### 🎛 Features

- **Dashboard:**
  - Game state summary
  - Active sessions
  - Server load/performance
- **Logs viewer:**
  - Socket logs, game events, errors
- **Game data editor:**
  - Modify specific game state for debugging/testing
- **Charts:**
  - Player count over time
  - Action types distribution

---

## Phase 5: Boilerplate Engineizing

Make this project extendable for new games.

### 🧱 Engine-Level Design

- **Game Loop System:**
  - `tick()` function in frontend tied to animation loop
  - Optional server-side simulation
- **Action System:**
  - Define actions like move, attack, use_item with schemas
  - Validate actions in backend
  - Send actions through WebSocket
- **Plugin Architecture (Optional):**
  - Allow new games to add systems (combat, farming, etc.)
  - Use dependency injection or dynamic imports
- **Scene Management:**
  - Use abstraction for different maps or levels
  - Load from backend or procedurally generate

---

## Phase 6: Mobile Optimization

- Use react-three-fiber's performance optimizations
  - Use drei helpers
  - Limit draw calls, geometry complexity
- Mobile touch controls (e.g., joystick, gestures)
- Progressive loading for assets
- PWA setup (optional)
- Viewport scaling and responsiveness

---

## 🔐 Security Considerations

- All game logic validated server-side
- Rate-limiting & IP monitoring
- Avoid client-trust for anything beyond visuals
- WebSocket auth with JWT refresh
- Action audit log for suspicious patterns
