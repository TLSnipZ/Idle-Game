# Post-roadmap priorities

This is the current post-roadmap status and priority source. ROADMAP.md retains
historical Base Game records. Current Save v17 / CE1 includes POST 2C vehicle
identity migration and POST 3B selected Business targeting. Non-vehicle Phase 9C balance, Phase 9D runtime safeguards and
Phase 9B accessibility remain preserved contracts.

## Immediate sequence

- POST 1A: approved visual foundation, manually verified live.
- POST 1B: Deep UI Transformation, manually verified live by the user.
- POST 1C: Live UX Polish & Number Formatting, **manually verified live by the user**.
- POST 2A: **Vehicle Catalog Design Pass implementation complete**. Design and
  analysis only; live-game changes: none. See [VEHICLE_CATALOG.md](VEHICLE_CATALOG.md).
- POST 2B: **Kairo KX-R Final Refinement approved** as canonical Model Reference.
- POST 2C: **Kairo KX-R Production Integration implementation complete**;
  **manually reviewed live by the user; canonical KX-R visually approved**. One vehicle only; Save v16 / CE1.
- POST 2D: **Interaction & Progression Polish implemented; live verification pending**.
  In-section focus/scroll stability, global HUD XP, Rebirth Ready and compact KX-R layout.
- POST 3A: **Business Expansion I design and deterministic analysis complete**;
  [BUSINESS_EXPANSION.md](BUSINESS_EXPANSION.md) retains the approved balance evidence.
- POST 3B: **Business Expansion I deployed and live, confirmed by the user**.
  Four Businesses, shared cards/production, selected Auto-Upgrader target and minimal
  Save v17 migration. Recovery starts directly from the preserved POST 3A baseline;
  the lost implementation SHA is not recreated. No non-Business rebalance.
- POST 3C: **Operations Long-Section Navigation & UX Polish implemented; live review pending**.
  Non-sticky Jobs / Businesses / Automation jumps, semantic focus destinations,
  shared requirements/action spacing and progression-vs-Cash helper copy. Save v17,
  CE1, Business gates and all gameplay remain unchanged.
- POST 3D: **Business Progression Gates & Shared Requirement Polish implemented**;
  deployment/live review pending. Laundry stays Player 5 / Dockside 7; Afterdark is
  Player 10 / Laundry 10; Nights is Player 16 / Afterdark 8 / Neon Mile. Acquisition
  gates only: existing owners remain valid, Save v17 / CE1 and runtime unchanged.
  Territory/Crew share requirements/action spacing and locked versus Cash helpers.
- **Next: Reset Progress / New Game**, after POST 3D deployment/live verification.
- Then **Next Objective / Guidance → Settings & Localization Foundation → Business
  Visual Identity / Artworks → Active Vehicle + Tier-1 Garage → Heat / Police 2.0**.
  Settings planning includes a menu, English/Deutsch, centralized translation keys,
  locale formatting, reduced-motion preference and later audio/visual options.
  Business art starts with a Dockside Golden Reference, then Laundry, Afterdark and
  Nights using one consistent Solara direction. No later system or artwork ships now.
- Later separately scoped Active Vehicle architecture, controlled Tier 1 expansion
  (Kairo Senda / Namera Lilt), Garage comparison/usability and Tuning Foundation.
- Crew / Territory / Event references and later asset batches remain separately
  scoped and not started; no automatic asset generation follows this design pass.

The earlier Vortex Golden Reference model-integration plan is cancelled. External
Candidate A is approved only for Vehicle Art-Style Direction; its sedan is not a
canonical in-game model. Kairo KX-R Final Refinement is the approved Model Reference,
now the sole production vehicle. Preserve ART_DIRECTION.md, the canonical model
and the shared camera/lighting/showroom language. No automatic next-phase work.

## Audited future work — not implemented in POST 1C

| Priority | Item | Constraints / direction |
| --- | --- | --- |
| P1 | Next Objective / Guidance | Derive a target, progress, missing requirements/cash and navigation action from current state. No saved guidance, gameplay change, forced optimal strategy or automatic play; remain non-intrusive. Possible goals span Dockside, Dispatcher, the first vehicle, Neon, Crew and Rebirth. |
| P1 | Long-section navigation | Live audit at 320px found approximately 7,300px Operations and 10,500px Empire. Explore accessible jumps, local nav, direct Save access or selective collapsible distant systems. Preserve focus/back behavior and critical information; avoid nested accordions and new gameplay state. |
| P2 | Purchase Intelligence | Show bonus/current absolute impact and optional payback using authoritative evaluators, explicit assumptions and presentation-only estimates. Utility specialists such as Mara are not judged solely by ROI. |
| P2 | Rebirth Guidance | Eligibility progress, expected EP, concise Keep/Lose and full confirmation detail; no reward/reset change. |
| P2 | City Visual Layer | District imagery, compact city overview and eventually a Solara map with ownership/Heat/Event context. |
| P2 | Crew Visual Identity | Approved portraits, role icons and assignment visualization within the Golden Reference style. |
| P2 | Event Discoverability | Stronger active priority/direct access and eventual art. POST 1C only clarifies existing timer copy and navigation. |
| High QoL | Reset Progress / New Game | Explicit destructive warning and strong confirmation; canonical fresh replacement erases ALL temporary/permanent progress and statistics, rebases runtime/savedAt. CE1 export remains separately available. No placeholder control now. |

## Major expansions retained

Garage 2.0 and Vehicle Tuning remain high-priority future implementations. The
14-vehicle planning catalog is now documented in VEHICLE_CATALOG.md:
approved references, persistent builds, performance/visual/utility customization and
later racing/operations integration. No runtime catalog, filters, tuning or builds are implemented by the design pass.

Heat expansion sequence remains: I Risk & Reward; II Police Pressure; III District
Heat; IV MANHUNT gameplay state; V deep integration with Tuning, Safehouses, Heists,
Crew and other systems. Current Foundation Heat is unchanged. Properties, activities
and deeper city/Empire systems require separate scopes and save compatibility review.

## POST 1C verification limits

Pure formatter tests cover exact full currency, two-decimal rates, integers,
percentages, conservative compact boundaries and unchanged simulation after display.
DOM/static tests cover whole-label navigation, rate/unit structure, clear EP funding,
concrete requirements, empty slots and navigation without state/RNG/storage work.
Existing tests retain domain, migration, runtime, focus, progress and storage failures.

Local Vite starts, but the cloud browser returns `ERR_BLOCKED_BY_CLIENT`. Desktop
1265×712, 390px and 320px therefore have structural review only, not browser visual
verification. The user subsequently manually verified POST 1C live. The recorded environment
limitation above remains historical; it is not a new browser review by POST 2A. No GitHub Pages
or assistive-technology certification is claimed.

## POST 2C verification and handoff

Fresh `npm ci --no-audit --no-fund`, `npm run typecheck`, `npm run test`,
`npm run build` and `git diff --check` succeeded: **1,884 tests in 90 files**
(24 new cases). Historical migrations and CE1, current purchase/modifier/Rebirth,
vehicle write-before-publication, offline durability and all Phase 9D gates pass.
The fixed pre-9D numeric oracle explicitly retains its historical vehicle bonus;
current production tests use KX-R +10%, including auto-upgrade funding changes.

Reference PNG bytes match the exact approved source. Only the 247,612-byte WebP
is emitted for runtime, with Vite-relative asset resolution for `/Idle-Game/`.
No package/lockfile changes, other vehicles, active selection or Tuning. The original
unrelated GAME_DESIGN.md edit is outside the clean task checkout and excluded.

The built local preview starts, but Cloud Browser rejects its address with
`ERR_BLOCKED_BY_CLIENT`. Desktop, 390px, 320px, keyboard/zoom, reduced-motion and
owned/locked visual review were **not completed in a browser**. DOM/static tests
cover states, image semantics, intrinsic/contained sizing, native purchase controls
and existing navigation/accessibility. No live GitHub Pages review is claimed.
The user subsequently manually reviewed POST 2C live and approved the KX-R presentation; the browser limitation above records the implementation environment.

Authenticated GitHub shell credentials are unavailable; the completed local commit
is retained without a push. Future work must preserve canonical KX-R identity,
approved Art Style, v16 migration/CE1 and one-vehicle authority until a separately
authorized multi-vehicle migration introduces Active Vehicle.


## POST 2D verification and handoff

Implemented: global HUD Level/XP (backlog item resolved), derived Rebirth Ready
notice, local action-focus/feedback stability and compact desktop KX-R Garage.
Save v16/CE1, historical migration, KX-R balance/artwork and all gameplay remain
unchanged. No new assets, dependencies, guidance engine, notification center,
Active Vehicle or Tuning. Broader Rebirth Guidance remains a future item.

Cloud Browser rejected the running local preview with `ERR_BLOCKED_BY_CLIENT`.
Mounted DOM and CSS checks do not constitute real scroll or visual verification.
Desktop, 390px, 320px, keyboard/zoom and live Pages acceptance remain pending.
After deployment, manually check repeated Dockside upgrades and Skill/Crew
interactions; XP across sections and level-up; Rebirth Ready appearing, Review
navigation and disappearance after Rebirth; compact desktop Garage and mobile
Collection. Preserve the explicit-navigation and Import/Rebirth focus exceptions.


Fresh `npm ci --no-audit --no-fund`, `npm run typecheck`, `npm run test`,
`npm run build` and `git diff --check` passed: **1,900 tests in 91 files**,
including 16 added cases. Existing Event/Crew focus assertions were strengthened;
the existing HUD markup expectation now includes its XP progress. Migration/CE1,
Phase 9D runtime, purchase/Rebirth, content counts and balance suites stay intact.
Baseline comparison confirms both KX-R assets, save/schema/export, XP/Rebirth
rules and all domain/platform code are unchanged. No dependency changes.
Authenticated GitHub shell credentials were unavailable; no push was attempted.
The original unrelated GAME_DESIGN.md edit remains untouched outside this task.

## POST 3A verification and handoff

Business Expansion I design and evidence are complete in BUSINESS_EXPANSION.md.
Fresh npm ci, typecheck, tests, build and git diff --check passed: **1,908 tests
in 92 files**, including eight isolated analysis cases. Current controls reuse
the prior balance policy; proposed runs use real commands/rational production
with test-only lookup data. Active, idle, optimized, investment/vehicle/Nights
sensitivities and an actual second-run reset are documented with their limits.

All previously tracked non-documentation files match POST 2D byte-for-byte.
Production still has one Business; Save v16/CE1 and all historical migrations,
runtime safeguards, balance, assets and dependencies remain unchanged. Built
browser JavaScript excludes the proposed IDs and analysis catalog. No visual
change or new deployed verification is claimed. The unrelated GAME_DESIGN.md
edit is preserved outside this task checkout. GitHub shell credentials are
unavailable; retain the single local design commit without a push.

POST 3B needs explicit implementation authorization: use the exact proposed
packages, preserve pooled fractions and historical validators, and introduce
one selected automation target with the recommended v17 migration. Monitor XP
pacing and higher Dockside/EP accumulation under enabled offline automation.
POST 3C Operations navigation follows successful deployed/live 3B verification.
