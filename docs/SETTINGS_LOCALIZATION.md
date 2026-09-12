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

## Contracts

Settings are presentation state only. A missing, malformed or unavailable settings record falls back safely to English with motion enabled. Storage failure never pauses gameplay and never enters the game's durable save transaction. No migration or CE1 change is required.

The translation dictionary is intentionally centralized in `src/app/localization.ts`. New UI copy should migrate into typed keys as related surfaces are touched instead of introducing a second localization mechanism. Content IDs, gameplay labels used as domain identity and save data must remain locale-neutral.

## Verification

Repository-side implementation was performed through the GitHub connector. The execution environment available to this session could not resolve github.com for a local checkout, so `npm ci`, typecheck, tests and build could not be rerun locally here. The pull request should therefore be treated as awaiting GitHub/maintainer CI and live visual acceptance before this phase is marked manually verified.

Manual acceptance should cover desktop and narrow mobile widths, English↔Deutsch switching, persistence after reload, Escape/backdrop close behavior, keyboard focus, reduced-motion behavior, and confirmation that existing save/export/import/offline/Rebirth progression remains unchanged.
