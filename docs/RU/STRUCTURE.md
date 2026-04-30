# Структура проекта

```text
src/
  main/        Electron main process, база данных, загрузчик, IPC-обработчики
  renderer/    React-интерфейс: страницы, компоненты, хуки, сторы, стили
  shared/      Общие TypeScript-типы
data/          Локальные файлы музыки и обложек
database/      SQLite-файлы
screenshots/   Скриншоты для документации
docs/          Документация (RU/EN)
```

Точки входа:

- Main: `src/main/main.ts`
- Preload: `src/main/preload.ts`
- Renderer: `src/renderer/main.tsx`


