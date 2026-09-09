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
| 6B — Permanent skill foundation (complete; user verified live) | One Empire Foundations tree, five skills, EP spending, v8 migration | Exact effects/XP flooring, permanent retention, shared derived cap |
| 7A — Territory foundation (complete; user verified live) | Solara City, Waterfront/Neon Mile, temporary ownership, v9 migration | Atomic acquisition, central job modifier, Rebirth baseline and save/runtime/offline tests |
| 7B — Deterministic Heat (complete; user verified live) | Integer Heat, exact gain/decay, job cash penalties, Lay Low, v10 migration | Atomic start-tier batching, cooling remainder, shared offline cap and Rebirth reset |
| 7C — Crew (complete; user verified live) | Three recruits, two assignment slots, exact active effects, v11 migration | Atomic recruitment/assignment, old-effect reconciliation, Mara remainder, shared offline and Rebirth reset |
| 7D — Random Events (complete; user verified live) | Three events, two choices each, injected RNG, online-only opportunities, v12 migration | Atomic choices, one pending event, offline exclusion, Rebirth reset and deterministic tests |
| 8A — Achievement Foundation (complete; user verified live) | Six permanent observational milestones, central evaluation, v13 migration | Idempotent unlocks, runtime/offline durability, Rebirth retention; no rewards |
| 8B — Lifetime Statistics Foundation (complete; user verified live) | Eight permanent observational fields, checked updates, v14 migration | Atomic counters, final-state peak Heat, offline durability and Rebirth retention |
| 8C — Late-Game Automation Foundation (complete; user verified live) | One opt-in Dockside Auto-Upgrader, 30s purchases, v15 migration | Chronological production/spending, outer batching, atomic offline/reset and CE1 tests |
| 9A — UX & Information Architecture (implementation complete; live pending) | Five primary sections, global status/feedback and compact Overview | Every feature reachable; presentation-only navigation; v15 unchanged |
| 9B — Accessibility & Interaction Polish (next / deferred) | Separately scoped systematic accessibility review | Preserve navigation, confirmations and runtime ownership |
| 9C — Balance review (deferred) | Deliberate economy review | Explicitly scoped values and regression evidence |
| Post-roadmap — Rebranding (not started) | Final art direction, palette, typography and assets | Separate approval and asset provenance |

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
Collection expansion remains deferred. Phase 6A implementation is complete: central reset/retention policy, banked Empire Points and Rebirth count, exact reward preview, explicit confirmation, durable write-before-publication, and sequential v6→v7 migration. The user manually verified Phase 6A eligibility, reward preview, confirmation/reset, EP/count persistence, permanent garage/modifier behavior and reload/export/import in the functioning live build. Phase 6B is complete and manually verified live by the user.


Phase 6B adds precisely five ranked skills in Empire Foundations, atomic unspent-EP
purchases, central permanent production/job/XP modifiers, final XP award flooring,
Dispatcher batch-floor semantics, derived 8h/10h/12h offline caps and v7→v8 migration.
Skills survive Rebirth without refund. CE1-, savedAt, one-time catch-up and the
strong Rebirth/import/offline persistence transactions remain intact. Additional
permanent skill trees, collection expansion and the next content phase are deferred.
Final permanent-progression balance is not complete; no respec or passive EP exists.


The user manually verified Phase 6B Empire Foundations, EP spending and remaining
balance, persistent ranks, Rebirth retention without refunds, production/job/XP
bonuses, Never Sleeps cap, reload and export/import in the functioning live build.

Phase 7A implementation is complete: **Solara City**, exactly two territories,
Waterfront baseline ownership, paid Neon Mile acquisition at Player Level 12 and
Dockside Level 15 for $100,000, central +10% job/Dispatcher Money modifier, temporary
territory reset on Rebirth, shared requirement presentation and v8→v9 migration.
The user manually verified Phase 7A territory UI, requirements/acquisition, job cash
modifier isolation, persistence/export/import, Rebirth territory reset and permanent
retention in the working live build. Phase 7B implementation follows below. Crew,
Random Events, collection expansion and additional permanent trees remain deferred;
Phase 7 as a whole is not complete. No full city redesign or final district art exists.


Phase 7B implementation is complete and was manually verified live by the user. Heat is bounded
0–100 with five tiers, three gain sources, exact per-minute decay, one Lay Low action
and HOT/MANHUNT job-cash penalties through the central evaluator. Shared elapsed
batches use starting Heat for rewards, then Dispatcher Heat, then cooling. No
cross-batch Heat counter exists. v9→v10 migration starts Heat at zero and preserves
all previous progression. CE1, import timing, durable offline/Rebirth replacement,
permanent skills/Garage and the shared 8/10/12h cap remain intact. Heat resets with
Waterfront-only territory ownership on Rebirth. Phase 7C Crew follows below;
Random Events, collections and other later work remain deferred. Phase 7 as a whole
is not complete. No RNG, policing events or additional content was implemented.


The user manually verified Phase 7B Heat gain/tiers, HOT/MANHUNT cash penalties,
decay, Lay Low, Neon Mile Heat, XP/production isolation, offline Heat, Rebirth reset
and persistence/export/import in the functioning live build.

Phase 7C implementation is complete and was **manually verified live by the user**. Three Crew
members (Rico Vale, Mara Knox, Jax Mercer) can be recruited and explicitly assigned
to Operations/Logistics. Bench ownership has no effect. Rico/Jax use central Money
modifiers; Mara derives 45s cooling without rescaling the saved remainder. All
assignment changes reconcile old effects first. Crew resets on Rebirth while
permanent systems remain intact. v10→v11 adds only empty recruitment/assignments;
CE1 and the shared offline/persistence contracts remain. Phase 7D follows below.
No Crew progression, upkeep, random traits, portraits or automatic assignment exists.


The user manually verified Phase 7C recruitment without automatic activation,
Operations replacement, Rico cash, Mara cooling and switching back, Jax production,
reload/offline/export/import and Crew reset with permanent retention in the live build.

Phase 7D implementation is complete and was **manually verified live by the user**. Three city
events have two transparent choices each. Injected RNG selects uniformly after a
35% online ten-minute opportunity, with at most one attempt per elapsed batch.
One pending event pauses only event cadence. Current-state atomic Money/Heat choices
reset cadence on success. Offline consumes no event progress/RNG; Rebirth clears
pending/progress. v11→v12 adds empty events; CE1 and durable boundaries are preserved.

Phase 7's city-system foundation now includes **Territories, Heat, Crew and Random
Events**. Phase 8 Long-Term Progression begins with Achievement Foundation below;
statistics expansion and late-game automation remain separately scoped.
Collection expansion, extra skill trees, final art and overall balance remain
unfinished. Unrelated future work and Phase 8 as a whole are not complete.


The user manually verified Phase 7D event cadence/choices, pending persistence,
offline exclusion and Rebirth reset in the functioning live build. The complete
Phase 7 city-system foundation — Territories, Heat, Crew and Random Events — is
now implemented and manually verified live. Earlier phase-local deferral notes
above record history rather than the current implementation status.

Phase 8A Achievement Foundation implementation is complete and **manually verified
live by the user**. Exactly six achievements permanently recognize current-state
milestones with no gameplay rewards. Central command/runtime/offline evaluation,
pre-/post-Rebirth ordering, v12→v13 migration and CE1 compatibility are covered.
Phase 8B implementation follows below. No lifetime or peak-Heat statistics were
added in Phase 8A. Phase 8 as a whole is not complete.


Phase 8B Lifetime Statistics Foundation implementation is complete and **manually
verified live by the user**. Eight permanent observations record manual/Dispatcher
jobs, paid business upgrades, territory acquisitions, Crew recruits, event choices,
Rebirths and final-state peak Heat. Checked counter overflow fails atomically;
shared offline simulation and Rebirth preserve history. v13→v14 adds zero history
except the exact existing Rebirth count; CE1 remains compatible. Statistics confer
no rewards or gameplay effects, and the six achievements remain unchanged.
No challenges, new achievements, analytics or automation were added in Phase 8B.
Phase 8C follows below.


The user manually verified all eight statistics, repeated actions across Rebirth,
Peak Heat permanence, offline Dispatcher counts and CE1 preservation in the live
Phase 8B build. Statistics remain observational.

Phase 8C Late-Game Automation Foundation implementation is complete and **manually
verified live by the user**. One Business Auto-Upgrader costs $250,000, requires
Level 20 / Dockside Level 25 / Neon Mile, starts disabled and attempts a paid
Dockside upgrade every 30 seconds when enabled. Production/spending respects purchase
boundaries, while Dispatcher XP/Heat and Event RNG retain outer-batch semantics.
Manual upgrade rules, individual XP flooring and statistics are reused. Shared
offline operation, durable publication, Rebirth reset and v14→v15 migration are tested.
CE1 is unchanged. No generic auto-buyer, reserve or Phase 9 work was added in 8C.

The currently planned **Phase 8 block is complete and fully manually verified live**: Achievements, Statistics and Business Auto-Upgrader. Phase 9A follows below; Phase 9 as a whole remains incomplete. Broader automation expansion remains separately scoped and
deferred, alongside collection expansion and other future work.


Phase 9A UX & Information Architecture implementation is complete; **live verification
is pending**. OVERVIEW, OPERATIONS, CITY, COLLECTION and EMPIRE organize every existing
feature. Cash/Level/Heat/EP and pending Event/active spending indicators remain global.
Navigation is local React state; one central runtime continues independently. Import
and Rebirth controllers retain their interaction state above the active section.
Save v15, CE1, balance, all content catalogs and timing remain unchanged.
[The feature review checklist](UX_CHECKLIST.md) maps the previous page to the sections.
Phase 9B Accessibility & Interaction Polish is next/deferred; Phase 9C balance review
and post-roadmap Rebranding have not begun. No new artwork, palette or fonts were added.
