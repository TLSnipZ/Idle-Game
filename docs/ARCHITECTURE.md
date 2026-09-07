# Architecture

## Current implementation

React + TypeScript + Vite, with strict compilation and ordinary CSS. Only
`main.tsx`, `app/App.tsx` and styles execute. There are no game interfaces, state
containers, tick loops, save handlers, domain calculations or feature stubs yet.
README files retain the intended folder boundaries without unused code.

## Boundaries and dependency direction

| Layer | Owns | Allowed dependencies |
| --- | --- | --- |
| `app` | Composition, future runtime wiring, top-level UI | Feature public APIs, game, platform, shared UI |
| `features/<name>/model` | Feature state, pure rules and transitions | Its config, shared game contracts, pure shared helpers |
| `features/<name>/config` | Typed definitions and balance | Domain types; no UI or platform code |
| `features/<name>/ui` | Views and user intents | Its public/model API, shared UI, presentation assets |
| `game` | Shared contracts, modifier evaluation, small integration modules | Pure helpers; composition modules may use feature public APIs |
| `platform` | Storage, clock, lifecycle, random adapters | Domain contracts and pure validation/migration APIs |
| `shared` | Proven reusable UI/helpers | No feature internals or application composition |
| `assets`, `styles` | Presentation files and tokens | No game logic |

Prevent cycles within `game`: future feature models may import only its contract
modules, never its feature composition modules. Composition modules orchestrate
features through public APIs and do not own their internal algorithms. Feature A
must not import feature B's implementation or state mutators. If two features need
a shared fact, pass a typed read-only view through composition or promote the
minimal stable contract. No generic bus, plugin framework or service locator.

## Planned data flow — implement only when needed

A UI intent becomes a validated command. A small game coordinator obtains the
relevant state/config and passes explicit inputs to pure feature rules. The rules
return a transition result; the coordinator applies all related state changes
atomically. Selectors derive display data. Browser adapters schedule commands and
persist snapshots without embedding game formulas. Automation follows the same
command path, preserving affordability, prerequisites and invariants.

Authoritative state is plain serializable data owned in feature slices, divided
into run and permanent progression. A composed GameState can reference those
slices; it must not become one giant store implementation. UI-local state (open
panels, selection) remains separate. Choose a state container only when the first
real interactions demonstrate a need. Do not store computed income, formatted
strings, functions, assets or React elements in save data.

## Planned modifier contract

These are design constraints, not TypeScript implementations in Phase 0:

- Stable modifier ID and source ID identify provenance and prevent accidental
  duplicate application. One modifier per distinct effect; enforce unique IDs.
- A typed target stat identifies income, purchase cost, production speed or a
  future supported stat. Avoid unrestricted magic string lookups.
- Scope is explicit: global, business ID, district ID, vehicle category, etc.
  Only implement scope variants with real consumers.
- Operations start with flat addition, additive percentage and multiplicative
  factor. Define the evaluation order centrally as
  `(base + sum(flat)) * (1 + sum(percent)) * product(factor)`.
- Percent values are fractional deltas (0.10 means +10%); factor 1.10 means ×1.10.
  Sorting by stable ID makes evaluation repeatable. Stacking policy is documented
  by source; additive bonuses sum and factor bonuses compound in the given order.
- Validate finite values, eligible scope and explicit expiry before evaluation.
  Apply target-specific floors/caps/rounding once at the documented boundary;
  do not scatter clamps throughout feature code.
- Producers expose eligible modifiers from source state; they never directly
  change another system's income or price. Recompute derived modifiers after load.

Example only: base income 100, flat +20, percent +0.10, factor 1.5 yields 198.
This is a contract illustration, not a game balance value. UI should eventually
explain effective stats using modifier provenance.

## Time, randomness and numbers

Domain transitions take explicit elapsed time and random outcomes/sources.
Never call Date.now, Math.random or browser timers inside calculations. A browser
adapter will drive simulation; React renders snapshots and cannot be its clock.
Use milliseconds for external timestamps/durations and explicitly named units
such as elapsedMs and incomePerSecond. Offline catch-up must share simulation
semantics with online play, with an explicit cap and no double counting.

Choose the money representation and rounding policy before economy implementation.
JS numbers are not an indefinite idle-game magnitude strategy. Phase 1 must state
its supported range, overflow policy and whether scaled integers or a dedicated
large-number type is justified. Keep numeric operations behind domain functions;
format only at the UI boundary. No numeric library is added in Phase 0.

## Planned persistence contract

Use a save envelope containing schemaVersion (integer), savedAt (UTC epoch ms),
and authoritative state; a build/game version may be diagnostic metadata only.
The schema version is independent of the app release version. Content IDs remain
stable across labels/art changes; retired IDs need an explicit migration policy.

Load/import pipeline: bound input size → decode → parse as unknown → validate
envelope/version → sequential pure migrations (vN to vN+1) → validate current
state/invariants → replace live state and persist only after complete success.
Each migration validates assumptions about its input. Reject newer unsupported
versions without overwriting them. Malformed, truncated, nonfinite, invalid-ID
or invalid-range data must leave the current game intact. Keep a recoverable last
known valid save and report unavailable/quota-limited storage to the player.

Portable export codes encode the same envelope. Encoding is not encryption or
anti-cheat. If a checksum is added it detects corruption only. Do not use eval or
trust imported object prototypes. Import and local load share validation rules.
Offline rewards consume a validated last-simulated timestamp exactly once; clamp
negative elapsed time and define future-clock/cap behavior before release.
Testing must cover round trips, old fixtures, corrupt/newer saves, migration
failures, storage failure and repeated offline reconciliation.

## Naming and content

- Feature directories and domain files: kebab-case, e.g. `buildings/model/buy-business.ts`.
- React files/components and type names: PascalCase. Hooks: useCamelCase.
- Functions/variables: camelCase; fixed constants: UPPER_SNAKE_CASE.
- Prefer named exports and `import type`; use relative paths while the graph is small.
- Stable content IDs: namespaced lower-case kebab-case, e.g. `building:example`.
- Configuration: feature-local typed data, with shared values only when truly shared.
- Asset IDs resolve to imported files in presentation. Domains/saves never refer
  to image filenames; replacement artwork must not require a migration.

## Decisions recorded for Phase 0

| Decision | Reason / consequence |
| --- | --- |
| Client-only Vite SPA, relative build base | Static GitHub Pages hosting; no infrastructure needed |
| Strict TS including indexed/optional checks | Invalid and missing data handled explicitly |
| React automatic JSX via Vite | Small dependency surface; React Fast Refresh plugin can be added when useful |
| CSS tokens and component styles | Replace presentation independently; no UI framework needed |
| No router or state package | One static shell has neither routing nor shared mutable state |
| Future folders contain README contracts only | Boundaries visible without premature systems |
| No test framework or CI/deploy workflow yet | Typecheck/build validate current scope; behavioral systems justify tests later |
| Local Git initialization | Empty workspace, no accessible connected repository; remote integration pending |

Record future significant decisions here with rationale and migration implications.
