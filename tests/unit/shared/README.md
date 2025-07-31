# Shared Package Tests

The unit tests for the `packages/shared` package have been moved to the centralized `/tests` directory for better organization and consistency across the project.

## Test Structure

```
/tests/shared/
├── index.test.ts           # Core schemas and types validation
└── engine/
    ├── GameEngine.test.ts   # GameEngine lifecycle and functionality
    ├── ActionSystem.test.ts # Action registration and execution
    └── types.test.ts        # Type interface validation
```

## Running Tests

From the root `/tests` directory:

```bash
# Run all shared package tests
npm test -- shared

# Run specific test files
npm test -- shared/index.test.ts
npm test -- shared/engine/GameEngine.test.ts

# Watch mode
npm test -- --watch shared

# Coverage report
npm test -- --coverage shared
```

## Test Coverage

The test suite provides comprehensive coverage for:

- **Core Schemas (21 tests)**: User roles, authentication, game actions/events with Zod validation
- **GameEngine (26 tests)**: Lifecycle management, entity operations, system management
- **ActionSystem (21 tests)**: Action registration, execution, cooldowns, error handling  
- **Types (15 tests)**: Interface validation for all core engine types

**Total: 83 tests covering all critical shared package functionality**

## Dependencies

Test dependencies are managed centrally in `/tests/package.json` rather than individual packages, ensuring consistent testing environment across all packages.
