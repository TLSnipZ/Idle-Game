# Tier-1 Garage

Gameplay implementation and automated verification complete in PR #27, from
`ba36d2abb3e1e666463d6eae916f8c53fc06b245`. Model artwork was subsequently approved; see the artwork integration note below.
Executed evidence and separate release status are recorded below.

| Vehicle | Cost | Acquisition gates | Effect while active |
| --- | --- | --- | --- |
| Kairo KX-R | $25,000 | Player 5 / owned Dockside 5 | +10% global Business Production |
| Kairo Senda | $40,000 | Player 6 / owned Dockside 7 | +12% manual Job Cash |
| Namera Lilt | $55,000 | Player 7 / owned Dockside 8 | Heat cooling interval minus 3 seconds |

Each model can be bought first. First purchase activates; later purchases retain
selection. One active effect, no collection stacking, switch fees, tuning or new
currencies. Requirements apply to acquisition only. Rebirth retains the full Garage;
New Game clears it. KX-R price, effect and approved artwork remain unchanged.

## Shared calculations

Job reward targets now optionally carry manual/dispatcher context. Unscoped existing
equipment, Rico, territory, skills and Heat effects apply to both. Senda applies
only to explicit manual evaluation. Dispatcher simulation and presentation request
dispatcher context. Flat-before-percent rational arithmetic and final per-job Cash
flooring remain unchanged, as do outer Dispatcher XP/Heat batching.

A shared integer `reduce-interval` modifier enters the existing central collector.
Heat derives its Crew interval first (60s, or 45s with assigned Mara), then subtracts
Lilt's 3s (57s / 42s). The common duration evaluator has a 1s lower bound for
defensive validity; no current combination approaches it. No Money units are used
for durations. Existing numerical remainder, zero-Heat no-banking, positive-elapsed
ticks and gain-before-decay are retained. Selecting Lilt never grants an immediate
cooling tick.

All changes use the existing durable vehicle transaction: reconcile old effects,
save the complete candidate, publish, then use new effects prospectively. Failure
retains reconciled old selection and old durable data. Earned production fractions
survive; only a genuine effect change resets runtime sub-millisecond duration.
Offline credit completes with the saved selection before interaction.

## Save v19

The Garage shape is unchanged. A version boundary freezes historical v16-v18
ownership to KX-R, so future IDs cannot be injected into old saves. Sequential
v18-to-v19 validation preserves all state and timestamps exactly, without granting
cars or rewards. Earlier historical identities/migrations remain intact. Current
v19 permits the three configured vehicles with exactly one owned selection.
CE1 is unchanged; local/import validation and write-before-publication are shared.

## Presentation and artwork

Three complete, localized vehicle cards explain effects, gates, price and active
ownership. EN/DE use distinct model descriptions; Villager transforms every word.
Native purchase/selection controls and existing responsive Garage layout are retained.
All three models now have individual artwork. The user approved the blue Senda
and red Lilt after the PR #27 handoff. Clean standalone PNG derivatives are retained
as production masters; only optimized WebP files are runtime-imported. See
ART_DIRECTION.md for provenance. Save v19, CE1, balance and switching are unchanged.

## Balance interpretation

These are optional horizontal choices, not an instruction to buy the entire $120k
collection. Senda adds $3 to a base $25 manual delivery: 13,334 such jobs recover
$40k in isolated gross bonus, before other modifiers, Heat and opportunity costs.
At one job per 5s this is approximately 18.5 hours of continuous activity; this
is a marginal illustration, not a recommended strategy or time-to-purchase model.
Lilt saves 3s per cooling point (5% / 6.67% shorter base/Mara intervals), with no
direct Cash payback. Both choices sacrifice KX-R's active production bonus.
Existing KX-R integrated route evidence is historical; no new optimal-route or
guaranteed-playtime claim is made. Post-release feedback should assess whether
these specialized permanent alternatives justify their capital cost.

## Acceptance

Require strict build, the entire existing suite with no failures/skips, new
purchase/context/cooling/migration/runtime regressions, and production Chromium
checks at 320/390/740/1024/1440px in EN/DE/Villager. Test real three-car purchase,
first/later activation, keyboard switching, storage and reload in addition to
historical Garage bootstrap and the whole-game audit. Record executed evidence;
automated screenshots do not constitute user model approval.

Heat / Police 2.0 remains the following separately authorized phase.

## Executed verification — 2026-09-13

[Run 34766756642](https://github.com/TLSnipZ/Idle-Game/actions/runs/34766756642)
verified code commit `54e507f518deeae0b7aab769e46399fc7ed8812e`:

- Fresh Node 24 install, strict TypeScript/Vite production build and whitespace checks passed.
- **2,283 / 2,283 tests pass**, zero failures, skips, TODOs or runtime-error suites.
  All 31 added cases pass; no existing test case was removed or disabled.
- **45 Garage Chromium cases**: historical v17 owner/non-owner bootstrap, original
  purchase/art/reload checks, plus 15 actual three-car purchase/keyboard-switch/reload
  flows in EN/DE/Villager at 320/390/740/1024/1440px.
- **225 whole-game Chromium section cases** pass across all three locales, five
  widths and fresh/mid/advanced state. No overflow, clipped financial metrics,
  broken loaded images or page errors. Settings/focus/locale changes, feedback,
  export/invalid import, automation, Crew, Events, skills, Rebirth and RESET pass.
- [Reports and screenshots](https://github.com/TLSnipZ/Idle-Game/actions/runs/34766756642/artifacts/10320792797)
  are retained for seven days. Automated browser checks do not replace human
  visual/model approval.

[PR #27](https://github.com/TLSnipZ/Idle-Game/pull/27) records merge and Pages
deployment status separately. The final evidence commit changes documentation only;
the code verified above is unchanged.

Model Candidate A review sheet was generated in this task conversation: steel-blue
Senda fixed-roof coupe and red open-top Lilt. At that historical checkpoint neither candidate was approved or
integrated. The next Garage checkpoint is explicit approval/refinement and separate
production artwork integration. Heat / Police 2.0 is not started.

## Artwork integration

Tier-1 artwork integration is implemented on `art/tier-one-vehicles`. The user approved the blue Senda and red Lilt with “Leg los broooo” after the explicit model-approval question. Clean standalone derivatives and optimized WebP delivery are included; verification and deployment are tracked in the artwork PR. Heat / Police 2.0 follows this release and is not started here.
