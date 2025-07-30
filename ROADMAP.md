# Project Roadmap

## Phase 2: WebSocket

- **User connects with JWT**
- **Game emits actions**
- **Server broadcasts updates or errors** (for anti-cheat)
- Optionally add game events (combat, item drop)

---

## Phase 3: Authentication & Anti-Cheat

### 👤 Auth System
- Guest users → temp JWT, no DB entry
- Registered users → JWT + MongoDB storage
- Admins → special role in JWT

### 🛡️ Anti-Cheat Middleware
- On gameAction WebSocket/event:
  - Validate request using server-side game rules
  - Reject illegal actions (e.g., teleport, infinite gold)

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
