# Workshop purchase insight

## Scope

First implementation slice of the retained Purchase Intelligence priority in
POST_ROADMAP.md, selected after the user authorized one further phase.
Baseline: PR #49, `53f07fcf35bea65e7f02b8896e1fbecee00910a9`.
At kickoff PR #49 was open, not merged; main remained `d96067ec`.
This separate follow-up targets `feat/tier-two-customization`; merge IV-D before
retargeting/merging this work into main. Never merge this into the IV-D branch as
a substitute for reviewing the two scopes separately.

## Player behavior

Each of the twelve setup cards in the Workshop offers an initially closed
“Compare effects” / “Wirkung vergleichen” disclosure.
It shows the current fitted setup and the candidate under identical conditions:

- Total owned Business Production per second.
- Standard manual delivery Cash per job.
- Dispatcher Cash per job, using Waterfront Heat.
- Seconds per Heat cooling step (when cooling or decoy costs change).
- Local decoy price, including eligible Business and assigned Crew support
  (when cooling or decoy costs change).

Both columns assume the workshop car is active. An explicit notice explains that
fitting an inactive car does not change current earnings. This is a same-car setup
comparison, not a comparison against the player's currently active different car.
The previous setup is removed in the candidate, so losses are visible alongside
gains. Vehicle base effects remain. A fitted part compares equal to itself.
Unowned cars have no comparison; an unowned Dispatcher is clearly marked as a
hypothetical payout. No purchase, fitting, activation or persistent write occurs
when opening the disclosure. Existing purchase controls remain the only actions.

Values are a snapshot with current bonuses/Heat, not sustained income or guaranteed
payback. Job values apply when that action is available. Production rounds for
display using the existing rate formatter; domain values retain exact fractions.
Lower cooling intervals and decoy costs are explicitly described as beneficial.
Reinvestment, future Heat, manual click frequency and payback estimates are outside
this slice. No optimal-buy badge or misleading income recommendation is introduced.

## Implementation and compatibility

`src/game/tuning-insight.ts` constructs temporary immutable counterfactual states
and delegates to the existing production, delivery, cooling and decoy evaluators.
Candidate ownership is introduced only in that local calculation, including when
the player cannot afford the part; it never enters a transition or saved state.
Unknown parts/unowned cars produce no insight. Economic evaluator overflow suppresses
the comparison. UI only formats the results, with native keyboard-accessible details,
EN/DE copy and the existing Villager transformation. The compact card stays closed
by default and wraps at mobile widths, including enlarged text.

Save v26 / CE1 is unchanged. No new saved fields or migrations. All prices,
modifiers, job rules, simulation, persistence, six cars, seventeen-identity wishlist
and approved PNG/WebP/SVG artwork remain unchanged.

## Acceptance and verification

Behavior tests cover all twelve real replacements, nonmutation, equal fitted
comparisons, fractional production losses, scoped delivery rewards, local versus
Waterfront Heat, Crew/Business support, zero Cash, no Businesses and ownership.
Browser verifier: `scripts/verify-tuning-insight.mjs`, three locales by five widths
(320, 390, 740, 1024, 1440). It checks keyboard disclosure, exact visible numbers,
inactive-car explanation, no Garage mutation on inspection, real purchase refresh,
Lilt tradeoffs, unowned model handling, reload and 125% text containment.
The shared CI also retains all existing regression/browser matrices. Its trigger
includes the IV-D branch so the dependent PR receives the same checks.

Implemented in [PR #50](https://github.com/TLSnipZ/Idle-Game/pull/50).
Final full CI passed on `16458e9d26214c41e2eecb6babd9f6b8ade66993`:
[run 34895241848](https://github.com/TLSnipZ/Idle-Game/actions/runs/34895241848).
Strict production build, all **2,643 tests** (zero failures/skips), every existing
browser matrix and the new **15 purchase-insight cases** passed. This includes
225 layout cases and the IV-D 45-case / 100-pixel-comparison regression.

Local build and all 17 focused behavior cases passed. The local compact-layout
matrix passed 15 cases, and German mobile/desktop screenshots were reviewed.
Initial full CI caught the unconverted `/sec` unit in Villager. The fix routes
formatted rates through the existing language transformer and adds a readable-prose
assertion to the new browser matrix; the complete rerun above passed. The final
completion commit updates this document only, without changing verified code.

PR #49 remained open at kickoff; PR #50 is its dependent follow-up, not a release.
Neither merge, deployment nor live acceptance is claimed here. Merge #49 first,
retarget #50 to main and verify integration checks before merging #50.
