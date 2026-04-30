# Разработка

## Запуск в режиме разработки

```bash
npm run dev
```

Команда запускает:

- renderer на Vite
- Electron main process

## Проверка типов

```bash
npm run typecheck
```

## Разделение main / renderer

- `src/main` собирается через [`tsconfig.main.json`](../../tsconfig.main.json)
- `src/renderer` собирается Vite

## Типовой workflow

1. Запустить `npm run dev`
2. Внести изменения в `main` / `renderer`
3. Проверить `npm run typecheck`
4. Проверить production-сборку `npm run build`

## Полезные команды

- `npm run typecheck`
- `npm run build:renderer`
- `npm run build:main`
- `npm run build`
