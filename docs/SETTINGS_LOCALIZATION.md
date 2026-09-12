# Settings & Localization Foundation

## Scope

This post-roadmap phase introduces presentation-only player preferences without changing GameState, Save v17, CE1, economy, runtime, offline progression or Rebirth behavior.

Implemented foundation:

- compact Settings entry in the global header and an accessible dialog,
- English and German locale selection,
- centralized typed translation keys for the global shell and primary section headings,
- device-local presentation preferences under `solara-city:settings`, isolated from canonical game saves,
- document language synchronization through `html[lang]`,
- explicit reduced-motion preference plus respect for the operating-system reduced-motion signal,
- Escape and backdrop dismissal for the Settings dialog,
- responsive Settings presentation.

## Localization voice pass

The follow-up voice pass establishes the shared writing contract in [LOCALIZATION_VOICE.md](LOCALIZATION_VOICE.md).

English and German both use original Solara City satire: dry crime-business humor, absurd capitalism, nightlife swagger and bureaucratic nonsense. German copy is adapted naturally rather than translated literally. Gameplay-critical facts always stay explicit before any joke.

The pass also moves the global HUD, primary navigation and global runtime indicators onto the same typed localization path. Future surfaces must reuse this dictionary as they are touched instead of creating another translation mechanism.

## Contracts

Settings are presentation state only. A missing, malformed or unavailable settings record falls back safely to English with motion enabled. Storage failure never pauses gameplay and never enters the game's durable save transaction. No migration or CE1 change is required.

The translation dictionary is intentionally centralized in `src/app/localization.ts`. New UI copy should migrate into typed keys as related surfaces are touched instead of introducing a second localization mechanism. Content IDs, gameplay labels used as domain identity and save data must remain locale-neutral.

## Verification

Repository-side implementation was performed through the GitHub connector. The execution environment available to this session could not run the project's npm/typecheck/test/build suite, so the pull request should be treated as awaiting GitHub/maintainer CI and live visual acceptance before this phase is marked manually verified.

Manual acceptance should cover desktop and narrow mobile widths, English↔Deutsch switching, persistence after reload, Escape/backdrop close behavior, keyboard focus, reduced-motion behavior, localized navigation/HUD/global indicators, and confirmation that existing save/export/import/offline/Rebirth progression remains unchanged.
