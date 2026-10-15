# react-healthie-kanban
React Typescript Healthie Kanban App

Minimal React + TypeScript foundation built with Vite and plain CSS for an
interview exercise. The app currently renders a static placeholder.

## Local development

Use Node.js 22.12+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

`preview` serves the production build locally after `build`. No test runner is
configured.

## Structure

- `index.html`: HTML entry point and root element.
- `src/main.tsx`: mounts React with StrictMode and imports global CSS.
- `src/App.tsx`: minimal app component.
- `src/index.css`: plain global styles.
- `vite.config.ts`: Vite configuration and React plugin.
- `tsconfig*.json`: strict TypeScript settings for the app and Vite config.
- `.oxlintrc.json`: lint configuration.
- `package.json` / `package-lock.json`: scripts, dependencies, and locked versions.
- `AGENTS.md`: interview context, scope, and contribution conventions.

Generated dependencies and build output live in ignored `node_modules/` and
`dist/` directories.
