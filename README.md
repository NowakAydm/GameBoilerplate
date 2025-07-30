
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

- **Turborepo** for monorepo orchestration
- **ESLint & Prettier** for linting/formatting
- **Jest** for unit/integration testing
- **Playwright, Pixelmatch, PNG.js** for visual regression
- **GitHub Actions** for CI/CD

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint && npm test --workspaces`
4. Open a pull request

---
For more details, see the README in each package.