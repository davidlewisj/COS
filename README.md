# COS

A single-page EOS ("Entrepreneurial Operating System") management app for running weekly Level 10 meetings — Rocks, Scorecard, To-Dos, Issues, Vision/V-TO, Org Chart, and Headlines, all in one place.

## Stack

- React 18 + Vite 5
- No backend — all data is stored locally in the browser (`localStorage`)

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server (default port 3000, see `vite.config.js`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the codebase |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run the test suite in watch mode |

## Project structure

```
src/
  App.jsx          # Page components and app shell (sidebar, topbar, routing)
  constants.js      # Storage keys, default data, and global CSS
  main.jsx          # Entry point
  components/        # Shared UI pieces (Icons, charts, modal, etc.)
  hooks/             # Custom hooks (e.g. useIsMobile)
  utils/helpers.js   # Date/period math, scorecard rollups, storage helpers
  test/setup.js      # Vitest/Testing Library setup
```

## Testing

Tests use [Vitest](https://vitest.dev) and [React Testing Library](https://testing-library.com/react), and live alongside the code as `*.test.js`/`*.test.jsx` files.

## Data persistence

App state (profile, team, rocks, scorecard, to-dos, issues, meetings, etc.) is persisted to the browser's `localStorage` under the keys defined in `STORAGE_KEYS` (`src/constants.js`). There is no server-side storage, so data is local to a single browser.
