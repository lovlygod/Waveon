# Development

## Run in development mode

```bash
npm run dev
```

This starts:

- Vite renderer dev server
- Electron main process with live renderer URL

## Type Safety

```bash
npm run typecheck
```

## Main / Renderer split

- `src/main` is compiled with [`tsconfig.main.json`](../../tsconfig.main.json).
- `src/renderer` is bundled by Vite and loaded in Electron.

## Local database and media

- Database files are located in `database/`.
- Downloaded tracks and covers are saved under `data/`.

## Common workflow

1. Run `npm run dev`.
2. Implement feature in renderer/main as needed.
3. Validate types with `npm run typecheck`.
4. Build with `npm run build` before release.

## Useful scripts

- `npm run typecheck`
- `npm run build:renderer`
- `npm run build:main`
- `npm run build`

