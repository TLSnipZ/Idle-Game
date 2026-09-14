# Garage IV-C — Rendan and Canto Club

## Phase entry

The user accepted the district correction in PR #47 and requested the next phase.
IV-C integrates both approved models. Baseline: PR #47, Save v24 / CE1.
The implementation advances to Save v25 / CE1; release evidence is in the PR.
The revised roles in TIER_TWO_GARAGE.md remain authoritative; older numeric rows
in VEHICLE_CATALOG.md are historical proposals.

| Car | Price | Acquisition gates | Active effects |
| --- | ---: | --- | --- |
| Toseki Rendan | $115,000 | Player 12, owned Afterdark Level 3 | +18% manual and Dispatcher Cash |
| Sevrin Canto Club | $165,000 | Player 14, owned Afterdark Level 5 | +18% Business Production, +12% Dispatcher Cash |

These are independent optional purchases. Existing cars are not prerequisites.
The manual-focused Serein remains +26% manual Cash. Tuning and finishes for these
models belong to IV-D; factory-only controls must be complete and localized.

## Approved model references

Generated with built-in Imagegen on 2026-09-14 and displayed in the conversation.
The approved Serein runtime image was used only for scene/rendering/camera style.
The user approved both shown candidates with “Perfekt. Hau das update raus bro”,
then reiterated “Goooo”. The exact originals are preserved in the repository.

| Candidate | Generation filename | Proposed identity |
| --- | --- | --- |
| Rendan A | `exec-5cfe7bff-5ab9-40f3-85c2-954f1057acc5.png` | Blue compact late-1990s four-door rally street sedan, hood scoop, functional wing, graphite wheels |
| Canto Club A | `exec-ee12c259-2639-4542-a220-5b0196c87ea5.png` | Dark emerald compact European-era two-door performance coupe, restrained aero, silver five-spoke wheels |

Shared prompt: original fictional vehicle identity, whole car safely framed in
low natural front-three-quarter view, nose left, realistic premium game rendering,
coastal-night showroom, wet floor, grounded shadow, palms and skyline, restrained
warm/pink/turquoise lighting. No real brand badges, UI, captions or collage.
Model-specific prompts request independent lamps, grille, intakes and body details;
the real-world era archetypes in VEHICLE_CATALOG.md are development guidance only.

This explicit selection satisfies ART_DIRECTION.md. Runtime WebPs use Pillow
quality 90 / method 6, original 1672 × 940 dimensions, no crop or visual edits.
Only the WebPs are imported; source masters stay outside the runtime bundle.

## Implemented scope

1. Preserve selected originals and create optimized runtime WebPs, with actual
   intrinsic dimensions and whole-frame Garage display.
2. Change the singular base modifier contract to a plural contract coherently,
   preserving each existing car's effect. Collect only the active car's effects,
   once each. Canto's second bonus is not tuning or an ownership-only benefit.
3. Add both catalog entries, revised gates and localized EN/DE/Villager text.
   Preserve shared Garage inspection, active selection and factory-only controls.
4. Freeze v24 validation to the four existing cars before introducing Save v25;
   sequential migration preserves ownership, active selection, builds, finishes,
   timestamps and unrelated progress, and grants nothing. Keep CE1 unchanged.
5. Test both acquisition boundaries, duplicate/funds failures, active-only plural
   effects and exact stacking, switching reconciliation, storage rollback,
   historical identity rejection, migration/CE1, offline, Rebirth and New Game.
6. Run full build/tests, browser purchase/selection/reload/artwork checks across
   all existing languages and widths, then CI, merge, Pages and live verification.

Full build/tests, browser results and deployment/live evidence are recorded in
the PR. The 30-case browser flow tests v24 migration, purchase without activation,
explicit switching, retained KX-R setup/finish, factory-only controls, reload,
image decoding/containment, all three languages, five widths and 125% text.
Domain/runtime tests cover both active scopes, exact stacking, old-effect-first
reconciliation, quota/conflict rollback, historical injections, CE1, offline,
Rebirth and New Game. Do not advance to IV-D or Tier 3.

## Preserved originals

- `src/assets/reference/vehicles/toseki-rendan-reference.png`: 2,171,396 bytes, SHA-256 `238d27625e8668251a60220f5556f9902a4682c4b153d08fba0f9e5619d0908d`. Runtime: `src/assets/vehicles/toseki-rendan.webp` (285,678 bytes).
- `src/assets/reference/vehicles/sevrin-canto-club-reference.png`: 2,150,336 bytes, SHA-256 `b59d4d2b083c48f6e2d5b17a890e68c3a25a3c84693e52e77296bee09c639a00`. Runtime: `src/assets/vehicles/sevrin-canto-club.webp` (266,036 bytes).
