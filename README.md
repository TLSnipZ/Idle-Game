# Crime Empire

Working title for a modern Miami/Florida-inspired crime, luxury and street-culture
idle/tycoon browser game. **Phase 2A: versioned local saves.**
Cash, business ownership and fractional production survive reloads on this browser.
Progress saves after successful actions and every five seconds; closing the page
can lose progress since the last successful save. There is **no offline income**.
Corrupt/newer saves are preserved with a warning and saving disabled for that
session. Storage failures are shown in-game. No export/import or cloud saves exist.

## Development

Use Node 24 LTS (`.nvmrc`) and npm. Node must be at least 22.12.

```sh
npm ci
npm run dev
npm run typecheck
npm run test
npm run build
npm run preview
```

`build` runs strict TypeScript checks then emits static files into `dist/`.
Vite handles TSX directly; no additional React build plugin is needed for this
shell. Vitest tests the pure domain. There is no router, state library or UI component library.

## Project map

- `src/app/`: application composition and shell.
- `src/features/`: implemented economy and boundaries for future modules.
- `src/game/`: minimal GameState, starter command and selectors.
- `src/platform/`: browser runtime and local persistence adapters.
- `src/shared/`: shared UI/utilities when actual reuse emerges.
- `src/assets/`: future licensed/original artwork, separate from logic.
- `src/styles/`: global styles and presentation tokens.
- `docs/`: design, architecture, phased roadmap and balancing policy.

Start with [AGENTS.md](AGENTS.md). Read [architecture](docs/ARCHITECTURE.md),
[game design](docs/GAME_DESIGN.md), [roadmap](docs/ROADMAP.md) and
[balancing](docs/BALANCING.md) before extending the foundation.

## GitHub Pages

Expected public URL: [Crime Empire](https://tlsnipz.github.io/Idle-Game/).
Deployment configuration is implemented; the live deployment is not yet verified.

[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) deploys
on pushes to `main` and supports **Actions → Deploy to GitHub Pages → Run workflow**
(select `main`). It reads Node **24** from `.nvmrc`, installs with `npm ci`, runs
`npm run build` (including TypeScript checks), and uploads only `dist` through the
official Pages artifact/deployment actions. A shared concurrency group prevents
overlapping deployments. Only the deploy job receives Pages write/OIDC permissions;
no personal access token or custom secret is required.

One-time setup in `TLSnipZ/Idle-Game`: open **Settings → Pages → Build and deployment**
and set **Source: GitHub Actions**. Ensure Actions are enabled for the repository
and official `actions/*` actions are permitted. Push the committed workflow to
`main`, or run it manually after enabling Pages. Check both jobs under **Actions**;
the deploy job's `github-pages` environment link and **Settings → Pages** show the
published URL. Confirm the site loads, delivery/purchase works, and owned cash rises.
If environment approval is configured, approve the pending deployment there.

Vite's existing `base: './'` is retained: generated JS/CSS references resolve under
`/Idle-Game/` without changing the local build. No router or custom-domain setup is
needed. This follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Repository handoff

The initial workspace had no repository and the GitHub connector returned no
accessible repositories. The current repository has local commits and an `origin` remote at
`https://github.com/TLSnipZ/Idle-Game.git`. Shell push credentials were unavailable
in the implementation environment; deployment configuration must reach remote
`main` before GitHub can run it. The delivered ZIP includes source, lockfile and a
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
