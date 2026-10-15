# Project context

This is a React + TypeScript Healthie Kanban interview exercise. Optimize for
readable code, clear reasoning, and small changes that are easy to explain during
an interview. The implemented scope is a three-column board with GraphQL character
assignment, item creation, drag-and-drop movement/reordering, and a Done effect.
Keep changes within the requested exercise scope; do not add speculative features.

## Working conventions

- Inspect the repository and preserve existing work before editing.
- Use function components and hooks. Name components in PascalCase and variables
  and functions in camelCase. Use `.tsx` for JSX and `.ts` for other TypeScript.
- Keep TypeScript strict. Prefer clear domain types and type inference; avoid
  `any`, unnecessary assertions, and abstractions without a concrete need.
- Prefer local React state with `useState` or `useReducer` by default, keeping
  state close to where it is used. Add shared state tools only when concrete
  requirements justify them.
- Keep components small and focused on one responsibility. Add shared components
  or utilities only when the current requirements justify them.
- Use semantic HTML, accessible labels for controls, and plain CSS. Avoid UI
  libraries, CSS frameworks, and unnecessary dependencies.
- Match the surrounding formatting and use descriptive names and small functions.
  Explain intent in comments only when the code cannot express it clearly.
- Make small, independently reviewable changes. Avoid unrelated refactors and speculative
  architecture. Validate the changed behavior with appropriate checks.
- Do not add hypothetical interview features. Ask for concrete requirements when
  behavior is unclear rather than inventing a larger product.
- Avoid production infrastructure: no deployment, cloud resources, backend,
  authentication, analytics, CI/CD, or production service integrations unless
  explicitly requested.
- Do not commit unless the user explicitly asks.

## Available commands

Use npm and keep `package-lock.json` in sync with dependency changes.

- `npm install`: install dependencies for local development.
- `npm ci`: reproduce the locked dependencies on a clean checkout.
- `npm run dev`: start the Vite development server.
- `npm run typecheck`: check the app and Vite config with TypeScript.
- `npm run lint`: run Oxlint using `.oxlintrc.json`.
- `npm test`: run Node's built-in test runner, including React tests with jsdom.
- `npm run build`: run TypeScript checks and build to `dist/`.
- `npm run preview`: serve the built output locally.

Run typecheck, lint, tests, and build after changes. Use Node.js 24.15.0+ on the
24.x line (or a compatible newer version); tests use native TypeScript stripping
and jsdom. Typecheck includes the test files. Add tests when changed behavior
warrants them; browser checks are still needed for drag sensors and animations.
