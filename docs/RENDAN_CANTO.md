# Garage IV-C — Rendan and Canto Club

## Phase entry

The user accepted the district correction in PR #47 and requested the next phase.
IV-C starts with two model candidates before their artwork is integrated.
Baseline: PR #47, Save v24 / CE1. No new cars are playable at this checkpoint.
The revised roles in TIER_TWO_GARAGE.md remain authoritative; older numeric rows
in VEHICLE_CATALOG.md are historical proposals.

| Car | Price | Acquisition gates | Active effects |
| --- | ---: | --- | --- |
| Toseki Rendan | $115,000 | Player 12, owned Afterdark Level 3 | +18% manual and Dispatcher Cash |
| Sevrin Canto Club | $165,000 | Player 14, owned Afterdark Level 5 | +18% Business Production, +12% Dispatcher Cash |

These are independent optional purchases. Existing cars are not prerequisites.
The manual-focused Serein remains +26% manual Cash. Tuning and finishes for these
models belong to IV-D; factory-only controls must be complete and localized.

## Initial model candidates — awaiting selection

Generated with built-in Imagegen on 2026-09-14 and displayed in the conversation.
The approved Serein runtime image was used only for scene/rendering/camera style.
Neither candidate is an approved model reference or production asset yet.
The original generated PNGs remain available with the conversation images.

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

ART_DIRECTION.md requires explicit selection of the actual model images before
reference promotion. The user has not yet approved these two candidates.

## Implementation after model selection

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

This checkpoint initiates the phase and presents its artwork; it does not claim
integration, new-save compatibility or release. Do not advance to IV-D or Tier 3.
