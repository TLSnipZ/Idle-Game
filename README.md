# Crime Empire

Working title for a modern Miami/Florida-inspired crime, luxury and street-culture
idle/tycoon browser game. **Phase 8B: Lifetime Statistics Foundation.**
Cash, player XP, business levels, five purchased upgrades, automation and exact progress survive
reloads. Buy Dockside Detail at level 1 and level it up to 100. Upgrade bonuses apply
to business production and delivery rewards through the shared modifier system.
Hire the **Delivery Dispatcher** for **$7,500** at Player Level 3 after acquiring Dockside: it performs
one delivery every **10 seconds** at your current reward ($25 base, $36 with both
job upgrades). Manual deliveries remain available and do not reset its progress.
Existing saves/codes migrate automatically. Pre-XP saves start with XP 0 while preserving existing progress.
Base rewards are 10 XP per manual delivery, 5 per dispatched delivery (including credited offline
jobs), and 25 per business level increase. Player level is derived from XP, capped
at 100, and grants no income bonus. The progress bar shows XP within the current
level; feedback announces level increases and newly eligible content.
Street Connections requires Player Level 2; Industrial Detailing Line requires
Dockside Level 5; Fleet Logistics requires an owned business, Commercial Pressure
Washer and Player Level 5. Cards show each requirement separately from affordability.
Dockside and Express Tips remain ungated. These are purchase requirements only:
already-owned upgrades and automation stay active, including in older saves.
The Garage introduces one provisional collectible, **Vortex S9**, for **$50,000**.
It requires Player Level 7 and Dockside Level 10, and adds **+15% global business
production** while owned, including offline. Vehicles persist through reload and
save codes; older saves gain an empty garage. Its display name/art are temporary;
there are no equip slots or set bonuses.
Progress saves after successful actions and every five seconds; closing the page
can lose unsaved actions. On return, businesses and the dispatcher receive the same base maximum **eight hours** (up to twelve with Never Sleeps)
of offline progress from the last successful local save. A welcome card shows
positive income with the business/dispatcher breakdown when hired. If offline reconciliation cannot be saved, the session pauses
and preserves your old save; reload to retry.
Corrupt/newer saves are preserved with a warning and saving disabled for that
session unless you explicitly confirm importing a replacement. Storage failures are
shown in-game. No cloud saves exist.

Use **Save management → Export save** to generate a `CE1-` backup code. Copy it
with the button or select the text manually if clipboard access is unavailable.
To restore, paste a code, validate it, then confirm replacing current progress and
the local save. Cancel keeps your progress. Codes are not encrypted or secret.
Importing a code awards no income or XP from its historical timestamp. Offline timing
begins at the new local import timestamp.

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
The user manually verified the live Phase 4C deployment: dispatcher purchase,
10-second jobs, $25/$30/$36 evaluated rewards, saved cycle progress, offline
automation, welcome-back breakdown and export/import work. The user also verified
Phase 5A manual/dispatcher/business-level XP, reload, offline XP, export/import
and the player progress UI. The user verified Phase 5B level gates, requirement UI,
grandfathered ownership and fresh-save progression live. Phase 5C and Phase 6A were also manually verified live by the user. Phase 6B was manually verified live by the user; Phase 7A was manually verified live by the user; Phase 7B was manually verified live by the user; Phase 7C was manually verified live by the user; Phase 7D and the complete Phase 7 city-system foundation were manually verified live by the user. Phase 8A was manually verified live by the user. Phase 8B live verification remains pending.

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


Rebirth becomes available at Player Level 20 and Dockside Level 25. Review the
explicit keep/lose summary before confirming: temporary progress resets, while
vehicles, Empire Points and Rebirth count remain permanent. The reset takes effect
only after local saving succeeds. Spend unspent Empire Points in **Empire Foundations**:
five permanent ranked skills improve production, delivery pay, XP or the future
offline cap. Skills survive Rebirth; EP spending is never refunded. There is no respec.
XP rounds down once per award; Dispatcher XP rounds once per completed-job batch.


**Solara City** starts with Waterfront controlled, with no gameplay bonus. Take
control of **Neon Mile** for **$100,000** at Player Level 12 and Dockside Level 15
to gain **+10% manual/Dispatcher cash**, including offline Dispatcher jobs. XP and
business production are unaffected. Territories beyond Waterfront reset on Rebirth;
vehicles and permanent skills remain. Older saves gain Waterfront only. Manual deliveries, Dispatcher batches and Neon Mile
acquisition build **Heat**. HOT reduces delivery cash by 10%; MANHUNT by 25%.
Heat normally cools by one per credited minute. **Lay Low** costs $500 and removes up to 10
Heat. Heat resets on Rebirth; XP and business production are unaffected. Older
saves begin with zero Heat. Recruit Rico, Mara and Jax in **Crew**, then explicitly assign them to Operations or Logistics. Only assigned specialists improve delivery cash, cooling or production; Operations chooses Rico or Mara. Recruitment and assignments reset on Rebirth. Crew progression and a full city map remain deferred.


**City Events** may appear at ten-minute opportunities during active play. Hot Tip,
Shakedown and Warehouse Opportunity each show two exact Money/Heat choices. Leave
one open while playing normally; only the event timer pauses. Successful choices
restart the timer. Events persist through reload/export/import, never advance or
spawn offline, and reset on Rebirth. Older saves gain an empty event state.


**Achievements** recognize six visible milestones without changing rewards or
production. Completion is permanent through Rebirth, reload and CE1 backups.
Locked cards show current progress; unlocked cards stay completed after rebuilding.


**Statistics** show eight lifetime observations: manual and automated jobs, paid
business upgrades, territory takeovers, Crew recruits, event resolutions, Rebirths
and peak Heat. They survive Rebirth and CE1 backups and provide no gameplay bonuses.
Older saves retain their exact Rebirth history; other new counters start at zero.
