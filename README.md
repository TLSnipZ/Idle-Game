<div align="center">

# SOLARA CITY

**Build the business. Own the streets. Take the city.**

A coastal crime-empire idle / tycoon game about street hustles, neon nights and building something that lasts.

<a href="https://tlsnipz.github.io/Idle-Game/">
  <img src="https://img.shields.io/badge/PLAY_SOLARA_CITY-78e4dc?style=for-the-badge" alt="Play Solara City in your browser" height="36" />
</a>

**[Play in your browser](https://tlsnipz.github.io/Idle-Game/)** · [What's in the game](#in-the-game-today) · [What's next](#whats-next) · [Developer guide](#development)

![Browser game](https://img.shields.io/badge/Browser_game-111c2e?style=flat-square)
![In development](https://img.shields.io/badge/Status-In_development-f2ca87?style=flat-square)
[![GitHub Pages deployment](https://github.com/TLSnipZ/Idle-Game/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/TLSnipZ/Idle-Game/actions/workflows/deploy-pages.yml)

<a href="https://tlsnipz.github.io/Idle-Game/">
  <img src="src/assets/vehicles/kairo-kx-r.webp" alt="The pearl-white Kairo KX-R in Solara City's neon-lit waterfront garage" width="860" />
</a>

*The Kairo KX-R — approved vehicle artwork used in the game, not a gameplay screenshot.*

**Single-player · Browser-first · No account required**

</div>



## Current phase — Garage IV-C: Rendan and Canto Club

Implemented with user-approved model artwork: Rendan ($115,000, Player 12 /
Afterdark 3, +18% manual and Dispatcher Cash) and Canto Club ($165,000, Player 14 /
Afterdark 5, +18% Business Production and +12% Dispatcher Cash). Only the active
car contributes; both remain factory-only. Save v25 / CE1 preserves prior progress.
See [Rendan/Canto](docs/RENDAN_CANTO.md) for approval, migration and verification scope.
Release evidence belongs in the PR. IV-D customization remains a separate phase.

## UI correction — approved district artwork

The user rejected storefront imagery in Economy and Districts after PR #46.
Economy is now text/value-led. Waterfront and Neon Mile have separate generated
district-wide images, displayed uncropped at their original ratio. The user
approved both images with “Ja passt” on 2026-09-14. Release evidence is in PR #47. See
[District artwork](docs/DISTRICT_ARTWORK.md) for provenance, review and verification.
Save v24 / CE1 and gameplay are unchanged.


## Current phase — Design & UX 2.0, remaining workspaces

Overview now prioritizes income and progression with approved storefront art.
City has separate Districts/Heat, Crew and Events views; Empire has separate
Rebirth, Skills, Achievements, Statistics and Save/Transfer views. Pending forms
survive tab changes; global shortcuts reveal their intended panel before focus.
See [Design & UX 2.0](docs/DESIGN_UX_2.md) for scope and verification. Save v24 / CE1,
artwork masters and gameplay are unchanged. PR evidence owns release status.
The user accepted the first slice (PR #45); this completes the remaining planned
page composition. Rendan/Canto remains the next separate content phase.

## Current phase — Design & UX 2.0, first slice

Shared visual hierarchy and the Operations Business portfolio are implemented:
real Jobs/Businesses/Equipment/Automation views, compact storefront selection and
one focused detail with mobile Back navigation. Guidance reveals hidden targets.
See [Design & UX 2.0](docs/DESIGN_UX_2.md) for scope, verification and the remaining whole-game
sequence. Save v24 / CE1 and gameplay are unchanged. Release evidence is in the PR.
This user-prioritized redesign precedes IV-C Rendan/Canto.

## Current phase — Garage and workshop UX

Implemented: separate Garage/Workshop views, compact vehicle selection, ownership
filters, price/name sorting, a focused detail view and shared workshop selection.
Tuning and Paint are separate services; paint drafts survive their tab changes.
Save v24 / CE1 and all gameplay contracts are unchanged. See [Garage workspace](docs/GARAGE_WORKSPACE.md)
for interaction and release checks. This user-requested UX interlude comes before
IV-C Rendan/Canto; those cars are not part of this update.

## Current phase — Garage IV-B: Serein pilot

Implemented: Namera Serein, $80,000, Player Level 10 and owned Afterdark Customs,
+26% active manual delivery Cash, Save v24 / CE1 and localized factory-only controls.
The approved PNG is retained unchanged; the runtime uses its optimized WebP derivative.
See [Serein pilot](docs/SEREIN_PILOT.md) for artwork provenance and release verification.
Release status and CI/deployment evidence are tracked in PR #43.
Next separate scope: IV-C Rendan/Canto; no additional cars or customization ship here.

## Current phase — Garage IV-A: Tier-2 catalog/progression analysis

Completed the isolated comparison of proposed Tier-2 cars against today's stock
and tuned Tier-1 choices. Serein, Rendan and Canto Club now have revised proposed
roles and Afterdark-based gates; see [Tier-2 decision](docs/TIER_TWO_GARAGE.md) for numbers,
opportunity costs, eight executable analysis cases and implementation acceptance.
This checkpoint adds no playable cars and keeps Save v23 / CE1 unchanged.
Next bounded phase: **IV-B — Serein model reference and production pilot**;
then IV-C Rendan/Canto and IV-D model-specific customization.
The user deferred remaining paint imperfections; PR #41 is not full visual acceptance.

## Current phase — Garage 2.0 III: curated vehicle finishes

Implemented: two signature finishes plus factory paint for each current car,
explicit preview/apply/discard, free owned-vehicle customization and matching
Garage presentation. Save **v23 / CE1** preserves prior tuning and progress;
applied looks survive Rebirth. See [Vehicle finishes](docs/VEHICLE_APPEARANCE.md)
for rendering, persistence and verification boundaries. Release evidence is in the PR.
Next separate scope: later vehicle tiers, starting with catalog/progression analysis.

## Latest UI update

KX-R paint coverage and rear-lamp isolation have been corrected. Existing looks
and saves are retained; see the [paint-studio notes](docs/VEHICLE_APPEARANCE.md).

A responsive dashboard, quick access menus for each feature area, direct Event/Crew
links and a slimmer fixed HUD make the existing game easier to navigate. See the
[layout review](docs/LAYOUT_REVIEW.md). Gameplay and Save v21 / CE1 are unchanged.

## Previous phase — Garage 2.0 I: KX-R tuning

Implemented in [PR #35](https://github.com/TLSnipZ/Idle-Game/pull/35): permanent Fleet gearing / Courier ECU, one fitted setup, free stock/owned switching and durable Garage writes. Save **v21 / CE1** migrates existing stock garages without granting parts. See [Tuning pilot](docs/GARAGE_TUNING.md) for prices, balance, persistence and verification scope.

This completes the first tuning pilot only. Next separate scope: model-specific Senda/Lilt tuning after reviewing this slice; visual customization and later vehicle tiers remain planned. Release evidence is tracked in the PR; user live acceptance remains separate.

## Previous phase — Heat V: Support network

Implemented: local Level-10 Business cover, assigned Mara and active Lilt reduce
the MANHUNT decoy cost through exact shared modifiers, down to **$810**.
Save **v20 / CE1 unchanged**. See [Heat support](docs/HEAT_SUPPORT.md). Verification passed; see [PR #33](https://github.com/TLSnipZ/Idle-Game/pull/33).
The retained Heat / Police 2.0 **I–V sequence is complete** at this scope.
Further post-roadmap expansions require their own scope. Older records below are historical.

## Previous phase — Heat IV: MANHUNT

Implemented: local roadblocks from 80 Heat and a voluntary $1,250 / −30 Heat
decoy, with durable payment and free recovery paths. Save **v20 / CE1 unchanged**.
See [MANHUNT](docs/MANHUNT.md) for balance, persistence and acceptance. Verification passed; see [PR #32](https://github.com/TLSnipZ/Idle-Game/pull/32).
Next separate phase: **Heat V — deeper cross-system integration**.
Earlier phase records below are historical.

## Previous phase — Heat III: District Heat

Implemented: separate Waterfront/Neon Heat, durable owned-district travel,
local manual actions/events and Waterfront Dispatcher. Save **v20**, CE1 unchanged.
See [District Heat](docs/DISTRICT_HEAT.md) for rules and compatibility. Verification passed; see the [PR #31 evidence](https://github.com/TLSnipZ/Idle-Game/pull/31).
Next separate scope: **Heat IV — MANHUNT**. Earlier phase records below are historical.


---

## Start small. Build an empire.

Your first operation is a waterfront detailing business. Your next move might be a quiet cash front, a performance workshop, or a nightclub on Neon Mile.

Run deliveries for immediate Cash, build passive income, recruit specialists and decide when to reinvest. Manage Heat, make choices in City Events, and eventually **Rebirth**: trade the current run for permanent Empire Points and a stronger comeback.

**HUSTLE → BUILD → EXPAND → REBIRTH → REBUILD STRONGER**

Open **Operations** to make your first deliveries and acquire **Dockside Detail**. From there, the Business ladder grows with you:

**Dockside Detail → Neon Laundry → Afterdark Customs → Solara Nights**

## In the game today

| System | What you can do |
| --- | --- |
| **Business empire** | Acquire four distinct Businesses, develop each through Level 100, and grow their combined passive production. Progression gates make later acquisitions depend on developing the earlier operation. |
| **Equipment & automation** | Buy production and delivery upgrades, hire a **Delivery Dispatcher**, and enable a **Business Auto-Upgrader** for one selected owned Business. Automatic upgrade spending is opt-in. |
| **City & crew** | Start in **Waterfront**, take control of **Neon Mile**, switch your operating district with separate local Heat, and recruit **Rico Vale, Mara Knox and Jax Mercer**. Assign specialists to Operations or Logistics to activate their effects. |
| **Heat & City Events** | Choose an optional +50% Cash (+25% at WATCHED) / +5 Heat delivery below HOT, cool down with discreet deliveries (half Cash, zero XP, −2 Heat), and use Lay Low. **Hot Tip, Shakedown and Warehouse Opportunity** offer two clearly explained choices each during online play. |
| **Rebirth & Empire Points** | Reset temporary run progress for Empire Points. Invest in **five permanent ranked skills** and keep your purchased vehicle through Rebirth. |
| **Garage** | Choose **Kairo KX-R**, **Kairo Senda** or **Namera Lilt** for production, manual delivery Cash or faster Heat cooling. Only the active car supplies its effect. |
| **Achievements & statistics** | Unlock **six permanent achievements** and track **eight lifetime statistics** across runs. These record progress without adding gameplay bonuses. |
| **Next Objective** | Follow a suggested progression step with exact Level/Cash requirements, or choose an optional goal. Jump to the relevant card from any section; guidance never purchases or resets anything. |
| **Offline progress & backups** | Return to credited Business and Dispatcher earnings for up to **8 hours**, extendable to **12 hours** through Never Sleeps. Save locally and transfer progress with **CE1 export/import codes**. |

The interface has five sections: **Overview** for your dashboard, **Operations** for earning and automation, **City** for territories, Heat, crew and events, **Collection** for the Garage, and **Empire** for Rebirth, skills, milestones and save transfer. Operations also has **Jobs / Businesses / Automation** jump navigation. **Next Objective** is shared across all five sections; its optional goal selection is not saved. See [Guidance](docs/GUIDANCE.md) for its suggested-route policy.

## Your first permanent garage investment

**Kairo KX-R** is Solara's lightweight, 1990s-inspired performance hatch. Build the Business portfolio now; keep the car when you start your next run.

| Purchase | Requirements | Ownership bonus |
| --- | --- | --- |
| **$25,000** | Player Level 5 · Dockside Detail Level 5 | **+10% global Business Production**, including offline and after Rebirth |

The Garage has **three purchasable vehicles**. Senda costs $40,000 at Player 6 / Dockside 7 and gives +12% manual Job Cash. Lilt costs $55,000 at Player 7 / Dockside 8 and reduces the Heat cooling interval by 3 seconds (57s, or 42s with assigned Mara). The first purchase activates automatically, and only the active vehicle supplies its bonus. Ownership and selection survive Rebirth. All three vehicles have individual approved-model artwork. All three cars now offer two permanent setups each in the Collection workshop. The paint studio offers two signature finishes plus factory paint per car, with free permanent selection. Later models remain planned. See the [Tier-1 notes](docs/TIER_ONE_GARAGE.md).

## Development status

**Playable development build — still growing, not a finished release.**

This build includes the Base Game foundation and **POST 3D: Business Progression Gates & Shared Requirement Polish**, followed by a **safe New Game / Reset Progress** flow and **Next Objective / Guidance**. This build includes **Tier-1 Garage**; [PR #27](https://github.com/TLSnipZ/Idle-Game/pull/27) records verification and release evidence. Current saves use **schema v23**; portable backups retain the **CE1** format. Supported older saves migrate through the existing sequential migration chain.

The [Base Game roadmap](docs/ROADMAP.md) records the original development phases. [Post-roadmap priorities](docs/POST_ROADMAP.md) track subsequent expansions and the next planned work. Implementation status and browser/live acceptance are recorded separately; a completed code milestone is not a claim that every device has been visually tested.

## What's next?

Current implementation and planned follow-ons are distinguished below. Scope and order may evolve as the game is tested.

| Direction | Planned additions |
| --- | --- |
| **A clearer, more comfortable game** | English, Deutsch and pure Villager gibberish are implemented. The whole-game audit and P1 regression repairs are complete. Follow-up UX polish brings jobs forward and explains local save status. |
| **Global HUD & activity** | Global HUD 2.0 and Activity Center are implemented, with Cash, Level/XP, Heat, EP and City Event access. Mobile stats wrap, events come first and latest feedback expands on demand. |
| **A stronger Solara identity** | Logo, favicon and all four Business storefronts are integrated; richer city presentation remains planned. |
| **A growing Garage** | Tier-1 Kairo Senda / Namera Lilt add specialized active effects; their model artwork is integrated. Performance tuning for all three current models is implemented; curated paint customization is implemented, and later catalog tiers remain planned. |
| **A deeper city** | Heat I Risk & Reward, II Police Pressure and III District Heat are implemented. IV MANHUNT adds local roadblocks and paid decoys. V adds Business/Crew/active-car support for decoy costs; more Business depth, crew and event development, and richer territory progression remain planned. |

The longer-term vision connects Businesses, cars, crew and city control through rival factions, Operations, Heists and Territory takeovers. New content should strengthen existing systems rather than become an isolated menu.

See [current priorities](docs/POST_ROADMAP.md), the [Business expansion design](docs/BUSINESS_EXPANSION.md) and the [vehicle catalog](docs/VEHICLE_CATALOG.md) for the detailed plans.

## Keep your progress safe

Progress is stored **locally in your browser**. There are **no cloud saves or account synchronization**. Clearing site data, changing browser or moving to another device does not carry your save with you automatically.

Before clearing browser data or switching devices, use **Empire → Save & Transfer → Export save** and keep a copy of the `CE1-` code. Import validates the code and asks for confirmation before replacing current progress.

<details>
<summary><strong>Save, offline and import details</strong></summary>

- The game saves after supported successful actions and periodically every five seconds. Watch for storage errors; do not assume a failed save was stored.
- Business production and the Delivery Dispatcher use the same capped offline interval. An enabled Auto-Upgrader can spend Cash on its selected owned Business during that interval.
- City Events do **not** advance or spawn offline. A pending event is retained through normal save/load and export/import.
- Importing an old code does not award income or XP from its historical timestamp. Offline timing starts from the new local import timestamp.
- Corrupt or unsupported newer saves are preserved rather than silently replaced. Read the in-game warning before confirming any replacement.
- CE1 codes are portable backup data, **not encrypted secrets**. They should not be treated as account credentials.

Rebirth is **not** a full New Game reset: it keeps the permanent progression listed in the in-game review. Always read the Keep/Lose summary before confirming.

For a complete restart, open **Empire → Save & Transfer → New Game / Reset Progress**. Export and copy a backup first. Review the warning, type `RESET`, and explicitly confirm. This erases **all run and permanent progress**, including vehicles, EP, skills, achievements and statistics, without awarding EP. The new game is published only after saving succeeds; corrupt, newer or conflicting saves are not silently overwritten. See the [New Game safety contract](docs/RESET_PROGRESS.md).

</details>

## Development

Built with **React, strict TypeScript, Vite, Vitest and modern CSS**. Gameplay rules are separated from rendering, with exact Money arithmetic, deterministic elapsed-time simulation, versioned saves and sequential migrations. The browser build is client-side; no backend or account service is required.

Use **Node.js 24**, as pinned in [`.nvmrc`](.nvmrc). The package requires Node.js 22.12 or newer.

```sh
git clone https://github.com/TLSnipZ/Idle-Game.git
cd Idle-Game
npm ci
npm run dev
```

### Checks and production preview

```sh
npm run typecheck
npm run test
npm run build
npm run preview
```

`build` includes the TypeScript check and emits the static application to `dist/`. Automated coverage includes economy rules, purchase failures, save migrations, CE1, offline chronology, automation, Rebirth and UI interactions. Browser, keyboard and responsive reviews complement those tests; they are not interchangeable.

<details>
<summary><strong>Project structure</strong></summary>

```text
src/
  app/        Application composition, sections and navigation
  features/   Feature configuration, domain rules and presentation
  game/       Shared state contracts and cross-feature integration
  platform/   Browser clock, storage and runtime adapters
  shared/     Reusable UI and utilities
  assets/     Approved reference artwork and production assets
  styles/     Global styles and presentation tokens
docs/         Architecture, balance, art direction and roadmaps
.github/
  workflows/  GitHub Pages build and deployment
```

</details>

<details>
<summary><strong>GitHub Pages deployment</strong></summary>

The existing [Deploy to GitHub Pages workflow](.github/workflows/deploy-pages.yml) runs on pushes to `main` and can also be started manually from Actions. It installs dependencies, runs the checked production build and deploys **only `dist/`**.

For this repository, **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**. The application uses Vite's relative base so built assets resolve beneath `/Idle-Game/`.

The deployment badge above reports the workflow status. It is not a live gameplay or accessibility certification.

</details>

## Project documentation

| Document | Purpose |
| --- | --- |
| [Development rules](AGENTS.md) | Scope, conventions, architecture boundaries and safe handoffs. |
| [Architecture](docs/ARCHITECTURE.md) | Domain/UI separation, runtime, state, persistence and migrations. |
| [Current balance](docs/BALANCING.md) | Implemented prices, requirements, effects and formulas. |
| [Business expansion](docs/BUSINESS_EXPANSION.md) | The four-Business economy, model assumptions and progression rationale. |
| [Vehicle catalog](docs/VEHICLE_CATALOG.md) | Implemented vehicle identity and future Garage planning. |
| [Art direction](docs/ART_DIRECTION.md) | Solara's visual language and approved reference-asset workflow. |
| [Base Game roadmap](docs/ROADMAP.md) | Original phase history, kept separate from expansion priorities. |
| [Post-roadmap priorities](docs/POST_ROADMAP.md) | Current expansion status, next steps and deferred systems. |
| [Release audit](docs/BASE_GAME_RELEASE.md) | Base Game verification evidence and review limitations. |

Found something broken? [Open an issue](https://github.com/TLSnipZ/Idle-Game/issues) with the steps to reproduce, your browser/device and a screenshot when useful. Avoid posting backup codes publicly unless you intend to share your saved progress.

---

<div align="center">

**Your empire starts at the waterfront.**

### [PLAY SOLARA CITY →](https://tlsnipz.github.io/Idle-Game/)

</div>
