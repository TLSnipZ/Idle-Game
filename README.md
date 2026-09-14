<div align="center">

# SOLARA CITY

**Build the business. Own the streets. Take the city.**

A coastal crime-empire idle / tycoon game about street hustles, neon nights and building something that lasts.

<a href="https://tlsnipz.github.io/Idle-Game/">
  <img src="https://img.shields.io/badge/PLAY_SOLARA_CITY-78e4dc?style=for-the-badge" alt="Play Solara City in your browser" height="36" />
</a>

**[Play in your browser](https://tlsnipz.github.io/Idle-Game/)** · [In the game](#in-the-game-today) · [Current work](#current-work--operations-balance-i-analysis-only) · [Development](#development)

![Browser game](https://img.shields.io/badge/Browser_game-111c2e?style=flat-square)
![In development](https://img.shields.io/badge/Status-In_development-f2ca87?style=flat-square)
[![GitHub Pages deployment](https://github.com/TLSnipZ/Idle-Game/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/TLSnipZ/Idle-Game/actions/workflows/deploy-pages.yml)

<a href="https://tlsnipz.github.io/Idle-Game/">
  <img src="src/assets/vehicles/kairo-kx-r.webp" alt="The pearl-white Kairo KX-R in Solara City's neon-lit waterfront garage" width="860" />
</a>

*Approved Kairo KX-R vehicle artwork used in the game, not a gameplay screenshot.*

**Single-player · Browser-first · No account required**

</div>

## Current work — Operations Balance I (analysis only)

[PR #51](https://github.com/TLSnipZ/Idle-Game/pull/51) compares current manual and
Dispatcher earnings with exactly two isolated alternatives. The recommendation,
assumptions, tradeoffs and implementation boundaries are in
[Operations balance](docs/OPERATIONS_BALANCE.md).

**This is not a gameplay rebalance.** Candidate rewards and the candidate manual
cadence exist only in the analysis test. Save **v26 / CE1**, current rewards,
prices, production, approved artwork and player progress are unchanged.
The PR records exact verification and review status. Merge, publication and the
proposed gameplay implementation each require the user's instruction.

## Latest published gameplay

Garage IV-D ([PR #49](https://github.com/TLSnipZ/Idle-Game/pull/49)) and Workshop
purchase insight ([PR #50](https://github.com/TLSnipZ/Idle-Game/pull/50)) are merged
and published. All six cars have two alternative permanent setups and two signature
finishes plus factory paint. All twelve setups offer optional before/after
comparisons using actual game evaluators.

Both comparison columns assume the Workshop car is active; the previous setup is
replaced, not stacked. Fitting or painting an inactive car does not activate it.
Comparisons are snapshots with current bonuses and Heat, not guaranteed income or
payback forecasts. See [Tier-2 customization](docs/TIER_TWO_CUSTOMIZATION.md) and
[Workshop release evidence](docs/WORKSHOP_INSIGHT.md#release--2026-09-14).
Automated verification is separate from the player's personal acceptance.

## Start small. Build an empire.

Run deliveries for immediate Cash, build passive income and recruit specialists.
Manage Heat, make choices in City Events and eventually **Rebirth**: trade temporary
run progress for permanent Empire Points and a stronger comeback.

**HUSTLE → BUILD → EXPAND → REBIRTH → REBUILD STRONGER**

Open **Operations** to make your first deliveries and acquire **Dockside Detail**.
The Business ladder grows with you:

**Dockside Detail → Neon Laundry → Afterdark Customs → Solara Nights**

## In the game today

| System | Available gameplay |
| --- | --- |
| **Business empire** | Acquire four Businesses, develop each through Level 100 and grow passive production. Later acquisitions depend on earlier development. |
| **Equipment & automation** | Buy production and delivery upgrades, hire a Delivery Dispatcher and optionally enable a Business Auto-Upgrader. Automatic spending is opt-in. |
| **City & crew** | Waterfront and Neon Mile, local Heat, district travel and three recruitable specialists: Rico Vale, Mara Knox and Jax Mercer. |
| **Heat & City Events** | Risky and discreet deliveries, Lay Low, MANHUNT roadblocks/decoys, support effects and three online City Events with explicit choices. |
| **Rebirth & Empire Points** | Restart temporary progression for EP, invest in five ranked permanent skills and retain the Garage. |
| **Garage & Workshop** | Kairo KX-R, Kairo Senda, Namera Lilt, Namera Serein, Toseki Rendan and Sevrin Canto Club. Only the active car and its fitted setup contribute. Each has two alternative setups and two signature finishes plus factory paint. |
| **Achievements & statistics** | Six permanent achievements and eight lifetime statistics, without gameplay bonuses. |
| **Guidance** | Next Objective shows exact requirements and navigation to the relevant view; guidance never purchases or resets anything. |
| **Offline progress & backups** | Business and Dispatcher earnings for up to eight hours, extendable to twelve through Never Sleeps. Local saves and CE1 export/import. |
| **Presentation** | English/German Solara satire and fully transformed Villager text; approved vehicle, storefront and district artwork in responsive workspaces. |

The five sections are **Overview**, **Operations**, **City**, **Collection** and
**Empire**. Their workspaces use separate views rather than one long list.
Next Objective is shared across sections; optional goal selection is not saved.
See [Guidance](docs/GUIDANCE.md).

Your first permanent Garage purchase, **Kairo KX-R**, costs **$25,000**, requires
Player Level 5 / Dockside Level 5 and provides **+10% Business Production while
active**, including offline and after Rebirth. The first car purchase activates
automatically; later purchases do not replace the active selection. Ownership,
selection, purchased setups and applied finishes survive Rebirth.

## What's next?

**Playable development build — still growing, not a finished release.**

The current bounded work is Operations Balance I: analysis and recommendation.
Its reward/cadence implementation requires a separate instruction. Other purchase
comparisons, Rebirth guidance, deeper city/crew presentation, Business depth and
later vehicle tiers remain separately scoped possibilities. The retained vehicle
catalog contains seventeen identities, six live; the wishlist is not a content-phase
authorization. No new artwork or vehicle is introduced by the analysis.

The longer-term vision connects Businesses, cars, crew and city control through
rival factions, Operations, Heists and Territory takeovers. See the
[current roadmap](docs/ROADMAP.md), [future priorities](docs/POST_ROADMAP.md),
[Business expansion design](docs/BUSINESS_EXPANSION.md) and
[vehicle catalog](docs/VEHICLE_CATALOG.md).

Earlier roadmap files are preserved unchanged in
[roadmap history](docs/ROADMAP_HISTORY.md) and
[post-roadmap history](docs/POST_ROADMAP_HISTORY.md). Their historical “next phase”
labels are not current instructions.

## Keep your progress safe

Progress is stored **locally in your browser**. There are **no cloud saves or account
synchronization**. Before clearing site data or changing browser/device, open
**Empire → Save & Transfer → Export save** and keep a copy of the `CE1-` code.
Import validates the code and asks for confirmation before replacing progress.

<details>
<summary><strong>Save, offline and reset details</strong></summary>

- Current saves use schema v26 and CE1 transport. Supported older saves migrate sequentially without resetting progress or granting purchases.
- Successful supported actions and periodic five-second saves preserve progress. A storage error means saving may have failed.
- Offline Businesses and Dispatcher share a capped interval. An enabled Auto-Upgrader may spend Cash on its selected Business during that interval.
- City Events do not spawn or advance offline; pending events survive ordinary save/load and export/import.
- Importing an old code does not award income or XP from its historical timestamp. Local timing starts anew.
- Corrupt or unsupported newer saves are preserved rather than silently replaced. CE1 backups are portable data, not encrypted credentials.

Rebirth is not a full New Game reset. Read the in-game Keep/Lose review.
For a complete restart, use **Empire → Save & Transfer → New Game / Reset Progress**,
export a backup, review the warning, type `RESET` and explicitly confirm. This erases
run and permanent progress without awarding EP. The fresh game is published only
after saving succeeds. See the [reset safety contract](docs/RESET_PROGRESS.md).

</details>

## Development

React, strict TypeScript, Vite, Vitest and modern CSS; exact Money arithmetic,
pure game rules, elapsed-time simulation and versioned saves. The browser build
requires no backend. Read [AGENTS.md](AGENTS.md), README, architecture and current
roadmap before editing. Use **Node.js 24**, pinned in `.nvmrc`; the package requires
Node.js 22.12 or newer.

```sh
git clone https://github.com/TLSnipZ/Idle-Game.git
cd Idle-Game
npm ci
npm run dev
```

```sh
npm run typecheck
npm run test
npm run build
npm run preview
```

Reproduce the isolated experiment:

```sh
npx vitest run src/game/operations-balance-analysis.test.ts --reporter=verbose
```

The experiment prints exact-cent records and is not imported by the game. Full CI
retains the complete test suite and existing browser matrices. PR #51 records the
verified source commit separately from documentation follow-ups. `build` includes
TypeScript checking and emits `dist/`. Tests, browser reviews and personal visual
acceptance are distinct forms of evidence.

<details>
<summary><strong>Structure and deployment</strong></summary>

```text
src/app/       UI composition and navigation
src/features/  Feature configuration, rules and presentation
src/game/      Shared contracts and cross-feature integration
src/platform/  Browser clock, storage and runtime adapters
src/shared/    Reusable helpers and UI
src/assets/    Approved artwork
src/styles/    Global presentation
docs/          Architecture, decisions and roadmaps
.github/       Verification and Pages workflows
```

[Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) runs on pushes to `main`
and may be started manually. It builds and deploys only `dist/`. Pages uses GitHub
Actions as its source; Vite's relative base resolves assets beneath `/Idle-Game/`.
A deployment badge is not a gameplay or accessibility certification. Publication
requires the user's instruction; an analysis PR does not authorize deployment.

</details>

## Project documentation

| Document | Purpose |
| --- | --- |
| [Development rules](AGENTS.md) | Scope, conventions and safe handoffs. |
| [Architecture](docs/ARCHITECTURE.md) | Domain/UI boundaries, runtime and save contracts; numbered phase records retain their historical meaning. |
| [Current balance](docs/BALANCING.md) | Implemented formulas and values. |
| [Operations experiment](docs/OPERATIONS_BALANCE.md) | Proposed reward/pacing decision, assumptions and limitations. |
| [Art direction](docs/ART_DIRECTION.md) | Solara identity and approved reference workflow. |
| [Current roadmap](docs/ROADMAP.md) | Active scope, released work and stopping conditions. |
| [Future priorities](docs/POST_ROADMAP.md) | Separately scoped directions and retained plans. |
| [Workshop release](docs/WORKSHOP_INSIGHT.md) | IV-D / purchase-insight release and verification evidence. |

Found something broken? [Open an issue](https://github.com/TLSnipZ/Idle-Game/issues)
with reproduction steps and browser/device details. Do not post backup codes publicly
unless you intend to share that progress.

---

<div align="center">

**Your empire starts at the waterfront.**

### [PLAY SOLARA CITY →](https://tlsnipz.github.io/Idle-Game/)

</div>
