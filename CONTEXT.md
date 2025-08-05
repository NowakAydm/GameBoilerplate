# Repository Context: GameBoilerplate Monorepo

## Project Purpose

A modern, full-stack TypeScript monorepo for building multiplayer games and dashboards. It provides a robust foundation for rapid prototyping and scalable production apps, with shared code, modern tooling, and batteries-included testing.

## Monorepo Structure

- **/packages/client**: Main game frontend built with Vite and React. Handles 3D rendering, real-time networking, and user interaction.
- **/packages/admin**: Admin dashboard (Vite + React) for analytics, moderation, and game management.
- **/packages/server**: Express.js backend API. Provides REST endpoints, real-time multiplayer (Socket.io), authentication, and database integration.
- **/packages/shared**: Shared TypeScript types, Zod schemas, and utility functions used by all other packages.
- **/tests**: Centralized test suite for unit, integration, and visual regression tests. Uses Jest, Playwright, Pixelmatch, and PNG.js.

## Key Technologies

- **Frontend**: React, Vite, zustand, react-three-fiber, drei, leva, Socket.io-client
- **Admin**: React, Material UI, Chart.js, zustand, React Router
- **Backend**: Express.js, Socket.io, Mongoose, JWT, Zod, MongoDB
- **Shared**: TypeScript, Zod
- **Testing**: Jest, Playwright, Pixelmatch, PNG.js, React Testing Library, Supertest
- **Tooling**: Turborepo, ESLint, Prettier, Husky, lint-staged, dotenv

## How Packages Interact

- All packages import shared types and utilities from `@gameboilerplate/shared` for type safety and DRY code.
- The client and admin communicate with the server via REST and Socket.io.
- Tests can target any package and use shared mocks/utilities.

## Coding, Testing, and Linting Conventions

- **TypeScript** is used throughout for type safety.
- **ESLint** and **Prettier** enforce code style and formatting. Run `npm run lint` at the root or in any package.
- **Jest** is the default test runner. Run `npm test --workspaces` at the root for all tests.
- **Playwright** and **Pixelmatch** are used for visual regression in `/tests`.
- **Husky** and **lint-staged** run linting and tests on pre-commit.

## Entrypoints & Scripts

- **Install all dependencies:**
  ```sh
  npm install
  ```
- **Build all packages:**
  ```sh
  npm run build --workspaces
  ```
- **Run all tests:**
  ```sh
  npm test --workspaces
  ```
- **Start dev servers:**
  - Client: `cd packages/client && npm run dev`
  - Admin: `cd packages/admin && npm run dev`
  - Server: `cd packages/server && npm run dev`

## Special Setup & Notes

- Copy `.env.example` to `.env` and fill in secrets before running the server.
- Playwright tests require browsers: run `npx playwright install` in `/tests`.
- All packages are managed with Turborepo for fast, cache-aware builds and scripts.
- See each package's README for more details and usage examples.
