# react-healthie-kanban
React Typescript Healthie Kanban App

React + TypeScript Kanban board built with Vite and plain CSS for an interview
exercise. The app displays local sample cards across To Do, Doing, and Done.
Character references are temporary; editing interactions are not implemented.

## Local development

Use Node.js 24 LTS (24.15.0+) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

`preview` serves the production build locally after `build`.

`npm test` uses Node's built-in test runner and TypeScript stripping. The jsdom
dependency requires Node 22.22.2+, 24.15.0+, or 26+. Tests cover pure board
transitions, mocked character API responses,
character rendering, and form submission with React Testing Library and jsdom.
Vite supplies the existing TSX transform. No live API or browser is required.
`typecheck` includes test files as well as the app and Vite configuration.

## Structure

- `index.html`: HTML entry point and root element.
- `src/main.tsx`: mounts React with StrictMode and imports global CSS.
- `src/App.tsx`: page layout and authoritative local board state.
- `src/components/`: presentational board, column, and card components.
- `src/kanban.ts`: board types and initial sample data.
- `src/index.css`: plain global styles.
- `docs/ARCHITECTURE.md`: component responsibilities, state model, and data flow.
- `vite.config.ts`: Vite configuration and React plugin.
- `tsconfig*.json`: strict TypeScript settings for the app and Vite config.
- `.oxlintrc.json`: lint configuration.
- `package.json` / `package-lock.json`: scripts, dependencies, and locked versions.
- `AGENTS.md`: interview context, scope, and contribution conventions.

Generated dependencies and build output live in ignored `node_modules/` and
`dist/` directories.
