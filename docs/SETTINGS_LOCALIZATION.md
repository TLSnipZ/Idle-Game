# Settings & Localization Foundation

## Current extension — Villager and game audit

The 2026-09-13 extension adds a third, written **Villager · Hrrm** option with
pure Villager gibberish, a native modal Settings dialog, and per-runtime language
feedback. Preferences remain device-local; current saves are v18 and CE1 is
unchanged. PR #24 passed strict build, 29 added regression tests and the full
255-case production Chromium matrix. The 62 inherited UI-test failures and visual
acceptance limits are recorded in [GAME_AUDIT.md](GAME_AUDIT.md) for executed verification and remaining
review work. The sections below record the original foundation.

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

## Historical foundation verification

Repository-side implementation was performed through the GitHub connector. The execution environment available to this session could not run the project's npm/typecheck/test/build suite, so the pull request should be treated as awaiting GitHub/maintainer CI and live visual acceptance before this phase is marked manually verified.

Manual acceptance should cover desktop and narrow mobile widths, English↔Deutsch switching, persistence after reload, Escape/backdrop close behavior, keyboard focus, reduced-motion behavior, localized navigation/HUD/global indicators, and confirmation that existing save/export/import/offline/Rebirth progression remains unchanged.


### Villager overkill correction

At the user's request, Villager now replaces every alphabetic word with written
Hrrm/Hmm/Mhm sounds, including names, units, headings, tooltips and feedback.
There are no English glosses. Replacement is deterministic and token-idempotent,
so composing already translated fragments never reintroduces English.
Numbers/punctuation remain; canonical IDs, saves and entered/exported data are
untouched. Language buttons also speak Villager; flag icons provide a way back.
The literal RESET input token is shown separately as code in its confirmation.
Browser verification rejects readable prose across every section and Settings,
including hidden disclosure text, option labels and accessibility descriptions.
