# Installation

## Requirements

- Windows 10/11
- Node.js 18+
- npm
- ffmpeg available on system

## Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Install ffmpeg if missing and ensure it is available in PATH.

4. (Optional) verify TypeScript:

```bash
npm run typecheck
```

## Notes

- App runtime assets are saved in local folders:
  - `data/music`
  - `data/covers`
  - `database/`
- First run will create missing runtime directories automatically.

