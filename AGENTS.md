# Development rules

## Start every session

Read this file, README.md, docs/ARCHITECTURE.md and docs/ROADMAP.md before editing.
Inspect Git status and relevant existing files. Preserve user changes. Read the
feature's design/balance notes before touching that feature. Follow the requested
phase and stop at its acceptance criteria; never advance automatically.

## Scope and stack

- React + strict TypeScript + Vite + modern CSS; client-side browser application.
- Keep GitHub Pages compatibility. No backend, database, authentication,
  multiplayer, server runtime, or unnecessary infrastructure.
- Prefer the simplest implementation satisfying the current request. No dormant
  systems, speculative frameworks, giant components, giant stores or game files.
- Dependencies need a concrete benefit. Preserve npm and package-lock.json.
- No `any`, unexplained type assertions, disabled checks, unused experiments,
  copied balance constants, or commented-out implementations.
- Do not add generated files, node_modules, credentials or build output to Git.

## Boundaries

- Features live in src/features/<feature>. Export the supported API via index.ts
  when a module is implemented. Never deep-import another feature's internals.
- Pure calculations and transitions live in feature model code or src/game.
  They must not import React, DOM, storage, wall-clock or random browser APIs.
- React renders state and dispatches intents; it never owns economy formulas.
- Shared game contracts and small composition functions live in src/game.
  Feature-specific logic stays in its feature. Introduce contracts when consumed.
- Browser side effects belong in src/platform; UI composition belongs in src/app.
- Content and balance are typed data in feature config, not React components.
- Cross-system bonuses go through the shared modifier contract once implemented.
  Never mutate another feature's state or insert special cases into its formulas.
- Derived values are calculated from authoritative state, not separately saved.
- Keep artwork, formatting, CSS tokens and asset paths outside gameplay logic.
- Use original or properly licensed artwork. No Rockstar/GTA assets or pixel art.

## Conventions

Use kebab-case feature directories and domain filenames, PascalCase component
files/types, camelCase functions/variables and UPPER_SNAKE_CASE fixed constants.
Use named exports (tool configuration may use its required default export),
explicit type-only imports and stable namespaced content IDs. See architecture
docs for units, state ownership and save compatibility expectations.

## Saves and validation

When persistence is requested, use a versioned validated save envelope, sequential
migrations, stable content IDs and safe import failure handling. Never silently
wipe a save or replace it before full validation. Keep run and permanent progress
separate. Import/export codes and offline catch-up are future work, not Phase 0.
Test domain invariants and failure boundaries when implementing real systems.
Do not add tests merely mirroring static shell markup. Vitest is installed for
pure behavioral tests; run `npm run test` when changing domain code.

## Finish each task

Run npm ci when restoring dependencies and npm run build after code/config changes.
Build includes strict type checking; npm run typecheck is available independently.
Use git diff --check and inspect the final diff for scope and accidental artifacts.
Run relevant behavioral tests when they exist. Report failures honestly.
Document significant decisions and update roadmap status for completed scope.
Commit only authorized changes with a descriptive message; do not push, deploy
or start another phase unless requested. Summarize changes, checks and next-session
context. Never claim unrun checks or a GitHub push that did not occur.
