# Serein pilot — implementation checkpoint

Status: gameplay and approved artwork integrated; release verification tracked in PR #43.
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

## Approved artwork provenance

Transferred from the user attachment in PR #43, comment 5663221085:
https://github.com/TLSnipZ/Idle-Game/pull/43#issuecomment-5663221085

Original PNG: 1672 x 940, 2,223,372 bytes.
SHA-256: `c18d830adcd113688238463f3d855219e2b4523e396b6c262611ec036a2e1307`.
Retained byte-for-byte at `src/assets/reference/vehicles/namera-serein-reference.png`.
Runtime: `src/assets/vehicles/namera-serein.webp`, WebP quality 90 / method 6,
original dimensions, no crop, recolor, regeneration or other visual edits.
The registry supplies the actual 1672 x 940 dimensions and the Garage uses contain.

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
The PR records executed local results. scripts/verify-serein.mjs verifies real decoding, source identity, full-frame containment
and purchase/save/reload at all five widths in all three locales. The release CI
includes this script. SOLARA_BASE_URL optionally runs the same checks against Pages
in disposable browser contexts without accessing a player's browser save.

Release gates: full build/tests and browser suite, GitHub CI, merge, successful
Pages deployment and live purchase/save/reload. Results are recorded in PR #43.
Rendan/Canto remain the next separate phase after this pilot.
