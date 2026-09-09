# Base Game Foundation Release

## Release State

Phase 9E audits the Release Candidate baseline
`420c6b3403a9fbd45ff73b083df6c2fa6923fe67` (Phase 9D). The single descendant commit
containing this document is the Phase 9E freeze; its identity is available through
`git log -1`. **Save v15 / CE1- remain unchanged.** Phase 9D live verification is
user-reported; **Phase 9E live verification remains pending**. Neither Phase 9 nor
the whole Base Game is claimed live verified by this audit.

No release-blocking production defect was reproduced. No production code, balance,
content, dependency, save field or migration changed. The patch adds three release
flow tests, three malformed-current-import cases, and strengthens fourteen historical
migration cases to assert every retained slice/default. No existing test was removed.

Final automated verification: **84 test files / 1,812 tests passed** (six new cases;
14 existing migration cases strengthened). Fresh `npm ci --no-audit --no-fund`,
`npm run typecheck`, `npm run test`, `npm run build` and `git diff --check` passed.
Production entry assets exist and use repository-relative paths.

## Included Systems

One manual delivery, Dockside Detail (levels 1–100), five normal upgrades, Delivery
Dispatcher and opt-in Business Auto-Upgrader; XP/Player Level; permanent Vortex S9;
Waterfront and Neon Mile; five Heat tiers and Lay Low; Rico/Mara/Jax in Operations
or Logistics; three two-choice City Events; Rebirth/EP and five Empire Foundations
skills; six permanent achievements and eight lifetime statistics; local saves,
8/10/12h capped offline progression and CE1 transfer.

Post-9C acquisition values remain Dispatcher $5,000; Neon $50,000; Auto-Upgrader
$50,000 at Player 12 / Dockside 15 / Neon. All other values remain in BALANCING.md.
The exact first eligible Player 20 / Dockside 25 Rebirth pays four EP.

## Verification Matrix

All referenced tests are run in the full Vitest suite, not merely inventoried.
Names below are under `src/game`, `src/platform` or `src/app` as indicated.
“DOM” means automated mounted/serialized React inspection, not a real-browser check.

| Area | Actual method and evidence |
| --- | --- |
| Fresh state, export, legal progression and second run | New game `release-flow.test.ts`: real jobs and deterministic earnings/purchases, all acquisition gates, all six milestones, Event spawn/resolution, enabled progress, two Rebirths, retained skill/vehicle effects; existing `balance-audit` covers three modeled routes |
| Manual job, Dockside purchase/levels/production, normal upgrades | Existing game `game-state`, `purchase-business`, `business-levels`, `purchase-upgrade`, `upgrade-catalog`, `simulate-elapsed`, `modifiers` and feature economy/rational tests; command/static review |
| Exact production fractions and overflow | Existing game `simulate-elapsed`, `runtime-hardening`, `auto-upgrader`; both remainder fields and frozen input / Money / XP / statistics failure fixtures |
| Dispatcher and Auto-Upgrader | Existing game `automation`, `auto-upgrader`, `runtime-hardening`; platform `auto-upgrader-runtime`; exact costs, opt-in, pause/resume, chronological funds, per-upgrade XP, outer Dispatcher floors, max collapse, progress and reset |
| XP, requirements, vehicle, territory and skills | Existing game `progression`, `requirements`, `vehicles`, `territories`, `skills`, `skill-effects`, `balance-audit`; new complete acquisition flow; config/central evaluator inspection |
| Rebirth, EP, permanent retention and temporary reset | New release cycle and exact four-EP test; existing game `rebirth`, platform `rebirth-runtime`, `auto-upgrader-runtime` and `runtime-hardening` verify overflow/write failure and pre-reset reconciliation |
| Heat / Lay Low / Crew | Existing game `heat`, `crew`, platform `crew-runtime`; exact five tiers, gain-before-decay, zero cooling bank, Mara inherited remainder, assignment/replacement/unassignment and active-only effects |
| Events and all six choices | Existing game `events`, platform `event-runtime`, app `events`; exact outcomes/affordability, pending timer freeze, PASS statistics, online-only cadence and chance/selection draw counts |
| Achievements / lifetime statistics | Existing game `achievements`, `statistics`, platform achievement/statistics runtime tests; new legal all-six flow and retained lifetime totals; deterministic card order in app tests |
| Offline basic / Dispatcher / Crew / enabled automation / pending Event | Existing game `offline-progress`, `skill-effects`, `runtime-hardening`; platform `offline-bootstrap`, `crew-runtime`, `event-runtime`, `auto-upgrader-runtime`, `runtime-hardening`; exact 8/10/12h caps and beyond-cap exclusion, frozen pending Event, no offline RNG |
| Offline one-time credit and durable failure | Existing platform `runtime-hardening` asserts exact 12h candidate, one write before publish, immediate repeat without rewards; `offline-bootstrap` and `auto-upgrader-runtime` cover storage conflict/failure and future timestamps |
| Zero/sub-ms, large workload and 4,096 budget | Existing game/platform `runtime-hardening`: identity/no RNG at zero, exact runtime fractional accumulation, invalid elapsed, 12h fixed baseline outputs, bounded oversized failure with original state |
| Autosave / reload / meaningful commands | Existing platform `persistent-game`, `upgrade-persistence`, Crew/Event/automation runtime tests; static review confirms 250ms refresh does not write and five-second autosave remains separate |
| Current and historical CE1 / invalid imports | Existing game `save-code`, `save-v15`, `balance-audit` rich roundtrip; platform `persistent-game`, `offline-bootstrap`, `auto-upgrader-runtime` prove no historical credit and atomic replacement. Three new malformed numeric/unknown-ID import cases preserve live and durable state |
| Sequential v1–v15 migrations | Static review of every migration in `save-schema.ts`; existing `save-migration`, `save-v3` through `save-v15`; fourteen strengthened CE1 fixtures assert the entire migrated state and timestamp, not just version/cash |
| Navigation / global status / all feature surfaces | Existing app `navigation`, `navigation-interaction` and section/card tests; active-only tree and stable parent runtime/controller inspection; no navigation RNG, reconciliation or saves |
| Keyboard / focus / feedback / reduced motion | Existing app `accessibility`, `navigation-interaction`, save/Rebirth/Event tests; shared focus/touch/wrapping/reduced-motion CSS reviewed. No assistive-technology certification |
| Production build / Pages / assets / dependencies | Fresh npm ci/typecheck/test/build; output entry JS/CSS existence and relative paths inspected; Vite `base: './'`, main-only Pages workflow, Node config, lockfile and production imports reviewed |
| Desktop/mobile visual smoke | Attempted local Vite preview; cloud browser returned `ERR_BLOCKED_BY_CLIENT`. Actual visual/zoom/real-browser interaction testing unavailable; no screenshots or live Pages claim |

## Persistence Compatibility

The shared validator still walks v1→v2→…→v15 sequentially. Historical defaults are:
v1 ownership becomes level 1; v3 adds fractional precision/upgrades; v4 automation;
v5 XP; v6 Garage; v7 EP/count; v8 skills; v9 Waterfront; v10 Heat; v11 Crew; v12
Events; v13 empty achievements; v14 zero statistics except existing Rebirth count;
v15 disabled/unowned Auto-Upgrader with zero progress. Existing fields and savedAt
are preserved. No migration infers deliveries, purchases, transient Heat or rewards.

Current CE1 preserves all authoritative slices, including pending Event, both
production fractions and both automation remainders. Import validates, writes the
replacement with current local time, then publishes. Historical exported time earns
nothing. Invalid codes/IDs/numbers, failed writes and storage conflicts do not
partially replace the game. Ordinary successful commands publish their complete
transaction then attempt saving; storage failure retains live play with a warning
and retry at the next normal save. Offline/import/Rebirth use the stronger durable
write-before-publication contract. These distinct existing policies are preserved.

## Runtime Guarantees

One central monotonic runtime; pure integer-ms simulation; exact sub-ms accumulation
in its adapter. Zero/sub-ms fast paths, progress checks and the 4,096 purchase-segment
budget remain. Twelve credited hours fit (at most 1,440 attempts plus a partial
segment); unsupported larger work fails atomically. Maxed/absent targets collapse,
disabled/unowned automation stays unsplit. Production/spendable cash follows exact
purchase boundaries, with no per-second/job simulation loop.

Dispatcher keeps outer Money/XP floors, interval-start Heat rewards and
floor(completed jobs / 5) Heat, then mathematical cooling. Mara keeps her 45s interval
and the globally valid remainder below 60s. Event opportunity is online-only, once
per outer reconciliation: no eligible content/pending/offline/not-due consumes zero
RNG; eligible failed chance one draw; successful spawn two. Achievements and peak
Heat observe final authoritative boundaries, never hidden transient peaks.

Offline caps remain 8/10/12h. One complete candidate is written before publication
and timestamp rebase prevents replay. Safety/overflow failures preserve original
state; no partial upgrade, XP, statistics or permanent reset can escape.

## UX / Accessibility

Overview, Operations, City, Collection and Empire retain every current interaction.
Cash/Level/Heat/EP and pending-event/active-spending indicators remain global. Native
navigation, skip link, focus recovery, contextual controls, progress semantics,
inline import/Rebirth confirmation, polite discrete feedback and reduced motion
remain intact. No continuously changing cash/countdown live-region spam is added.
The app renders one active management tree while the central runtime stays mounted.

Static search found Math.random only in the injected browser RNG adapter, and
production setInterval only in the runtime and autosave schedulers. No runtime
console.log/debug, suppression directives, new caches/schema/content or missing
image/font references were found. Intentional balance-analysis console.info output
is test-only and retained. Production dependencies remain React and React DOM;
Happy DOM, Vitest, TypeScript and Vite remain development tools. No dependency
upgrade or security-certification claim is part of this audit.

## Intentional Limitations

One vehicle, two territories, three Crew, three Events; Foundation Heat/Police depth;
working branding and provisional vehicle presentation; no final art, interactive
map, tuning, properties, factions, heists, cloud/account saves or backend. These are
intentional scope limits, not release blockers. Browser and assistive-technology
coverage is limited as stated above. Deployed Phase 9E still needs user verification.

## Freeze Contract

This freezes a stable foundation, not future development. Future explicitly scoped
expansions preserve or migrate existing player progress and stable IDs. Retain v15 /
CE1 compatibility, post-9C balance unless a new balance task authorizes changes,
Phase 9D runtime safeguards, deterministic Event RNG, exact remainders, offline
durability, atomic import/Rebirth, permanent history, Phase 9A navigation and Phase
9B accessibility. Authoritative-state additions need explicit sequential migrations.
No post-roadmap work or Rebranding is started by this release audit.
