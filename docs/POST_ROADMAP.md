# Post-roadmap priorities

This is the current post-roadmap status and priority source. ROADMAP.md retains
historical Base Game records. Save v15, CE1, stable IDs, Phase 9C balance, Phase 9D
runtime safeguards and Phase 9B accessibility remain frozen contracts.

## Immediate sequence

- POST 1A: approved visual foundation, manually verified live.
- POST 1B: Deep UI Transformation, manually verified live by the user.
- POST 1C: Live UX Polish & Number Formatting implementation complete; **live
  verification pending**. Presentation-only changes; no assets or content added.
- POST 2A: Vortex S9 Golden Reference, next after POST 1C live approval; not started.
- POST 2B: Crew / Territory / Event Golden References; not started.
- Then controlled, small reviewed asset-production batches; not started.

Vortex comes first because the text-only Collection has the largest gap from its
premium showroom intent. Inspect ART_DIRECTION.md and the optional showroom region.
Produce only a small candidate set, preserving perspective, camera height, focal
length, scale, placement, lighting, contact shadow and responsive crop contracts.
Only explicit user approval promotes a candidate to an authoritative reference.

## Audited future work — not implemented in POST 1C

| Priority | Item | Constraints / direction |
| --- | --- | --- |
| P1 | Next Objective / Guidance | Derive a target, progress, missing requirements/cash and navigation action from current state. No saved guidance, gameplay change, forced optimal strategy or automatic play; remain non-intrusive. Possible goals span Dockside, Dispatcher, Vortex, Neon, Crew and Rebirth. |
| P1 | Long-section navigation | Live audit at 320px found approximately 7,300px Operations and 10,500px Empire. Explore accessible jumps, local nav, direct Save access or selective collapsible distant systems. Preserve focus/back behavior and critical information; avoid nested accordions and new gameplay state. |
| P2 | Purchase Intelligence | Show bonus/current absolute impact and optional payback using authoritative evaluators, explicit assumptions and presentation-only estimates. Utility specialists such as Mara are not judged solely by ROI. |
| P2 | Rebirth Guidance | Eligibility progress, expected EP, concise Keep/Lose and full confirmation detail; no reward/reset change. |
| P2 | City Visual Layer | District imagery, compact city overview and eventually a Solara map with ownership/Heat/Event context. |
| P2 | Crew Visual Identity | Approved portraits, role icons and assignment visualization within the Golden Reference style. |
| P2 | Event Discoverability | Stronger active priority/direct access and eventual art. POST 1C only clarifies existing timer copy and navigation. |
| High QoL | Reset Progress / New Game | Explicit destructive warning and strong confirmation; canonical fresh replacement erases ALL temporary/permanent progress and statistics, rebases runtime/savedAt. CE1 export remains separately available. No placeholder control now. |

## Major expansions retained

Garage 2.0, a vehicle catalog and Vehicle Tuning remain high-priority future work:
approved references, persistent builds, performance/visual/utility customization and
later racing/operations integration. No catalog, filter, tuning or build work here.

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
verification. User live approval must check density, first actions, intact nav labels,
rate grouping, long values, all five sections and error/focus states. No GitHub Pages
or assistive-technology certification is claimed.
