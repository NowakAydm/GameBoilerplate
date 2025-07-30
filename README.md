
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

| Layer                    | Tech Stack                                                                                                 |
|--------------------------|-----------------------------------------------------------------------------------------------------------|
| **Frontend Game Client** | React, Vite, TypeScript, zustand, r3f, @react-three/drei, r3f-perf, leva, Socket.io-client, GLTFLoader, Frustum Culling, ModelManager (with fallback) |
| **Frontend Admin Panel** | React, zustand, Material UI, Chart.js, React Router                                                        |
| **Backend API**          | Express.js, Socket.io, Mongoose, JWT, Zod, MongoDB                                                        |
| **Visual Regression**    | Playwright (headless browser), Pixelmatch (image diff), PNG.js (parsing), custom canvas testing routes     |
| **Unit & Integration**   | Jest, React Testing Library, Supertest, Vitest (optional for Vite)                                        |
| **Dev & Tooling**        | Vite, ESLint, Prettier, Husky, Turborepo, dotenv, path aliases                                            |
| **Other**                | GLTF Model Loader & Fallback System, Frustum Culling, optional Storybook for isolated component previews   |

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