# Next Objective / Guidance

## Status and scope

Implemented after the New Game reset, from merged `main` at
`27a6241d27c10b10940a4b9181131a1da3df1452`. Deployment and visual acceptance
are separate. The user reported the New Game feature working after merging PR #1.

A compact **Next Objective** panel is shared across Overview, Operations, City,
Collection and Empire. It shows an achievable next step toward a named goal,
relevant Level/XP progress, exact missing Cash or EP, and a navigation-only button.
It lives outside the active-section subtree; it is **not** a sticky HUD. Adaptive
HUD morphing, Activity Center and global Event decisions remain a later update.

## Suggested route and optional goals

The default route prioritizes acquiring Dockside, hiring the Delivery Dispatcher,
and then the first unowned Business in the authoritative catalog order. Once the
current Rebirth requirements are satisfied, Rebirth is highlighted with the exact
shared reward preview. Otherwise, after the portfolio is acquired, guidance helps
reach Rebirth's prerequisites. This is an understandable milestone path, **not** a
claim of optimal ROI, shortest Rebirth, or mandatory purchases.

**Choose another goal** exposes a labeled native selector in a collapsed details
area. A player can follow another Business, either automation purchase, the KX-R,
a Territory, Crew recruit, equipment upgrade, skill ranks, or Rebirth. All names
and candidates come from implemented catalogs. Owned acquisitions and maxed skills
are excluded. A completed chosen goal falls back to the suggested route. A manually
chosen unfinished goal is not displaced merely because Rebirth becomes eligible.

Choice is in-memory UI state only. It survives normal section navigation but resets
on reload and successful Import, Rebirth or New Game. A failed replacement does not
clear it. No guidance fields, completion rewards, achievement unlocks or tracking
history are added to GameState, local storage or CE1.

## Prerequisites and exact decision information

`src/game/guidance.ts` is a pure selector, using `evaluateRequirements` and the
existing Business/XP/skill/Rebirth helpers. It resolves unmet content prerequisites
before Player-Level prerequisites where possible, since paid Business upgrades
also grant XP. It never copies acquisition gates or prices into a separate quest
configuration. Missing Business ownership is not interpreted as Level 1.

Examples under the current POST 3D gates:

- Afterdark selected, Laundry Level 7: **Grow Neon Laundry to Level 10**, with
  **7 / 10** and the exact price of the **next single Level**. That price is not
  presented as the cost of the entire three-Level goal.
- Nights selected, Afterdark developed but Neon Mile missing: guide the Territory's
  own prerequisites, then its acquisition, before Nights. The Territory retains
  its actual Player/Dockside gates and price.
- Player Level missing: show current/required Level with an XP-based progress bar,
  and navigate to Jobs; deliveries and paid upgrades remain alternative XP sources.
- Skill EP missing: show current EP / next-rank cost and navigate to the Rebirth
  review area. The player must independently satisfy and confirm Rebirth.

Money remains canonical integer-cent strings. Cash shortages use exact Money
helpers; only a bounded **display percentage** is converted from BigInt to Number.
No simulated future earnings, arbitrary ETA, guessed payback, or aggregated
prerequisite-investment estimate is presented. The full requirement list and any
session/storage availability remain on the destination card.

The resolver is bounded by visited goal IDs and rejects cyclic content dependencies
rather than recursing indefinitely. Each new requirement kind must be handled
explicitly. Current-state ownership is authoritative: old owners are never sent
through new acquisition gates just to keep production or upgrades active.

## Navigation, accessibility and runtime boundaries

The panel receives only state and a navigation callback, not purchase/assignment/
Rebirth/reset commands. Clicking **View ...** switches to the existing section,
focuses the exact existing card heading, and intentionally scrolls to it. Navigation
is also meaningful within the already-active section. IDs containing colons are
resolved with `getElementById`, not unescaped CSS selectors. A missing presentation
target safely falls back to the section heading. No button buys, spends, assigns,
enables automation, submits an Event, or opens Rebirth confirmation.

Guidance, optional tracking and its navigation do not read clocks, reconcile,
consume RNG, write storage or create timers. The central runtime and its existing
feedback stay authoritative. Ordinary acquisitions/upgrades keep stable component
identities and the prior local `preventScroll` focus recovery. Passive updates do
not invoke guidance navigation or steal focus. Rates/progress and the panel are not
live regions; the existing Rebirth announcement is retained without a second one.

Native headings, button, details/summary, labeled select and labeled progress
provide keyboard and assistive-technology structure. Controls retain at least
44px height; text and exact prices can wrap. The layout stacks on narrow screens
and grows with zoom rather than clipping. No motion or animation is introduced.
Real responsive layout/scroll acceptance still requires a browser review.

## Cross-system integration and freeze

| Existing system | Guidance integration / invariant |
| --- | --- |
| Businesses and equipment | Catalog-backed names, gates, exact next-upgrade/acquisition costs; no purchase changes. |
| Dispatcher and Auto-Upgrader | Optional acquisition goals. Disabled automatic spending is not treated as unfinished ownership and is never auto-enabled. |
| Territories and Crew | Gates and Cash derived from their own catalogs; recruitment note reminds the player that assignment is separate. |
| Garage | KX-R is optional; permanent ownership remains valid after Rebirth. No Active Vehicle or Tuning. |
| Skills / EP / Rebirth | Rank dependencies, EP affordability, original requirements/reward preview; no forced build or reset. |
| Offline / Events / Heat | Reads only the already-published state. No new time advancement, RNG, Event choices, or Heat effects. |
| Save / Import / New Game | Save v17, CE1 and migrations unchanged. Successful replacement clears only UI tracking via existing replacementSequence. |
| Achievements / Statistics | Remain observational; guidance visits earn nothing and add no counters. |
| UI / future Settings | Shared all-section placement, optional tracking, existing navigation/focus. Localization and HUD 2.0 remain deferred. |

Future content updates must audit the catalog-driven goal list, new dependency kinds,
navigation targets and regression cases. Generic enumeration is not a substitute
for balancing a newly extended suggested route. Current prices, production,
content counts, modifiers, automation/offline chronology and reset policies are
unchanged. No assets or dependencies were added.

## Verification and handoff

Focused tests cover catalog/gate boundaries, missing prerequisite ownership, exact
Cash, rank dependencies, optional goals, ready/extended Rebirth, retained owners,
no clock/RNG/state mutations, v17/CE1, actual acquisitions/upgrades, and offline
snapshots. Mounted tests cover global placement, all destination domains, no extra
runtime/storage work, stable controls/focus, and Import/Rebirth/New Game tracking
invalidation. Existing gameplay/runtime/reset suites are retained unchanged.

Local Chromium navigation to the preview was blocked with
`ERR_BLOCKED_BY_ADMINISTRATOR`. Desktop, 390px/320px, zoom and real keyboard/scroll
visual acceptance remain pending; mounted DOM/CSS checks do not replace them.
No real player save was modified during verification. The final report and PR
record the exact local and fresh GitHub Actions results for the feature commit.

Next separately authorized phase: **Settings & Localization Foundation**. Then
**Global HUD 2.0 / Activity Center → Solara City Branding → Business Visual Identity
→ Active Vehicle + Tier-1 Garage → Heat / Police 2.0**. Nothing from those phases is
implemented here.

Local implementation verification: **2,142 passing tests across 103 files**, with
65 new cases in two Guidance suites and all existing tests unchanged. Typecheck,
production build and `git diff --check` passed using Node 22.16 and restored
lockfile dependencies. A separate fresh Node 24 GitHub Actions verification is
required before the delivery PR is marked ready; its result is recorded in the PR.
