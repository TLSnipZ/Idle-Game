# Game design

## Status and identity

Phase 0 establishes a technical and documented foundation only. Everything below
is a planned direction, not an implemented feature or final balance promise.
The working title is Crime Empire; final branding and city naming remain open.

A premium modern crime-empire idle/tycoon game inspired by Miami/Florida nightlife,
luxury and street culture. Use an original setting, characters and visual assets.
No Rockstar/GTA assets. No pixel art. Criminal themes serve fictional progression;
the core experience is economic decisions, collection and empire management.

## Intended experience

Start small with meaningful active choices, invest earnings into businesses,
expand passive income, collect desirable vehicles and gradually delegate routine
work. Rebirth trades selected run progress for permanent progression and unlocks.
It must become increasingly automated, not remain a repetitive clicker.

The long-term loop is: act and earn → buy and improve → unlock and collect →
automate and expand → rebirth → explore new permanent options. The opening action
and first business will be chosen in their implementation task.

## Planned systems

| System | Responsibility | Integration |
| --- | --- | --- |
| Economy | Currency, affordability, income and spending | Consumes effective stats and coordinates atomic purchases |
| Buildings/businesses | Ownership, levels, business production definitions | Requests economy transactions; exposes production inputs |
| Upgrades | Building-specific and global progression | Produces scoped modifiers and unlock facts |
| Cars | Vehicle definitions, rarity and collectible bonuses | Provides collection metadata and eligible modifier sources |
| Garage | Owned vehicle instances, display and collections | Derives completed sets; produces collection bonuses |
| Rebirth/prestige | Reset eligibility, reward and reset policy | Resets designated run state; preserves explicit permanent state |
| Skills | Multiple skill trees and prerequisites | Spends designated points; produces permanent modifiers/unlocks |
| Territories | District progression and business context | Supplies district scopes, unlock facts and bonuses |
| Heat/wanted | Risk and wanted progression | Supplies explicit penalties/conditions to shared evaluation |
| Crew/managers | Assignments and delegation | Produces scoped bonuses and enables automation capabilities |
| Random events | Temporary opportunities/effects | Uses injected randomness/time and finite modifier lifetimes |
| Automation | Routine action scheduling | Invokes the same validated commands used by active play |
| Offline progression | Elapsed-time catch-up | Reuses simulation rules with bounded elapsed time |
| Achievements | Milestone detection and rewards | Reads facts/statistics; claims each reward at most once |
| Statistics | Run and lifetime counters | Receives successful transition results; does not control economy |
| Saves | Device-local persistence and portable exports | Validates/version-migrates authoritative state through adapters |

## Collection and rebirth questions

Vehicles should evoke real automotive collecting. Exact real car names, licensing,
art sources, roster and rarity tiers are future content decisions. Do not add any
cars now. Collection membership and stable IDs must be independent of image files.
Before implementing rebirth, explicitly decide what happens to cars, collections,
crew, districts, achievements and each currency. Do not infer retention from UI.
Multiple trees must offer distinguishable choices; their names and node designs
remain open. Permanent progress and run progress require separate ownership.

## Presentation and accessibility

Dark ink/navy surfaces, controlled pink/cyan accents, strong typography and ample
contrast establish the initial direction. Later licensed/original photography or
cinematic artwork may provide automotive and city imagery. Keep interface text
readable, support mobile and keyboard use, avoid color-only status, and respect
reduced motion when animation is added. The current shell has no fake balances,
nonfunctional purchase controls, or implied playable features.

## Local-first saves

Eventually autosave in the browser and allow a portable save code (encoding chosen
at implementation time; hex is an option, not encryption). No account or cloud
sync. Browser data can be cleared; export provides a user-controlled backup.
Versioning, migration, failed-import protection and offline catch-up are mandatory
when persistence is introduced. They are not implemented in this phase.
