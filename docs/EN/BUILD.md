# Build & Distribution

## Production build

```bash
npm run build
```

This runs:

- renderer bundle build with Vite
- Electron main process TypeScript build

## Build distributables

```bash
npm run dist
```

Artifacts are generated to the `release/` directory according to electron-builder config.

## Current targets

Configured in [`package.json`](../../package.json):

- NSIS installer
- Portable build


