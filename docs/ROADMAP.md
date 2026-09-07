# Roadmap

Each phase is an independent scope proposal requiring a new user task. Split large
phases into one system or vertical slice per session. Do not begin Phase 1 during
foundation work. Roadmap order may change explicitly; it is not authorization.

| Phase | Scope | Acceptance gate |
| --- | --- | --- |
| 0 — Foundation | React/TS/Vite, empty shell, boundaries, development/design docs | Strict build succeeds; no gameplay; local commit and handoff |
| 1 — Small economic slice | Decide numeric policy; one active earning interaction and business purchase | Pure tested transitions, atomic spending, no negative/invalid funds |
| 2 — Durable progress | Versioned local saves, validated import/export and migrations | Reload/round trip; corruption/newer versions preserve state; storage errors visible |
| 3 — Production | Passive income, business levels, shared clock, offline catch-up | Deterministic time integration, capped offline rewards applied once |
| 4 — Upgrades and modifiers | Scoped/global upgrades, central stat evaluation, initial delegation | Stacking/affordability tests; bonuses explained; active/automated actions agree |
| 5 — Collection | Cars, garage, collections and set bonuses | Ownership/collection rules tested; assets remain replaceable |
| 6 — Permanent progression | Rebirth, reset policy, multiple skill trees, unlocks | Explicit retention matrix, atomic reset, prerequisite/cycle validation |
| 7 — City systems | Territories, heat, crew, random events, one at a time | Each uses public contracts, deterministic inputs and compatible saves |
| 8 — Long-term progression | Achievements, statistics expansion and late-game automation | One-time rewards, consistent commands, no runaway scheduling |
| 9 — Polish and release | Art, accessibility, responsive UI, balance and Pages deployment | Asset provenance, full progression checks, supported save migrations |

## Current status

Phase 0 implementation is complete. App shell and documentation only. No runtime
state, income, purchase flow, modifiers, saves, offline rewards, cars or other game
systems are implemented. No remote or deployment is configured.

## Next session

1. Read AGENTS.md, inspect Git status and the architecture/design documents.
2. If restoring the ZIP, clone the included Git bundle as described in README.
3. Resolve repository URL/access before integrating with existing GitHub history.
4. Wait for a Phase 1 request; agree on its smallest playable slice and numeric policy.
5. Add only the domain contracts and tests needed by that slice.

Before rebirth, explicitly decide the permanence of every owned item and currency.
Before offline progression, define simulation/clock/cap semantics. Before saves,
define v1 schema and validation; every later save-shape change needs migration
consideration. These are phase-specific decisions, not requests to implement now.
