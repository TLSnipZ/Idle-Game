# Roadmap

Each phase is an independent scope proposal requiring a new user task. Split large
phases into one system or vertical slice per session. Do not begin Phase 1 during
foundation work. Roadmap order may change explicitly; it is not authorization.

| Phase | Scope | Acceptance gate |
| --- | --- | --- |
| 0 — Foundation | React/TS/Vite, empty shell, boundaries, development/design docs | Strict build succeeds; no gameplay; local commit and handoff |
| 1A — Core economy (complete) | Exact cash, minimal GameState, safe transactions, one earning action and domain tests | Strict checks and behavioral tests pass; immutable deterministic transitions |
| 1B — First business slice (complete) | Dockside Detail definition, ownership, atomic purchase and minimal UI | Purchase invariants and exact cross-slice transitions tested |
| 1C.1 — Production math (complete) | Exact elapsed production, pooled fractional accrual and pure simulation tests | Step-size independence, atomic overflow and corruption handling |
| 1C.2 — Runtime ticking (deferred) | Drive the pure simulation with a browser runtime adapter when requested | One elapsed-time path; scheduling/clock policy tested separately |
| 2 — Durable progress | Versioned local saves, validated import/export and migrations | Reload/round trip; corruption/newer versions preserve state; storage errors visible |
| 3 — Production | Passive income, business levels, shared clock, offline catch-up | Deterministic time integration, capped offline rewards applied once |
| 4 — Upgrades and modifiers | Scoped/global upgrades, central stat evaluation, initial delegation | Stacking/affordability tests; bonuses explained; active/automated actions agree |
| 5 — Collection | Cars, garage, collections and set bonuses | Ownership/collection rules tested; assets remain replaceable |
| 6 — Permanent progression | Rebirth, reset policy, multiple skill trees, unlocks | Explicit retention matrix, atomic reset, prerequisite/cycle validation |
| 7 — City systems | Territories, heat, crew, random events, one at a time | Each uses public contracts, deterministic inputs and compatible saves |
| 8 — Long-term progression | Achievements, statistics expansion and late-game automation | One-time rewards, consistent commands, no runaway scheduling |
| 9 — Polish and release | Art, accessibility, responsive UI, balance and Pages deployment | Asset provenance, full progression checks, supported save migrations |

## Current status

Phases 0, 1A, 1B and 1C.1 are complete. Cash, starter delivery, business purchase
and pure deterministic production simulation exist. Cash/remainder simulation is
atomic and exact. The browser does not call simulation; no timers, runtime clock,
modifiers, saves, offline rewards or automation exist. No deployment is configured.

## Next session

1. Read AGENTS.md, inspect Git status and the architecture/balance contracts.
2. Restore/install with `npm ci`; run `npm run typecheck`, `npm run test`, and
   `npm run build`. Review remote status before integrating commits.
3. Wait for an explicit Phase 1C.2 task. Reuse `simulateElapsed(state, elapsedMs)`;
   do not recreate production math in React. Define runtime clock precision,
   command-boundary reconciliation and scheduling/error policy before adding timers.
4. Preserve `purchaseBusiness` as the paid ownership command and the economy's safe
   cash APIs. Saves, offline progression and automation remain separate scope unless
   explicitly authorized. The later production roadmap row is broader follow-on work,
   not permission to include levels or offline rewards in Phase 1C.2.

Before rebirth, explicitly decide the permanence of every owned item and currency.
Before offline progression, define simulation/clock/cap semantics. Before saves,
define v1 schema and validation; every later save-shape change needs migration
consideration. These are phase-specific decisions, not requests to implement now.
