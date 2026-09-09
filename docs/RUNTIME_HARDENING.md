# Phase 9D Runtime Hardening Audit

Baseline: `f3a8631bb056277ec56ce304ad294c47de4e8da9`. Recovery inspection found
three modified runtime files and three new test/fixture files, no staged changes
and no Phase 9D commit. Those changes were reviewed rather than assumed complete.
The original checkout's unrelated GAME_DESIGN.md edit remains excluded.

## Findings and changes

- Zero elapsed previously evaluated production, modifiers, Dispatcher and statistics
  despite returning no progress. The composed simulation now returns after the
  inexpensive existing automation-shape corruption check.
  Runtime sub-ms callbacks retain their fraction without simulation/publication.
- Auto-Upgrader already collapsed absent/max-level attempts and bypassed segmentation
  when disabled/unowned. These optimizations are retained, not new Phase 9D work.
- Purchase-capable simulation previously had no independent resource bound for very
  large direct inputs. A 4,096-segment work budget and positive-advance invariant now
  guarantee termination. Exceeding it returns `simulation-limit` atomically. Supported
  offline durations fit entirely; unusually long online/direct calls may now fail
  safely rather than monopolize the thread. A final max-level collapse remains allowed.
- Prefix Dispatcher planning repeats some validation/evaluation at boundaries. The
  bounded 12h load is small enough to retain this clear, proven path. No speculative
  cache or alternate solver is justified by the measured test workloads.
- Money, XP, statistics and production precision failures retain the original candidate.
  Runtime failure cancels simulation, blocks command execution and prevents autosave
  from writing partial work. No infinite retry path was added.
- Offline bootstrap writes exactly one complete candidate before publication. Immediate
  reload cannot replay it. Import never simulates historical timestamps; Rebirth keeps
  pre-reset reconciliation and durable reset. Ordinary command write failures retain
  completed live actions and the recoverable previous save, as already documented.
- Autosave is five seconds, separate from 250ms refresh. Successful meaningful commands
  still save normally. No persistence changes are warranted.
- Only active section content renders. Runtime, import/Rebirth controllers and feedback
  live above it. Small bounded catalogs are not an obvious rendering hotspot; no React,
  focus, live-region or CSS changes were made.

## Deterministic workload evidence

The two complete outputs below were captured with the unmodified baseline simulation
before runtime edits. Tests compare every resulting state field and result metadata,
including exact fractional remainders; expected values are not recomputed from the
implementation under test. Fixtures use all equipment, Vortex, Mara/Jax, permanent
modifiers, Heat 79 with 50s remainder, Dispatcher progress 7s and Auto-Upgrader progress
20s. Inputs are deeply frozen during simulation to detect mutation.

| 12h fixture | Start cash | Final Dockside | Final cash | Final XP | Upgrades | Upgrade spend |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Starts at L25; production must fund purchases | $0 | 46 | $67,924.54 | 60,427 | 21 | $3,974,250 |
| Starts at L95; funded max-level path | $10,000,000 | 100 | $13,803,731.20 | 59,995 | 5 | $7,058,250 |

Both complete 4,320 Dispatcher jobs, earn 23,760 Dispatcher XP and $169,344 job
income, finish at Heat 0 and retain Auto-Upgrader progress 20s. Offline consumes
zero Event RNG. Gross business income is $3,872,830.54 / $10,692,637.20 respectively.
The first fixture includes repeated unaffordable attempts; the second reaches max
and collapses the remainder. Tests assert no more than 1,441 production segments.
Maximum-safe elapsed at an already maxed business requires one production call.

Additional coverage exercises empty/light and normal Crew/Dispatcher states at 1ms,
1s, 1min, 1h, 8h, 10h and 12h; invalid elapsed; sub-ms clock accumulation; huge direct
work failure; exact Dispatcher outer floor/Heat; Event draws; pending events; Mara
and default decay; exact production partitioning; and atomic overflow/storage failure.
No sleeps or wall-clock pass/fail performance thresholds are used.

## Complete requirement coverage checklist

Numbers refer to the authoritative Phase 9D Parts 1 and 2. Existing suites are retained
and rerun alongside focused additions; they need not be copied into new tests.

| Requirements | Audit and verification evidence |
| --- | --- |
| 1–3 | Config/save diffs unchanged; central game-runtime remains the sole clock path |
| 4–7 | game/runtime-hardening, platform/runtime-hardening, game-runtime tests: invalid/zero/fractional/large elapsed and anchors |
| 8–13 | simulate-auto-upgrader review; bounded work, advance invariant, max/disabled paths; auto-upgrader and runtime-hardening exact production tests |
| 14–17 | simulate-automation, Heat and Crew review; auto-upgrader, heat, crew-runtime and runtime-hardening tests preserve outer floors/Mara |
| 18–20 | simulate-online-elapsed review; event-runtime/events/runtime-hardening count RNG and pending behavior |
| 21–23 | local-save/offline-progress review; auto-upgrader-runtime, offline-bootstrap and runtime-hardening tests cover capped catch-up, one-time credit and rollback |
| 24–27 | persistent-game review; five-second autosave, command saves, import/Rebirth durable tests unchanged |
| 28–32 | Frozen fixtures, exact repeatability/production partitions and atomic overflow tests; intentional outer-batch differences retained |
| 33–37 | App/use-game/SectionContent/selectors/GlobalFeedback audit; only active tree renders, controllers/live regions stable; navigation-interaction/accessibility tests |
| 38–43 | No worker, dependency, content, balance, cache or schema changes; deterministic call-count guards instead of flaky benchmarks |
| 44–45 | ARCHITECTURE and ROADMAP updated with actual changes and phase status |
| 46–49 | Light/normal/heavy/max-offline fixed fixtures, max collapse and disabled/unowned operation counts |
| 50–52 | Zero/invalid/huge elapsed tests; work-limit suspension prevents writes/retries |
| 53–55 | Exact Dispatcher 11-job batch gives 60 XP with Learn rank 1; Heat gain remains floor(jobs/5); existing Rico/Mara comparisons retained |
| 56–58 | Event 0/1/2 draw cases, no-eligible zero-draw shipped contract, outer modulo, pending long elapsed |
| 59–61 | Heat 0/59,999ms/Mara 50,000ms, assignment-preserved remainder; exact rational production split/combined tests |
| 62–65 | Money/XP/statistics outer failures; existing Rebirth EP/count overflow and storage failure suites |
| 66–71 | One-write offline candidate/reload, future timestamps, autosave/command write counts; existing upgrade/Crew/Event/toggle/Rebirth/import transaction tests |
| 72–76 | No render refactor needed; existing mounted navigation tests cover all five sections, preserved controllers, no extra RNG/time/save and focus/accessibility |
| 77–80 | Fixed baseline outputs plus existing exact economy suites; balance-audit, auto-upgrader, save-v15 and catalog tests protect config/schema/content |
| 81–85 | This audit, architecture and roadmap; no speculative optimization or out-of-scope work |
| 86–90 | Full final npm ci/typecheck/test/build/diff checks, complete diff and scope review, one focused commit, clean task checkout and credential-aware push |
| 91–93 | Final report and Phase 9E preservation handoff; stop after 9D |

## Review limits and handoff

Automated DOM tests exercise navigation, controls, feedback and focus; they are not
browser performance measurements or assistive-technology certification. Local Vite
startup succeeded, but browser access returned `ERR_BLOCKED_BY_CLIENT`, preventing
a visual/browser performance review. No GitHub
Pages verification is claimed for 9D. Keep environment-dependent timings descriptive,
never a brittle CI threshold. No browser-rendering change was necessary.

Phase 9E must retain post-9C balance, these runtime safeguards, save v15/CE1, exact
Dispatcher/Heat/Mara/Event contracts, chronological spending, both production
remainders, offline durability, atomic import/Rebirth, achievements/statistics,
existing content counts, five-section navigation and Phase 9B accessibility.
