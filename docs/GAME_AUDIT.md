# Villager language and game audit — 2026-09-13

User-prioritized scope before Tier-1 Garage: add a third playful locale, inspect the
whole game, fix concrete defects and record larger overhaul candidates.

## Implemented in this branch; verification pending

- Device-local `villager` preference; original written Hrrm/Hmm sounds with readable
  English glosses. English/Deutsch remain recognizable in Settings. No audio,
  Minecraft assets, save migration, economy change or new dependency.
- Keyed, inline and catalog-flavor presentation support the third locale.
  Canonical content names, exact numerical values, CE1 data and RESET remain intact.
- Runtime feedback locale is per hook instance and survives rerenders.
- Unlock notices resolve the actual catalog name before translating it.
- Rebirth and New Game controllers follow language changes during an open review
  without submitting or discarding consent.
- Native modal Settings provides browser focus containment, Escape, an inert
  background and return focus. Three language buttons wrap on narrow screens.

## Review scope and acceptance evidence

Baseline is merged Active Vehicle commit `d758fbb207d1ecb91dc0971d105391476498266d`.
Its known result is 2,223 tests: 2,159 pass, 64 inherited presentation failures.
This branch must introduce no new failures, removed tests or increased skips.
CI installs dependencies, builds with strict TypeScript, runs both full suites,
reports inherited failure excerpts, and checks the production build in Chromium.
Browser matrix: all five sections, EN/DE/Villager, five widths (320–1440),
fresh/mid/late-game fixtures; separate vehicle migration/purchase/reload cases.
Checks include modal keyboard interaction, runtime feedback after language changes,
preference reload, export, invalid import and cancelling a pending reset.

Execution results and prioritized findings will be added after the checks finish.
Automated geometry checks do not replace visual review, mobile hardware testing,
screen-reader listening, or long-session balance playtesting.
