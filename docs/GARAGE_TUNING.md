# Garage 2.0 I — KX-R tuning pilot

The first tuning slice extends the existing Collection surface with a KX-R workshop. This is the bounded pilot from VEHICLE_CATALOG.md, not completion of the full Garage backlog.

## Parts and balance

| Setup | Category | One-time cost | Active fitted effect |
| --- | --- | --- | --- |
| Fleet gearing | Drivetrain | $15,000 | +5% global Business Production |
| Courier ECU | Engine | $10,000 | +8% manual Job Cash, including risky/discreet delivery; no Dispatcher benefit |

The KX-R's base +10% production remains. Fleet gearing multiplies it: 1.10 × 1.05 = 1.155, or +15.5% before other sources. Courier ECU creates a hybrid: base +10% production plus +8% manual Cash. Senda retains the stronger +12% manual specialization; Lilt retains its cooling and support role.

Static marginal check with only Dockside and base KX-R: at Dockside L10, gearing adds $0.4125/sec and repays $15,000 in about 10.10h; at L25 it adds $1.03125/sec and repays in about 4.04h. ECU adds $2 to a cold, otherwise unmodified $25 manual delivery: 5,000 jobs to repay its $10,000 price. These isolate the increment; actual modifiers, Heat, reinvestment, activity and Rebirth change outcomes. They are not progression-time promises. The hybrid's long-run attractiveness should be revisited with later model-specific tuning.

## Ownership and fitting

- A build belongs to its owned vehicle. Only KX-R parts are configured in this pilot.
- Buy & fit charges once and selects the new part. Buying both retains both permanently but only one is fitted.
- Owned setups and stock can be selected for free. Stock keeps purchased parts.
- Inactive-car builds stay stored and supply no modifiers. Fitting a setup does not activate the car.
- Acquisition requires ownership and Cash; retained parts remain usable after Rebirth without temporary progression gates.
- No XP, jobs, Heat, achievements or statistics are awarded for tuning.
- No additional vehicles, racing stats, cosmetics, new art, resale or refunds ship here.

## Save v21 / CE1

Garage gains optional builds keyed by canonical vehicle ID. Each entry stores purchasedIds and selectedId, with null meaning stock. Prices/effects/assets remain config-only.

The v20 → v21 migration validates v20 first and leaves implicit stock builds absent. Historical versions reject injected build fields. Current validation rejects unknown/incompatible parts, builds for unowned cars, duplicates, unpurchased selections, empty purchases, accessors and extra build fields. Parsing copies owned part arrays.

Rebirth retains the entire Garage. Another vehicle purchase preserves builds. Full New Game clears them. Current CE1 round-trips builds; old codes migrate with the existing timing/replacement policy.

## Runtime

Tuning uses the existing guarded Garage transaction: reconcile old effects, recompute command, write candidate, then publish. Quota errors and conflicts cannot spend or change a build. Unknown/unowned/repeated intents are IO-free; insufficient-Cash requests may reconcile newly earned income before rechecking.

Only the active selected part enters the shared modifier collector. Changing that effect resets fractional runtime duration under the existing vehicle-rate-change policy; earned production fractions remain intact. Inactive fitting does not reset time. Offline catch-up uses the saved build before any new selection and cannot be recalculated retroactively.

## Presentation and verification

EN/DE copy uses the original Solara satire; Villager remains fully transformed. Setup name, category, cost, effect and purchased/fitted/affordability state stay visible. The workshop fits mobile widths and native buttons use existing action focus handling.

Coverage includes domain purchases/selection, exact stacking/manual scope, inactive builds, stock and Rebirth retention, subsequent car purchase, strict schema and v20 migration, CE1, durable order, quota/conflict failure, no-op IO and old-effect reconciliation/offline chronology. Fifteen production Chromium tuning flows cover three locales at five widths, including failed payment, retry, both purchases, free swaps, stock and reload.

Build, full regression suite, browser matrix and release evidence are tracked in PR #35. User live acceptance remains separate.

## Next separate scope

Review the pilot's gameplay and Garage layout, then expand model-specific tuning to Senda/Lilt. Curated visual customization and additional catalog tiers remain later phases. Define a finite Solara City 1.0 milestone list alongside that planning.
