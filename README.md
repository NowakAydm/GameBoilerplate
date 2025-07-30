# GameBoilerplate Monorepo

>A modern monorepo for full-stack TypeScript game projects using React, Express, and shared code, managed with Turborepo.

## Monorepo Structure

- **packages/client** – Game frontend (React, Vite, r3f)
- **packages/admin** – Admin dashboard (React, MUI)
- **packages/server** – Express backend API
- **packages/shared** – Shared types, schemas, and utilities
- **tests/** – Unit and integration tests (Jest)

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
- **Jest** for testing
- **GitHub Actions** for CI/CD

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint && npm test --workspaces`
4. Open a pull request

---
For more details, see the README in each package.