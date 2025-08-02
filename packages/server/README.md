# @gameboilerplate/server

> Express + TypeScript backend for GameBoilerplate.

## Tech Stack

- Express.js (REST API)
- Socket.io (real-time communication)
- Mongoose (MongoDB ODM)
- JWT (authentication)
- Zod (validation)
- MongoDB (database)
- Shared types/utilities from `@gameboilerplate/shared`

## Features

- Real-time multiplayer backend
- REST API with validation and authentication
- MongoDB integration
- Ready for integration and visual regression testing

## Development

```sh
npm install
npm run dev
```

The server will start on [http://localhost:3000](http://localhost:3000) by default.

## Build

```sh
npm run build
```

Output is in the `dist/` folder.

## Testing

```sh
npm test
```

Integration and visual regression: see `/tests` for Playwright/Supertest setup.
