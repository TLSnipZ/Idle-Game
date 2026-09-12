# Solara City Localization Voice

This document defines the writing contract for all player-facing Solara City copy in English and German.

## Core voice

Solara City should sound like a premium satirical crime sandbox with its own identity: dry, cocky, mildly unhinged, nightlife-soaked and aggressively entrepreneurial. Humor may poke fun at greed, bureaucracy, hustle culture, shady business logic and bad decisions.

All copy must remain original to Solara City. Do not reproduce or closely imitate Rockstar/GTA dialogue, mission text, slogans or protected wording.

## Gameplay clarity wins

Humor is presentation. Gameplay truth is authority.

- Prices, percentages, requirements, timers, Heat values and rewards must stay explicit.
- Buttons must still clearly describe the action they perform.
- Failure states explain what is missing before adding a joke.
- Requirements are never hidden behind flavor text.
- Localization may adapt jokes rather than translate them literally when that produces a stronger natural line.
- Proper names such as Solara City, Waterfront, Neon Mile, Dockside Detail, Kairo and character names remain canonical unless a future content decision explicitly changes them.

## English direction

Use concise, sharp lines with dry criminal-capitalist satire. Prefer confident punchlines over meme slang. Avoid references that depend on outside franchises.

Examples of tone:

- Autosave on -> `Autosave armed · bad decisions now legally documented.`
- Overview -> `Your empire at a glance. Mostly assets. Definitely not evidence.`
- Operations -> `Move product, grow revenue and automate the parts your lawyer hates.`
- City -> `Own districts, manage Heat and keep the crew expensive but useful.`
- Collection -> `Collect questionable machinery. Enjoy completely legitimate bonuses.`
- Empire -> `Turn temporary success into permanent tax problems.`

## German direction

German should feel written for German players, not translated word-for-word from English. Use dry, cheeky phrasing with natural rhythm. Keep established game terms such as Heat, Crew, Rebirth, Businesses and EP where that reads naturally.

Examples of tone:

- Autosave aktiv -> `Autosave läuft · deine fragwürdigen Entscheidungen sind aktenkundig.`
- Übersicht -> `Dein Imperium auf einen Blick. Vermögen, Probleme und erstaunlich wenig Papierkram.`
- Operationen -> `Geld verdienen, Businesses hochziehen und die Arbeit automatisieren, die keiner freiwillig macht.`
- Stadt -> `Bezirke kontrollieren, Heat im Zaum halten und die Crew teuer beschäftigen.`
- Sammlung -> `Fragwürdige Maschinen sammeln. Völlig seriöse Boni kassieren.`
- Imperium -> `Kurzfristigen Erfolg in langfristige Steuerprobleme verwandeln.`

## Full UI localization architecture

The locale preference remains presentation-only and device-local; it does not enter GameState, Save v17 or CE1.

- `LocalizationProvider` supplies the active locale to the complete presentation tree while preserving English defaults for isolated component tests.
- Stable global shell copy continues to use the typed translation dictionary in `localization.ts`.
- Large catalog-backed surfaces use centralized localized content in `content-localization.ts`, keyed by stable content IDs rather than duplicating translated gameplay definitions.
- Presentation helpers accept an optional locale and default to English. Domain rules, IDs, prices, gates and save data remain language-neutral.
- Runtime feedback receives the active presentation locale without persisting it into the game state.

## Full UI acceptance gate

The Full UI Localization & Solara Voice Pass is not complete until all normal player-facing surfaces are covered in both locales:

- global shell, navigation, HUD and feedback
- Overview and Next Objective / Guidance
- Operations, Jobs, Businesses, Upgrades and Automation
- City, Territories, Heat, Crew and City Events
- Garage / Collection
- Rebirth, permanent Skills, Achievements and Lifetime Statistics
- Save / Transfer, destructive Reset Progress and Offline Return
- requirements, availability states, errors, confirmations, accessibility labels and action feedback
- catalog-backed descriptions and choice/outcome copy

When German is selected, ordinary English UI sentences must not remain except intentional proper names, established game terms, abbreviations or user-visible values that are language-neutral.

## Future localization rule

Every new player-facing surface ships with English and German copy in the same change. Do not add a parallel translation mechanism or hardcode a new English-only UI path. Gameplay truth always wins over the joke, and future content must preserve the same original Solara City voice contract.