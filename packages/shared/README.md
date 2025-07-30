# @gameboilerplate/shared

> Shared types, schemas, and utilities for the GameBoilerplate monorepo.

## Tech Stack

- TypeScript-first
- Zod (validation schemas)
- Utilities for all packages

## Features

- Common types and interfaces for client, admin, and server
- Zod schemas for validation
- Utility functions for game logic, networking, etc.

## Usage

Import types or utilities from this package in any other workspace package:

```ts
import type { ExampleSharedType } from '@gameboilerplate/shared';
```

## Development

- Add new types, schemas, or utilities in `src/`
- Run `npm run build` to compile
- Run `npm test` to test
