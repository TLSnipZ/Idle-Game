# Post-roadmap priorities

This is the current post-roadmap status and priority source. ROADMAP.md retains
historical Base Game records. Current Save v16 / CE1 includes POST 2C vehicle
identity migration. Non-vehicle Phase 9C balance, Phase 9D runtime safeguards and
Phase 9B accessibility remain preserved contracts.

## Immediate sequence

- POST 1A: approved visual foundation, manually verified live.
- POST 1B: Deep UI Transformation, manually verified live by the user.
- POST 1C: Live UX Polish & Number Formatting, **manually verified live by the user**.
- POST 2A: **Vehicle Catalog Design Pass implementation complete**. Design and
  analysis only; live-game changes: none. See [VEHICLE_CATALOG.md](VEHICLE_CATALOG.md).
- POST 2B: **Kairo KX-R Final Refinement approved** as canonical Model Reference.
- POST 2C: **Kairo KX-R Production Integration implementation complete**;
  **live verification pending**. One vehicle only; Save v16 / CE1.
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
| High QoL | Global HUD Level / XP Progress | Future thin XP bar under/near Player Level across all five primary sections; current XP / next-level context and MAX LEVEL. Use existing authoritative XP/Level selectors, semantic accessible progress and compact mobile treatment. Not implemented in POST 2C. |
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
The user must manually verify deployment before the next Garage phase.

Authenticated GitHub shell credentials are unavailable; the completed local commit
is retained without a push. Future work must preserve canonical KX-R identity,
approved Art Style, v16 migration/CE1 and one-vehicle authority until a separately
authorized multi-vehicle migration introduces Active Vehicle.
