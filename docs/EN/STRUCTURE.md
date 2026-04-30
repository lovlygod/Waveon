# Project Structure

```text
src/
  main/        Electron main process, database layer, downloader, IPC handlers
  renderer/    React UI (pages, components, hooks, stores, styles)
  shared/      Shared TypeScript app types
data/          Local runtime media, covers
database/      SQLite files
screenshots/   Project screenshots for docs/readme
docs/          Documentation (RU/EN)
```

Key entry points:

- Electron main: `src/main/main.ts`
- Preload bridge: `src/main/preload.ts`
- React app root: `src/renderer/main.tsx`


