# Serein pilot — implementation checkpoint

Status: gameplay implementation prepared; **draft, not release-ready**.
The user explicitly approved the generated platinum-silver Serein model in the
task conversation on 2026-09-14 (“Perfekt. Dann setz alles jetzt genau so um im game”).
This approval is final for that exact design; do not ask for design approval again.

## Implemented behavior

- Namera Serein: $80,000, Player Level 10, owned Afterdark Customs Level 1.
- +26% manual delivery Cash while active; normal cold $25 job becomes $31.50.
  Existing risky/discreet factors produce $47.25 / $15.75. Dispatcher stays $25.
- First purchase activates; later purchases retain the existing active car.
  Selection is free and old effects reconcile before durable publication.
- Ownership/selection survive Rebirth; New Game clears them.
- Factory-only workshop/paint presentation in EN/DE/Villager. Existing cars retain
  their compatible parts/finishes. No Serein tuning or alternate paint is granted.
- Save v24 / CE1 validates historical v19–v23 against the frozen Tier-1 identity
  set before current catalog acceptance. Existing builds, paint, timestamps,
  state and cash are preserved without rewards or compensation.

## Exact artwork transfer blocker

Approved original: “Namera Serein am nächtlichen Yachthafen.png”, generated
2026-09-14, 1672 x 940 as displayed, 2,223,372 bytes per source metadata.
The file service reports materialization into the ChatGPT workspace, but that
workspace is unavailable to the connected build sandbox. Reading native image
pixels also returned “Native image pixels were unavailable.”
The approved image has NOT been replaced, regenerated, approximated or shipped.

Need the user to attach that exact image file again so the attachment transfer
can supply its bytes. Then retain the original in
src/assets/reference/vehicles/namera-serein-reference.png, create a WebP runtime
derivative without visual edits, and add the vehicle-artwork.ts registry entry.
Update the Garage image-count check from three to four only with that actual asset.
Do not merge this draft before artwork integration and visual acceptance checks.

## Verification and remaining release work

Added domain cases cover gates/cost/duplicate, old active selection and build/paint
retention, manual scope and risky/discreet amounts, actual Dispatcher batching,
historical identity injection, exact v23 migration, CE1 and invalid customization.
Runtime cases cover durable purchase, quota/conflict rollback for purchase/activation,
old-effect-first switching, offline/reload, Rebirth and reset.
UI checks cover localized factory-only states; the new browser script covers
15 purchase/reload flows across EN/DE/Villager and five widths.

Current-version assertions and current Garage counts advance; historical fixtures
remain historical. No existing test is removed or skipped.
The PR records executed local results. scripts/verify-serein.mjs explicitly reports
pending artwork acceptance rather than claiming it checked an image.

After image transfer: verify full image decoding, crop and card presentation at all
five widths; add the Serein browser step to the release workflow; run full GitHub
CI, merge and Pages deployment, then check live purchase/save/reload.
Rendan/Canto remain the next separate phase after this pilot.
