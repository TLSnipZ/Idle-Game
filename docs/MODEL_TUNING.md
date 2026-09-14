# Garage 2.0 II — Senda and Lilt tuning

This extends the KX-R pilot after the whole-game layout pass. All three existing
cars now have two permanent, mutually exclusive setups. No vehicle artwork,
cosmetics, additional cars or racing systems are added in this phase.

## Catalog and roles

| Vehicle / setup | One-time price | Additional active effect |
| --- | --- | --- |
| Senda / Express ECU | $18,000 | +8% manual Job Cash; no Dispatcher bonus |
| Senda / Fleet support gearing | $14,000 | +4% global Business Production |
| Lilt / Quiet running kit | $20,000 | Heat cooling interval reduced by 3 seconds |
| Lilt / Decoy logistics kit | $12,000 | Decoy cost reduced by another 10% |

Existing base bonuses and both KX-R parts are unchanged. One fitted setup applies
only when its own vehicle is active. Buying every part does not stack every effect.
Workshop browsing never activates a vehicle. Stock and purchased setup swaps are
free, per vehicle, and preserve purchased parts.

## Balance checks

- Senda Express: 1.12 × 1.08 = 1.2096, or +20.96% manual Cash before other sources.
  A cold $25 job pays $30.24 (risky $45.36; discreet $15.12); Dispatcher stays $25.
  Compared with stock Senda's $28, the $2.24 increment recovers $18,000 after
  8,036 such jobs. This is an isolated marginal comparison, not a progression ETA.
- Senda Fleet: retains +12% manual Cash and adds +4% production. KX-R still leads
  passive production (+10% stock, +15.5% Fleet), while its Courier hybrid gives
  +10% production / +8% manual. Neither hybrid dominates both dimensions.
  With only Dockside L25, Senda Fleet adds $0.75/sec: about 5.19 hours to recover
  $14,000 at that static rate. L10 adds $0.30/sec: about 12.96 hours.
- Lilt Quiet: 60s − 3s base − 3s tuning = 54s per Heat; assigned Mara gives
  45s − 3s − 3s = 39s. Stock Lilt is 57s / 42s. Compared with stock Lilt this is
  5.56% / 7.69% more cooling steps per unit time. The existing minimum remains.
- Lilt Decoy: stock Lilt $1,125 × 0.90 = $1,012.50; local Level-10 cover plus
  assigned Mara and active Lilt $810 × 0.90 = $729. The $12,000 investment
  needs 107 standalone-Lilt or 149 fully supported decoys to recover its cost.
  This is optional permanent specialization, not a mandatory progression gate.
  Lay Low price, local Heat reduction, XP and all other prices are unchanged.

All arithmetic flows through the shared modifier system, including the scoped
decoy evaluator. Only the active selected cost part enters that pricing path,
exactly once. Cooling applies through the existing active modifier collector.
Earned cooling/production remainders are retained; old effects reconcile before
a new fit is written and published. Offline uses the saved build once.

## Save v22 / CE1 and persistence

The existing Garage build structure needs no new fields. Save v22 identifies the
new configured content and protects older clients from silently accepting it.
The v21 → v22 step first validates the historical KX-R-only build boundary, copies
existing builds and preserves timestamp/Cash/ownership. It grants no parts.
Historical v21 rejects injected Senda/Lilt builds; current validation rejects
unowned, unknown, incompatible, duplicate and unpurchased selections.

Stock/fit commands take an explicit vehicle ID; callers cannot clear the KX-R
when intending to clear Senda or Lilt. Mismatched vehicle/part requests fail before
clock or storage IO. Purchases and fitting remain guarded Garage transactions:
write the candidate before publishing; quota/conflict failure preserves the live
build and Cash. Error status can publish independently without publishing a
successful purchase. Rebirth retains every build; full New Game clears all.

## Presentation and verification

Collection's workshop selector shows all three models with ownership labels and
two compatible setup cards at a time, initially selecting the active car.
Browsing unowned workshops is allowed;
purchases require ownership and funds. The fitted/active distinction is visible.
The support disclosure names an active decoy kit and shows its discount.
EN/DE satire and complete Villager transformation remain in place.

Twenty added behavioral tests cover prices, exact scope/stacking, ownership and
cross-model failures, independent stock swaps, cooling/decoy chronology, v21
migration, v22/CE1, Rebirth/reset, quota/conflict rollback and UI-only selection.
Existing tests keep their historical fixtures; current-envelope expectations and
future-version rejection fixtures advance to v22/v23.

The 15 new Chromium flows cover three locales × five widths with old KX-R builds,
failed purchase/retry, all four new parts, real manual payout, activation, derived
cooling/decoy displays, failed/free stock swaps, save/reload, Villager and 125%
text size. Existing gameplay and layout browser matrices remain release gates.
Executed results and deployment evidence are recorded in the PR.

## Next separate scope

The model-specific performance tuning block is complete at this scope.
Curated visual customization is the next Garage design/implementation proposal;
later vehicle tiers remain separate. Do not begin another phase automatically.
