# Tier 2 — catalog and progression decision

## Status

Garage IV-A, the catalog/progression analysis requested after PR #41, is complete.
Baseline: `232a3a97a99337e31f6a78f7e85f12f4293cdac6`, Save v23 / CE1.
This is a design and executable-analysis checkpoint. No new vehicle, save version,
artwork, tuning or reward is enabled in the game by this change.

The user reports that paint coverage is improved but still imperfect and explicitly
deferred further paint work. PR #41 verification must not be represented as full
visual acceptance. Resume that polish only in its own later patch.

## Decision: three optional workshop-era choices

| Proposed identity | Price | Acquisition requirements (all) | Active base effects |
| --- | ---: | --- | --- |
| Namera Serein | $80,000 | Player 10; own Afterdark Customs at Level 1 | +26% manual delivery Cash |
| Toseki Rendan | $115,000 | Player 12; own Afterdark Customs at Level 3 | +18% manual and Dispatcher Cash |
| Sevrin Canto Club | $165,000 | Player 14; own Afterdark Customs at Level 5 | +18% Business Production; +12% Dispatcher Cash |

These supersede the old Tier-2 numerical proposals in VEHICLE_CATALOG.md only.
Prices remain familiar; progression now follows the expanded Business chain.
No Tier-1 car, collection completion, Rebirth, new currency or racing reputation
is required to acquire a Tier-2 car. Choose any eligible model independently.
After Rebirth, retained ownership remains usable without re-meeting acquisition gates.

Only the active car contributes base effects. Stock Tier-2 release has no parts or
alternate finishes; show clear stock-only presentation rather than empty purchase
controls. Existing Tier-1 tuning and paint selections remain intact.

Serein is a higher manual payout, Rendan a delivery hybrid, Canto an idle upgrade.
These labels describe effects, not a promise that every car maximizes total income.
Drift, AWD grip and chassis personality remain artwork/lore until real activities
consume those properties. No fake handling statistics.

## Why the historical proposals cannot ship unchanged

The earlier Serein +16% pays $29 on a cold $25 delivery. A current Senda with
Express ECU pays $30.24 (+20.96%) and costs $58,000 including the part.
An $80,000 Serein therefore needs more than its historical bonus; +26% pays $31.50.

The earlier Canto +5% Business / +12% Dispatcher loses to KX-R Fleet's +15.5%
production in every tested workshop-era portfolio. At entry, its idle total is
$76.5625/sec against $83.63875/sec for the $40,000 KX-R/Fleet combination.
The revised +18% Business effect gives Canto a measurable passive upgrade.
Rendan +18% pays $29.50 in both delivery contexts, above its historical $27.50,
while keeping Serein ahead in manual payout and Canto ahead in passive output.

This exposes a broader limitation: Business production outweighs manual delivery
income at these portfolios. Even the revised Serein and Rendan lose total Cash/sec
to KX-R Fleet in the illustrative one-manual-job-per-five-seconds comparison.
They are optional collection/specialization purchases. Do not sell them through
Next Objective as mandatory or economically optimal investments. A later Operations
reward pass should evaluate their usefulness before adding more manual-only tiers.

## Reproducible evidence

Run:
`npx vitest run src/game/tier-two-design-analysis.test.ts`

Eight cases use the real modifier evaluator, whole-job flooring, actual Dispatcher
interval, actual Business prices/levels and shared requirement evaluator.
Proposals remain local to this test file and cannot enter production lookup or saves.
The test compares all three stock cars and all six currently fitted setups against
historical and revised Tier-2 effects.

| Fixed portfolio (Dockside / Laundry / Afterdark / Nights) | Base production/s | KX-R Fleet idle/s | Revised Canto idle/s | Canto gross marginal payback |
| --- | ---: | ---: | ---: | ---: |
| 7 / 10 / 1 / none | $70.25 | $83.63875 | $85.695 | 22.29 h |
| 15 / 10 / 5 / none | $136.25 | $159.86875 | $163.575 | 12.37 h |
| 25 / 15 / 8 / 1 | $253.75 | $295.58125 | $302.225 | 6.90 h |

Assumptions: cold $25 job, Dispatcher every 10 seconds, no Crew, upgrades, skills,
territory boosts or Events. These are fixed-rate counterfactuals, not sustainable
Heat simulations or time-to-unlock forecasts. The entry portfolio deliberately
compares effects even though it does not yet meet Canto's Level-5 workshop gate.
Capital already spent on KX-R/Fleet is sunk; payback uses the full new $165,000,
no resale or hypothetical refund. No Business reinvestment occurs during payback.

Serein's incremental $1.26 per cold job over Senda Express takes 63,493 jobs to
recover $80,000 in isolation (88.18 hours at one job per five seconds). That is
not a recommended route. Heat, bonuses, missed jobs and production opportunity
cost make a real route different. Lilt cooling/decoy utility is not valued as Cash
in these comparisons; its original niche remains.

### Business-chain capital and XP gates

| Car | Required Business-chain capital | Car price | Combined capital floor | Player XP threshold |
| --- | ---: | ---: | ---: | ---: |
| Serein | $458,800 | $80,000 | $538,800 | 8,100 |
| Rendan | $478,800 | $115,000 | $593,800 | 12,100 |
| Canto Club | $578,800 | $165,000 | $743,800 | 16,900 |

The floor includes Dockside purchase through Level 7, Laundry purchase through
Level 10, and Afterdark purchase through the proposed required level. It excludes
optional purchases and extra XP-generating actions, so it is not a sufficient
complete route or required cash balance. Existing workshop owners pay only the car
price if already eligible. No production grants, unlock-time money or fabricated XP
are used. Boundary tests reject missing ownership and one-below level/XP gates.

## Implementation sequence and acceptance

Next bounded phase: **Garage IV-B — Serein production pilot**.

1. Produce one original Serein model reference: low turn-of-millennium FR coupe,
   long hood, compact fixed roof, distinct lamps/badges, same waterfront composition
   and visual treatment as the current Garage. Complete and present the actual
   reference before requesting any asset approval required by ART_DIRECTION.
2. Integrate Serein at the price/gates/effect above through existing purchase,
   active selection, shared requirements and modifier collection.
3. Advance to Save v24 with sequential v23 validation frozen to the three old
   vehicle IDs before expanding current lookup. Preserve ownership, active car,
   builds, finishes, timestamps and unrelated state; grant nothing. CE1 stays.
   Historical v23 must reject injected Serein; current saves reject unknown or
   unowned active IDs and incompatible parts/finishes.
4. Add fully localized EN/DE satire and complete Villager text. Example Serein copy:
   EN: “The delivery is express. The explanation to your accountant is not.”
   DE: “Express geliefert. Dem Steuerberater erklären wir das in Zeitlupe.”
   Factory-only Serein stays visible in Garage while unsupported workshop/paint
   actions are excluded or explained without activating another car.
5. Test purchase gates/funds, first/later activation, no Dispatcher bonus, exact
   modifier stacking, old-effect reconciliation, quota/conflict rollback, offline,
   CE1/migration, Rebirth and New Game. Run production browser flows at all existing
   widths/locales; check art load, keyboard access, save/reload and overflow.

Follow with **IV-C — Rendan/Canto integration**, rechecking the chosen roles against
the pilot. Canto requires a plural base-modifier contract; replace the singular
vehicle modifier coherently and collect each active effect once. Do not simulate
its second effect as free tuning or silently attach it to inactive ownership.

**IV-D — Tier-2 tuning/finishes** follows stable model artwork and player feedback.
Do not mass-generate cars or copy Tier-1 masks onto new silhouettes.
Tier-3–5 prices/effects remain historical proposals: in particular the old Caron
+16% Business cannot be released unchanged above the revised Canto +18%.
Re-evaluate those tiers before implementation instead of treating old rows as final.

## Verification record

Production build and all eight isolated analysis cases passed locally.
GitHub PR records the exact source commit, complete regression results and merge
status. Existing game/runtime behavior is unchanged by this checkpoint.
