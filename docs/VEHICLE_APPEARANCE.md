# Garage 2.0 III — curated vehicle finishes

## Player scope

Collection → Paint studio offers factory paint plus two signature finishes per car:

| Car | Finish 1 | Finish 2 |
| --- | --- | --- |
| Kairo KX-R | Coastal Mint / Küstenmint | Graphite Club / Graphit-Club |
| Kairo Senda | Champagne Account / Champagnerkonto | Afterhours Amethyst / Feierabend-Amethyst |
| Namera Lilt | Ivory Alibi / Elfenbein-Alibi | Lagoon Escape / Lagunenflucht |

All changes are free and cosmetic. Ownership is the only application requirement.
Unowned cars can be previewed. The native vehicle selector never activates a car.
Finish buttons update a local per-car draft, showing PREVIEW / NOT APPLIED until
the player explicitly applies it. Discard returns to the applied finish.
Factory restoration changes only that vehicle's appearance, retaining every tuning
purchase and fitted setup. The Garage immediately uses the applied finish.

Drafts survive switching the studio selector while mounted; leaving Collection
discards unapplied previews. Rebirth, import and New Game are initiated from Empire,
so returning to Collection initializes the studio from the resulting saved Garage. All player-facing
strings use EN/DE localization and complete Villager transformation.
Desktop pairs preview and controls; narrow screens stack them. Native buttons,
pressed states, labels and a text status accompany the swatches. Quick access
focuses the paint studio heading below the measured sticky HUD.

## Domain and persistence

Appearance identities and vehicle compatibility live in the vehicles feature.
No appearance entry contains a modifier, price, artwork path or CSS value.
Optional Garage `appearances` maps an owned VehicleId to its compatible AppearanceId.
An absent entry means factory paint. Maps reject unknown or unowned vehicles,
incompatible/unknown/null values, arrays, symbols and accessors.

Save **v23 / CE1** adds this optional map. Sequential v22 → v23 validates the old
shape first and preserves exact timestamps, Cash, ownership and all model builds.
No appearance or reward is granted. Older envelopes cannot smuggle new fields.
Current parsing copies appearance maps independently. CE1 transport is unchanged.

The pure command changes only Garage appearances. Invalid and repeated selections
return before runtime/storage IO. Valid application reconciles ordinary elapsed
time, then uses the existing guarded Garage write-before-publication transaction.
A failed save keeps the previous applied look; the UI retains the draft for retry
and shows existing save feedback. Cosmetic changes do not reset fractional runtime
timing, alter active vehicle, or touch production, Cash, XP, Heat, tuning or stats.
Normal time-based game progress can still advance while the studio is open.

The whole Garage survives Rebirth; full New Game removes all looks. Import/export,
offline bootstrap and conflict detection retain their existing durability contracts.

## Rendering and limits

The canonical WebP files are unchanged and reused from the existing asset map.
`VehicleArtwork` renders a presentation-only SVG paint layer over the image,
clipped with separate hand-authored body masks for each approved model. Glass,
lamps, wheel openings, intakes and the environment stay on the base image.
A fixed color transform preserves body shading. All paint masks, color coefficients
and swatches live in app presentation files, never in saved state or game logic.
Factory mode emits no paint layer. Unique React IDs isolate multiple previews.

This is a curated 2D paint treatment, not a 3D configurator or new rendered artwork.
Reflections in the original showroom floor are not recolored. Wheel swaps,
body kits, decals/livery editing and physical material simulation are outside this
phase. Future canonical camera/model changes require corresponding mask review.
No new image downloads, third-party generation calls or dependencies are introduced.

## Verification

Behavioral coverage includes every finish, no-cost/no-effect invariants, ownership
and compatibility rejection, per-car factory restoration, Rebirth, v22 migration,
v23/CE1, independent copied maps, malformed data, invalid/no-op IO boundaries,
quota/conflict failure, durable publication, reload, import and New Game.
An integrated UI flow checks preview/discard/apply, unowned preview and Garage display.

The new Chromium matrix covers EN/DE/Villager at 320, 390, 740, 1024 and 1440px:
all six finish previews, owned application, unowned restriction, failed save/retry,
independent choices, factory/discard, reload, retained tuning, unchanged Cash,
125% text, heading focus, and runtime errors. Existing 600 browser cases remain
release gates; the layout matrix also visits the new studio destination.
Executed counts, screenshot review, CI and release evidence are recorded in the PR.

## Next separate scope

This completes curated paint customization for the current three models.
Later vehicle tiers remain separate and require catalog/progression analysis
before implementation. No additional phase begins automatically.
