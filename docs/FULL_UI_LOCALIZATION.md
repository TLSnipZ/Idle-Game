# Full UI Localization & Solara Voice Pass

## Status

Implementation complete on the feature branch; CI / deployment and manual live acceptance are required before the pass is marked live-verified.

This pass is intentionally scheduled before Global HUD 2.0 / Activity Center. No work from that later phase is included here.

## Why this pass exists

The Settings & Localization Foundation and first Voice Pass established locale selection, the global shell and the Solara writing contract, but a repository-wide audit found that most gameplay surfaces still contained hard-coded English copy or English-only presentation helpers.

The full pass closes that gap instead of carrying mixed-language UI into later systems.

## Covered surfaces

- Global shell, navigation, HUD, XP, Heat tier and activity indicators
- Global feedback, runtime failures, purchase/action feedback and save status
- Overview command center
- Next Objective / Guidance, including goal selection and accessibility copy
- Operations navigation and Jobs
- Businesses, requirements, modifier breakdowns and upgrade states
- Delivery Dispatcher and Business Auto-Upgrader
- City, Territories, Heat / Lay Low
- Crew roster, assignments, effects and command feedback
- City Events, localized situations, choices, effects and outcomes
- Garage / Collection and vehicle content
- Rebirth readiness, confirmation and keep/lose policy
- Permanent Skills and purchase feedback
- Achievements and Lifetime Statistics
- Save export/import/validation feedback
- New Game / Reset Progress destructive confirmation
- Offline Return summaries and level-up copy
- Catalog-backed Business, Vehicle, Territory, Crew, Upgrade, Automation, Skill, Achievement and Event flavor text

## Architecture

The active language remains presentation-only. Save v17, CE1, GameState, economy, balance, requirements, content IDs and runtime authority are unchanged.

`LocalizationProvider` supplies the active locale through the presentation tree. Stable shell strings continue to use typed keys in `localization.ts`. Catalog-backed flavor copy is centralized in `content-localization.ts` and addressed by stable content IDs so gameplay definitions do not fork by language. Presentation helpers accept an optional locale and keep English as their default for isolated tests and compatibility.

Runtime action feedback uses an in-memory presentation-locale reference only. It is neither persisted nor used by gameplay logic.

## Voice contract

Both locales use original Solara City satire: criminal capitalism, nightlife swagger, municipal nonsense, lawyers, accountants and questionable business decisions. German is adapted naturally rather than translated word-for-word. No Rockstar/GTA dialogue or protected wording is copied.

Gameplay-critical information remains explicit before humor: prices, XP, EP, Heat, timers, requirements, effects, irreversible actions and failure causes stay readable and authoritative.

## Acceptance gate

Before this pass is considered live-complete:

1. Typecheck and production build must pass.
2. Existing gameplay / migration / save / runtime tests must remain green.
3. English must remain complete and coherent.
4. With German selected, no ordinary English UI sentences should remain outside intentional proper names, established terms or language-neutral values.
5. Check Overview, Operations, City, Collection and Empire on the deployed build.
6. Exercise at least one success and one failure feedback path, an Event choice, Crew assignment, Save import validation, Rebirth review and Reset review in German.
7. Confirm language switching changes presentation only and does not alter the save.

## Handoff

Only after this pass is merged, deployed and visually accepted does the roadmap continue with **Global HUD 2.0 / Activity Center**.