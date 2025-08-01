# GameBoilerplate Monorepo

> A modern monorepo for full-stack TypeScript game projects using React, Express, and shared code, managed with Turborepo.

---

## Requirements

- **Node.js**: 22.x or higher
- **NPM**: 10.x or higher
- **MongoDB**: 7.x or higher (for development)

### Quick Node.js Setup

If you don't have Node.js 22, you can use the provided setup scripts:

**Windows:**
```cmd
setup-node.bat
```

**macOS/Linux:**
```bash
chmod +x setup-node.sh
./setup-node.sh
```

Or manually with NVM:
```bash
nvm install 22
nvm use 22
```

---

## Packages Overview

| Package                       | Description                                                      | Docs                                         |
| ----------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| [`client`](./packages/client) | 3D game frontend built with React, Vite, r3f, zustand, and more. | [Client README](./packages/client/README.md) |
| [`admin`](./packages/admin)   | Admin dashboard with React, Material UI, Chart.js, zustand.      | [Admin README](./packages/admin/README.md)   |
| [`server`](./packages/server) | Express backend API with Socket.io, MongoDB, JWT, Zod.           | [Server README](./packages/server/README.md) |
| [`shared`](./packages/shared) | Shared types, Zod schemas, and utilities for all packages.       | [Shared README](./packages/shared/README.md) |
| [`tests`](./tests)            | Visual regression, unit, and integration tests.                  | [Tests README](./tests/README.md)            |

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

| Layer                    | Tech Stack & Docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Game Client** | [React](https://react.dev), [Vite](https://vitejs.dev), [TypeScript](https://www.typescriptlang.org), [zustand](https://docs.pmnd.rs/zustand/getting-started/introduction), [react-three-fiber (r3f)](https://docs.pmnd.rs/react-three-fiber/), [@react-three/drei](https://docs.pmnd.rs/drei/introduction), [r3f-perf](https://github.com/RenaudRohlinger/r3f-perf), [leva](https://leva.pmnd.rs/), [Socket.io-client](https://socket.io/docs/v4/client-api/), [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) |
| **Frontend Admin Panel** | [React](https://react.dev), [zustand](https://docs.pmnd.rs/zustand/getting-started/introduction), [Material UI](https://mui.com/), [Chart.js](https://www.chartjs.org/), [React Router](https://reactrouter.com/)                                                                                                                                                                                                                                                                                                                      |
| **Backend API**          | [Express.js](https://expressjs.com/), [Socket.io](https://socket.io/), [Mongoose](https://mongoosejs.com/), [JWT](https://jwt.io/), [Zod](https://zod.dev/), [MongoDB](https://www.mongodb.com/)                                                                                                                                                                                                                                                                                                                                       |
| **Visual Regression**    | [Playwright](https://playwright.dev/), [Pixelmatch](https://github.com/mapbox/pixelmatch), [PNG.js](https://github.com/lukeapage/pngjs)                                                                                                                                                                                                                                                                                                                                                                                                |
| **Unit & Integration**   | [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [Supertest](https://github.com/ladjs/supertest), [Vitest](https://vitest.dev/)                                                                                                                                                                                                                                                                                                                                     |
| **Dev & Tooling**        | [Vite](https://vitejs.dev/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/), [Turborepo](https://turbo.build/repo), [dotenv](https://github.com/motdotla/dotenv), path aliases                                                                                                                                                                                                                                                                                            |
| **Other**                | [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader), [Frustum Culling](https://threejs.org/docs/#api/en/math/Frustum), [Storybook](https://storybook.js.org/)                                                                                                                                                                                                                                                                                                                                                       |

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
# API at http://localhost:3000
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

## 📦 Project Dependencies

### Root Dependencies (Monorepo Management)

#### Development Tools
- **[@typescript-eslint/eslint-plugin](https://typescript-eslint.io/)** `^7.5.0` - TypeScript-specific linting rules
- **[@typescript-eslint/parser](https://typescript-eslint.io/)** `^7.5.0` - TypeScript parser for ESLint
- **[eslint](https://eslint.org/)** `^8.56.0` - JavaScript/TypeScript linter for code quality
- **[eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)** `^10.1.8` - Disables ESLint rules that conflict with Prettier
- **[eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)** `^5.1.3` - Runs Prettier as an ESLint rule
- **[prettier](https://prettier.io/)** `^3.3.0` - Code formatter for consistent styling
- **[husky](https://typicode.github.io/husky/)** `^9.1.7` - Git hooks for pre-commit quality checks
- **[lint-staged](https://github.com/okonet/lint-staged)** `^15.5.2` - Run linters on staged files only
- **[turbo](https://turbo.build/repo)** `^1.12.0` - Monorepo build system and task runner
- **[typescript](https://www.typescriptlang.org/)** `^5.4.0` - TypeScript compiler and language support

#### Testing & Quality
- **[@types/jest](https://www.npmjs.com/package/@types/jest)** `^30.0.0` - TypeScript definitions for Jest
- **[dotenv](https://github.com/motdotla/dotenv)** `^17.2.1` - Environment variable loader

### Client Package (3D Game Frontend)

#### Core Framework
- **[react](https://react.dev/)** `^18.3.1` - UI library for building interactive components
- **[react-dom](https://react.dev/)** `^18.3.1` - React renderer for web browsers
- **[vite](https://vitejs.dev/)** `^7.0.6` - Fast build tool and development server

#### 3D Graphics & Game Engine
- **[three](https://threejs.org/)** `^0.178.0` - 3D graphics library for WebGL rendering
- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)** `^9.3.0` - React renderer for Three.js
- **[@react-three/drei](https://docs.pmnd.rs/drei/introduction)** `^10.6.1` - Useful helpers and abstractions for R3F
- **[three-stdlib](https://github.com/pmndrs/three-stdlib)** `^2.36.0` - Stand-alone Three.js utilities and helpers

#### Development & Debugging
- **[leva](https://leva.pmnd.rs/)** `^0.10.0` - GUI controls for tweaking game parameters
- **[r3f-perf](https://github.com/RenaudRohlinger/r3f-perf)** `^7.2.3` - Performance monitor for React Three Fiber

#### State & Communication
- **[zustand](https://docs.pmnd.rs/zustand/)** `^5.0.6` - Lightweight state management library
- **[socket.io-client](https://socket.io/docs/v4/client-api/)** `^4.8.1` - Real-time WebSocket client for multiplayer

#### TypeScript Support
- **[@types/react](https://www.npmjs.com/package/@types/react)** `^18.3.23` - TypeScript definitions for React
- **[@types/react-dom](https://www.npmjs.com/package/@types/react-dom)** `^18.3.7` - TypeScript definitions for ReactDOM
- **[@types/three](https://www.npmjs.com/package/@types/three)** `^0.178.1` - TypeScript definitions for Three.js

### Admin Package (Dashboard Frontend)

#### Core Framework
- **[react](https://react.dev/)** `^18.3.1` - UI library for dashboard components
- **[react-dom](https://react.dev/)** `^18.3.1` - React renderer for web browsers
- **[react-router-dom](https://reactrouter.com/)** `^7.7.1` - Client-side routing for single-page apps

#### UI Framework & Styling
- **[@mui/material](https://mui.com/)** `^7.2.0` - Material-UI component library
- **[@mui/icons-material](https://mui.com/material-ui/material-icons/)** `^7.2.0` - Material Design icons
- **[@emotion/react](https://emotion.sh/docs/@emotion/react)** `^11.14.0` - CSS-in-JS library (MUI dependency)
- **[@emotion/styled](https://emotion.sh/docs/@emotion/styled)** `^11.14.1` - Styled components for Emotion

#### Charts & Data Visualization
- **[chart.js](https://www.chartjs.org/)** `^4.5.0` - Flexible JavaScript charting library
- **[react-chartjs-2](https://react-chartjs-2.js.org/)** `^5.3.0` - React wrapper for Chart.js
- **[@mui/x-charts](https://mui.com/x/react-charts/)** `^8.9.0` - Advanced charting components from MUI

#### State Management
- **[zustand](https://docs.pmnd.rs/zustand/)** `^5.0.6` - Lightweight state management for admin data

#### TypeScript Support
- **[@types/react](https://www.npmjs.com/package/@types/react)** `^18.3.23` - TypeScript definitions for React
- **[@types/react-dom](https://www.npmjs.com/package/@types/react-dom)** `^18.3.7` - TypeScript definitions for ReactDOM
- **[@types/react-router-dom](https://www.npmjs.com/package/@types/react-router-dom)** `^5.3.3` - TypeScript definitions for React Router

### Server Package (Backend API)

#### Core Framework
- **[express](https://expressjs.com/)** `^4.21.2` - Web framework for Node.js APIs
- **[cors](https://github.com/expressjs/cors)** `^2.8.5` - Cross-Origin Resource Sharing middleware

#### Real-time Communication
- **[socket.io](https://socket.io/)** `^4.8.1` - Real-time WebSocket server for multiplayer features

#### Database & ODM
- **[mongoose](https://mongoosejs.com/)** `^8.17.0` - MongoDB object modeling and validation

#### Authentication & Security
- **[jsonwebtoken](https://jwt.io/)** `^9.0.2` - JWT token creation and verification
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** `^6.0.0` - Password hashing and verification

#### Validation & Environment
- **[zod](https://zod.dev/)** `^4.0.14` - TypeScript-first schema validation
- **[dotenv](https://github.com/motdotla/dotenv)** `^17.2.1` - Environment variable management

#### Development Tools
- **[ts-node-dev](https://github.com/wclr/ts-node-dev)** `^2.0.0` - TypeScript execution with hot reload

#### TypeScript Support
- **[@types/bcrypt](https://www.npmjs.com/package/@types/bcrypt)** `^6.0.0` - TypeScript definitions for bcrypt
- **[@types/cors](https://www.npmjs.com/package/@types/cors)** `^2.8.19` - TypeScript definitions for CORS
- **[@types/express](https://www.npmjs.com/package/@types/express)** `^4.17.23` - TypeScript definitions for Express
- **[@types/jsonwebtoken](https://www.npmjs.com/package/@types/jsonwebtoken)** `^9.0.10` - TypeScript definitions for JWT

### Shared Package (Common Types & Schemas)

#### Validation & Schema
- **[zod](https://zod.dev/)** `^4.0.14` - Runtime type validation and schema definition

#### Testing
- **[jest](https://jestjs.io/)** `^30.0.5` - Testing framework for shared utilities
- **[ts-jest](https://kulshekhar.github.io/ts-jest/)** `^29.4.0` - TypeScript preprocessor for Jest
- **[@types/jest](https://www.npmjs.com/package/@types/jest)** `^30.0.0` - TypeScript definitions for Jest

### Tests Package (Testing Infrastructure)

#### Testing Frameworks
- **[jest](https://jestjs.io/)** `^30.0.5` - JavaScript testing framework
- **[playwright](https://playwright.dev/)** `^1.54.1` - Browser automation for e2e testing
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** `^16.3.0` - React component testing utilities
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** `^6.6.4` - Custom Jest matchers for DOM testing

#### Test Configuration & Transpilation
- **[babel-jest](https://jestjs.io/docs/getting-started#using-babel)** `^30.0.5` - Babel transformer for Jest
- **[@babel/core](https://babeljs.io/docs/en/babel-core)** `^7.28.0` - Babel compiler core
- **[@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)** `^7.28.0` - Babel preset for modern JavaScript
- **[ts-jest](https://kulshekhar.github.io/ts-jest/)** `^29.1.1` - TypeScript preprocessor for Jest

#### API & Integration Testing
- **[supertest](https://github.com/ladjs/supertest)** `^7.1.4` - HTTP assertion library for testing APIs
- **[node-fetch](https://github.com/node-fetch/node-fetch)** `^2.7.0` - HTTP client for mock server integration

#### Visual Regression Testing
- **[pixelmatch](https://github.com/mapbox/pixelmatch)** `^7.1.0` - Pixel-level image comparison
- **[pngjs](https://github.com/lukeapage/pngjs)** `^7.0.0` - PNG image parsing for visual testing

#### Mock Server (Tests)
- **[express](https://expressjs.com/)** - Embedded in mock-server.js for realistic API simulation
- **[cors](https://github.com/expressjs/cors)** - Cross-origin support for test server

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
