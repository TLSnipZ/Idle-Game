# Heat III — District Heat

Waterfront and owned Neon Mile have independent Heat and cooling progress.
Manual deliveries (normal/risky/discreet), Lay Low, event eligibility and event
effects use the operating district. The Dispatcher always earns and generates
Heat at Waterfront, including while away and during Auto-Upgrader simulation.
Both districts cool for the same credited online/offline duration, with the
existing Mara/Lilt interval. Gain/clamp precedes cooling; batch rules stay intact.

Travel is free, requires ownership and retains both exact Heat/remainder pairs.
An open City Event blocks travel until resolved, binding consequences to its
district. Selecting the current district is a no-op. Acquisition does not travel:
Neon ownership still adds 10 Heat at Waterfront; Neon itself starts cold.
The existing Neon job bonus remains global. Switching districts can restore a
better manual payout; it cannot move the Dispatcher or erase parked Heat.
Peak Heat and Heat achievements observe the maximum final district Heat, without
reconstructing transient batch peaks. Rebirth/New Game restore cold Waterfront.

## State and compatibility

Save v20 / CE1. city.heat and city.heatDecayElapsedMs are authoritative for the
active district. Optional city.districts stores activeId and the other district's
parked Heat/remainder. Without that extension, Waterfront is active and Neon is
cold. There is no duplicate active value. The extension requires Neon ownership.
The v19→v20 step preserves all legacy state and savedAt exactly; v10–v19 validators
retain their three-key city shape. v20 validates nested records, IDs, ownership,
integer ranges, canonical zero progress and exact keys; malformed input is rejected.

Runtime travel reconciles elapsed time in the old location, then commits storage
before publishing the new location. Storage failure or cross-tab conflict keeps
the prior district. No-op and invalid travel do not read the clock or write.
Durable reload/import retain location and both district pairs.

## Interface and verification

Operations and City expose the same owned-district selector, two Heat readings
and action routing explanation. HUD, Heat and Events identify the active district.
English, German and full Villager transformation cover all new prose.
Behavioral tests cover travel, events, cooling, rewards, Dispatcher, capped offline,
Auto-Upgrader, Rebirth, v19 migration, malformed saves and failed durable writes.
The Chromium audit adds 15 district flows across three locales and five widths,
including keyboard job actions, exact payouts, travel, reload and overflow checks.
Build/full-suite/browser evidence will be recorded after CI completes.

## Next separate phase

Heat IV — MANHUNT. No additional escalation mechanics are part of this phase.
