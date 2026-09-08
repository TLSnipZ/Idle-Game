# Architecture

## Current implementation

Through Phase 1C.2, the domain has economy and business ownership, atomic job and
purchase commands, and pure elapsed-time production simulation. A per-mount browser
adapter drives live production and reconciles before player commands. React state
renders published snapshots. Phase 2A adds validated versioned local persistence
as documented below. Phase 3A adds bounded offline bootstrap below.

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

Phase 1A uses exact integer cents represented as branded canonical decimal strings.
Native BigInt is used transiently only inside the money helpers. See the numeric
contract below. No numerical dependency or custom arbitrary-precision engine exists.

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

## Phase 1A decisions and contracts

### Currency policy

`Money` is a branded string of canonical nonnegative integer cents. Valid values
are `"0"` or up to 100 decimal digits starting with 1–9. Maximum cash is
(10^100 − 1) cents, or (10^98 − 0.01) dollars. This is a technical resource bound,
not a gameplay target. Length and syntax checks precede BigInt parsing. Numbers,
bigints, negatives, signs, leading zeros, whitespace, exponents, fractions and
nonfinite values are rejected. Money is never converted to Number for calculations
or display. String comparison/concatenation must never substitute for money APIs.

`moneyFromMinorUnits` validates trusted literals and throws RangeError for invalid
programmer input. `isMoney` narrows unknown external amounts. `compareMoney` uses
exact integer comparison; `addMoney` and `subtractMoney` return explicit overflow
or insufficient-funds results. Valid zero transfers succeed. Addition/subtraction
are exact; fractional cents are rejected rather than rounded. General multiplication and modifiers remain deferred. Phase 1C.1 introduces only
the exact rate-times-elapsed accrual helper documented below; transfers still accept
whole cents only.

Money is a string in JSON, with no runtime brand, class, Date or BigInt in state.
`moneyToDecimal` exposes exact fixed two-decimal text; the presentation formatter
adds USD-style separators. Branding does not validate imported data. Future save
loaders must validate unknown input, including every amount and state shape,
before it reaches these typed domain APIs. A malformed authoritative cash value
is a programming/integration error and throws; invalid transaction input is an
expected result failure. Neither path repairs or silently clamps invalid data.

The 100-digit bound already exceeds Number precision and typical early/mid idle
progression. If more range becomes necessary, raise the bound with compatibility
fixtures, or replace the private representation with a reviewed large-exponent
library. Preserve economy commands/selectors as boundaries, version the future
save schema, and migrate old integer-cent strings explicitly (including an exact
or documented-loss conversion policy). No migrations or save versions are invented
before persistence exists.

### Ownership and transitions

Phase 1A introduced `{ economy: { cash: Money } }`; Phase 1B extends it below. Cash is the player's
run balance; no separate empty player/permanent slices or redundant totals exist.
`createInitialGameState` delegates to `createInitialEconomyState`. No schema metadata
is needed for this in-memory-only version; schemaVersion belongs to a future save
envelope. The state is readonly at compile time; transitions create new objects.

Economy public API is exported from `features/economy/index.ts`: `readCash`,
`earnCash`, `canAfford`, `spendCash`, the factory, config and money helpers/types.
Amounts enter transitions as unknown to enforce runtime validation. `canAfford`
returns false for invalid amounts; commands provide a precise error reason.
Transitions return `{ ok: true, state }` or `{ ok: false, state, error }` with
`invalid-amount`, `overflow` or `insufficient-funds`. On failure the exact original
state object is returned. No partial spend, mutation or negative balance is possible
from valid state through these APIs. Success preserves unrelated fields by spread.

`game/perform-starter-job.ts` composes `earnCash` with the single configured reward.
It preserves the whole GameState on failure. `selectCash` derives the current cash
view without copying it into another authoritative field. Future purchases and
automation must compose these same contracts rather than directly writing cash.
No command bus, modifier evaluator or scheduling abstraction is introduced.

Phase 1A used a functional React updater for latest-state command ordering.
Phase 1C.2 preserves that guarantee with a synchronous per-hook runtime adapter
(see below), keeping timing side effects out of React updater replay. The
result/feedback wrapper belongs to the runtime, not GameState. There is no context
or state library dependency. Replacing React state later only changes the adapter.
UI reads selectors/config and the economy's public `ui`
entry point for formatting; pure modules never import presentation. Future feature
UI can expose a separate `ui/index.ts` entry to preserve this separation.

### Tests and scope

Vitest runs pure domain and exact-formatting tests in Node with no DOM emulator,
React rendering tests, coverage infrastructure or extra test configuration. Tests
are colocated and included in strict TypeScript checks, but not imported into the
application bundle. `npm run test` runs once and exits. Tests cover initial state,
valid/repeated earning, affordability, zero/full/failed spending, malformed input,
precision beyond 2^53, maximum values, overflow, immutable deterministic command
results, selectors and JSON representation. Frozen inputs expose accidental mutation.

Phase 1B adds purchases, Phase 1C.1 adds pure production, and Phase 1C.2 adds the
browser runtime below. Modifiers, automation, saves, offline progress and rebirth
remain unimplemented.
No architectural boundary has been replaced.

## Phase 1B — first business purchase

Phase 1B introduced `economy` and `businesses: { ownedIds: BusinessId[] }`.
The array is readonly in TypeScript and contains unique stable namespaced IDs,
not duplicated prices, labels, levels or future production fields. A fresh game
creates its own empty ownership array and keeps initial cash at zero. No Set,
BigInt or class instance is stored; the entire state remains JSON-compatible.

The `businesses` feature implements the previously planned buildings/businesses
boundary (do not create a second parallel `buildings` module for the same ownership).
Its config has exactly one frozen definition: `business:dockside-detail`,
**Dockside Detail**, costing 15,000 cents ($150.00). This original waterfront
detailing garage fits the early automotive setting; six existing deliveries fund
it. Definition fields are only ID, name, description and canonical Money cost.
No category is added because there is no category consumer. `findBusiness` performs
an exact lookup and returns undefined for unknown or non-string input; no registry
framework or prototype-sensitive object indexing is needed for one definition.

Public feature contracts expose definition lookup, the starter definition, types,
`createInitialBusinessState`, `ownsBusiness`, and `prepareBusinessOwnership`.
The latter validates existence and duplicate ownership, returning a proposed
immutable slice only. It is not a paid purchase API; runtime callers must use the
game coordinator. Business config/types depend only on the public economy Money
contract. Neither feature imports the other feature's internal files, and economy
continues to own affordability and all cash arithmetic.

`game/purchase-business.ts` exposes `purchaseBusiness(state, businessId)`:

1. Prepare ownership through the business public API. Unknown ID takes precedence,
   then already-owned, before checking payment.
2. Call existing `spendCash` with the resolved config cost. Do not subtract or
   duplicate the economy's payment validation.
3. Return a new GameState containing BOTH candidate slices only after success.
   Every expected failure returns the exact original GameState and both unchanged
   slices. No intermediate candidate is ever published to the runtime.

Results follow the existing `{ ok, state, error? }` discriminated-union convention.
Expected failures are `unknown-business`, `already-owned`, and
`insufficient-funds`; the type also propagates existing EconomyError values
(`invalid-amount`, `overflow`) without recreating or changing economy rules.
Valid frozen config cannot produce those latter errors in this slice. Malformed
authoritative state remains a programming/integration error under Phase 1A policy;
this phase does not add an import validator or a save schema migration.

`selectOwnsBusiness` and `selectCanPurchaseBusiness` derive UI state from lookup,
ownership and `canAfford`; unknown IDs return false. UI eligibility is advisory:
the command always rechecks the latest state, including repeated queued requests.
`useGame` routes earning and purchasing through the same runtime command boundary.
Its result union is runtime-only; no global bus or new state library is introduced.
`BusinessCard` renders the single definition with price, affordability and owned
status. There are no placeholder cards or production rates. Ownership visibly
persists for the current session only, and the UI continues to disclose reload reset.

Tests cover config and lookup, fresh ownership, invalid IDs, insufficient funds,
exact/full/large-balance purchases, deep-frozen inputs, unchanged object identity
on failure, duplicate requests with and without funds, deterministic results,
selectors, JSON compatibility, and six-delivery purchase integration. Existing
starter-job tests are adapted to the added required slice without changing reward
rules. Phase 1C.1 defines pure production below; Phase 1C.2 connects it to live
browser income.

## Phase 1C.1 — deterministic elapsed production

### Rate and authoritative remainder

Dockside Detail adds `baseProductionCentsPerSecond: Money` to its definition,
configured as `"75"` (75 whole cents/second, $0.75/sec). Money supplies canonical
nonnegative integer validation and the existing 100-digit bound; the field name
supplies the rate unit. Fractional cents per second are not supported as config
inputs in this phase. No rate or total is copied into ownership state.

BusinessState now contains `{ ownedIds, productionRemainderMilliCents }`. The
remainder starts at 0 and is a JSON number restricted to integer 0..999, measured
in thousandths of a cent. This tiny integer is exactly representable, never a
floating-point fraction. It is authoritative earned cash below the whole-cent
threshold, pooled across all producing businesses. Per-business remainders are
unnecessary because all sources credit the same currency and no source-specific
claim/reset mechanic exists. Purchases and starter jobs preserve this field.
A future ownership removal or rate change must retain already-earned fractions;
future source-specific mechanics would require an explicit state migration policy.

### Shared simulation API and math

`simulateElapsed(state, elapsedMs)` in `src/game/simulate-elapsed.ts` is the sole
elapsed-time coordinator. It is independent of React, browser APIs, clocks, random
sources and storage. `getOwnedProductionRates` in businesses is a derived selector
with a real simulation consumer: it resolves each unique owned ID to config.
There are no extra business definitions or unused UI selectors.

`accrueProduction` in economy owns the exact financial calculation:

- `R = sum(owned base rates in cents/second)`.
- `A = R * elapsedMs + previousRemainder`, in thousandths of a cent.
- Whole-cent income = integer quotient `A / 1000`.
- New remainder = `A % 1000`.

All sum/product/quotient/modulo arithmetic uses transient native BigInt. The
resulting income is validated canonical Money; only the bounded 0..999 modulo
is converted to Number. No BigInt enters state. Division truncates only the
credited whole cents; the entire fraction remains authoritative, so nothing is
rounded away. The helper also accepts several rate inputs for future owned
businesses without per-source rounding. Work is O(owned business count) plus
bounded-size integer math, never O(elapsed milliseconds) or O(tick count).

For unchanged rates/ownership and accepted non-overflowing transitions, splitting
an interval preserves both final cash and remainder. Integer quotient/remainder
retains the exact numerator across calls, including 100+900, 500+500, 100×10, and
1×1000 ms. The split total must itself fit the accepted elapsed range for comparison
to a single call. If ownership/rates change between intervals, callers must split
at that boundary; a new business cannot earn for time before it was bought.

### Elapsed input and failure contract

Accept only Number safe integers in [0, Number.MAX_SAFE_INTEGER] milliseconds.
Zero (including JavaScript -0) is an identity no-op for valid state. Negative,
fractional, nonfinite, unsafe integers, strings and BigInts return
`{ ok: false, state: originalState, error: 'invalid-elapsed' }`. No coercion,
rounding, cap or clock reading occurs. This is a numeric input bound, not an
offline-reward cap. Real runtime/offline policies belong to future callers.

Valid elapsed input triggers authoritative-state validation even at zero elapsed:
existing `readCash` validates cash, owned IDs must be an array of unique known IDs,
and the remainder must be an integer 0..999. Unknown/duplicate IDs, invalid cash,
missing/corrupt remainder and invalid configured rates throw RangeError under the
existing fail-loudly policy for programming/integration corruption. Invalid elapsed
is reported first if both input and state are invalid. This is not a save importer
or a general schema validator; externally loaded GameState must eventually be
validated before entering domain code. Throwing never mutates the original state.

Derived production beyond Money's 100 digits returns `overflow`. Otherwise the
coordinator credits the entire whole-cent income once via `earnCash`. Any failed
credit, including maximum-balance overflow, returns the original GameState with
its original remainder and ownership; no partial payment or fractional advancement
is published. Successful calls return both credited economy and new remainder
atomically. Calls with no cash or remainder change return the original object.
Existing EconomyError values propagate without changing the economy contract.

Split-size equivalence concerns successful transitions, not sequences which cross
the maximum balance: a failed call rejects its entire interval; earlier successful
calls remain committed. Future callers must handle failures explicitly, never retry
an already-applied interval, silently cap income, or discard the remainder.

### Tests and Phase 1C.2 handoff

Pure tests cover config, owned-rate selection, no owners, zero/invalid elapsed,
full seconds, sub-cent carry, arbitrary partitions, sequential calls, deep-frozen
inputs, JSON compatibility, exact large balances, maximum elapsed, income and
cash overflow, corrupt state, invalid rates, pooled synthetic rate inputs (not
additional businesses), and ownership/earning integration. No new dependencies.

Phase 1C.2 consumes this unchanged domain API as documented below. Future saves
must persist the production remainder with a versioned schema; no migration is
implemented before persistence exists.

## Phase 1C.2 — browser runtime game clock

### Clock, scheduler and reconciliation

`src/platform/game-runtime.ts` exposes `createGameRuntime(initialState, publish,
timing)`. The small injected `RuntimeTiming` contract supplies `now()` and
`schedule(callback)` returning a cancellation function. The default clock is
`performance.now()`, never `Date.now()`. `setInterval` requests a reconciliation
every **250 ms** (four per second): adequate visible cash updates for $0.75/sec,
with low CPU/mobile battery overhead and no 60 FPS economy. Changing scheduling
does not change domain formulas or production amounts.

Construction is side-effect free. `start()` establishes the baseline at mount,
without startup income. Each `reconcile()` reads the clock once, adds the measured
delta to the retained fractional runtime milliseconds, floors the total to whole
milliseconds, and calls `simulateElapsed(latestState, wholeMs)` exactly once.
On success it advances the baseline, retains the fraction in [0, 1), and publishes
the complete returned state if changed. No millisecond loops or money calculations
live here. Fractional browser timestamps retain their native Number precision;
they are not independently rounded at every callback. For example, 0.4 + 0.4 +
0.4 ms provides 1 ms of simulation with approximately 0.2 ms retained.

Two distinct remainders must never be confused:

- `remainderMs`: runtime-only fractional duration, absent from GameState/JSON.
- `businesses.productionRemainderMilliCents`: authoritative integer 0..999
  thousandths of a cent, preserved by the unchanged pure simulation domain.

### Player command boundary

`execute(command)` reconciles first, then runs the pure command against the latest
successful snapshot. Both starter deliveries and business purchases use this path.
A purchase cannot receive the full pre-purchase timer interval. A failed command
still retains the production successfully reconciled before it. Timer updates
preserve the last command's feedback rather than clearing it on each callback.

When the first business is successfully purchased, the runtime clears only the
sub-millisecond *unowned* duration: that time earned nothing and must not transfer
to the new producer. Its production baseline is the actual purchase timestamp.
Starter jobs and failed purchases retain fractional producing time. This handles
the only production-set change supported now. Future rate/ownership changes must
use this same boundary and explicitly define sub-millisecond rate-transition
semantics before implementation; do not blindly carry old-rate time into a new
rate. No earned milli-cent remainder is reset.

### Lifecycle and state ordering

`useGame` holds one stable runtime instance through a lazy state initializer;
React state remains the render source. The instance's private synchronous snapshot
is the latest transition source, so batched commands/timers cannot consume stale
render snapshots. JavaScript callbacks run serially; publication updates the
adapter before requesting a React render. The former functional-updater mechanism
is replaced only to keep clock reads and bookkeeping out of replayable React
updaters. Domain functions and state shape are unchanged. There is no singleton,
external store dependency, or generic command bus.

The effect starts the scheduler and returns `stop` for cleanup. Start is idempotent;
stop cancels the interval and invalidates its callback generation. Late callbacks
from an old generation cannot affect a restarted runtime. React development
setup/cleanup/setup establishes a new baseline with one loop and the same valid
snapshot; stopped time is not credited. Commands while stopped do nothing. A real
remount/reload creates fresh state; no timestamps cross sessions. Runtime lifecycle
and scheduler tests use deterministic clocks/fake timers; no DOM renderer or real
sleeping is needed for these adapter contracts.

### Throttling and failure policy

A hidden tab remains an open session. Delayed callbacks reconcile the actual
monotonic elapsed duration on the next callback or command; no visibility listener
or assumed callback count is necessary. Time measurement follows the browser's
monotonic clock (including its platform-specific sleep behavior). There is no
wall-clock fallback, persisted timestamp, reload catch-up or offline reward.

A simulation failure preserves the last valid GameState and its production
remainder, cancels scheduling, publishes a separate `runtimeError`, and blocks
further commands/reconciliation/restart on that instance. The failed interval is
never marked successfully applied or replayed. This terminal session suspension
has no recovery/retry mechanism: the UI reports it and reload starts a fresh game.
Unapplied time is not converted to a partial credit or silently skipped to resume
production. Nonfinite/backward/unsafe clock intervals also suspend. Authoritative
state exceptions suspend first and are rethrown to preserve the domain's fail-loudly
policy. Expected overflow does not throw or create a rapid retry loop.

Phase 1C.2 changes only the existing session note and adds a concise runtime error
message. Phase 1C.3 owns visual production feedback/polish; it is deferred. No
save/load, offline progression, modifiers or automation have been introduced.

## Phase 1C.3 — presentation boundary

The first playable slice uses responsive cash and business cards with original
CSS garage artwork, configured rewards/rates, explicit purchase readiness and
owned/live/paused states. `app/game-presentation.ts` maps existing command results
and ownership/affordability/runtime-error flags to display text and button states.
It owns no economic arithmetic. `BusinessCard` consumes the existing business
config and exact public cash formatter; no balance values are copied into JSX.

`useGame` records action feedback only inside the command callback actually
executed by the existing runtime boundary. A runtime-only sequence distinguishes
repeated identical messages for the polite, atomic status region. Timer updates
do not create announcements or clear the last action message. GameState, the
clock adapter, scheduler, simulation and command results remain unchanged.
Terminal runtime errors take precedence, disable actions, remove live status,
and appear in an alert explaining reload and reset; no recovery is offered.

Cash uses tabular digits on one stable line inside a keyboard-scrollable region
for extreme balances. The two-column layout stacks below 740 px, with min-width
zero tracks and full-width buttons. Only short hover/press and border transitions
are used; reduced-motion disables those transitions and transforms. There are no
continuous animations, new timers, fonts, assets or dependencies to download.
Targeted pure presentation and server-rendered card tests cover ownership,
affordability, paused status, configured values and action failure messages.
Browser visual QA remains pending because the available browser blocked the local
preview address. Phase 1C.4 GitHub Pages deployment is deferred; no hosting, saves
or offline progression is introduced.

## Phase 2A — versioned local save core

### Schema and validation

`game/save-schema.ts` owns `SAVE_FORMAT = "crime-empire-save"`,
`CURRENT_SAVE_VERSION = 1` and the envelope `{ format, version, savedAt, state }`.
The concrete field `version` implements the schema-version concept in the earlier
planned contract; it is independent of package/game releases. `savedAt` is a
nonnegative safe-integer Unix timestamp in milliseconds, supplied explicitly.
Future timestamps are valid metadata and cause no simulated income.

`MAX_SAVE_LENGTH = 65,536` bounds UTF-16 code units before JSON parsing (at most
128 KiB for string contents). This deliberately generous bound accommodates future
small saves while limiting corrupt input. It is not an offline cap. Parse into
unknown, check a plain object and exact own data keys, verify format/version and
timestamp, enter `migrateToCurrentSave`, then validate/reconstruct the entire current
GameState. Missing and extra fields, custom prototypes/accessors, invalid money,
unknown/duplicate IDs and noninteger/out-of-range remainders are rejected. Cash
uses public `isMoney`; IDs resolve through public `findBusiness`. No parsed value
is asserted to be GameState and no input is repaired. Output is a detached plain
object with only economy.cash and businesses.ownedIds/productionRemainderMilliCents.

`migrateToCurrentSave` is the explicit pure migration boundary. Only v1 exists, so
it currently validates v1 without a transformation. Unsupported versions fail.
When a real v2 exists, add validated sequential vN -> vN+1 transitions at this
boundary and validate the final current shape; do not skip versions or silently
reinterpret a newer payload. No dummy migrations or save-code format are present.
Outgoing state and metadata are also validated before serializing.

### Browser storage and failure policy

`platform/local-save.ts` owns one stable key **`crime-empire:save`** in localStorage.
`createLocalSave` injects storage access and a wall clock, defaulting to guarded
`window.localStorage` access and `Date.now()`. Neither is read during construction.
`load()` distinguishes loaded, empty and explicit error outcomes. `save(state)`
constructs/validates/serializes the full v1 envelope before one atomic `setItem`;
it never removes the old entry first. Quota, access and write errors leave gameplay
intact, and failed localStorage writes preserve the previous stored value.

Read-before-write compares the stored string with this adapter's last successfully
loaded/written string. An observed change suspends writes with a conflict warning
rather than overwriting another session. This is best-effort conflict detection,
not a cross-tab transaction/lock: localStorage offers no compare-and-swap, so truly
simultaneous writers are not fully coordinated in Phase 2A. Use one active tab.
No backup slots, cloud synchronization or storage-event system is introduced.

### Bootstrap, commands and autosave

`platform/persistent-game.ts` composes the unchanged `createGameRuntime` with the
save adapter. Its side-effect-free factory can be created by `useGame` during
render. The mount effect loads once before starting production. A valid save is
the initial state; empty storage starts fresh. Invalid/corrupt/future-version saves
or storage-read failure start a safe fresh playable state with a persistent warning
and **all writes blocked for that instance**, including successful commands.
Nothing deletes or replaces the problematic entry, and no reset/overwrite control
is added. Users can retain that entry for later recovery; a subsequent page load
validates it again. Dismissing a warning is not treated as permission to erase data.

Successful meaningful commands still run through the original runtime's
reconcile-before-command boundary. The wrapper saves only after execute returns,
using its latest published post-command state; failed/no-op commands do not save.
A separate five-second persistence interval calls the existing `reconcile()` once
and then saves the resulting state. It does not calculate production or replace
the 250 ms production scheduler. Write errors retry on the next normal command or
five-second autosave; there is no rapid retry loop. Runtime simulation failure
prevents further autosaves. Persistence status is runtime-only and never GameState.

Start is idempotent. Stop cancels autosave, invalidates old callback generations,
and stops the original runtime. Strict Mode setup/cleanup/setup neither reloads
over newer in-memory state nor duplicates schedulers. There are no cleanup/unload
writes: unsaved production since the last successful save may be lost on close.
A fresh reload restores exactly the stored state, starts a new monotonic baseline,
and resets fractional runtime milliseconds. Timer handles, clock baselines and UI
feedback are never serialized. `savedAt` is discarded by the load adapter after
validation: runtime code receives state only and awards **no offline progression**.

The UI reports ready/loaded/saved/error/blocked status. Pause copy now explains
restoring the last available save and potential loss of unsaved progress. Tests
use fake storage, injected clocks and fake timers for schema/round trips,
corruption protection, version rejection, atomic failures, command boundaries,
reload timing, cadence, and lifecycle cleanup. Phase 2B export/import codes remain
deferred and must reuse this validation/migration boundary with explicit replacement
semantics. No compression, Base64, checksum, slots or offline logic is implemented.

## Phase 2B — portable save codes

`game/save-code.ts` is a transport around the single Phase 2A schema. The stable
**CE1-** prefix identifies transport version 1 independently of envelope schema
version. UTF-8 JSON is encoded as canonical unpadded Base64URL; no compression or
Node-only runtime dependency is used. Serialization still comes from
`serializeSave`; decoding still ends in `parseSave` / `migrateToCurrentSave`.
There is no second envelope, Money validator or business validation path.

Raw code input, including surrounding whitespace, is bounded to **262,148 UTF-16
code units** before trimming or decoding. This includes the four-character prefix
and room for Base64URL of three UTF-8 bytes per allowed serialized UTF-16 unit.
Decoded text retains Phase 2A's **65,536 UTF-16 code-unit** limit (at most 128 KiB
of string contents). Strict alphabet, length, UTF-8 and canonical trailing-bit
checks reject malformed encoding. Leading/trailing whitespace is otherwise allowed;
internal whitespace and padding are rejected. JSON is parsed as unknown and the
existing complete schema/migration validation must succeed. Typed results distinguish
empty/oversized input, prefix, encoding, JSON, envelope/state/version errors,
runtime unavailability and persistence failure (with the storage error retained).

### Transaction and timing

The persistent runtime exposes `exportCode()` and `importCode(code)`. Export first
uses the existing runtime `reconcile()`, then serializes the latest authoritative
state with the adapter's injected wall clock. It never reads a stale local save as
its source, writes storage, or mutates gameplay beyond normal reconciliation.
`savedAt` represents export time, not last autosave time.

Import validates again after UI confirmation. Without reconciling/mutating the old
state, `prepareReplacement` validates and captures a new monotonic baseline and
returns a synchronous commit closure. The coordinator then writes the entire
candidate using the same normal v1 serialization and atomic localStorage `setItem`
path. Only after a successful write does it call that closure to replace the live
snapshot and clear fractional runtime milliseconds. Preparation, write and commit
run in one synchronous task with no await; the boundary timestamp is taken just
before the durable write. Normal runtime time after that boundary, including the
synchronous write duration, accrues on later callbacks. No prior session duration
or imported timestamp is credited. The original production scheduler remains in
place, and the existing five-second autosave continues without duplicate loops.
If bootstrap had blocked autosave, a successful explicit import starts that loop.

Validation, unavailable timing or failed storage writes leave the previous state,
local save and timing bookkeeping untouched. Read-before-write conflict detection
remains best effort as in Phase 2A: a changed external save is not overwritten;
reload before trying again. A **confirmed import** may replace an unchanged corrupt
or newer stored save read at bootstrap, and enables normal saving after success.
This is the only exception to Phase 2A's automatic-write block. If storage could
not be read, import remains blocked. Runtime terminal failure still requires reload;
import does not introduce recovery from simulation failures.

The imported `savedAt` is validated but discarded. Local persistence records the
current injected wall-clock time when committing the replacement. Cash, ownership
and authoritative production milli-cent remainder come exactly from the candidate.
There is **no offline progression**, elapsed-since-save calculation or offline cap.

### Interaction and trust

The compact Save Management panel uses runtime-only interaction state in
`app/save-management.ts`: paste → validate → explicit Confirm import / Cancel.
Editing invalidates the pending candidate; validation alone never replaces state.
Confirmation states that both current progress and the stored local save will be
replaced. The code is revalidated at commit, and a confirmation applies only once.
Export output stays selectable in a labelled read-only textarea. The platform
clipboard wrapper attempts `navigator.clipboard.writeText` without a permission
request. On failure the code remains visible for manual copying; late clipboard
results cannot replace newer action feedback. Labels, a polite status region,
large buttons and stacked narrow-screen controls retain the existing UI baseline.
No UI timers, browser testing framework or new dependencies were added. Fake storage,
clocks and clipboard tests cover transport, transactions, confirmation/cancellation,
publication and autosave; server-rendered checks cover the accessible controls.

Codes are user-controlled, untrusted text: **not encrypted, secret, authentication
or anti-cheat**. Players may edit their own codes. Validation prevents malformed
state from becoming authoritative; it does not prevent intentional valid edits.
No signatures or static-client secret keys exist. Future phases must preserve the
single schema/migration boundary and durable-write-before-publication ordering.
Phase 2B is complete; Phase 2C and Phase 3 are not started.

## Phase 3A — deterministic offline progression

The v1 envelope and CE1- transport are unchanged. For **local persisted saves**,
`savedAt` now identifies the fully reconciled state at the synchronous persistence
boundary. The adapter captures an integer Unix wall timestamp; bootstrap uses this
same captured value for calculation and durable write, never reading a later time
for the candidate's metadata. Active commands/autosaves still reconcile immediately
before saving. The synchronous serialization/storage operation has no interleaved
game callbacks; browser I/O duration is not an additional offline simulation step.
The old Phase 2 “metadata only” behavior above is superseded for local bootstrap.

`game/offline-progress.ts` receives explicit timestamps and validated GameState.
It reuses the save timestamp validator (nonnegative safe integers), orders the
endpoints before subtraction, and caps the difference at `OFFLINE_CAP_MS` =
28,800,000 ms (eight hours). The difference between ordered nonnegative safe
integers is itself safe. No unsafe elapsed input reaches simulation, even at
Number.MAX_SAFE_INTEGER. Negative differences become zero with `clockAnomaly` true;
valid state is retained and the timestamp rebased to current time. No punishment or
positive credit is attached to a future timestamp. `capped` is true at or above
the cap; `actualElapsedMs` is zero for a backwards clock and otherwise full absence.

Every candidate comes from exactly one `simulateElapsed(state, rewardedElapsedMs)`
call, including zero time/no businesses. The same rates, exact Money helpers and
production milli-cent remainder apply online and offline, with no per-second loops
or alternate income formula. Metadata contains actual/rewarded elapsed, capped,
clockAnomaly and exact `incomeEarned` derived by the existing Money subtraction
helper from the before/after balances. It contains no duplicate resulting balance.
Metadata lives only in the persistent runtime snapshot, never GameState or saves.

`local-save.bootstrap()` reads and fully validates/migrates the envelope, reads the
injected wall clock, computes the candidate, and uses the existing guarded atomic
write path with that timestamp. The coordinator publishes the candidate and starts
its fresh performance.now baseline **only after the write succeeds**. The timestamp
is consumed even for zero income, a capped absence or a future timestamp. The
coordinator bootstraps once per instance; Strict Mode restart reuses that result.
A new instance reads the rebased envelope, so immediate reload awards zero additional
elapsed time. Autosave remains every five seconds and never invokes offline logic.
There is no repeating offline timer or change to the 250 ms active scheduler.

If offline simulation overflows, the wall clock is invalid/unavailable, or the
write fails/conflicts, bootstrap returns the original validated saved state and a
typed `offline-error`. No candidate or reward metadata is published. The session
shows that original state but remains paused, with no production/autosave timers or
commands; reload is required to retry. This intentionally prevents subsequent
saving from silently erasing the unconsumed interval. The previous valid stored
string remains intact on write failure. Malformed save bootstrap retains Phase 2's
fresh-state warning/blocked-write policy. Cross-tab comparison remains best effort;
localStorage is not a cross-tab compare-and-swap transaction. Use one active tab.

Import preserves Phase 2B's exception: historical code timestamps are validated but
never simulated. Confirmed import writes the candidate with the **current import
time**, then replaces live state and clears any prior welcome metadata. A later
reload may earn only since that new local timestamp. Export only reconciles active
time and records current export time; it never performs offline catch-up. Schema
version stays v1 because no envelope or GameState field changed.

The inline, nonblocking Welcome back card appears only for positive whole-cent
income, shows exact cash and credited duration, indicates the cap when reached,
and offers Continue to dismiss runtime-only metadata. Zero-income/fraction-only
returns do not show a fake reward. A pure duration formatter uses seconds/minutes/
hours without a date library. The card uses existing responsive surfaces, focus
styles and a polite live region; no UI timer or animation was added.

Tests use fake clocks/storage/schedulers to check cap/clock boundaries, exact
simulation equivalence, write-before-publication, rollback, one-time consumption,
Strict Mode restart, autosave, import/reload timestamps, remainder partitioning,
and presentation. Phase 3A is complete; Phase 3B, levels and modifiers are deferred.
