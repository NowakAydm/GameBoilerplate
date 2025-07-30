# @gameboilerplate/client

> Vite + React game frontend for GameBoilerplate.

## Tech Stack

- React, Vite, TypeScript
- zustand (state management)
- react-three-fiber (r3f), @react-three/drei, r3f-perf, leva (3D/scene tools)
- Socket.io-client (real-time multiplayer)
- GLTFLoader, ModelManager (with fallback), Frustum Culling
- Shared types/utilities from `@gameboilerplate/shared`

## Features
- Modern 3D game client with real-time networking
- Model loading with fallback and culling
- State management with zustand
- Ready for visual regression testing

## Development
```sh
npm install
npm run dev
```
The app will be available at [http://localhost:5173](http://localhost:5173) by default.

## Build
```sh
npm run build
```
Output is in the `dist/` folder.

## Testing
```sh
npm test
```
Visual regression: see `/tests` for Playwright/Pixelmatch setup.
