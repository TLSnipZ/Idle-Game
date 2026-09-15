# Garage V-A — Tier-3 Vehicle Progression & Catalog Design

Status: **COMPLETE**. Baseline: `main` at `3a718570a85ddf743d5c3345bb313f9a342b6039`, Save v27 / CE1, six live vehicles and Operations Balance II with the Standard Delivery cooldown regression repaired.

V-A is a design/balance checkpoint only. It adds executable regression analysis and locks the Tier-3 production contract; it does **not** add a seventh playable vehicle, artwork, save fields, free unlocks or unrelated economy changes.

## Runtime facts used

The decision uses the current evaluators, not historical catalog math. Owned Business base production is summed before Operations scaling: manual base Cash is `max($25, P × 8s)` and Dispatcher base Cash is `max($25, P × 1s)`. Standard Delivery is freely repeatable; only Risky and Discreet Delivery use the shared 10-second special-readiness slot. Percentage sources multiply in the shared modifier pipeline. One active vehicle contributes its base modifiers plus at most one fitted setup.

Current acquisition ladder ends with Solara Nights: $400,000, Player 16, Afterdark 8 and Neon Mile ownership. Its $40/s × level output makes Tier-3 a post-Nights progression layer rather than an immediate follow-up to Canto Club.

Current tuned Tier-2 specialty factors used as guardrails are Serein manual `1.26 × 1.08 = 1.3608`, Rendan Dispatcher `1.18 × 1.12 = 1.3216`, and Canto production `1.18 × 1.05 = 1.239`. Tier-3 beats those only in the intended specialty; Raizan deliberately does not beat the Tier-2 manual/Dispatcher specialists on raw payout.

## Canonical Tier-3 model direction

Real-world names below are developer-only design references. They must never enter player-facing copy, logos or badges.

- **Toseki Raizan** — Lancer Evolution IX-era inspiration: compact mid-2000s AWD performance sedan; grip, launch, Operations and Heat utility.
- **Namera Luma** — RX-7 FD-era inspiration: low lightweight 1990s sports coupe; intensive manual/active specialist.
- **Toseki Tenrai** — Supra Mk4-era inspiration: muscular 1990s tuner GT; Dispatcher/automation and long-session power build.
- **Sevrin Caron** — **M3 G80-era inspiration**: modern 2020s four-door German performance sedan; premium aggressive stance and passive/business role. The former `5-door fastback` / `executive sport fastback` direction is retired.

Fictionalization is mandatory. Caron is not a logo-delete BMW: it needs its own front signature, grille geometry, lamps, bumpers, surfacing, aero and badges. Raizan, Luma and Tenrai follow the same rule: retain broad era/body/drivetrain character while creating an independent Solara model identity.

## Final balance

| Fahrzeug | Archetyp | Preis | Level | Requirements | Rolle | Modifier |
| --- | --- | ---: | ---: | --- | --- | --- |
| Toseki Raizan | Evo IX | $250,000 | 18 | Solara Nights owned at Lv2; Neon Mile owned | Grip / Operations / Heat utility; versatile City operator | +24% all Delivery Cash; −15% Heat response/decoy cost |
| Namera Luma | RX-7 FD | $290,000 | 19 | Solara Nights Lv3; Neon Mile owned | Active/manual specialist | +42% manual Delivery Cash |
| Toseki Tenrai | Supra Mk4 | $360,000 | 21 | Solara Nights Lv5; Neon Mile owned | Dispatcher / automation / long-session power | +38% Dispatcher Cash |
| Sevrin Caron | M3 G80 | $475,000 | 23 | Solara Nights Lv7; Neon Mile owned | Business Production / passive Empire | +30% global Business Production |

All prices are permanent collection opportunity costs. Gates are AND requirements. Vehicle ownership and active selection continue to survive Rebirth under the existing Garage contract; gates control purchase only and do not revoke ownership.

### Why these numbers

**Raizan** is first because it is broad but intentionally not best at raw income. Its 1.24 manual/Dispatcher factor sits below tuned Serein manual (1.3608) and tuned Rendan Dispatcher (1.3216), while the 0.85 Heat-response-cost factor creates a distinct Heat utility. A $1,250 base MANHUNT decoy becomes $1,062.50 before other applicable sources.

**Luma** reaches 1.42 manual, only about 4.35% above tuned Serein's 1.3608. That is enough to establish the Tier-3 active specialist without deleting Serein's cheaper acquisition and optional Workshop flexibility. Because Standard Delivery has no cooldown, this specialty is intentionally priced and gated as an active-play investment.

**Tenrai** reaches 1.38 Dispatcher, about 4.42% above tuned Rendan Dispatch (1.3216). It gives no manual or production bonus, so it is strongest only when Dispatcher throughput matters.

**Caron** reaches 1.30 production, about 4.92% above tuned Canto Boardroom (1.239). At the historical $136.25/s representative base portfolio, its isolated +30% marginal production repays $475k in about 3.23h; at $253.75/s about 1.73h; at $500/s about 0.88h. Reinvestment, skills, Crew and other multipliers can change actual payback, which is desirable: Caron is a late passive choice, not an automatic first buy.

## Acquisition order and opportunity cost

The default progression recommendation is **Raizan → Luma → Tenrai → Caron** because the gates rise with Solara Nights and Player progression. This is not a forced purchase order: a passive player can skip active specialists and save for Caron, while a Dispatcher-heavy player can defer Luma. That optional skipping is intentional opportunity cost.

Tier-2 remains useful because it is much cheaper and because tuned Serein/Rendan/Canto stay close to the Tier-3 specialty ceilings. Lilt retains cooling/decoy utility, and tuned Tier-1 options remain low-cost alternatives. No Tier-3 baseline combines top manual, top Dispatcher and top production.

Rebirth does not grant Tier-3 cars. Existing owned cars/builds/paint and the active selection retain the established permanent Garage semantics. After a Rebirth, an owned Tier-3 vehicle can contribute again against rebuilt Businesses exactly like current permanent vehicles; no new schema is needed for V-A.

## Executable analysis

`src/features/vehicles/model/tier-three-balance.test.ts` is the reproducible V-A decision suite. It exercises the shared `evaluateStat` path and locks:

- acquisition boundaries for all four candidates;
- Tier-3 specialty factors and Raizan Heat-response cost;
- tuned Tier-2 guardrails;
- representative passive portfolio payback;
- active-heavy, Dispatcher-heavy and passive-heavy comparisons;
- Heat/Operations utility and the no-universal-best constraint.

The test deliberately treats the four candidates as analysis fixtures rather than adding them to `VEHICLE_CATALOG`; V-B is the implementation boundary.

# Garage V-B — Toseki Raizan Production Contract

V-B is the next concrete phase. No new foundational balance discussion is required unless the live economy changes before implementation.

| Contract | Locked V-B value |
| --- | --- |
| Vehicle ID | `vehicle:toseki-raizan` |
| Manufacturer | `Toseki` |
| Model | `Raizan` |
| Price | `$250,000` / `25000000` cents |
| Unlock Level | Player Level 18 |
| Requirements | `territory:neon-mile` owned; `business:solara-nights` owned and Level 2 |
| Base modifiers | `modifier:toseki-raizan-operations`: +24% `job-reward` with no context; `modifier:toseki-raizan-decoy`: −15% `heat-response-cost` |
| Role | Grip / Operations / Heat utility; versatile City operator, not raw-income BIS |
| Save | Use existing Garage ownership/active fields. Advance save version only if implementation validation requires the new stable ID; CE1 transport remains. Never grant ownership during migration. |
| Rebirth | Owned Raizan and active selection survive under current Garage permanence; no free reacquisition and no gate re-check for retained ownership. |
| Active Vehicle | Only active Raizan contributes. Switching remains free and non-stacking. Existing fitted setup semantics remain untouched; V-B ships factory-only unless separately scoped. |
| UI | Garage card/detail, locked requirements, purchase/activate states, modifier scope, collection count and purchase insight must use existing workspace patterns. No final artwork placeholder masquerading as approved model art. |
| EN | `Toseki Raizan`; role copy emphasizes AWD city-operator confidence, delivery utility and cleaner exits without real-world names. |
| DE | `Toseki Raizan`; localized role/requirement/modifier copy with the same meaning and GTA-style Solara voice. |
| Villager | Full Villager transformation through the established localization system; no hard-coded `hrmm` prefix shortcut. |
| Unit/domain tests | Purchase gates, exact cents, modifier collection active/inactive, manual/Dispatcher +24%, Heat-response −15%, switching, failures atomic, Rebirth, save migration/validation, no grants. |
| Browser verification | EN/DE/Villager; locked/affordable/purchase/activate/reload/Rebirth; mobile+desktop; current six cars retained; Standard Delivery remains no-cooldown; Risky/Discreet shared cooldown unchanged; runtime errors zero. |
| Artwork | **Explicit user approval required before model-image integration.** Mid-2000s compact AWD sedan stance may inform the design, but lights, grille, intakes, hood treatment, rear graphics, wing supports, surfacing, wheels, aero and badges must be original Toseki design. No real logos or 1:1 Evo replica. |

## V-B acceptance boundary

V-B may implement the Raizan only after explicit model/artwork approval. Until then, production code must not invent or integrate a final vehicle image. V-B must preserve Save v27 progress, Operations cadence behavior and every existing Garage/Workshop setup. Build, full relevant tests, browser verification, PR checks, merged `main` and successful Pages deployment are all required before calling V-B released.
