# Roadmap

## Current phase — Garage IV-D: Tier-2 customization

Implemented and verified in [PR #49](https://github.com/TLSnipZ/Idle-Game/pull/49):
two alternative permanent setups and two signature finishes
plus factory paint for each of Serein, Rendan and Canto Club. Save v26 / CE1
preserves all existing progress. See [Tier-2 customization](TIER_TWO_CUSTOMIZATION.md)
for exact prices, scoped effects, paint limitations and verification/release status.
Six vehicles remain playable; the seventeen-identity wishlist is still planning only.
Older phase sections below are historical. Full CI passed on `aaf5abf`; PR #49
tracks merge/deployment separately. No further vehicle phase has started.


## Future vehicle wishlist — recorded 2026-09-14

Recorded the user's six requested automotive inspirations in
[Vehicle catalog](VEHICLE_CATALOG.md#future-vehicle-wishlist--user-request-2026-09-14).
Serein already covers S15; retain planned Raizan (Evo IX) and Arashi (R34).
Add proposed Toseki Kazan (modern GT-R/R35), Namera Shiore (180SX) and
Kairo Reika (classic NSX): seventeen planned/live identities in total, six live.
Use fictional Solara branding and distinct model designs. New names and generation
interpretations are proposals; pricing, bonuses, artwork and release order remain
future work. This records the wishlist without starting a content phase.

## Current phase — Garage IV-C: Rendan and Canto Club

Implemented with user-approved model artwork: Rendan ($115,000, Player 12 /
Afterdark 3, +18% manual and Dispatcher Cash) and Canto Club ($165,000, Player 14 /
Afterdark 5, +18% Business Production and +12% Dispatcher Cash). Only the active
car contributes; both remain factory-only. Save v25 / CE1 preserves prior progress.
See [Rendan/Canto](RENDAN_CANTO.md) for approval, migration and verification scope.
Release evidence belongs in the PR. IV-D customization remains a separate phase.


## UI correction — approved district artwork

The user rejected storefront imagery in Economy and Districts after PR #46.
Economy is now text/value-led. Waterfront and Neon Mile have separate generated
district-wide images, displayed uncropped at their original ratio. The user
approved both images with “Ja passt” on 2026-09-14. Release evidence is in PR #47. See
[District artwork](DISTRICT_ARTWORK.md) for provenance, review and verification.
Save v24 / CE1 and gameplay are unchanged.


## Current phase — Design & UX 2.0, remaining workspaces

Overview now prioritizes income and progression with approved storefront art.
City has separate Districts/Heat, Crew and Events views; Empire has separate
Rebirth, Skills, Achievements, Statistics and Save/Transfer views. Pending forms
survive tab changes; global shortcuts reveal their intended panel before focus.
See [Design & UX 2.0](DESIGN_UX_2.md) for scope and verification. Save v24 / CE1,
artwork masters and gameplay are unchanged. PR evidence owns release status.
The user accepted the first slice (PR #45); this completes the remaining planned
page composition. Rendan/Canto remains the next separate content phase.

## Current phase — Design & UX 2.0, first slice

Shared visual hierarchy and the Operations Business portfolio are implemented:
real Jobs/Businesses/Equipment/Automation views, compact storefront selection and
one focused detail with mobile Back navigation. Guidance reveals hidden targets.
See [Design & UX 2.0](DESIGN_UX_2.md) for scope, verification and the remaining whole-game
sequence. Save v24 / CE1 and gameplay are unchanged. Release evidence is in the PR.
This user-prioritized redesign precedes IV-C Rendan/Canto.

## Current phase — Garage and workshop UX

Implemented: separate Garage/Workshop views, compact vehicle selection, ownership
filters, price/name sorting, a focused detail view and shared workshop selection.
Tuning and Paint are separate services; paint drafts survive their tab changes.
Save v24 / CE1 and all gameplay contracts are unchanged. See [Garage workspace](GARAGE_WORKSPACE.md)
for interaction and release checks. This user-requested UX interlude comes before
IV-C Rendan/Canto; those cars are not part of this update.

## Current phase — Garage IV-B: Serein pilot

Implemented: Namera Serein, $80,000, Player Level 10 and owned Afterdark Customs,
+26% active manual delivery Cash, Save v24 / CE1 and localized factory-only controls.
The approved PNG is retained unchanged; the runtime uses its optimized WebP derivative.
See [Serein pilot](SEREIN_PILOT.md) for artwork provenance and release verification.
Release status and CI/deployment evidence are tracked in PR #43.
Next separate scope: IV-C Rendan/Canto; no additional cars or customization ship here.

## Current phase — Garage IV-A: Tier-2 catalog/progression analysis

Completed the isolated comparison of proposed Tier-2 cars against today's stock
and tuned Tier-1 choices. Serein, Rendan and Canto Club now have revised proposed
roles and Afterdark-based gates; see [Tier-2 decision](TIER_TWO_GARAGE.md) for numbers,
opportunity costs, eight executable analysis cases and implementation acceptance.
This checkpoint adds no playable cars and keeps Save v23 / CE1 unchanged.
Next bounded phase: **IV-B — Serein model reference and production pilot**;
then IV-C Rendan/Canto and IV-D model-specific customization.
The user deferred remaining paint imperfections; PR #41 is not full visual acceptance.


## Patch — paint edge coverage across the full current garage

Refined KX-R, Senda and Lilt body contours, mirrors, spoiler, wheel arches,
grille surrounds and lamp cutouts for both finishes per model. Small mask strokes
cover antialias seams; protected lamp, glass, tyre and showroom interiors retain
the source artwork. Senda handles and the Lilt far mirror now receive paint.

The browser verifier checks 148 body/protected pixel comparisons at each of
two display densities (296 total), with factory and both-finish screenshots for
all three models. The existing 15 appearance flows still cover preview, apply,
storage failure, reload, localization and responsive layout. Samples supplement
enlarged visual review; they do not prove every boundary pixel is perfect.
Save v23 / CE1 and gameplay are unchanged. Release evidence belongs in the PR.
The next roadmap scope remains later vehicle tiers.


## Patch — KX-R paint mask

Corrected missed bodywork and rear-lamp color leakage with refined contours and
subtractive masking. The browser verifier checks 32 real rendered pixel samples
for body coverage and protected details. Save v23 / CE1 and gameplay are unchanged.
See [Vehicle finishes](VEHICLE_APPEARANCE.md); release evidence is in the patch PR.

## Current phase — Garage 2.0 III: curated vehicle finishes

Implemented: two signature finishes plus factory paint for each current car,
explicit preview/apply/discard, free owned-vehicle customization and matching
Garage presentation. Save **v23 / CE1** preserves prior tuning and progress;
applied looks survive Rebirth. See [Vehicle finishes](VEHICLE_APPEARANCE.md)
for rendering, persistence and verification boundaries. Release evidence is in the PR.
Next separate scope: later vehicle tiers, starting with catalog/progression analysis.

## Current phase — Garage 2.0 II: model-specific tuning

Implemented: two permanent setups each for Senda and Lilt, per-model workshop
selection, independent stock/fit commands, cooling and decoy integration.
Save **v22 / CE1** preserves existing KX-R builds without grants.
See [Model tuning](MODEL_TUNING.md) for prices, exact balance, save boundaries
and verification. Release evidence is tracked in the PR.
Next separate scope: curated visual customization; later car tiers remain planned.


## Interlude — whole-game layout and navigation

Implemented: responsive overview, desktop section indexes/mobile quick access,
comparable delivery cards, slimmer fixed HUD, precise Crew/Event/Automation
destinations and repaired Rebirth notice. See [Layout review](LAYOUT_REVIEW.md)
for findings, boundaries and verification. Save v21 / CE1 unchanged.
This requested UI pass precedes the separate Senda/Lilt tuning phase.


## Interlude — compact Welcome back panel

The offline return panel now shows a compact heading, earnings and Continue action.
Income breakdown, XP, elapsed/credited time and cap notes expand through native
Details. Automatic spending remains visible before expansion. Styling wraps on
mobile and supports EN, DE and Villager. Presentation only; Save v21 / CE1 and
offline credit/dismissal semantics are unchanged. Verification is recorded in the
patch PR. Senda/Lilt tuning remains the next separate gameplay phase.

## Current phase — Garage 2.0 I: KX-R tuning

Implemented in [PR #35](https://github.com/TLSnipZ/Idle-Game/pull/35): permanent Fleet gearing / Courier ECU, one fitted setup, free stock/owned switching and durable Garage writes. Save **v21 / CE1** migrates existing stock garages without granting parts. See [Tuning pilot](GARAGE_TUNING.md) for prices, balance, persistence and verification scope.

This completes the first tuning pilot only. Next separate scope: model-specific Senda/Lilt tuning after reviewing this slice; visual customization and later vehicle tiers remain planned. Release evidence is tracked in the PR; user live acceptance remains separate.


## Current phase — UX polish after Heat V

Implemented in [PR #34](https://github.com/TLSnipZ/Idle-Game/pull/34): jobs-first Operations, compact Heat explanations and Activity Center, a wrapping mobile HUD, and clear last-save status. Save **v20 / CE1 unchanged**. See [UX polish](UX_POLISH.md).

Build, regression, browser and deployment evidence is tracked in PR #34; user live acceptance remains separate. Next separate phase: **Garage 2.0 / tuning design and implementation**. Heat I–V is complete; earlier records below are historical.

## Current phase — Heat V: Support network

Implemented: local Level-10 Business cover, assigned Mara and active Lilt reduce
the MANHUNT decoy cost through exact shared modifiers, down to **$810**.
Save **v20 / CE1 unchanged**. See [Heat support](HEAT_SUPPORT.md). Verification passed; see [PR #33](https://github.com/TLSnipZ/Idle-Game/pull/33).
Verified in [PR #33](https://github.com/TLSnipZ/Idle-Game/pull/33):
[run 34783614823](https://github.com/TLSnipZ/Idle-Game/actions/runs/34783614823)
on code `fb0c5ade7e4ed52190b6cb088fedd4ffff5fe6fc` passed strict build,
**2,441/2,441 tests** (28 added; zero failures/skips), **345 Chromium cases**
(45 Garage, 225 sections, 15 each risk/police/district/MANHUNT/support), and
whitespace checks. Evidence artifact: `10326270313`.
This follow-up changes documentation only. Merge/deployment evidence is recorded
in the PR; manual live acceptance remains separate.

The retained Heat / Police 2.0 **I–V sequence is complete** at this scope.
Further post-roadmap expansions require their own scope. Older records below are historical.


## Current phase — Heat IV: MANHUNT

Implemented: local roadblocks from 80 Heat and a voluntary $1,250 / −30 Heat
decoy, with durable payment and free recovery paths. Save **v20 / CE1 unchanged**.
See [MANHUNT](MANHUNT.md) for balance, persistence and acceptance. Verification passed; see [PR #32](https://github.com/TLSnipZ/Idle-Game/pull/32).
Verified in [PR #32](https://github.com/TLSnipZ/Idle-Game/pull/32):
[run 34781843741](https://github.com/TLSnipZ/Idle-Game/actions/runs/34781843741)
on code `4545e8bf32b267f9930cbb3f307d710cbc363abe`: strict build,
**2,413/2,413 tests** (29 added; zero failures/skips), **330 Chromium cases**
(45 Garage, 225 sections, 15 each risk/police/district/MANHUNT), and whitespace
checks passed. Evidence artifact: `10325630553`.
The final follow-up changes documentation only. Merge and deployment evidence
are recorded in the PR; manual live acceptance remains separate.

Next separate phase: **Heat V — deeper cross-system integration**.
Earlier phase records below are historical.


## Current phase — Heat III: District Heat

Implemented: separate Waterfront/Neon Heat, durable owned-district travel,
local manual actions/events and Waterfront Dispatcher. Save **v20**, CE1 unchanged.
See [District Heat](DISTRICT_HEAT.md) for rules and compatibility. Verification passed; see the [PR #31 evidence](https://github.com/TLSnipZ/Idle-Game/pull/31).
Verified in [PR #31](https://github.com/TLSnipZ/Idle-Game/pull/31):
[run 34780604928](https://github.com/TLSnipZ/Idle-Game/actions/runs/34780604928)
on code `91749a14e3bf7a00f95abf388f70d371bece984e` passed strict build,
**2,384/2,384 tests** (30 added, zero failures/skips), **45 Garage + 225 section +
15 risk + 15 police + 15 district Chromium cases**, and whitespace checks.
Evidence artifact: `10325411638`. This final follow-up changes documentation only.
Merge/deployment evidence is recorded in the PR; manual live acceptance remains separate.

Next separate scope: **Heat IV — MANHUNT**. Earlier phase records below are historical.

## Current phase — II Police Pressure

Implemented on `feat/police-pressure`: WATCHED reduces risk premium to +25%;
discreet delivery pays half normal Cash, zero XP, and cools up to 2 Heat.
See [POLICE_PRESSURE.md](POLICE_PRESSURE.md). Save v19 / CE1 unchanged.
Verified in [PR #30](https://github.com/TLSnipZ/Idle-Game/pull/30):
[run 34777563745](https://github.com/TLSnipZ/Idle-Game/actions/runs/34777563745)
on `bf28818fd514cc68baf74f6bd90c18dc6b11ae7b`: strict build, **2,354/2,354 tests**
(39 added, zero failures/skips), **45 Garage + 225 section + 15 risk + 15 police
Chromium cases**, and whitespace checks passed. Evidence artifact: `10323499963`.
This final follow-up changes documentation only. Merge/deployment evidence is
recorded in the PR; manual live acceptance remains separate.
PR #29 completed and deployed Heat I.
Next separate scope: III District Heat. Earlier handoffs below are historical.

## Current phase — Heat / Police 2.0 I: Risk & Reward

Implemented on `feat/heat-risk-reward`: optional +50% Cash / +5 Heat delivery,
available below HOT, exact shared rewards and all three languages. Save v19 / CE1.
See [HEAT_POLICE_2.md](HEAT_POLICE_2.md) for balance, contracts and acceptance.
Verified in [PR #29](https://github.com/TLSnipZ/Idle-Game/pull/29):
[run 34775975009](https://github.com/TLSnipZ/Idle-Game/actions/runs/34775975009)
on code `577881c63554f43bb7a6603fddc4f6646b4c707e` passed strict build,
**2,315/2,315 tests** (32 added; zero failures/skips), **45 Garage + 225 all-section +
15 risk delivery Chromium cases**, and whitespace checks. Artifact: `10324165450`.
This follow-up changes documentation only. Merge and deployment evidence are
recorded in the PR; manual live acceptance remains separate.
PR #28 completed and deployed the Garage.
Next separate phase: II Police Pressure; not started.

The following handoffs are historical.


## Current artwork handoff

Tier-1 artwork is implemented and verified in [PR #28](https://github.com/TLSnipZ/Idle-Game/pull/28). [Run 34774339210](https://github.com/TLSnipZ/Idle-Game/actions/runs/34774339210) verified code commit `298ef28287bfe6f090736698f06861c7b0adb35a`: strict build, 2,283/2,283 tests (zero failures/skips), 45 Garage and 225 whole-game Chromium cases, and whitespace checks passed. Evidence artifact: `10322962950`. This documentation-only follow-up does not change the verified runtime or tests. The PR records merge/deployment separately. Heat / Police 2.0 is the next separate phase and has not started.

Completed: **P1 UI regression restoration** (PR #26), following the whole-game
audit and Villager overkill (PRs #24–25). All **2,252 tests pass, zero failures or
skips**; strict build, whitespace checks and all 255 Chromium cases passed.
Automation description links, instant Operations navigation and shared action
spacing are repaired. Evidence: [GAME_AUDIT.md](GAME_AUDIT.md).
Current phase: **Tier-1 Garage — Kairo Senda / Namera Lilt** gameplay and automated
verification complete in PR #27: 2,283 tests and 270 Chromium cases pass. See [TIER_ONE_GARAGE.md](TIER_ONE_GARAGE.md). Approved Senda and Lilt artwork is integrated and verified in PR #28. Heat / Police 2.0 follows this Garage block. Other P2 audit items remain tracked; no additional content shipped in P1.

Previous milestone: **Active Vehicle Foundation / Save v18** is implemented on
`feat/active-vehicle-complete` in PR #23; executed checks and release state are
recorded there. Manual live acceptance remains separate.
The Base Game records below are historical. [POST_ROADMAP.md](POST_ROADMAP.md) and
[ACTIVE_VEHICLE.md](ACTIVE_VEHICLE.md) own current expansion status. PR #22 was only
a design checkpoint. Tier-1 Garage content follows this feature's acceptance.

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
| 9A — UX & Information Architecture (complete; user verified live) | Five primary sections, global status/feedback and compact Overview | Every feature reachable; presentation-only navigation; v15 unchanged |
| 9B — Accessibility & Interaction Polish (complete; user verified live) | Separately scoped systematic accessibility review | Preserve navigation, confirmations and runtime ownership |
| 9C — Balance & Progression Pass (complete; user verified live) | Deterministic progression audit; three acquisition adjustments | Reproducible models, unchanged v15/CE1 and runtime contracts |
| 9D — Performance & Runtime Hardening (complete; user verified live) | Runtime/performance review | Preserve post-9C balance, deterministic batching and durable persistence |
| 9E — Release Candidate / Base Game Freeze (implementation complete; live pending) | Regression verification and release readiness | Preserve balance, v15/CE1, runtime and accessibility contracts |
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


Phase 9A UX & Information Architecture is complete and **manually verified live by the user**. OVERVIEW, OPERATIONS, CITY, COLLECTION and EMPIRE organize every existing
feature. Cash/Level/Heat/EP and pending Event/active spending indicators remain global.
Navigation is local React state; one central runtime continues independently. Import
and Rebirth controllers retain their interaction state above the active section.
Save v15, CE1, balance, all content catalogs and timing remain unchanged.
[The feature review checklist](UX_CHECKLIST.md) maps the previous page to the sections.
Phase 9B Accessibility & Interaction Polish is implemented and manually verified live by the user. Phase 9C is documented below; post-roadmap Rebranding has not begun. No new artwork, palette or fonts were added.


Phase 9B adds native control context, skip/focus behavior, quieter live feedback,
progress descriptions, inline import confirmation focus and centralized reduced motion.
DOM interaction and style checks preserve all Phase 9A navigation/runtime contracts.
The user manually verified the live build, keyboard navigation, skip/focus, Rebirth/import,
Event/automation controls, reduced motion, zoom and mobile behavior. Dedicated
screen-reader certification was not performed; this is not a certification claim. Phase 9 remains incomplete. No balance, save or content change.


Phase 9C Balance & Progression Pass implementation is complete and **manually verified
live by the user**. [BALANCE_AUDIT.md](BALANCE_AUDIT.md) records deterministic Active,
Idle-Leaning and Optimized routes, baseline findings, paybacks and limitations.
Only three acquisition groups change: Dispatcher price, Neon Mile price and
Auto-Upgrader price/level gates. Current values are in BALANCING.md. Existing saves
keep their exact state; v15/CE1, rewards, production, Heat, batching, Events,
automation chronology, achievements/statistics, offline durability and 9A/9B UI
contracts remain unchanged. No new content or system was added.

**Phase 9D Performance & Runtime Hardening is complete and manually verified live by the user**, with explicit
preservation of post-9C balance, Dispatcher XP/Heat batching, Mara remainder,
outer Event RNG/online-only opportunities, Auto-Upgrader chronology, offline
write-before-publication, import timing, achievement/statistics semantics and
9A navigation / 9B accessibility, focus and live regions. Phase 9 is not complete.
Post-roadmap Rebranding has not started.


Phase 9D adds zero/sub-millisecond fast paths and bounded Auto-Upgrader work with
atomic failure on unsupported direct workloads. Exact pre-9D twelve-hour fixtures,
RNG counts, fraction arithmetic, persistence and navigation/accessibility regressions
protect existing behavior. Max-level collapse, disabled/unowned unsplit simulation,
250ms refresh and five-second autosave were reviewed and retained. No balance,
schema, content, render architecture or dependency change was needed.

**Phase 9E Release Candidate / Base Game Freeze implementation is complete; live
verification is pending.** [BASE_GAME_RELEASE.md](BASE_GAME_RELEASE.md) records the
release matrix, migration preservation, legal progression/Rebirth regressions and
review limits. No production bug fix, balance change, schema change or new content
was needed. Phase 9 / Base Game is not yet marked live verified: that requires the
user's deployed Phase 9E confirmation. Post-roadmap Rebranding remains not started.


## Post-roadmap — current status

The user has declared the roadmap through **Phase 9E Base Game Foundation complete**.
Earlier phase paragraphs above are historical implementation records, not the current
post-roadmap status. The frozen baseline is `21c5858ad6a11b1ec9d1260cd580fe94d2299881`.

**POST 1A Rebranding & Art Direction Foundation is manually verified live.**
The approved Solara palette, typography, tokens and [ART_DIRECTION.md](ART_DIRECTION.md)
remain the visual foundation.

**POST 1B Deep UI Transformation is manually verified live by the user.**
**POST 1C Live UX Polish & Number Formatting is manually verified live by the user.**
**POST 2A Vehicle Catalog Design Pass implementation is complete; live-game changes
are none.** [VEHICLE_CATALOG.md](VEHICLE_CATALOG.md) documents proposed vehicles,
pricing evidence and future ownership/tuning/migration contracts. KX-R was not live
in POST 2A; see the POST 2C handoff below.

[POST_ROADMAP.md](POST_ROADMAP.md) remains the current priority/status source.
Historical next step after POST 2A: **POST 2B — Kairo KX-R Golden Reference**,
a separately approved small candidate phase. Candidate A's prior approval concerns Art Style only, not its sedan model.
That design pass implemented no artwork, Garage expansion or Tuning.

## POST 2C handoff

POST 2A catalog design is complete; POST 2B Final Refinement is explicitly approved
as the canonical Kairo KX-R Model Reference. POST 2C production integration is
implemented and subsequently manually reviewed live by the user. Current Save v16 maps Vortex ownership to
KX-R; CE1 is unchanged. One production vehicle only. See POST_ROADMAP.md for the
current priorities; global HUD Level/XP progress is implemented in POST 2D below. Active Vehicle,
Tier 1 expansion and Tuning remain separately scoped future work.


## POST 2D handoff

POST 2C has been manually reviewed live by the user; KX-R is visually approved.
POST 2D Interaction & Progression Polish is implemented, live verification pending:
local action/focus stability, global local-level XP progress, derived Rebirth Ready
navigation and compact desktop Garage. Save v16, CE1, canonical assets and all
balance/runtime contracts are unchanged. POST_ROADMAP.md owns the current backlog;
HUD XP is resolved, while broader Guidance, Reset Progress and Garage expansion
remain future separate scopes. No automatic next phase.

## POST 3A design handoff

Business Expansion I design/analysis is complete; production still contains only
Dockside Detail, Save v16 / CE1. [BUSINESS_EXPANSION.md](BUSINESS_EXPANSION.md)
records concrete **proposed** Neon Laundry, Afterdark Customs and Solara Nights
packages, deterministic control/proposed pacing, risks and the POST 3B contract.
POST 3B implementation is next, including one selected Auto-Upgrader target and
the recommended v17 migration. Neither is implemented here. After deployed/live
3B verification, prioritize POST 3C Operations Long-Section Navigation / UX.
POST_ROADMAP.md retains Reset, Guidance, Garage and other deferred priorities.


## POST 3B recovery handoff

POST 3A design is complete. POST 3B Business Expansion I is **implemented** from
baseline `96ab72fffe8ced6710bca8572e573c086b0b9f8d`: four Businesses, Save v17/CE1,
selected-target Auto-Upgrader, shared responsive Operations cards, tests and docs.
The POST 3A handoff above records its historical one-Business design boundary.
Deployment/live verification remains pending; browser local preview was blocked.
**Next after live verification: POST 3C — Operations Long-Section Navigation / UX.**
Then Reset Progress → Next Objective / Guidance → Active Vehicle / Tier 1 Garage →
Heat / Police 2.0, subject to defects. None of those, Business artwork/depth, new
Territories/Crew/Events/Achievements/Statistics or extra Businesses ship in POST 3B.


## POST 3C handoff

POST 3B is deployed and live (user confirmation). POST 3C is implemented:
compact non-sticky Operations navigation for Jobs, Businesses and Automation,
semantic heading focus and instant scrolling only for explicit jumps. Business and
Automation acquisition cards share requirements/action/helper spacing; progression
locks take precedence over Cash helpers, with no arrow on disabled Business actions.
Ordinary action focus remains local with the existing preventScroll recovery.
Save v17 / CE1, balance, gates, content and runtime remain unchanged.

Local Browser preview is blocked by ERR_BLOCKED_BY_CLIENT; desktop, 390px, 320px,
real keyboard and scroll review remain pending. Automated DOM coverage is not live
visual approval. After deployment/live review, next is **POST 3D — Business
Progression Gates**: analyze sequential development of the previous Business;
exact levels are undecided. Settings & Localization Foundation is future planning.
No POST 3D gates, Settings, Reset, Guidance, Garage/Tuning or Heat work ships here.


## POST 3D handoff — current

POST 3D Business Progression Gates & Shared Requirement Polish is implemented.
Afterdark now needs Player 10 / Laundry 10; Nights needs Player 16 / Afterdark 8 /
Neon Mile. Laundry remains Player 5 / Dockside 7. BALANCING.md records the 10/8
choice and pacing risks. Existing owners are grandfathered; Save v17 / CE1 and
runtime/Rebirth are unchanged. Territory/Crew share the acquisition spacing and
state helpers; POST 3C navigation and local focus remain intact.

Browser preview is blocked by ERR_BLOCKED_BY_CLIENT: desktop, 390px, 320px and real
keyboard/scroll checks remain pending. Next after deployment/live verification:
**Reset Progress / New Game** → Next Objective / Guidance → Settings & Localization
Foundation → Business Visual Identity / Artworks → Active Vehicle + Tier-1 Garage →
Heat / Police 2.0. Settings will consider English/Deutsch, centralized translation
keys, locale formatting, reduced-motion preference and later audio/visual options.
Business art starts with Dockside Golden Reference, then Laundry, Afterdark and
Nights in one Solara direction. None of these later phases is implemented here.
