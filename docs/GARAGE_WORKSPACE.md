# Garage and workshop workspace

This UX interlude follows the user-verified Serein release (PR #43) and precedes
Rendan/Canto. Save v24 / CE1, all vehicle identities, artwork, tuning/paint catalogs,
prices, requirements, effects and runtime transactions are unchanged.

## Interaction

- Garage and Workshop are separate views. Workshop has Tuning and Paint services.
  Hidden views are excluded from layout and keyboard navigation. Local mounted
  paint state preserves per-car drafts while switching services or vehicles.
- Garage provides all/owned/not-owned filters, price/name ordering, compact artwork
  tiles and one visible detail card. Desktop shows selection and detail together;
  mobile opens details with an explicit return to the selection and focus recovery.
- Inspecting a car never activates it. Opening its workshop transfers that vehicle
  to the shared Tuning/Paint selection without changing the active bonus vehicle.
- Tuning shows the vehicle, fitted setup, active/inactive state and side-by-side
  options naming the replacement effect and one-time price. Original purchase/fit/
  stock transactions remain authoritative; factory-only cars show honest notices.
- Paint keeps explicit preview/apply/discard and existing per-car saved appearance.
  Workshop selection is separate from Garage inspection. Navigation state is local,
  not a new saved preference. State replacement remounts the workspace to discard
  stale drafts. Leaving Collection resets local navigation/drafts as before.
- Guidance destinations reveal the requested vehicle and focus its heading.
  Native buttons/selects, text wrapping and responsive layouts cover keyboard,
  EN/DE/Villager, reduced motion and 125% text size.

## Verification

`verify-collection-layout.mjs` covers the 15 locale/width combinations: independent
views, filters, sorting, keyboard detail access, mobile return, workshop handoff,
per-car paint drafts across tabs, discard, factory-only models, no incidental Garage
mutation, activation and reload. SOLARA_BASE_URL runs the same checks on Pages with
disposable fixtures, without accessing a player's real browser state.

Existing domain/runtime/CE1 coverage is retained. Existing browser scripts now use
explicit view navigation before acting; purchase, rollback, fitted effects, reload,
paint pixel checks and all previous behavioral assertions remain release gates.
Full build, suite, browser and publication evidence is recorded in the release PR.

The paint pixel harness retains the raster phase of PR #43's source samples
(fractional origin 0.1875, 0.984375 CSS pixels) and excludes sticky navigation from
its isolated 720x405 image capture. This stabilizes existing edge coordinates across
layout changes without altering paint masks, sample points or pass thresholds.
