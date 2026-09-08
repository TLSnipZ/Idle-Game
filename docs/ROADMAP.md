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
| 1C.2 — Runtime ticking (complete) | Monotonic browser clock, command boundaries and live production | Deterministic timing, fractional carry, cleanup and terminal failure tests |
| 1C.3 — UI feedback/polish (complete) | Premium cash/delivery/business presentation, live status and accessible feedback | Targeted presentation tests; runtime/domain contracts unchanged |
| 1C.4 — GitHub Pages configuration (complete; user verified) | Official Actions workflow builds and deploys `dist` from `main` | Live Phase 2A persistence, reload and autosave manually verified by the user |
| 2A — Versioned local saves (complete) | Validated v1 localStorage envelope, safe bootstrap and autosave | Exact reload without offline credit; corrupt/newer saves protected; storage/lifecycle tests |
| 2B — Save export/import codes (complete) | Portable codes through shared validation and migration boundary | Confirmed atomic replacement, bounded UTF-8 Base64URL and deterministic failure tests |
| 3A — Offline progression (complete) | Eight-hour bounded bootstrap through shared simulation | Exact remainder, atomic persistence and one-time consumption tests |
| 3B — Business levels (complete) | Normalized levels, exact quadratic costs and linear production | v1→v2 migration, atomic upgrades, runtime boundaries and offline/save regression tests |
| 4A — Central modifiers and first upgrade (complete) | Exact scoped stat evaluation, one purchased equipment bonus, v3 saves | Stacking/precision, atomic purchases, migration, runtime and offline regressions |
| 4B — Multi-upgrade catalog (complete) | Five scoped/global production and job upgrades | Exact flat-before-percent stacking, v3 compatibility |
| 4C — Starter-job delegation (complete) | One Delivery Dispatcher, 10-second cycle, v4 migration | Exact shared online/offline elapsed transaction, atomic failures and persistence |
| 5A — Player XP and levels (complete) | Exact XP, three reward sources, derived levels 1–100, v5 migration | Atomic cash/XP, shared offline dispatcher XP, threshold and persistence tests |
| 5B — Central unlock requirements (complete) | Typed AND lists, selected acquisition gates and shared presentation | Exact boundaries, atomic failures, grandfathered saves and deadlock protection |
| 5C — Vehicle collection foundation (complete) | One collectible, Garage, central requirements/modifier source, v6 migration | Atomic acquisition, exact stacking, save/runtime/offline and presentation tests |
| Future — Collection expansion | Additional cars, final art, collections and set bonuses | Separately scoped; stable IDs and replaceable assets |
| 6A — Rebirth foundation (complete; user verified live) | Rebirth, EP/count, permanent garage, v7 migration | Explicit retention matrix, atomic reset, prerequisite/cycle validation |
| 6B — Permanent skill foundation (implementation complete; live pending) | One Empire Foundations tree, five skills, EP spending, v8 migration | Exact effects/XP flooring, permanent retention, shared derived cap |
| 7 — City systems | Territories, heat, crew, random events, one at a time | Each uses public contracts, deterministic inputs and compatible saves |
| 8 — Long-term progression | Achievements, statistics expansion and late-game automation | One-time rewards, consistent commands, no runaway scheduling |
| 9 — Polish and release | Art, accessibility, responsive UI, balance and Pages deployment | Asset provenance, full progression checks, supported save migrations |

## Current status

Phases 0, 1A, 1B, 1C.1 and 1C.2 are complete. Cash, starter delivery, business
purchase and deterministic production simulation are connected to a 250 ms browser
scheduler using monotonic elapsed time. Commands reconcile before acting; fractional
time, lifecycle cleanup and safe failure suspension are tested. Phase 4A adds one scoped equipment modifier; Phase 4C adds one starter-job dispatcher. Phase 3A offline rewards are implemented. Phase 2A local saves are implemented. GitHub Pages deployment configuration is implemented in Phase 1C.4.
Phase 1C.3 presentation polish is complete: responsive cards, configured production
rates, acquisition readiness, action announcements and terminal error presentation.
Browser visual verification was blocked by the available browser rejecting the local
preview address; narrow-width CSS constraints and server-rendered state presentation
were checked.

Phase 1C.4 repository-side implementation is complete: the Pages workflow reads
Node 24 from `.nvmrc`, runs the normal checked build, uploads only `dist`, and
serializes deployments to the `github-pages` environment. Vite's relative base
is unchanged. The user manually verified the live Phase 2A build: cash, ownership
and autosave survive reload, with no offline income. This is user-reported live
verification, not a new browser deployment check performed during Phase 2B.

Phase 2A is complete: local state is saved after successful meaningful commands and
every five seconds. Validated reload restores cash, ownership and production
milli-cent remainder without offline income. Corrupt/newer saves and read failures
block automatic writes for the fresh session. Phase 2B is complete: CE1- codes reuse
the v1 envelope; validated imports require confirmation and a successful durable
write before live replacement. Clipboard failure leaves a manually copyable code.
Phase 3A is complete: valid local saves earn bounded offline production, durably
recorded before live startup. Failed offline transactions preserve the old save
and pause the session. Imported historical timestamps still award no income.
Phase 3B is complete: purchases start at level 1, with paid upgrades through level
100. Existing v1 saves migrate without changing cash, savedAt or earned remainder.
No additional businesses are implemented. Phase 4A adds exactly one equipment upgrade,
central exact production/job evaluation and v2→v3 migration. Phase 4B is complete: five upgrades exercise scoped/global production and flat/percentage job rewards. Phase 4C is complete: one dispatcher, exact cycle progress and v4 migration. Phase 5A is complete: exact player XP, derived levels, three atomic reward sources and v4→v5 migration. Phase 5B is complete: central acquisition-only requirements, current-content gates and grandfathering without a schema bump. The next phase remains deferred.

## Next session

1. Read AGENTS.md, inspect Git status and the architecture/balance contracts.
2. Restore/install with `npm ci`; run `npm run typecheck`, `npm run test`, and
   `npm run build`. Review remote status before integrating commits.
3. Preserve the verified Pages configuration; keep `simulateElapsed(state, elapsedMs)` as the only production path and route
   commands through runtime reconciliation. Do not add new timers in UI components.
4. Preserve `purchaseBusiness` as the paid ownership command and the economy's safe
   cash APIs, shared save-schema/import transaction boundaries, and offline
   write-before-publication semantics. Further progression and automation remain separate scope unless
   explicitly authorized. The later production roadmap row is broader follow-on work,
   not permission to include levels or offline rewards in Phase 1C.2.

Before rebirth, explicitly decide the permanence of every owned item and currency.
Before offline progression, define simulation/clock/cap semantics. Before saves,
define v1 schema and validation; every later save-shape change needs migration
consideration. These are phase-specific decisions, not requests to implement now.

The user manually verified the live Phase 3A offline income and welcome-back UI
after a hard refresh. The user also manually verified Phase 3B save migration,
levels/costs/scaled production, reload, offline income and export/import with levels.
The user manually verified Phase 4A purchases, +25% production, reload, offline production and export/import in the working live build. The user manually verified Phase 4B’s five upgrades, scoped/global production, stacked and displayed job rewards, reload, offline production and export/import in the working live build. The user manually verified Phase 4C dispatcher purchase, 10-second execution, $25/$30/$36 rewards, saved progress, offline automation, welcome-back breakdown and export/import. The user manually verified Phase 5A manual/dispatcher/business-level XP, reload, offline dispatcher XP, export/import and the player progress UI. The user manually verified Phase 5B player/business-level gates, requirement UI, grandfathered ownership and fresh-save progression in the working live build. The user manually verified Phase 5C Garage, requirements, Vortex S9 acquisition, +15% production, reload, offline modifiers and export/import in the functioning live build.


Phase 5C is complete: one provisional Vortex S9, $50,000 acquisition at Player
Level 7 / Dockside Level 10, +15% global production through the central evaluator,
Garage presentation and sequential v5→v6 migration. No final art, second vehicle,
set bonuses or equipped system is included. Preserve acquisition-only gates,
CE1-, exact fractions, command reconciliation and durable offline/import publication.
Collection expansion remains deferred. Phase 6A implementation is complete: central reset/retention policy, banked Empire Points and Rebirth count, exact reward preview, explicit confirmation, durable write-before-publication, and sequential v6→v7 migration. The user manually verified Phase 6A eligibility, reward preview, confirmation/reset, EP/count persistence, permanent garage/modifier behavior and reload/export/import in the functioning live build. Phase 6B implementation is complete; live verification remains pending.


Phase 6B adds precisely five ranked skills in Empire Foundations, atomic unspent-EP
purchases, central permanent production/job/XP modifiers, final XP award flooring,
Dispatcher batch-floor semantics, derived 8h/10h/12h offline caps and v7→v8 migration.
Skills survive Rebirth without refund. CE1-, savedAt, one-time catch-up and the
strong Rebirth/import/offline persistence transactions remain intact. Additional
permanent skill trees, collection expansion and the next content phase are deferred.
Final permanent-progression balance is not complete; no respec or passive EP exists.
