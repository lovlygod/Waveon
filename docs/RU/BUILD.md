# Сборка и релиз

## Production-сборка

```bash
npm run build
```

Выполняется:

- сборка renderer через Vite
- сборка main-процесса TypeScript-компилятором

## Сборка установщика/портативной версии

```bash
npm run dist
```

Результаты сборки появляются в папке `release/`.

Текущие цели сборки (из [`package.json`](../../package.json)):

- NSIS installer
- Portable


