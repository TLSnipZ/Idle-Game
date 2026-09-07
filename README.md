# Crime Empire

Working title for a modern Miami/Florida-inspired crime, luxury and street-culture
idle/tycoon browser game. **Phase 0 only: this application is not playable yet.**
No game systems, persistence, timers, or gameplay data are implemented.

## Development

Use Node 24 LTS (`.nvmrc`) and npm. Node must be at least 22.12.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview
```

`build` runs strict TypeScript checks then emits static files into `dist/`.
Vite handles TSX directly; no additional React build plugin is needed for this
shell. There is no router, state library, test runner or UI component library.

## Project map

- `src/app/`: application composition and shell.
- `src/features/`: future feature modules; currently documentation only.
- `src/game/`: future shared domain contracts and integration.
- `src/platform/`: future browser side-effect adapters.
- `src/shared/`: shared UI/utilities when actual reuse emerges.
- `src/assets/`: future licensed/original artwork, separate from logic.
- `src/styles/`: global styles and presentation tokens.
- `docs/`: design, architecture, phased roadmap and balancing policy.

Start with [AGENTS.md](AGENTS.md). Read [architecture](docs/ARCHITECTURE.md),
[game design](docs/GAME_DESIGN.md), [roadmap](docs/ROADMAP.md) and
[balancing](docs/BALANCING.md) before extending the foundation.

## GitHub Pages

This is a static client application. Vite uses `base: './'` so generated assets
resolve beneath both a domain root and `/repository-name/`. Publish the contents
of `dist/` using a future Pages workflow; do not serve the unbuilt source tree.
No deployment or CI workflow is configured in Phase 0. No client routing exists;
if introduced, prefer hash routing unless the hosting fallback is addressed.
Use imported assets or `import.meta.env.BASE_URL` for future public asset paths.

## Repository handoff

The initial workspace had no repository and the GitHub connector returned no
accessible repositories. This foundation has a local Git commit only; no remote
or deployment is configured. The delivered ZIP includes source, lockfile and a
`foundation.bundle` containing Git history. To restore the committed repository,
extract the ZIP and run from the extracted project directory:

```sh
git clone foundation.bundle ../crime-empire-restored
cd ../crime-empire-restored
npm ci
```

Add the intended remote only after its URL and access are established. If that
remote already has history, inspect it and integrate on a branch; never overwrite
it or force-push this standalone foundation.

## Foundation verification

Passed: `npm ci --no-audit --no-fund`, `npm run build` (including
`tsc --noEmit`), and `git diff --cached --check`. Built JS/CSS references were
checked for existing files and relative resolution beneath a repository path.
Browser visual/interaction testing was not run; no behavioral test suite exists
yet because Phase 0 has no gameplay behavior.
