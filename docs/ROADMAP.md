# Roadmap

Each phase is an independent scope proposal requiring a new user task. Split large
phases into one system or vertical slice per session. Do not begin Phase 1 during
foundation work. Roadmap order may change explicitly; it is not authorization.

| Phase | Scope | Acceptance gate |
| --- | --- | --- |
| 0 — Foundation | React/TS/Vite, empty shell, boundaries, development/design docs | Strict build succeeds; no gameplay; local commit and handoff |
| 1A — Core economy (complete) | Exact cash, minimal GameState, safe transactions, one earning action and domain tests | Strict checks and behavioral tests pass; immutable deterministic transitions |
| 1B — First business slice (deferred) | First business definition and purchase using existing spend contracts | Separate request; atomic ownership/cash change and purchase invariants |
| 2 — Durable progress | Versioned local saves, validated import/export and migrations | Reload/round trip; corruption/newer versions preserve state; storage errors visible |
| 3 — Production | Passive income, business levels, shared clock, offline catch-up | Deterministic time integration, capped offline rewards applied once |
| 4 — Upgrades and modifiers | Scoped/global upgrades, central stat evaluation, initial delegation | Stacking/affordability tests; bonuses explained; active/automated actions agree |
| 5 — Collection | Cars, garage, collections and set bonuses | Ownership/collection rules tested; assets remain replaceable |
| 6 — Permanent progression | Rebirth, reset policy, multiple skill trees, unlocks | Explicit retention matrix, atomic reset, prerequisite/cycle validation |
| 7 — City systems | Territories, heat, crew, random events, one at a time | Each uses public contracts, deterministic inputs and compatible saves |
| 8 — Long-term progression | Achievements, statistics expansion and late-game automation | One-time rewards, consistent commands, no runaway scheduling |
| 9 — Polish and release | Art, accessibility, responsive UI, balance and Pages deployment | Asset provenance, full progression checks, supported save migrations |

## Current status

Phase 0 and Phase 1A are complete. Cash and one active delivery action exist.
No business, production, timers, modifiers, save/load, offline rewards, or other
future feature has been implemented. No deployment is configured.

## Next session

1. Read AGENTS.md, inspect Git status and the architecture/balance contracts.
2. Restore/install with `npm ci`; run `npm run typecheck`, `npm run test`, and
   `npm run build`. Review remote status before integrating commits.
3. Wait for an explicit Phase 1B task. Its first business may consume `spendCash`;
   do not mutate cash directly or add systems simply because they appear here.
4. Decide business data and atomic purchase semantics in that task. Passive income,
   timers and persistence remain separate future scope unless explicitly authorized.

Before rebirth, explicitly decide the permanence of every owned item and currency.
Before offline progression, define simulation/clock/cap semantics. Before saves,
define v1 schema and validation; every later save-shape change needs migration
consideration. These are phase-specific decisions, not requests to implement now.
