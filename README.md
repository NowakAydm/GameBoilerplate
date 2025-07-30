# GameBoilerplate Monorepo

>A modern monorepo for full-stack TypeScript game projects using React, Express, and shared code, managed with Turborepo.

## 🧭 Tech Stack Overview

| Layer                    | Tech Stack                                                                                                 |
|--------------------------|-----------------------------------------------------------------------------------------------------------|
| **Frontend Game Client** | React, Vite, TypeScript, zustand, r3f, @react-three/drei, r3f-perf, leva, Socket.io-client, GLTFLoader, Frustum Culling, ModelManager (with fallback) |
| **Frontend Admin Panel** | React, zustand, Material UI, Chart.js, React Router                                                        |
| **Backend API**          | Express.js, Socket.io, Mongoose, JWT, Zod, MongoDB                                                        |
| **Visual Regression**    | Playwright (headless browser), Pixelmatch (image diff), PNG.js (parsing), custom canvas testing routes     |
| **Unit & Integration**   | Jest, React Testing Library, Supertest, Vitest (optional for Vite)                                        |
| **Dev & Tooling**        | Vite, ESLint, Prettier, Husky, Turborepo, dotenv, path aliases                                            |
| **Other**                | GLTF Model Loader & Fallback System, Frustum Culling, optional Storybook for isolated component previews   |

## Monorepo Structure

- **packages/client** – Game frontend (see [client README](./packages/client/README.md))
- **packages/admin** – Admin dashboard (see [admin README](./packages/admin/README.md))
- **packages/server** – Express backend API (see [server README](./packages/server/README.md))
- **packages/shared** – Shared types, schemas, and utilities
- **tests/** – Unit, integration, and visual regression tests

## Getting Started

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

## Tooling

- **Turborepo** for monorepo task orchestration
- **ESLint & Prettier** for linting/formatting
- **Jest** for unit/integration testing
- **Playwright, Pixelmatch, PNG.js** for visual regression
- **GitHub Actions** for CI/CD

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint && npm test --workspaces`
4. Open a pull request

---
For more details, see the README in each package.