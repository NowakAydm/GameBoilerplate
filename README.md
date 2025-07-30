# GameBoilerplate Monorepo

>A modern monorepo for full-stack TypeScript game projects using React, Express, and shared code, managed with Turborepo.

---

## Packages Overview

| Package | Description | Docs |
|---------|-------------|------|
| [`client`](./packages/client) | 3D game frontend built with React, Vite, r3f, zustand, and more. | [Client README](./packages/client/README.md) |
| [`admin`](./packages/admin) | Admin dashboard with React, Material UI, Chart.js, zustand. | [Admin README](./packages/admin/README.md) |
| [`server`](./packages/server) | Express backend API with Socket.io, MongoDB, JWT, Zod. | [Server README](./packages/server/README.md) |
| [`shared`](./packages/shared) | Shared types, Zod schemas, and utilities for all packages. | [Shared README](./packages/shared/README.md) |
| [`tests`](./tests) | Visual regression, unit, and integration tests. | [Tests README](./tests/README.md) |

---

## Quick Start

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Build all packages:**
   ```sh
   npm run build --workspaces
   ```
3. **Run all tests:**
   ```sh
   npm test --workspaces
   ```
4. **Start development servers:**
   - Client: `cd packages/client && npm run dev`
   - Admin: `cd packages/admin && npm run dev`
   - Server: `cd packages/server && npm run dev`

---

## Tech Stack

| Layer                    | Tech Stack & Docs                                                                                                 |
|--------------------------|-----------------------------------------------------------------------------------------------------------|
| **Frontend Game Client** | [React](https://react.dev), [Vite](https://vitejs.dev), [TypeScript](https://www.typescriptlang.org), [zustand](https://docs.pmnd.rs/zustand/getting-started/introduction), [react-three-fiber (r3f)](https://docs.pmnd.rs/react-three-fiber/), [@react-three/drei](https://docs.pmnd.rs/drei/introduction), [r3f-perf](https://github.com/RenaudRohlinger/r3f-perf), [leva](https://leva.pmnd.rs/), [Socket.io-client](https://socket.io/docs/v4/client-api/), [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) |
| **Frontend Admin Panel** | [React](https://react.dev), [zustand](https://docs.pmnd.rs/zustand/getting-started/introduction), [Material UI](https://mui.com/), [Chart.js](https://www.chartjs.org/), [React Router](https://reactrouter.com/)                                                        |
| **Backend API**          | [Express.js](https://expressjs.com/), [Socket.io](https://socket.io/), [Mongoose](https://mongoosejs.com/), [JWT](https://jwt.io/), [Zod](https://zod.dev/), [MongoDB](https://www.mongodb.com/)                                                        |
| **Visual Regression**    | [Playwright](https://playwright.dev/), [Pixelmatch](https://github.com/mapbox/pixelmatch), [PNG.js](https://github.com/lukeapage/pngjs)     |
| **Unit & Integration**   | [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [Supertest](https://github.com/ladjs/supertest), [Vitest](https://vitest.dev/)                                        |
| **Dev & Tooling**        | [Vite](https://vitejs.dev/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/), [Turborepo](https://turbo.build/repo), [dotenv](https://github.com/motdotla/dotenv), path aliases                                            |
| **Other**                | [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader), [Frustum Culling](https://threejs.org/docs/#api/en/math/Frustum), [Storybook](https://storybook.js.org/)   |

---

## Package Usage Examples

### Client (Game Frontend)
```sh
cd packages/client
npm install
npm run dev
# Open http://localhost:5173
```

### Admin (Dashboard)
```sh
cd packages/admin
npm install
npm run dev
# Open http://localhost:5173
```

### Server (API)
```sh
cd packages/server
npm install
npm run dev
# API at http://localhost:3001
```

### Shared (Types/Utils)
Import types or utilities in any package:
```ts
import type { ExampleSharedType } from '@gameboilerplate/shared';
```

### Tests (Visual Regression, Unit, Integration)
```sh
cd tests
npx playwright test
# See tests/README.md for details
```

---


## WebSocket Actions & Events (Phase 2)

- **JWT-Authenticated WebSocket:** All Socket.io connections require a valid JWT (guest, user, or admin). The server validates the token on connection and for all incoming actions.
- **Shared Action/Event Schemas:** All game actions and events are defined and validated using shared Zod schemas in the `shared` package, ensuring type safety and preventing malformed data.
- **Server-Side Validation:** Every incoming WebSocket action is validated on the server. Invalid or illegal actions are rejected, and an error event is broadcast to the client.
- **Event Broadcasting:** The server emits game events to all relevant clients (e.g., player joined, action performed, error occurred) using the shared event schema.
- **Sample Events:**
  - `player:join` – Sent when a player joins the game.
  - `player:move` – Broadcast when a player moves.
  - `game:error` – Sent to a client if an invalid action is attempted.
- **Anti-Cheat:**
  - All actions are checked for legality (e.g., no teleporting, no item drops for guests).
  - Attempts to cheat are logged and result in error events.

---

## Tooling & CI

- **Turborepo** – Monorepo task runner and orchestrator. Handles building, testing, and running scripts across all packages efficiently. [Docs](https://turbo.build/repo)
- **ESLint** – Linter for TypeScript/JavaScript. Enforces code quality and style. [Docs](https://eslint.org/)
- **Prettier** – Code formatter for consistent style. [Docs](https://prettier.io/)
- **Jest** – Unit and integration testing framework for JavaScript/TypeScript. [Docs](https://jestjs.io/)
- **Playwright** – End-to-end browser testing for UI and visual regression. [Docs](https://playwright.dev/)
- **Pixelmatch** – Image comparison library for visual regression tests. [Docs](https://github.com/mapbox/pixelmatch)
- **PNG.js** – PNG image parser/encoder used in visual regression. [Docs](https://github.com/lukeapage/pngjs)
- **Husky** – Git hooks manager. Runs linting/tests before commits to ensure code quality. [Docs](https://typicode.github.io/husky/)
- **lint-staged** – Runs linters on staged git files before commit. [Docs](https://github.com/okonet/lint-staged)
- **dotenv** – Loads environment variables from `.env` files. [Docs](https://github.com/motdotla/dotenv)
- **GitHub Actions** – CI/CD automation for building, testing, and deploying the monorepo. [Docs](https://docs.github.com/en/actions)

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint && npm test --workspaces`
4. Open a pull request

---
For more details, see the README in each package.