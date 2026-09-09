# Architecture

## Current implementation

Through Phase 1C.2, the domain has economy and business ownership, atomic job and
purchase commands, and pure elapsed-time production simulation. A per-mount browser
adapter drives live production and reconciles before player commands. React state
renders published snapshots. Phase 2A adds validated versioned local persistence
as documented below. Phase 3A adds bounded offline bootstrap; Phase 3B adds levels and v2 migration.
Phase 4A adds central exact modifiers and v3 migration; Phase 4B expands the catalog.
Phase 4C adds starter-job delegation, shared elapsed reconciliation and v4 migration below.

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

## Central modifier contract

Phase 4A implements the shared stat contract in `game/modifiers.ts`, with source
collection in `game/effective-stats.ts`. Only `business-production` and `job-reward`
exist. Purchased equipment and owned vehicles are sources; future implemented sources join the
same collector, never mutate cash/rates directly. Full precision, stacking and
migration decisions are documented in the Phase 4A section below. This supersedes
the Phase 0 proposal of separate flat/additive-percent/factor operations: flat additions and
multiplicative percentage bonuses have current consumers (Phase 4B below).

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

## Phase 3B — business level progression

Current GameState replaces `businesses.ownedIds` with a single normalized
`businesses.owned` map: `{ [businessId]: { level } }`. An absent record means unowned;
purchase creates level 1. Levels are safe positive integers bounded by
`MAX_BUSINESS_LEVEL = 100`. Only level and the existing pooled
`productionRemainderMilliCents` are authoritative. No price, rate, duplicated
ownership list or config is stored in state. Ownership transitions replace nested
records immutably; the current stable business ID and purchase cost are unchanged.

`features/businesses/model/levels.ts` derives upgrade cost and production from a
business definition and level. Each definition supplies independent purchaseCost,
baseProductionCentsPerSecond and baseUpgradeCost. The shared Phase 3B curve is
quadratic: upgrading current level L costs `baseUpgradeCost * L²` cents. Production
is `baseProductionCentsPerSecond * L` cents/second. L is checked before bounded
integer-factor arithmetic (maximum square 9,801 for purchasable upgrades). Economic
multiplication runs through the economy's `multiplyMoney`, using transient BigInt
and the existing Money range/overflow policy. Invalid future configuration that
cannot scale within Money bounds fails loudly; shipped config remains safe through
level 100. There are no floating-point currency multipliers, unbounded powers,
levels beyond the cap, special bonuses or modifier infrastructure.

`upgradeBusiness(state, id)` validates business, ownership, level and cap, derives
the cost, spends via `spendCash`, then returns the complete cash/level transition.
Expected failures are unknown-business, not-owned, invalid-level,
max-level-reached and existing economy errors (including insufficient-funds).
Failures retain the exact original state. Simulation continues to fail loudly on
corrupt authoritative levels, while loaded external data is strictly validated.
`selectBusinessProgress` returns current level/rate, next rate/cost and affordability
for real UI use. Other business helpers remain feature-public and React-independent.

### Save schema v2 and compatibility

`CURRENT_SAVE_VERSION` is now **2** because the authoritative ownership shape changed.
`migrateToCurrentSave` explicitly validates the old v1 envelope and old ownedIds
array (known, unique IDs only), converts owners to level-1 records, and validates
the resulting v2 state. Cash, production remainder and savedAt are unchanged by
migration. Missing/extra fields, invalid money, unknown IDs and bad levels remain
rejected. v2 payloads cannot use v1 ownership, and unsupported future versions fail.
No fake migrations or alternate schema path exist. Further versions must add real
sequential validated steps after v1→v2. Local bootstrap still uses the original
savedAt for offline catch-up, then durably writes current v2 state/current time.
Thus migration itself neither loses absence nor silently consumes it.

The **CE1-** encoding and storage key remain unchanged: transport version is
independent of save schema version. Old save codes migrate through the same loader.
Import still validates historical savedAt without crediting it, writes a new local
timestamp before replacement, and resets live timing. v2 levels survive command
saves, five-second autosave, reload, export, import and offline bootstrap.

### Time and fraction boundaries

Upgrade runs through the existing `execute`: reconcile whole elapsed milliseconds
at the OLD level, then upgrade, then future time uses the NEW level. Purchase and
upgrade never reset authoritative production milli-cents. On a successful ownership
map change the runtime discards only the remaining **sub-millisecond runtime time**
at that rate boundary, extending the existing first-purchase policy. This is a
conservative loss of less than 1 ms per successful rate change, not per callback;
it prevents old-rate fractional time from receiving the higher rate. Failed commands
retain that runtime fraction. No new scheduling loop or production formula exists.
With integer elapsed boundaries, online/offline partition equivalence stays exact,
including saved fractions before an upgrade followed by scaled production after it.

Offline remains `simulateElapsed` with the saved levels, the unchanged eight-hour
cap, safe future-clock rebasing, atomic write-before-publication and one-time
consumption. The offline algorithm and save-code transport are unchanged.
The card shows Level, current and next production, upgrade cost, affordability and
MAX LEVEL. Announcements reuse existing action feedback; no upgrade modal is needed.
Phase 3B is complete. No additional business, managers, special upgrades or modifiers
are implemented; future phases must preserve migration and rate-boundary semantics.


## Phase 4A — central stats and one equipment upgrade

### Evaluation and sources

`game/modifiers.ts` owns the pure `evaluateStat(base, target, modifiers)` path.
`game/effective-stats.ts` collects effects from validated purchased upgrade IDs and
uses that evaluator for business production and starter-job reward. Business code
still owns `baseProductionCentsPerSecond × level`; its public
`getOwnedProductionInputs` returns business IDs with their level-scaled base inputs.
The former rates-only API changed deliberately so composition can apply scope
without matching rates to IDs by positional assumptions. Simulation and UI both
use the same effective-stat composition. No config or derived bonus enters saves.

The two typed stats are `business-production` and `job-reward`. Business scope is
an explicit business ID, or null for all businesses; global business effects never
apply to jobs. The shipped effect is business-specific. Each modifier has stable
`id`, `sourceId`, target and `multiply-basis-points` operation. A bonus of 2,500
basis points is +25%; its exact factor is 12,500/10,000. Filter by stat/scope,
sort eligible effects by stable ID using lexical comparison (not locale), and
multiply their factors. Two +25% bonuses would compound to ×1.5625, not ×1.5.
Duplicate modifier IDs fail loudly to prevent double application. No flat/additive
percentage operation is implemented without a content consumer. This is intentionally
smaller than the early proposed generic contract.

All arithmetic uses transient BigInt and reduced rational values; no authoritative
floating-point amount or percentage exists. Evaluation exposes base, ordered applied
modifiers (including source IDs), and effective value for explanation. Magnitudes
above Money's existing maximum return `overflow`. Invalid config is a programming
error, not a silently skipped bonus. Technical work bounds are 64 modifiers and
nonnegative safe-integer bonus deltas up to 1,000,000 basis points per modifier.
These are resource/config limits, not new purchasable progression caps.

Discrete job rewards floor once to whole cents **after** the entire evaluation;
there is no job-fraction state. With no job-targeted content the reward remains
exactly 2,500 cents. The command, button and feedback obtain that effective reward.
Continuous business rates are never floored before elapsed simulation.

### Exact fractional production

`shared/rational.ts` provides only the consumed nonnegative fraction operations:
reduction, addition, multiplication and validation. Rational data is
`{ numerator: string, denominator: string }`, canonical decimal integers, positive
denominator, reduced by gcd; zero must be `0/1`. Each component is bounded to 256
digits before parsing. Arithmetic exceeding that precision bound returns an
explicit overflow through evaluation/accrual rather than rounding. It is a
technical resource boundary; future content must remain within it or deliberately
migrate/change the contract. Money itself retains its separate 100-digit bound.

The existing integer `businesses.productionRemainderMilliCents` (0..999) remains
unchanged in meaning. v3 adds `productionRemainderSubMilliCents`, a reduced fraction
in [0,1) of **one milli-cent**. Together they represent exactly
`(milliCents + subMilliCents) / 1000` cents. This mixed representation retains old
milli-cent values verbatim while supplying the precision percent factors require;
neither field duplicates the other. This is earned authoritative production, not
fractional runtime milliseconds.

`accrueProduction` sums exact rational cents/second, multiplies once by integer
elapsed milliseconds, adds both old remainder parts in milli-cent units, extracts
whole cents, then normalizes the two remaining parts. It also accepts unchanged
whole-cent rate inputs. `simulateElapsed` remains the only economic production
coordinator: effective rates → one accrual → `earnCash` → atomic state publication.
Cash and both fractions stay unchanged on overflow. Runtime/valid-save corruption
policies are preserved. No loop scales with elapsed time.

At level 1 with equipment, the rate is 375/4 cents/sec. One millisecond earns
93 + 3/4 milli-cents; four milliseconds earn 375 milli-cents. These fractions
survive callbacks, saves, purchases, levels and offline catch-up. Accepted split
intervals equal one combined interval exactly. Precision overflow, like cash
overflow, rejects the whole interval; rejected intervals are never partial credit.

### Equipment, transactions and v3 migration

`features/upgrades` contains exactly **Commercial Pressure Washer**,
`upgrade:commercial-pressure-washer`: $2,500, requires Dockside Detail ownership,
+25% Dockside production at every level. `upgrades.purchasedIds` is the only added
ownership slice; it stores unique known IDs. Config owns cost/requirement/effect.
`purchaseUpgrade(state, id)` validates lookup, duplicate and prerequisite, calls
`spendCash`, and publishes cash plus ownership together. Failures return the original
state with `unknown-upgrade`, `already-purchased`, `prerequisite-not-met`, or the
existing economy error. No repeat tier, other upgrade or automation is present.

Runtime `execute` reconciles the old modifier set before the equipment purchase.
Future elapsed time uses the new set. Successful equipment changes extend the
Phase 3B rate-boundary policy: discard only the remaining sub-ms runtime duration
(less than 1 ms), never either earned production remainder. Failed commands retain
that duration and all successfully reconciled income. No second production timer.

The single envelope is now **v3**, CE1- transport and storage key unchanged.
Sequential v1→v2 converts IDs to level-1 records; v2→v3 adds empty purchased IDs and
`0/1` sub-milli-cent remainder. Each input shape is validated, then the final v3
state is validated and reconstructed. Levels, cash, old milli-cents and savedAt
are preserved exactly. Current validation rejects unknown/duplicate upgrade IDs,
upgrades without required ownership, malformed levels, noncanonical fractions,
custom prototypes/accessors, missing/extra fields and newer unsupported versions.
There is still one schema path for local saves and portable codes.

Local migration preserves savedAt so offline bootstrap consumes the full eligible
absence through modified `simulateElapsed`, capped at the unchanged eight hours.
Durable write still precedes offline/import publication. Failed writes preserve
old storage; failed offline catch-up pauses without autosave. Successful bootstrap
rebases once. Imported historical timestamps still award nothing; import writes
current local time and offline timing begins there. Five-second autosave and the
250 ms live scheduler are unchanged.

### Presentation and completion

The single compact equipment panel displays config cost, requirement, effect,
affordability and PURCHASED/active status; buying controls disappear after purchase.
The business card shows effective current/next production and base/bonus breakdown.
Rates display up to four dollar decimals (e.g. $4.6875/sec), with at least two;
nonterminating/higher-precision future values are truncated only for display and
labelled ≈. Formatting never feeds simulation. Existing focus, mobile layout,
polite feedback and reduced-motion rules are retained; no UI timer is added.
Phase 4A is complete; Phase 4B and automation remain deferred.

## Phase 4B — catalog and stacking contract

Five upgrades now use the same `purchaseUpgrade` command and `evaluateStat` path.
The explicit `UPGRADE_CATALOG` array defines presentation order; evaluation order
is independent: filter stat/business scope, apply all `add-flat` adjustments in
stable modifier-ID order, then all `multiply-basis-points` factors in stable ID
order. Flat amounts are canonical whole cents (cents/sec for production); factors
are `(10000 + bonusBasisPoints) / 10000`. No intermediate rounding occurs. All
rational bounds/overflow rules remain unchanged. Discrete jobs floor only once at
payout; continuous production retains both authoritative remainder fields.

Business-specific targets match exactly; a null business ID applies to every
business for the business-production stat only. Job targets are stat-only. The
evaluator contains no Dockside special case. Config requirements are `business`,
`any-business` or `none`; purchase, selectors and authoritative save/source
validation share `meetsUpgradeRequirement`. Job upgrades require no business.

Evaluation metadata supplies ordered named bonus explanations to both the business
card and delivery area. UI formatting never feeds economic calculations. All five
cards show scope, cost, prerequisite and purchase availability; purchased cards
remove buying controls. The catalog uses two columns, one below 740px, retaining
existing keyboard focus, touch targets and reduced-motion rules.

Save schema remains **v3**: only catalog/config and derived metadata changed, not
GameState or envelope shape. Existing v3 washer saves remain valid; v1/v2 migrate
sequentially as before, and CE1- transport is unchanged. Unknown/duplicate purchased
IDs are rejected. Persistent upgrade IDs must never be renamed/retired without
explicit migration handling; do not silently ignore retired content. No new keys
or cached effective stats exist.

Every upgrade purchase reconciles old modifiers before atomic spending/acquisition;
only later elapsed time uses the new set. Earned milli-cent and sub-milli-cent
remainders survive. Autosave, export/import and offline bootstrap keep their normal
paths: durable write before replacement, imported historical timestamps ignored,
eight-hour offline cap and one-time consumption. Online/offline production both use
`simulateElapsed`, with no additional timers or modifier-specific formula.

## Phase 4C — starter-job delegation

`features/automation` owns exactly one config, **Delivery Dispatcher**
(`automation:delivery-dispatcher`): $7,500, requires Dockside ownership, one-time
unlock, fixed 10,000 ms interval. It is distinct from upgrade ownership and adds
no modifiers, workers, levels or additional businesses. GameState adds only:

```ts
automation: {
  unlockedIds: AutomationId[];
  starterJobElapsedMs: number;
}
```

Progress is a safe integer in `[0, 10000)`; locked state requires zero progress.
There are no timestamps, cached rewards, lifetime counts or UI history in this
slice. `purchaseAutomation` validates identity/prerequisite/ownership, spends via
`spendCash`, and returns cash plus unlock together with initial progress zero.
Failures retain the original object. Manual deliveries remain available, reuse
`evaluateJobReward`, and never change automation progress.

### Shared elapsed transaction

`simulateGameElapsed` is the small composition boundary used by live runtime and
offline bootstrap. It calls **`simulateElapsed` once for business production**,
then `simulateAutomation` for the **same integer elapsed duration**, returning one
candidate. The existing business formula and both production remainder fields
are unchanged. If either transition fails, the composition returns the original
state; no successful intermediate business credit/progress is published.

Automation uses transient BigInt for `total = previousProgress + elapsedMs`,
`jobs = total / interval`, `progress = total % interval`. It does not loop per job.
Even maximum safe elapsed plus prior progress is exact; the quotient at the fixed
interval and remainder fit safe integers. Completed jobs use the same
`evaluateJobReward` as manual jobs, including flat-before-percent stacking and
one floor at discrete payout. `multiplyMoney(reward, jobs)` and `earnCash` apply the
batch with existing overflow checks. No reward constant or modifier formula is
copied. Invalid elapsed returns an explicit failure; corrupt authoritative progress
throws under the existing fail-loudly policy. Runtime suspends on failure and
prevents later autosaves from publishing an intermediate candidate.

For unchanged modifiers, partitioning successful elapsed intervals yields identical
cash and progress. The runtime uses its existing 250 ms monotonic scheduler and
fractional runtime-ms accumulator; no extra production timer exists. Before **any**
player command it reconciles both systems with old ownership/modifiers. Unlocking
starts progress at zero at that boundary, so prior time never counts. Successful
unlock changes extend the existing conservative discard of less than one runtime
millisecond at rate boundaries; earned business fractions and whole-ms automation
progress are never discarded. Failed commands retain timing as before.

Job-modifier purchases first pay all jobs completed up to the boundary at the old
reward. An unfinished cycle retains its progress and pays the new reward when it
later completes. There is no prorated per-ms job income. Manual jobs do not reset
or advance that cycle. After successful reconciliation, optional runtime-only
`automationEvent` holds just the latest completed batch, its exact income and an
announcement sequence. Ordinary ticks preserve it as a labelled “Last dispatch”;
imports clear it. No notification history or lifetime job statistics are saved.

### Save v4, offline and import semantics

Schema **v4** adds automation; sequential v1→v2→v3→v4 migrations validate each old
shape. Valid v3 saves gain locked automation with zero progress, preserving cash,
levels, all purchased upgrades, both production fractions and savedAt exactly.
The shared slice validator rejects missing/extra fields, unknown/duplicate IDs,
invalid progress, locked nonzero progress and unmet ownership prerequisites.
CE1- remains the transport; local storage key and bounds are unchanged. Stable
automation IDs require explicit migration if retired or renamed.

Offline bootstrap calls the shared elapsed coordinator with the existing capped
window: **both businesses and delegation receive at most eight hours**. Saved cycle
progress contributes to those jobs; discarded absence contributes to neither jobs
nor remainder. Future timestamps award zero and safely rebase. The resulting
candidate is durably written with current time **before** live publication/startup.
Failure preserves the old save and pauses startup. Repeated bootstrap/reload and
Strict Mode retain the existing once-only interval consumption behavior.

Export reconciles both systems and serializes v4 with fresh injected savedAt.
Confirmed import validates/migrates, preserves imported progress, writes before
replacement, resets active timing and uses import time for future local offline
accrual. Historical imported timestamps award **no business or automated income**.
Five-second autosave continues through ordinary reconciliation, not every tick.

The compact Delegation card shows prerequisite, cost, current effective reward,
interval, ownership and a labelled native progress element with time remaining.
After hiring, buying controls disappear. Polite feedback aggregates each completed
batch. The welcome card optionally separates business and dispatcher income/jobs
while retaining total, credited time, cap notice and dismiss control. Presentation
uses selectors/formatters and the existing responsive/focus/reduced-motion styles;
there is no UI timer. Phase 4C is complete; further delegation systems are deferred.

## Phase 5A — player XP and derived levels

GameState.progression = { xp: number } is the only new authoritative state.
XP is separate from Money: a nonnegative safe integer through
Number.MAX_SAFE_INTEGER (9,007,199,254,740,991). It cannot be spent. The progression
feature exports validation, immutable addXp(state, amount, count), level thresholds,
getPlayerLevel, getLevelProgress and getLevelIncrease. Batch addition uses
transient BigInt to check the exact total before converting back to Number.
Overflow returns xp-overflow with the original state; invalid authoritative
inputs throw under the existing programming-error policy. There is no clamping.

Player level is derived, never persisted. An immutable 100-entry threshold table
uses 100 × (L - 1)²; integer binary search finds the highest reached level.
Level starts at 1 and caps at 100 while XP can continue increasing. Progress metadata
provides cumulative XP, current threshold, nullable next threshold, integer
within-level progress/requirement, max status and a presentation-only ratio.
React does not calculate thresholds or persist a level/progress percentage.

### Three reward transactions

Central XP_REWARDS defines manual delivery **10**, dispatcher cycle **5** and
business level increase **25**. Manual delivery composes evaluated Money and XP
before returning either. A business level upgrade composes spend, level change and
XP before returning. Any failure preserves the entire original state. Money
modifiers never affect XP. Business/equipment/delegation purchases, passive
business production and elapsed time alone award no XP.

Dispatcher simulation batches 5 × completedJobs through addXp; no per-cycle
loop or second XP scheduler exists. simulateGameElapsed still composes business
production through the unchanged simulateElapsed, then dispatcher Money/progress
and XP for the same interval. All publish together or none publish. An XP failure
rolls back the candidate business cash and both fractions too, then follows the
existing runtime suspension/blocked-autosave policy. Manual jobs leave cycle
progress alone. Pre-command reconciliation still pays completed cycles with old
modifiers and old business levels before applying the command and its XP reward.

### Save v5 and offline XP

Current schema **v5** adds progression. Sequential v1→v2→v3→v4→v5 migrations
validate each historical shape; v4 gains { xp: 0 }, preserving cash, owned levels,
purchased upgrades, dispatcher ownership/progress, both production fractions and
savedAt. No historical clicks/level upgrades are inferred. The retained timestamp
still permits normal capped offline dispatcher simulation after migration.
Current validation requires exactly the progression XP field and rejects negative,
fractional, nonfinite, unsafe or otherwise malformed XP using the progression API.
CE1- transport, storage key and encoded/decoded bounds are unchanged.

Offline dispatcher cycles award the same 5 XP each in the shared eight-hour window.
Saved progress contributes; discarded absence and business income award no XP.
Future timestamps still credit zero and rebase. Money, progress, XP and current
timestamp are written durably before the candidate is published. Failure preserves
the prior save and pauses startup; restart/reload/autosave cannot replay the
consumed interval. Export reconciles live Money and XP before encoding. Confirmed
import preserves validated XP but awards no historical Money **or XP**, writes
before replacement, and rebases future offline timing to import time.

### Presentation and verification

The compact labelled native progress bar beside cash shows within-level XP and
the next level; max level shows MAX LEVEL plus total XP. Runtime-only levelEvent
stores only the latest derived before/after level increase with an announcement
sequence, preserved on ordinary ticks and cleared on import. It has no gameplay
effect and no notification history. Polite inline feedback handles one or multiple
levels without a modal or extra timer/motion. Source XP is combined with existing
manual, business-level and dispatcher messages. Offline metadata adds xpEarned
and an optional derived level increase; its welcome card shows XP only when positive.

Deterministic tests cover all threshold boundaries, integer validation/batch
overflow, transaction rollback, modifier independence, migration/CE1 round trips,
runtime ordering, capped once-only offline XP, persistence failures and display
states. Phase 5A is complete; skills, level-gated content, income bonuses and
Phase 5B remain deferred.

## Phase 5B — central acquisition requirements

Requirement is a small discriminated union in src/game/requirement.ts. Content
definitions contain readonly requirements lists; they are configuration, never
GameState. Supported types are player-level, business-owned, business-level,
any-business-owned, upgrade-purchased and automation-unlocked. References use
typed stable content IDs. There are no OR/NOT trees or scripting hooks.

evaluateRequirements(state, requirements) is the sole pure acquisition evaluator.
It checks every entry in explicit config order, ANDs the results, and returns each
original requirement, its met boolean and a centrally constructed description.
Player level comes from getPlayerLevel(XP); business levels use the business public
API. A minimum business level implies ownership. Empty lists succeed. Unknown
configured IDs and invalid/impossible minimum levels throw as programming errors;
catalog tests exercise every configured reference. Evaluation has no side effects.

purchaseBusiness, purchaseUpgrade and purchaseAutomation all evaluate requirements
after identity/duplicate checks and before spending. Failed acquisition returns
prerequisite-not-met with a structured RequirementResult and the exact original
GameState; cash, ownership, XP and progress are unchanged. Insufficient funds remains
a separate failure after eligibility succeeds. Selectors use the same evaluator.
The old upgrade-specific prerequisite evaluator and hardcoded dispatcher ownership
check are removed.

### Acquisition-only compatibility

Requirements gate acquisition, not ongoing ownership or effects. Save validation,
modifier collection and automation simulation no longer re-evaluate acquisition
conditions. They still reject malformed state, unknown/duplicate ownership IDs,
invalid levels, XP, cash and progress. Known owned items remain valid and active
even when new gates (including prerequisites) are unmet. In particular, a low-XP
save with Street Connections or a dispatcher, and Fleet Logistics without its new
washer prerequisite, loads/imports and produces normally. Nothing is revoked.

GameState is unchanged, so save schema stays **v5**, sequential migrations remain
v1→v2→v3→v4→v5 and transport stays **CE1-**. This config change needs no migration.
Existing persisted IDs are still compatibility contracts. Imported historical
savedAt awards neither Money nor XP. Shared offline simulation, eight-hour cap,
write-before-publication, once-only consumption and exact remainders are unchanged.
Commands still reconcile old production/rewards before checking current eligibility;
a dispatcher cycle can cross an XP threshold before the following purchase.

### Presentation and progression

Upgrade and delegation cards consume structured requirement details through one
RequirementList component. Explicit “Met / Not met” text supplements the locked
state; unmet requirements and lack of cash remain distinct. Already-purchased cards
show PURCHASED/ACTIVE and omit acquisition locks. Existing responsive layout,
semantic buttons, focus styles and progress controls are retained.

The latest runtime-only levelEvent can include newly eligible content names,
computed by comparing complete requirement results before/after XP changes in
explicit catalog order. It excludes already-owned items and does not imply cash
affordability. Polite level-up feedback announces these names; no flags/history
are saved and no extra scheduler is added. Other eligibility changes (such as
business level 4→5) immediately update the card through selectors.

Dockside purchase and Express Tips have empty requirement lists. Manual work
remains ungated and awards cash/XP, ensuring a fresh player can buy Dockside and
reach Level 2 without gated content. Future businesses and separately implemented
cars/skills/districts can declare these same typed AND lists; none are added here.
Phase 5B is complete. The next phase requires a new task.


## Phase 5C — vehicle collection and Garage

GameState adds only `garage: { ownedVehicleIds: VehicleId[] }`. Ownership IDs are
unique, stable and namespaced; prices, requirements, effects, labels and artwork
are never duplicated in state. The vehicles feature exposes its typed definition,
explicitly ordered catalog and lookup through its public API. There is exactly one
provisional collectible: Vortex S9 (`vehicle:starter-sport-sedan`). No equipped slot,
capacity, vehicle levels, selling or set bonuses exist; all owned bonuses are passive.

`purchaseVehicle(state, id)` validates identity/duplicate ownership, calls the same
`evaluateRequirements` used by other purchases, then spends through `spendCash`.
Cash and ownership publish together. Expected failures are `unknown-vehicle`,
`already-owned`, `prerequisite-not-met` (structured RequirementResult) and existing
economy errors including `insufficient-funds`. The original state is retained on
failure; acquisition awards no XP and never resets earned fractions or delegation.
Requirements apply only to purchase. Known owned vehicles remain valid and active
when imported below the acquisition gates, just like grandfathered upgrades.

The sole modifier collector now combines purchased upgrades and owned vehicles,
resolving definitions and rejecting unknown/duplicate authoritative IDs. Both sources
enter the unchanged `evaluateStat`: flats first, then exact multiplicative basis-point
factors, stable modifier-ID order within each group, no intermediate rounding.
The sedan supplies one +15% global business-production modifier (1,500 basis points).
There is no car-specific production path or stored multiplier. Job Money/XP is
unaffected. Business production still goes through `simulateElapsed`, retaining
both the integer milli-cent carry and reduced rational sub-milli-cent carry.

Vehicle commands use the existing runtime execute boundary: reconcile with old
ownership first, acquire, then produce with the new modifier. As with other rate
changes, only the runtime's unapplied sub-millisecond duration is dropped at the
boundary; authoritative earned fractions survive. No scheduler is added.
The shared eight-hour offline window, Dispatcher jobs/XP, future-clock handling,
one-time timestamp consumption and durable write-before-publication remain intact.

### Save v6 and presentation identity

The shape change requires **v6**. The sequential v1→v2→v3→v4→v5→v6 pipeline validates
each historical shape; v5 gains an empty garage, preserving cash, XP, business
levels, upgrades, automation progress, both production fractions and savedAt exactly.
The v4→v5 step still emits the historical v5 shape before the new step. No offline
time is lost through migration. Current validation requires the garage's sole
ownership field and rejects unknown/duplicate IDs and malformed structures. It does
not evaluate acquisition requirements. Retiring/changing a persistent vehicle ID
requires an explicit migration; changing its name or art does not.

Local saves, autosave and CE1- export/import all use this one schema. Export
reconciles current state first. Import preserves vehicle ownership, writes before
replacement and rebases active/local timing; historical imported timestamps award
no Money, jobs or XP. The vehicle effect is active immediately after replacement.

The Garage section uses pure `selectGarage` counts and `selectVehicle` purchase
presentation, the shared RequirementList, explicit owned/locked/insufficient-cash
text, semantic buttons and the existing mobile/focus styles. Owned cards omit buy
controls. Modifier breakdown names resolve both upgrade and vehicle source IDs.
Level-up eligibility feedback includes the vehicle in explicit catalog order.

`app/vehicle-artwork.ts` is a presentation-only registry keyed by stable VehicleId.
Its neutral CSS placeholder can later resolve imported images without changing any
save or formula. The temporary display name and final catalog/art are replaceable.
Later artwork is intended to be detailed, real-car-inspired, lightly toon/comic
styled, with fictional names and no unmodified manufacturer logos. No final images,
logos or final Solara City art direction are implemented in Phase 5C.

Phase 5C is complete; more vehicles and collection set bonuses remain deferred. Phase 6A follows below.


## Phase 6A — Rebirth and permanent progression

`permanentProgression` stores only `empirePoints` and `rebirthCount`, each a
non-negative safe integer up to Number.MAX_SAFE_INTEGER. EP is neither Money nor
XP and has no gameplay effect or spending path yet. Player level remains derived.
`game/rebirth.ts` owns the acquisition requirements, reward preview and pure
`performRebirth` transition. Eligibility uses the central AND evaluator: Player
Level 20 and Dockside Detail Level 25. Reward is integer division of player level
by 10 plus integer division of Dockside level by 10, each floored independently.
Cash, vehicles, upgrades and automation do not enter this formula.

The exhaustive `REBIRTH_POLICY` describes every GameState slice. The transition
constructs a fresh state and explicitly retains only garage and updated permanent
progression. Adding a future slice requires an explicit policy decision.

| Reset to fresh run | Retain permanently |
| --- | --- |
| Cash: zero | Exact owned vehicle IDs |
| Businesses and their levels: absent | Previous EP plus current reward |
| Normal upgrades: none | Previous Rebirth count plus one |
| Dispatcher ownership: locked; progress: zero | |
| XP: zero; derived player level: one | |
| Both production remainder fields: zero | |

Incomplete delivery progress and remaining fractional production are sacrificed.
Vehicles remain active collection modifier sources despite now-unmet acquisition
requirements. Rebuying level-1 Dockside with Vortex S9 yields exactly $0.8625/s
through the existing evaluator. Temporary purchases must satisfy their gates again.
Repeated Rebirths use the same reset, accumulating EP/count without special cases.
Overflow fails with the original state; malformed authoritative input follows the
existing loud validation convention without mutation.

### Destructive transaction and confirmation

`persistent-game.rebirth()` is separate from ordinary publish-then-autosave
commands. It reconciles current elapsed business production and Dispatcher cash/XP,
then re-evaluates eligibility and reward, builds the whole reset candidate, and
uses the normal guarded save adapter. Only a successful durable write permits
runtime replacement. The existing replacement boundary rebases monotonic timing,
drops fractional runtime milliseconds and clears prior runtime event metadata.
No pre-Rebirth elapsed interval enters the new run. No additional timer exists.

A failed write preserves the reconciled pre-Rebirth live state and previous durable
save, awards no EP and resets nothing. No destructive candidate is queued for retry.
Blocked/corrupt-save sessions cannot overwrite that save through Rebirth. Normal
runtime failure suspension still applies when pre-command reconciliation fails.
Successful persistence records current injected wall-clock time; offline timing
starts at that new anchor. Immediate reload cannot award pre-Rebirth progress.

The compact Empire panel consumes the shared preview and policy. Review opens an
inline accessible confirmation with the exact current reward and explicit keep/lose
summary. Cancel affects only UI state, not clocks or saves. Confirmation reads the
latest authoritative state again, including XP earned while it was open. Success
reports the actual awarded reward; failures clearly report that nothing reset.
Focus moves to Cancel on opening and returns to the heading on completion/cancel.
Confirmation and feedback are never persisted.

### Save v7 and existing simulation

The same validated envelope and CE1- transport now carry schema v7. Sequential
v1→v2→v3→v4→v5→v6→v7 migration adds zero EP/count to valid v6 saves while preserving
all temporary state, garage, both fractions and savedAt exactly. Migration never
performs Rebirth. Current v7 validates both permanent fields strictly; missing,
negative, fractional, unsafe or non-number values are rejected, not repaired.

Export/import preserves permanent and temporary state through the shared schema.
Import never triggers Rebirth and historical imported timestamps award no cash,
jobs, XP or EP; local timing starts at import time. The existing eight-hour offline
cap, write-before-publication, one-time consumption, future-clock policy, Dispatcher
XP and vehicle modifiers are unchanged. Offline simulation cannot increase EP/count.
Phase 6A stopped before skills; Phase 6B extends this permanent contract below.


## Phase 6B — Empire Foundations

One permanent tree, `tree:empire-foundations`, contains exactly five skills.
`features/skills` owns stable SkillIds, immutable definitions, explicit display
order and strict rank validation. Names can change without changing save identity.
Retiring or changing a persistent ID/rank meaning requires explicit migration.
`permanentProgression` now contains `{ empirePoints, rebirthCount, skills }` where
`skills` is a sparse SkillId→positive integer rank map. Absent means rank zero;
stored zero, unknown IDs, malformed maps, accessors, non-serializable properties,
unsafe/fractional ranks and ranks above configured maxima are rejected.
No effects, costs, cap, prerequisite flags or derived levels are persisted.

Empire Points are the existing **unspent** safe-integer currency. The only skill
acquisition API is `purchaseSkillRank(state, skillId)`. It validates authoritative
state, looks up the definition and next rank, evaluates configured AND requirements,
checks EP and atomically subtracts exact EP while incrementing precisely one rank.
No Money, XP or Rebirth count changes. Unknown skill, max rank, unmet prerequisite
and insufficient EP are distinct typed failures preserving the entire original
state. Malformed authoritative state fails loudly without mutation.

The central requirement union adds `skill-rank` with stable SkillId and minimum
rank. Definitions use type-only references so configuration does not import the
runtime evaluator. Prerequisites are acquisition-only: already-owned ranks remain
valid and active without their current prerequisites, including import and Rebirth.
See BALANCING.md for all five exact definitions and prerequisite boundaries.

### Shared stats and XP units

`collectModifiers` gathers purchased equipment, vehicles and owned skill ranks.
`getSkillEffect` computes both preview and applied strength. Stat skills produce
one modifier per skill with a stable ID derived from SkillId;
ranks add basis points within that skill (not separate factors per rank). Different
sources then multiply, after flats, in the existing stable modifier-ID order.
There is no separate prestige multiplier. Production retains exact rational rates
and both authoritative production remainders through the sole `simulateElapsed`
path. The same breakdown identifies equipment, vehicles and skills by source name.

`evaluateStat` additionally supports the typed `xp-reward` target with a transient
BigInt base, separate from Money. Existing Money callers retain their contract.
`game/xp-reward.ts` is the single XP reward boundary for manual jobs, business levels
and dispatcher batches: choose configured base XP, multiply by batch count exactly,
evaluate all matching modifiers, floor the final rational result once, enforce the
safe-integer XP bound, and add via the progression API. No fractional XP is saved.
Money modifiers never affect XP; XP modifiers never affect Money or level thresholds.
Money/XP/level/progress changes still publish atomically; XP overflow rolls all back.

**Dispatcher XP intentionally depends on batch boundaries.** At +10%, one batch of
three cycles earns floor(15×1.10)=16 XP. Three separate one-cycle batches earn
5+5+5=15 XP. This is the specified batch-floor policy, not per-cycle flooring inside
a batch and not a fractional carry system. Production Money, dispatcher Money and
cycle progress remain partition-independent; fractional modified XP does not claim
that property. Online and offline agree for the same state and same credited batch.
No per-cycle loops or additional clocks are introduced.

### Derived cap and command boundaries

`getOfflineCapMs` derives the shared cap from validated permanent ranks: eight-hour
base plus Never Sleeps' configured two hours per rank (10h/12h). The offline
bootstrap validates/migrates first, computes this cap, bounds actual wall-clock
elapsed, then supplies one credited duration to business production, dispatcher
Money and dispatcher XP. `OfflineProgress.capMs` records the cap actually used for
that runtime-only welcome-back result. UI reads it instead of the base constant;
the current session note reads the same cap selector. The cap is never saved.
Discarded time does not enter automation progress or future catch-up. Purchasing
Never Sleeps online changes future absence credit only; bootstrap is not rerun.
Future-clock rebasing, one-time consumption and durable offline publication remain.

Every skill purchase uses existing `runtime.execute`: reconcile old ranks first,
apply the atomic command, then the normal successful-command save. No pre-purchase
business income, completed delivery Money or completed delivery XP receives a new
bonus. Unfinished delivery progress survives and a later completed cycle uses the
then-current ranks. The established runtime sub-ms rate boundary also applies to
skill changes; earned authoritative production fractions remain intact.
Autosave remains five seconds and production scheduling remains 250 ms.

Skills use the existing ordinary-command persistence policy: save errors leave the
new valid rank/EP state live, expose the normal persistence warning and allow later
autosave, while the old durable save remains intact. Unsaved progress can be lost
on reload; it is never reported as durably saved on failure. Rebirth/import/offline
retain their stronger write-before-replacement transaction, unchanged.

### Rebirth, saves and presentation

The explicit Rebirth constructor now retains skill ranks along with garage, unspent
EP plus the new reward, and Rebirth count plus one. Every temporary field from the
Phase 6A matrix still resets. Spent EP is never refunded. The reward formula remains
unchanged. For example 3 unspent EP plus a 4 EP Rebirth leaves 7 EP with identical
ranks. Permanent effects resume automatically: Fast Talker/XP act on the next job;
production bonuses act when a business is repurchased; Never Sleeps retains its cap.

Save **v8** extends the single envelope through sequential v1→…→v7→v8 migration.
v7 gains only empty `skills`; every prior value including EP/count, garage,
automation progress, both production fractions and savedAt survives exactly.
Migration never buys ranks, spends EP or triggers Rebirth. Historical v6→v7 emits
the actual v7 shape before the new step. CE1- transport is unchanged; export/import
preserves all skills and unspent EP and activates owned effects immediately. Import
still awards no historical Money/jobs/XP/EP/ranks and rebases to current local time.

The single responsive Empire Foundations section consumes pure skill selectors for
ranks, prices, effects, requirements and availability. Text prerequisites carry the
branch relationships without reliance on connector lines. Current owned effects
stay labelled active even if another rank is locked. Maxed nodes omit purchasing;
EP shortage is distinct from a prerequisite lock. Existing polite action feedback
shows exact rank/EP changes and evaluated integer XP; Rebirth confirmation lists
Permanent skills under You keep. No new notification history, scheduler or UI library.

Phase 6B implementation is complete and was manually verified live by the user. No second tree,
sixth skill, respec, refunds, passive EP, extra currency or follow-on content exists.

## Phase 7A — Solara City territory foundation

**SOLARA CITY** is the canonical current city display identity; the repository,
`crime-empire-save` format and CE1- transport retain their names. The dedicated
`features/territories` public boundary owns two stable typed TerritoryIds,
immutable configuration, explicit presentation order and ownership validation.
Display names can change without changing saved identity. Renaming or retiring a
persistent ID requires an explicit migration, never silently ignoring ownership.

GameState adds only `city: { ownedTerritoryIds: TerritoryId[] }`. Every valid current
state must own `territory:waterfront`; `territory:neon-mile` is optional. The slice
contains unique known IDs only. Missing/malformed shapes, unknown/duplicate IDs,
missing Waterfront, accessors and non-JSON properties are rejected. No prices,
effects, labels, counts, requirements, territory levels or progress are stored.
Fresh state creates its own Waterfront ownership array, without charging cash or
awarding XP/EP. Waterfront has no modifier.

`acquireTerritory(state, id)` is the sole paid acquisition coordinator. It validates
authoritative state, checks identity/ownership, evaluates configured requirements
through the central AND evaluator, then calls `spendCash`. Money and territory
ownership change together or not at all; no XP, EP or Rebirth count reward exists.
Failures are `unknown-territory`, `already-owned`, `requirements-not-met` with
structured requirement details, and the existing economy failures (in particular
`insufficient-funds`). Failures return the entire original state. Waterfront is
already owned, so it has no acquisition action.

Neon Mile costs $100,000 and requires Player Level 12, Dockside ownership and Dockside
Level 15. These are acquisition-only gates. Valid imported ownership remains active
below its former gates. Nothing automatically grants Neon Mile when eligible. No
existing content gains a territory gate; manual work and the original progression
path remain open. A typed `territory-owned` requirement is supported centrally and
tested synthetically; it is not added to existing content. Type-only references keep
configuration independent of the requirement evaluator. Presentation and level-up
eligibility announcements use the same ordered requirement results.

### One shared modifier and time path

`collectModifiers` now includes `collectTerritoryModifiers(state.city)` alongside
normal upgrades, vehicles and permanent skills. Waterfront contributes nothing;
Neon Mile contributes exactly `modifier:territory-neon-mile-job-reward`, a +1,000
basis-point `job-reward` modifier with Neon Mile as source. `evaluateStat` is unchanged:
flat additions first, then multiplicative rational factors in stable modifier-ID
order, no intermediate rounding. Manual and Dispatcher Money use their existing
shared evaluated payout. XP, business production, Dispatcher interval/progress and
the derived offline cap are not modified by territory ownership.

Acquisition goes through `runtime.execute`: reconcile business and completed
Dispatcher jobs using OLD territory ownership, then acquire, then save through the
normal meaningful-command path. Later jobs use the new ownership; unfinished whole-ms
cycle progress survives. The existing conservative sub-millisecond runtime boundary
applies to territory changes too. Neither earned production remainder is reset.
No new scheduler or simulation formula exists.

Ordinary acquisition preserves the existing publish-then-save policy: write failures
leave the valid acquisition live, retain the prior durable save and expose the normal
persistence warning; later autosave may save it. It is not reported as durably saved
on failure. Rebirth, import and offline bootstrap retain their stronger durable
write-before-publication transactions. Autosave cadence remains five seconds.

Offline uses the same shared elapsed simulation and one skill-derived 8h/10h/12h
credited duration. Neon Mile affects Dispatcher Money only, with no territory-specific
catch-up. Production fractions, cycle remainder, XP batch flooring, future-clock
rebasing and one-time timestamp consumption remain unchanged.

### Temporary territory reset and save v9

The exhaustive Rebirth policy marks `city` as reset. The existing fresh-run constructor
restores exactly Waterfront owned / Neon Mile unowned. Rebirth retains garage,
unspent EP plus its unchanged reward, incremented count and permanent skill ranks;
all other temporary slices still reset. Neon Mile's bonus disappears, while Fast
Talker rank 1 continues making the post-Rebirth base job $27.50. Reacquisition needs
the same gates and full price again; no lifetime territory flags exist.

Save schema **v9** adds city. The sequential v1→…→v8→v9 pipeline validates historical
shapes; valid v8 gains only the fresh Waterfront baseline. Every prior field, both
production fractions, all permanent ranks/balances and savedAt survive exactly.
Older v6→v7 and v7→v8 steps continue emitting their historical shapes before v9.
Migration neither spends Money nor infers Neon Mile ownership from progression.
No current malformed city is repaired. Unsupported future versions remain rejected.

Local saves and CE1- codes use this single schema. Export reconciles first; import
retains city and all valid progression without acquisition checks, charging, feedback,
Rebirth or historical Money/jobs/XP/EP. It rebases local savedAt at import time and
writes before replacement. No separate city storage key exists.

The compact Solara City section has exactly two responsive district cards and derived
1/2 or 2/2 controlled counts. Central selectors provide ownership, eligibility and
affordability; shared requirement text distinguishes locks from insufficient cash.
Controlled cards omit acquisition, and Waterfront explicitly states no gameplay
bonus. Existing action feedback and modifier breakdown identify Neon Mile by name.
Rebirth confirmation lists loss of territories beyond the starting Waterfront foothold.
No map, final district art, Heat, Crew or Random Events are implemented.
Phase 7A is complete and was manually verified live by the user. Phase 7B follows below.

## Phase 7B — deterministic Heat

Phase 7A was manually verified live by the user. Phase 7B implementation adds
Heat to the temporary city slice; the user has now manually verified Phase 7B live.

`city = { ownedTerritoryIds, heat, heatDecayElapsedMs }`. Heat is an integer 0–100,
separate from Money/XP. Cooling progress is an integer 0–59,999 milliseconds. At
Heat zero progress must be zero. Tiers are derived centrally, never persisted:
COLD 0–19, NOTICED 20–39, WATCHED 40–59, HOT 60–79, MANHUNT 80–100.
The feature-public Heat API owns validation, bounded gains/reductions, constant-time
cooling, tier derivation and dynamic modifier construction. Content/balance constants
live in its config. Current save validation rejects malformed state rather than
clamping or repairing it; only gameplay gain/reduction operations clamp legitimately.

### Sources, ordering and batching

Exactly three sources gain Heat: a successful manual delivery adds 1; one Dispatcher
reconciliation batch adds `floor(completedJobs / 5)`; acquiring Neon Mile adds 10.
The territory definition declares its acquisition Heat, shared by command and UI.
Waterfront has zero and remains the unpurchased baseline. Other purchases, business
levels/production, XP and passage of time do not generate Heat. Manual delivery
returns Money, XP and Heat in one immutable transition. Its runtime-only result
also carries the actual awarded Money/XP so feedback never evaluates the next tier
by mistake. Neon Mile returns payment, ownership and Heat together; failures retain
all original state. No XP/EP/count is granted by Heat actions or acquisition.

`simulateGameElapsed` remains the single elapsed composition boundary:

1. Business production through the unchanged `simulateElapsed` path.
2. Dispatcher cycles, Money and XP using interval-start modifiers/Heat.
3. Dispatcher batch Heat gain, clamped to 100.
4. Heat decay over the same full integer elapsed duration.
5. Publish the complete resulting state atomically.

Business production changes no modifiers, so the Dispatcher sees the same applicable
modifiers as the interval start. Neither gains nor cooling change this batch's payout.
No cycle/minute interleaving or per-cycle loop exists. A HOT batch that ends COLD
still pays every completed job at HOT; only later batches use the cooler state.

There is deliberately **no cross-batch Heat counter**: 3 jobs then 2 jobs generate
zero Heat, whereas one batch of 5 generates 1. Heat and heat-dependent job Money
therefore do not claim partition independence across arbitrary reconciliation
boundaries. Online/offline equivalence means the same initial state and the same
elapsed batch. Business-production fractions remain partition independent, and
XP retains the separately documented final/batch-floor policy. The 250ms runtime
and five-second autosave cadence are unchanged. Ordinary short online batches
usually complete only one delivery and therefore generate no Dispatcher Heat.

For cooling, transient BigInt computes `total = progress + elapsed`,
`intervals = total / 60000`, and `remainder = total % 60000`. Subtract the smaller
of Heat and completed intervals. Preserve the remainder only if Heat remains
positive; reaching zero clears it. Heat zero never banks time. Gains while positive
preserve cooling progress; gains from zero begin at zero. This is safe even when
adding progress to maximum safe-integer elapsed would exceed Number precision.
Synthetic 10 jobs + 5 cooling intervals at Heat 20 gives 17. The real 10-second
Dispatcher completes 30 jobs in five minutes, giving 20 + 6 − 5 = 21 instead.

### One consequence and one action

The existing central collector includes the dynamic `modifier:heat-job-reward`
(source `heat:city-pressure`) only at HOT/MANHUNT. It targets `job-reward` exclusively:
HOT −1,000 basis points (×0.90), MANHUNT −2,500 (×0.75). The evaluator now permits
signed integer deltas down to −10,000, retaining the previous upper bound, stable
ID sorting, flats-first order and exact rational multiplication. No separate cash
subtraction or penalty formula exists. Breakdown metadata resolves to Heat — HOT
or Heat — MANHUNT. XP, business production, offline cap and Rebirth reward are unchanged.

The full `$43.56` stack becomes exactly `$39.204` at HOT or `$32.67` at MANHUNT in
the evaluator. The established discrete reward boundary floors the final per-job
payout to cents ($39.20 / $32.67); Dispatcher multiplies that same payout by its
completed cycles. No new saved fractional job-cash field or intermediate modifier
rounding is introduced. A manual job at 79 uses HOT, then gains 1; the next uses
MANHUNT. At 100 jobs remain available, gains clamp and territory is never revoked.

`layLow(state)` is the sole active Heat-reduction command: require positive Heat,
spend $500 via `spendCash`, reduce Heat by 10 down to zero, preserve cooling progress
unless the result reaches zero. Failures distinguish `already-cold` and
`insufficient-funds` with the original state. No cooldown, XP/EP, progress reset or
confirmation modal. It and acquisition use ordinary reconcile-before-command,
then meaningful-command saving; completed jobs always use the old Heat/ownership.
Manual/Lay Low preserve existing fractional runtime duration and earned production
remainders; discrete rewards are selected when cycles complete. Existing purchase
rate-boundary behavior remains unchanged.

### Offline, Rebirth and saves

Offline bootstrap uses the same composition and one Never Sleeps-derived 8/10/12h
credited duration for all economic simulation, Dispatcher Heat and cooling. Excess
absence contributes nothing, including no cooling remainder. No second cap or
clock exists. The candidate is durably written before startup publication; failure
preserves the old save and pauses startup. One-time consumption and future-clock
rebasing remain intact. The live Heat panel reflects the caught-up result; no Heat
history or additional offline notification state is persisted.

The authoritative fresh-run constructor resets Heat/progress to zero alongside
Waterfront-only ownership. Rebirth reconciles first and writes before replacing
state as before. Garage, EP/count and permanent skills remain; Neon Mile and Heat
reset. Fast Talker rank 1 consequently pays $27.50 after Rebirth with no territory
bonus or Heat penalty. Heat never affects eligibility or EP reward. Confirmation
explicitly lists loss of current Heat/attention.

Save schema **v10** adds only the two Heat fields through validated v9→v10 migration.
Every previous field and savedAt survives exactly; old players start at zero Heat
regardless of ownership/history. The v8→v9 step still emits the actual historical
ownership-only city shape. v1–v9 CE1 codes migrate sequentially. CE1 transport,
encoding, bounds, storage key, import and Rebirth transaction semantics are unchanged.
Import preserves Heat/progress without historical cooling or Dispatcher Heat and
rebases timing to import time. Export first reconciles current runtime.

The Solara City Heat panel consumes pure selectors for tier, penalty, affordability,
cooling countdown and Lay Low. Native progress semantics, visible tier text, focus
styles and restrained colors retain accessibility without flashing or new UI timers.
Neon Mile discloses +10 acquisition Heat before purchase. No wanted stars, police
encounters, RNG, loss/confiscation, Crew or random events were part of Phase 7B.
Phase 7C follows below.

## Phase 7C — Crew assignment foundation

Phase 7B was manually verified live by the user. Phase 7C implementation is complete;
it was manually verified live by the user. `features/crew` owns exactly three original
specialists, stable CrewMemberIds, fixed config and structural validation. Display
names are replaceable independently of save identity. Retiring an ID or changing
slot compatibility needs an explicit migration decision, never silent deletion.

`GameState.crew = { recruitedIds, assignments: { operations, logistics } }`.
The unique ID array records recruitment; each slot holds one compatible recruited
ID or null. A member can occupy at most one slot, independently of future slot
compatibility. Fresh runs contain no recruits and two empty slots. No display names,
costs, derived effects, counts or timestamps are stored. Strict validation rejects
unknown/duplicate IDs, unowned/incompatible assignments, duplicate occupants,
unknown slot keys, malformed shapes, accessors and non-JSON properties. It does not
re-evaluate acquisition requirements. Valid grandfathered recruits/assignments
remain active after load/import regardless of current level/territory gates.

`recruitCrewMember(state, id)` validates, checks identity/duplicate ownership, uses
central `evaluateRequirements` and canonical `spendCash`, then atomically adds
recruitment with the exact payment. It never assigns, activates an effect, awards
XP/EP or adds Heat. Failures retain the full original state; unmet requirements
carry the same structured breakdown as other content. `assignCrewMember(state,
slot, id)` checks slot, identity, recruitment, existing assignment and configured
compatibility, then replaces only the requested slot atomically. Replaced members
remain recruited. `unassignCrewSlot(state, slot)` clears only that slot. Both cost
nothing and preserve Heat, cooling progress, Money, XP and EP. Assigning someone
already active fails `already-assigned`; empty unassignment fails `already-empty`.
Invalid authoritative state follows the existing fail-loud programming-error policy.

Only **assignments** feed `activeCrewMembers` / `collectCrewModifiers`; recruitment
alone gives no bench bonus. Rico and Jax supply configured modifiers to the existing
central collector/evaluator. Flat-first, stable-ID-ordered rational multiplication
and final per-job whole-cent flooring are unchanged. Breakdown source IDs resolve
to the specialist names. Rico and Mara share Operations, so their effects cannot
coexist; Jax independently occupies Logistics. No separate Crew multiplier exists.

Mara supplies derived runtime configuration instead of a Money stat.
`getHeatDecayIntervalMs(state)` returns 60,000ms normally or 45,000ms with her
assigned. The sole `decayHeat` implementation accepts that interval; integer
BigInt quotient/remainder handles arbitrarily large accepted elapsed batches with
no tick loop. Assignment changes preserve the numerical cooling remainder and
never cool immediately or proportionally rescale progress. Zero elapsed is an
identity; next **positive** elapsed processes any now-complete interval. Thus
40,000ms plus 5,000ms under Mara cools once; 50,000ms plus 1ms cools once and retains
5,001ms. Persisted validation deliberately stays **0 <= remainder < 60,000** even
under Mara. At Heat zero the remainder must still be zero, with no banked cooling.
The Heat selector uses the same derived interval; an overdue remainder displays
zero seconds until the next positive reconciliation, never a negative countdown.

All three commands use existing `execute`: reconcile with OLD assignments, apply
one immutable command, then normal successful-command persistence. Recruitment
retains runtime fractional time because it activates nothing. Assignment changes
use the existing conservative rate-boundary policy: discard less than 1ms of
runtime-only duration, never earned production fractions, whole-ms Dispatcher
progress or Heat remainder. Failure keeps legitimate pre-command reconciliation.
Normal write failure leaves the valid new state live with a warning and the previous
durable save intact; future ordinary autosave may save it. No new scheduler/storage
key is added. Offline, import and Rebirth retain write-before-publication.

Shared elapsed ordering remains business production, Dispatcher Money/XP using
STARTING modifiers/Heat, batch Heat gain, then cooling using the interval-start
assignment. Crew does not alter Heat gains, tiers, XP, Dispatcher interval or caps.
Never Sleeps alone derives the shared 8/10/12h credited duration. Offline uses the
same assigned effects and exact simulation; discarded time affects nothing. Heat
and heat-dependent job income retain the intentional Phase 7B batch semantics;
continuous business production retains exact split-interval fractions.

Rebirth policy explicitly resets **Crew recruitment and assignments** to fresh
empty state after the final reconciliation with old Crew active. No costs are
refunded. All prior temporary fields still reset, including Waterfront-only city,
Heat/remainder zero. Garage, unspent EP plus reward, count and skill ranks survive.
Rico/Jax bonuses disappear; default cooling returns to 60s. No cached effects remain.

Save **v11** sequentially migrates v1 through v10. v10→v11 only adds empty Crew;
cash, XP, business levels, upgrades, automation progress, both production fractions,
garage, EP/count/skills, territories, Heat/remainder and savedAt are preserved exactly.
Earlier migration steps still emit their historical shapes. CE1 transport is
unchanged. Import preserves explicit recruits/assignments without payment,
recruitment feedback, requirement checks or historical simulation; it rebases timing
and durably writes before replacement. Export reconciles first as before.

The adjacent Solara City Crew panel has three text-first cards and two named slots,
central requirements/affordability, inactive/active states, replacement labels and
unassignment controls. Pure selectors supply all eligibility, compatibility and
active effects. Counts and feedback are presentation-only. Responsive grids,
semantic buttons and existing focus/reduced-motion styles are retained. Rebirth's
keep/lose summary includes Crew. No automatic assignment, portraits, levels, XP,
rarity, wages or traits exist. Phase 7D extends city systems below.


## Phase 7D — online city events

Phase 7C recruitment, inactive bench ownership, assignment/replacement, Rico/Mara/Jax
effects, reload/offline/export/import and temporary Rebirth reset were manually
verified in the functioning live build by the user. Phase 7D implementation is
complete; **Phase 7D live verification remains pending**.

`features/events` owns stable `EventId` / `EventChoiceId` types, an explicit ordered
catalog, strict event-state validation and pure cadence/selection helpers. There
are exactly three events, each with exactly two choices: Hot Tip, Shakedown, then
Warehouse Opportunity. Names, descriptions, costs and effects are replaceable config;
none are persisted. Central requirements evaluate level/business spawn conditions;
a focused structured minimum-Heat condition covers Shakedown. Spawn eligibility is
checked against the reconciled state after normal economy/XP/Heat simulation. Once
pending, an event is retained regardless of later spawn eligibility.

```ts
events: {
  opportunityElapsedMs: number, // safe integer 0–599,999
  pendingEventId: EventId | null
}
```

Fresh state is `0 / null`. There is at most one pending event, no queue, history,
per-event cooldown, chain, seed, RNG cursor or cached selection. A pending event
freezes only its opportunity progress; all normal commands and economy/Heat/Crew
simulation continue. Rebirth is the intentional exception that discards the event.

### Online opportunity and RNG boundary

`simulateGameElapsed` remains the common economy/Dispatcher/Heat path. Online
`simulateOnlineElapsed` composes it with event opportunity progression, using the
existing monotonic runtime clock and 250ms scheduler. Offline bootstrap calls the
common simulation directly, never the online wrapper. No new timer exists.

When idle, add integer credited online milliseconds to opportunity progress using
BigInt arithmetic; keep the modulo 600,000ms remainder. One or more completed
10-minute windows cause **at most one attempt per reconciliation**. For example,
590,000 + 20,000 yields one opportunity and 10,000 remainder; 35 minutes from zero
yields one opportunity and 5 minutes remainder. Missed additional windows are
intentionally discarded. Pending events preserve/freeze the modulo remainder until
resolution. This cadence does not guarantee an event every ten minutes.

`RandomSource.next(): number` is injected through `RuntimeTiming.random`.
`platform/random-source.ts` is the only production adapter calling `Math.random()`;
authoritative event helpers receive values and have no browser dependency. Tests
inject exact sequences. Values must be finite and `0 <= value < 1`; invalid output
throws, suspending the runtime with the previous complete state and no partial
Money, XP, Heat or event publication. No modulo/clamping repair of RNG output occurs.

RNG consumption is explicit:

- No completed opportunity, pending event, or no eligible content: **zero values**.
- Eligible opportunity: one chance value, success only when `< 0.35`.
- Successful chance: one additional selection value; choose `floor(value * N)`
  from eligible events in configured order, uniformly. No retry in that batch.
- Rendering, selectors, validation, migration, loading, import, offline simulation
  and choice effects consume **zero** event RNG values.

Choosing zero rolls when no eligible content exists preserves the no-eligible RNG
contract. Future rolls need not replay across reloads; no PRNG state is persisted.
Existing interval-start Money modifiers, Dispatcher XP batching, Dispatcher Heat
then cooling order and Crew effect boundaries remain unchanged.

### Choice transaction and runtime ordering

`resolveEventChoice(state, eventId, choiceId)` accepts only the current pending
identity and one of its configured choices. It returns structured no-pending,
wrong-event, unknown-choice, insufficient-funds and economy failures. Domain failure
preserves the entire original input, pending ID and timer. Invalid authoritative
state fails loudly using the existing validation convention.

The runtime first reconciles elapsed economy/Heat with the event still pending and
its timer frozen. Choice affordability is then evaluated against **current cash**.
Canonical `spendCash` followed by `earnCash` builds a local candidate; Warehouse must
first afford/spend $2,500 before adding $4,000. Overflow anywhere publishes no choice
payment, reward or Heat. Configured Heat uses existing clamp/reduction helpers:
0–100, numerical cooling remainder retained unless resulting Heat is zero.
All outcomes are fixed transactions, unaffected by job/production modifiers, Heat
cash penalties, Crew or skills. Events award zero XP and zero EP and remove no assets.

Every successful choice, including PASS, clears pending and resets progress to zero.
Runtime-only fractional milliseconds are discarded at this completed-choice boundary
so a fresh ten minutes is required. Choices consume no RNG. A failed choice leaves
any legitimate preceding elapsed reconciliation authoritative, but applies no choice
effect and does not reset the event timer.

Successful choices use the existing meaningful-command save boundary. As with other
ordinary purchases, a write failure reports a persistence warning while the completed
live command remains authoritative and the previous durable save remains recoverable.
No second storage key or retry loop is introduced. Offline, import and Rebirth retain
their stronger durable write-before-publication/replacement boundaries.

### Offline, save migration and reset policy

Offline catch-up still uses one shared Never Sleeps 8/10/12h credited duration for
businesses, Dispatcher Money/XP/Heat and cooling with active Crew. **Events do not
advance or spawn offline**, including discarded time. A saved pending event and its
frozen remainder survive intact while ordinary systems simulate. Saving 420 seconds
of event progress, leaving for eight hours, and returning preserves 420 seconds;
an additional 180 seconds online is required before an opportunity.

Current save **v12** preserves the sequential v1→v2→v3→v4→v5→v6→v7→v8→v9→v10→v11→v12
boundary. v11→v12 adds only fresh event state. All previous Money, XP, business levels,
upgrades, Dispatcher/progress, both production fractions, Garage, EP/count/skills,
territories, Heat/remainder, Crew and savedAt values are preserved exactly. Current
validation rejects missing/malformed event shape, unsafe/fractional/out-of-range
progress and unknown pending IDs without repairing them or testing spawn eligibility.

CE1 transport remains unchanged. Export/import preserves exact pending ID/progress;
import does not charge, roll, resolve, announce or simulate historical savedAt. It
rebases time and writes before replacement as before. Loaded/imported events need no
eligibility recheck and remain pending until an explicit valid choice.

Rebirth's explicit policy resets **active city event and opportunity progress** to
null/zero, after final runtime reconciliation (which may itself spawn an event).
No choice is auto-resolved and no reward/refund is granted. All previous temporary
fields reset: cash, businesses/levels/fractions, upgrades, Dispatcher/progress, XP,
Crew, Neon Mile and Heat/remainder. Waterfront is restored; Garage, unspent EP plus
Rebirth reward, count and permanent skill ranks retain their established semantics.

### Presentation

The non-blocking CITY EVENTS panel next to Solara City displays an idle countdown or
one named event with exactly two transparent choices. Pure selectors/presentation
models own eligibility, current affordability, countdown and effect text. Paid
choices disable semantically when unaffordable; a free alternative always remains.
The rest of the app is usable. A runtime-only sequence announces a newly spawned
event once through a polite status region; existing action feedback describes
outcomes and structured failures. Reload/import do not announce a new spawn.
Responsive two-column/one-column cards reuse keyboard/focus/reduced-motion styles,
without imagery, flashing, modal traps or browser dialogs.

No weighted rarity, chains, history, police/bust mechanics, hidden outcomes,
Crew-specific options, extra content or Phase 8 systems are implemented.

## Phase 8A — permanent Achievement Foundation

Phase 7D and the complete Phase 7 city-system foundation were manually verified
live by the user. Phase 8A implementation is complete and **manually verified live by the user**.

Exactly six stable `AchievementId`s live in the explicit ordered achievement catalog.
Config owns names, descriptions and typed current-state conditions. The only saved
addition is `permanentProgression.unlockedAchievementIds: AchievementId[]`.
Ownership is unique and permanent, with no reward, timestamp, progress cache,
category or lifetime statistics. Validation accepts historical completion even
when its current condition is false; malformed/unknown/duplicate IDs are rejected.

`game/achievements.ts` owns the pure condition/progress path and
`unlockEligibleAchievements`. It returns all newly satisfied IDs in configured
order and preserves object identity when nothing unlocks. Conditions use derived
player level, current business level, territory ownership, final Heat, the three
specified recruited Crew IDs, and Rebirth count. React renders selectors only.
No gameplay formula reads achievement ownership; recognition changes no balance.

Successful runtime commands evaluate their complete candidate centrally before
publication and normal meaningful-command persistence. Failed commands do not
unlock anything through their failed outcome; preceding successful elapsed
reconciliation remains authoritative. Shared elapsed simulation evaluates only
its completed candidate, after Dispatcher Money/XP/Heat and Heat decay. There is
no per-cycle milestone scan or peak-Heat reconstruction. If Heat temporarily
crosses 60 inside a batch but ends below 60, Running Hot does not unlock from that
unobserved peak. This also applies offline; Phase 8B may separately introduce
statistics, but Phase 8A stores none.

Bootstrap policy: after valid load/migration and legitimate offline reconciliation,
evaluate currently satisfied conditions, including when credited elapsed is zero.
The candidate with permanent unlocks is durably written before publication.
A failed write preserves the old save and publishes no new rewards/unlocks. Reload
cannot duplicate completion. Offline uses the same simulation and existing shared
8/10/12h cap; City Event progress still does not advance offline.

Rebirth reconciles first. Its pure reset constructor evaluates the eligible
pre-reset state (even a migrated state with no elapsed time), carries its unlocks
through the explicit permanent retention, increments Rebirth count, and evaluates
again. First Rebirth is therefore inside the single durable reset candidate.
Garage, EP, count, skills and achievements persist. All existing temporary fields
still reset, including Crew, Heat, territories beyond Waterfront and City Events.

Save schema **v13** retains sequential v1→…→v12→v13 migration. v12→v13 adds only an
empty achievement collection and preserves every previous field and `savedAt`.
Migration itself never evaluates milestones. Bootstrap evaluation is a separate
normal gameplay boundary. **CE1- is unchanged**. Import preserves exported IDs
exactly, performs no historical simulation or achievement inference, and retains
write-before-replacement. A later successful command or positive elapsed runtime
may unlock currently satisfied conditions. Past lost territories, Crew combinations
or Heat peaks are never fabricated.

The Achievements panel shows all six named cards, current progress while locked,
and permanent completion after unlocking. Grouped runtime announcements include
all new names in configured order, including a command that unlocks milestones
both during reconciliation and afterward. Bootstrap and successful Rebirth use
the same ephemeral announcement shape; no notification history is saved.


## Phase 8B — permanent Lifetime Statistics Foundation

Phase 8A was manually verified live by the user. Phase 8B implementation is
complete and **manually verified live by the user**. Statistics are local, observational
history and grant no rewards. No formula, requirement, event chance or achievement
condition reads statistics. The six Phase 8A achievements remain unchanged.

`permanentProgression.statistics: StatisticsState` contains exactly eight explicit
numeric fields. Fresh games start all eight at zero. No display strings, derived
values, timestamps, lifetime cash, telemetry or backend state are stored.

| Field | Successful transition counted |
| --- | --- |
| `manualJobsCompleted` | +1 per manual starter job; never Dispatcher jobs |
| `automatedJobsCompleted` | +completed Dispatcher cycles, online or credited offline, once per full batch |
| `businessLevelsPurchased` | +1 per paid level upgrade; initial Level-1 purchase excluded |
| `territoriesAcquired` | +1 per Neon Mile acquisition, including repeat acquisitions after Rebirth; Waterfront excluded |
| `crewMembersRecruited` | +1 per recruitment, including repeats after Rebirth; assignment/replacement/unassignment excluded |
| `eventsResolved` | +1 per successful choice, including PASS; spawn, failed choices and pending discard excluded |
| `rebirthsCompleted` | +1 per successful Rebirth, atomically with the existing `rebirthCount` |
| `peakHeat` | Maximum final Heat observed at successful Heat-changing command or positive elapsed-batch boundaries |

The statistics feature owns immutable `incrementStatistic` and `recordPeakHeat`
helpers. Cumulative counters are non-negative safe integers. Checked addition
compares remaining safe-integer capacity before adding; overflow returns structured
`statistics-overflow`, never a clamped/imprecise result. Invalid authoritative
inputs fail loudly. Peak Heat is an integer in 0–100 and never decreases.
`game/statistics.ts` composes these helpers with complete local command candidates;
a failed counter update returns the full original transaction input. No partial
Money, XP, Heat, ownership, event resolution, achievement or counter is published.

Commands retain their existing runtime reconciliation boundary. Completed elapsed
work before a failed command remains authoritative; only the failed command's
candidate is discarded. Successful commands carry their counters in the same
normal meaningful-command save, then the existing central achievement evaluation
runs before publication. No second statistics write or UI-owned update exists.

The shared `simulateGameElapsed` transaction keeps interval-start modifiers/Heat,
business production, Dispatcher Money/XP, batch Heat gain, then Heat decay. Only
after that full result does it count completed Dispatcher cycles and observe final
Heat, followed by achievement evaluation. There is no per-cycle loop or additional
scheduler. Internal gain/decay slices never observe peak Heat: starting at 55,
rising internally to 65 and cooling to final 45 observes **45**, not 65. Existing
higher historical peaks remain. Running Hot still evaluates current final Heat,
not `peakHeat`; neither system reconstructs unseen transient peaks.

Zero elapsed is not a statistics observation. Loading, validation, migration,
rendering and import alone do not increment counters or infer a peak from current
Heat. Positive legitimate online/offline reconciliation may record its final Heat.
Offline uses the same completed-cycle result and the same Never Sleeps-only
8/10/12h duration for every subsystem. Its candidate includes statistics and
achievements before durable write/publication. Overflow or storage failure
preserves the previous durable save and existing paused-bootstrap behavior.
No manual-job/event-resolution counts arise offline; City Events remain frozen.

Rebirth reconciles with the current run first, retaining legitimate final elapsed
statistics, then constructs the fresh temporary run with permanent history carried
forward. Both Rebirth counters update atomically; overflow in either rejects the
whole reset and EP award. It never infers a new peak merely from resetting Heat.
The durable write includes all retained history before replacement.

| Rebirth policy | State |
| --- | --- |
| Keep | Garage/vehicles, unspent EP, Rebirth count, permanent skills, achievements, all lifetime statistics |
| Reset | Cash, businesses/levels/fractions, normal upgrades, Dispatcher/progress, XP, Crew, City Events/progress, Heat/remainder; territories return to Waterfront only |

Save schema **v14** retains sequential v1→…→v13→v14 migration. v13→v14 adds only
statistics and preserves every old field and `savedAt`. Seven fields start zero,
including `peakHeat`, regardless of current progression. The **sole history
initialization exception** is `rebirthsCompleted = existing rebirthCount`, since
that is already an exact historical count. No other history is inferred. Current
validation requires exactly the eight fields, checked numeric ranges and plain
JSON-compatible structure. It intentionally does not require the two Rebirth
counts to equal; valid imported values remain authoritative, and future Rebirths
increment both independently by one.

**CE1- remains unchanged** and preserves all statistics exactly, with the existing
write-before-replacement and timestamp rebase. Import performs no historical
simulation, count increment or peak inference. Future successful gameplay resumes
from imported values. Statistics UI is a separate compact section with eight
ordered, accessible entries; formatting lives in pure presentation selectors.
No charts, analytics, rewards, new achievements, challenges or Phase 8C automation
were added. Phase 8C must preserve these counter units, atomic boundaries, migration
exception, observational isolation and final-state Heat semantics.


## Phase 8C — Business Auto-Upgrader foundation

Phase 8B and Phase 8C were manually verified live by the user. The current Phase 8
roadmap block is complete and fully verified live. Phase 9A follows below; broader
automation expansion remains deferred.

Exactly one new automation joins Delivery Dispatcher in `features/automation`:
`automation:business-auto-upgrader`, displayed as **Business Auto-Upgrader**. The
Dispatcher keeps its original identity, cost, ten-second cycle and always-active
ownership semantics. Both share the automation catalog and purchase architecture.
The new automation targets only Dockside Detail. Acquisition uses central AND
requirements: Player Level 20, owned Dockside at Level 25, and Neon Mile controlled;
`spendCash` charges exactly $250,000. There is no Crew, achievement or statistics gate.

```ts
automation: {
  unlockedIds: AutomationId[];
  starterJobElapsedMs: number;
  enabledIds: AutomationId[];
  businessAutoUpgradeElapsedMs: number;
}
```

Only the owned Auto-Upgrader may occur in `enabledIds`. Dispatcher never needs an
enabled entry and cannot be toggled. Arrays contain unique known IDs. Current
validation rejects missing/extra fields, malformed IDs, getters/sparse collections,
unowned enablement and unowned progress. Auto-Upgrader progress is an exact safe
integer in `[0, 30000)`; it must be zero before ownership. Purchase initializes
progress to zero and leaves it disabled. Ownership/enablement never changes merely
because acquisition requirements later fail in a structurally valid imported save.

`setAutomationEnabled` is a pure, free immutable command with structured unknown,
non-toggleable, unowned and invalid-boolean failures. Repeating the current setting
succeeds as an identity-preserving no-op. A disabled automation pauses its exact
progress, never resets it. Enabling resumes that progress. All purchases and toggles
use the normal runtime command boundary: reconcile with the old configuration,
then apply the command, then save normally. No past time receives a newly enabled
purchase, and disabling first processes any due purchases. The explicit enable
button and visible automatic-spending disclosure are the player's opt-in.

### Chronological production and spending

`simulateGameElapsed` keeps the unchanged Phase 8B path when Auto-Upgrader is
unowned/disabled, or elapsed is zero. With enabled positive elapsed,
`simulateAutoUpgrader` divides **business production and spendable earnings** at
30-second attempt boundaries. Each segment calls the existing exact
`simulateElapsed`; earned business fractions survive through both remainder fields.
At each completed boundary `attemptBusinessAutoUpgrade` calls the same
`upgradeBusiness` command used manually. Its exact current quadratic price,
Money spending, single level increment, effective XP and checked
`businessLevelsPurchased` update remain the one authoritative path.

One boundary attempts one level. Success, insufficient funds and max level all
consume the attempt. Insufficient funds does not disable the automation; later
production/Dispatcher earnings may fund a later boundary. Current Level 100 consumes
attempts without spending. A valid imported owner without Dockside similarly
consumes no-op attempts and never automatically buys a business. Invalid state,
XP/Money overflow or statistics overflow fails the entire **outer** candidate,
including earlier successful local purchases. No partial publication occurs.

Each successful upgrade floors its own effective XP award. Learn the Streets rank
1 gives 27 XP per purchase: three upgrades give 81, not a combined 82. The existing
six achievements are evaluated centrally against the completed outer candidate;
upgrade-dependent XP/level milestones are monotonic within this candidate and are
therefore all retained. No additional Heat source, achievement or statistic exists.
Only `businessLevelsPurchased` counts automatic purchases; Dispatcher statistics
continue to count deliveries separately.

At most 1,440 boundaries occur in the shared maximum twelve-hour offline window.
Each segment uses batched math, never loops per delivery/millisecond/second. When
Dockside is maxed or absent, all remaining no-purchase boundaries collapse into
one segment plus exact modulo progress. Unaffordable attempts with a producing
business are processed at their actual boundaries because later earnings can
make a purchase possible. There is no speculative analytic purchase solver.

### Dispatcher, Heat and Event outer-batch contracts

Auto-Upgrader changes no Dispatcher modifiers. `planDispatcher` therefore keeps
interval-start reward/skill/Heat evaluation and one outer completed-job count.
At each purchase boundary, only the earnings for jobs completed **up to that
boundary** become spendable. Future jobs cannot fund an earlier purchase.
Cumulative prefix Money/XP differences distribute these earnings chronologically;
Dispatcher XP still equals the floor of the **whole outer batch**, rather than
summing independently floored segments. Prefix planning and normal Dispatcher
simulation share the same reward/cycle calculation. Separate upgrade XP awards
are added without changing that Dispatcher floor. No per-job loop is introduced.

Heat remains one outer transaction: starting Heat, `floor(totalJobs / 5)` gain,
then decay across the full elapsed duration using the starting Crew assignment.
Mara still derives 45s, otherwise 60s; purchase boundaries do not invent Heat
batches or cooling observations. Final peakHeat and Running Hot keep final-state
observation, not internal/transient peaks. Rico and Jax use the unchanged central
modifier evaluator; Jax's rate increases naturally with bought business levels.
Business levels and current player XP do not modify Dispatcher/Heat formulas.
This is why only production/spendable income needs internal segmentation.

`simulateOnlineElapsed` advances City Events once **after** the completed economic
candidate, with the original total online elapsed and final-state eligibility.
There is still at most one spawn attempt per outer reconciliation, no matter how
many auto-upgrade boundaries it contained. Pending events freeze only event cadence;
normal purchases continue around them. Offline consumes no event progress or RNG.
Arbitrarily splitting outer calls still retains the existing Phase 7 Heat/XP
batching distinctions; internal purchase boundaries add none of their own.

### Offline, reset and save compatibility

Owned/enabled Auto-Upgrader uses the same Never Sleeps 8h/10h/12h credited duration
and the exact online economic simulation. Discarded absence contributes no attempt,
income or progress. The complete candidate (cash, levels, XP, counters, achievements,
Dispatcher, Heat and progress) is durably written before publication. Overflow or
storage failure preserves the old save and existing bootstrap pause behavior.
One-time consumption and future-clock handling remain unchanged.

Offline metadata optionally carries `{ levelsPurchased, spent }`, never saved in
GameState. Welcome-back income remains **gross earned income** (business plus
Dispatcher), since automated spending may reduce existing cash. The card explicitly
shows gross income before spending and Dockside +N levels / spent Money when
purchases occurred. It does not misreport net cash reduction as negative production.

Rebirth first reconciles active automation. Due upgrades earn legitimate XP,
statistics and achievements before reset. The fresh constructor then clears both
ownership IDs, `enabledIds`, and both progress fields. There is no purchase-price
refund. Vehicles, EP/count, skills, achievements and lifetime statistics retain
their existing policy. The reset summary explicitly lists Auto-Upgrader loss.

Save schema **v15** sequentially migrates v1→…→v14→v15. Only the final v14 step
adds empty enabled IDs and zero Auto-Upgrader progress. Every pre-existing field,
Dispatcher ownership/progress and `savedAt` is preserved exactly. Earlier steps
still emit the actual historical two-field automation shape. Migration never
purchases, enables, upgrades or simulates. **CE1- remains unchanged**. Ordinary
save/reload/import/export preserve explicit ownership, enablement and remainder.
Import writes before replacement and rebases timing without historical upgrades or
requirement checks. Imported 20,000ms progress requires 10,000ms future elapsed for
the next attempt, even if its exported timestamp is a week old.

The new card sits next to Delegation, uses pure selectors for requirements/current
price/level/progress, and reuses native progress controls and responsive styles.
No target selector, reserve, budget, second new automation, cloud feature or Phase 9
polish is included. Future work must preserve opt-in spending, exact chronological
funding, outer Dispatcher/Heat/Event contracts and durable atomic publication.


## Phase 9A — presentation information architecture

Exactly five primary sections are defined in `src/app/navigation.ts`, in a fixed
order: OVERVIEW, OPERATIONS, CITY, COLLECTION, EMPIRE. `SectionId` and the small
presentation catalog are the shared identity source. Every load defaults to
Overview. Selection lives in `GameShell` React state only: no router, hash storage,
GameState field, localStorage key, migration or navigation-dependent requirement.

`App` mounts `useGame` exactly once above `GameShell`. Only the active section's
management tree renders. Section selection only updates React state and keyboard
focus/scroll position; it never calls a command, reconcile, RNG, save or bootstrap.
The original 250ms runtime and autosave remain active regardless of visible content.
Production, Dispatcher, Heat, Crew, Events, achievements/statistics and Auto-Upgrader
use the exact Phase 8C domain and platform implementation, unchanged by this phase.

- Overview summarizes cash, derived player XP/level, current total effective business
  production, Heat/tier, territories, recruited/active Crew, EP/Rebirth readiness,
  events and Garage count. Shortcuts navigate without executing gameplay actions.
- Operations contains the starter job, business purchase/level upgrades and modifier
  breakdown, normal upgrades, then both automation cards with their existing controls.
- City contains Solara City/territories, Heat/Lay Low, Crew assignments/recruitment and
  City Events with both choices. Pending events do not block any other section.
- Collection contains the existing Garage/Vortex S9 only.
- Empire contains Rebirth/EP, Empire Foundations, Achievements, Statistics, then
  Save & Transfer with the original export/validation/confirm/cancel flows.

Global status derives Cash/Level/Heat/EP from existing selectors. Event and spending
indicators route to City or Operations only. The Auto-Upgrader indicator distinguishes
an enabled but paused session from running automatic spending. It is not a second toggle.
The current palette, system fonts and existing decorative artwork remain unchanged.
The compact top navigation uses five columns on desktop and wraps to three on mobile;
all five native buttons remain available, with `aria-current`, visible focus and
44px minimum targets. Short viewports use non-sticky status to leave content accessible.
Overview and automation use responsive grids; long Money/requirements wrap rather than
introducing horizontal scrolling. No section-specific scheduler exists.

`dashboardPresentation` composes existing selectors. Total production sums the exact
central evaluated rational rates and formats them using `formatProduction`; it never
caches an authoritative rate. Money continues using `formatCash`. Short Heat/automation
countdowns remain ceiling seconds, Event opportunities remain MM:SS, and offline
absence remains the existing duration formatter. These contextual formats and exact
millisecond semantics are retained; no economy values were reformatted into new units.

Command, achievement, level/unlock, event-spawn and Dispatcher feedback live outside
the active section. Offline welcome/upgrade spending summaries and persistence/failure
messages are global too. Announcement identities remain the existing sequence IDs;
navigation does not create another announcement or persisted notification history.
The detailed Achievements and Events cards no longer receive the global announcement
prop, preventing duplicate render-time announcements when visiting them.

Small extracted `useSaveManagement` and `useRebirthControls` hooks reuse the existing
pure controllers. `GameShell` retains these above the conditional views, preserving
import draft, exported text, validated code and confirmation state across section
changes. A pending-confirmation shortcut returns to Empire. Only the existing explicit
confirmation can call a destructive command. Success/cancel/errors remain in the
Empire views and are also shown globally when Empire is inactive. Import preserves
the current UI section and replaces only the authoritative game state as before.

**Save remains v15; CE1 remains unchanged.** All six achievements, eight statistics,
prices, requirements, timings, ownership and persistence contracts are unchanged.
No Phase 9B/9C or final Rebranding work is included. Future Rebranding may replace
styling/assets while preserving this information architecture and action mapping.
See `docs/UX_CHECKLIST.md` for feature coverage and visual-review limitations.

A development-only Happy DOM environment exercises real mounted React navigation
with the existing injected runtime clocks and storage. It verifies no extra runtime
construction, time reads, writes or RNG from navigation, and retained import/Rebirth
controllers through actual unmount/remount of the section views. This is a test
harness only; no new runtime dependency, router or browser automation framework is
shipped. DOM tests do not substitute for the pending real-browser visual review.


## Phase 9B — accessibility and interaction polish

Phase 9A was manually verified live by the user. Phase 9B is implemented; live and
assistive-technology verification remain pending. These changes are presentation-only:
**save v15, CE1, GameState, runtime, requirements and all gameplay formulas are unchanged**.

The five native navigation buttons retain their order/default, `aria-current="page"`,
and an underline as well as color/border for the current section. One main and one
active h1 remain; business, automation and save subsection headings now reflect their
nesting. Skip to main content explicitly focuses the existing `main` anchor target.
Section changes deliberately focus the section heading; runtime updates never do so.
No custom tab/arrow-key widget or saved focus state is introduced.

A small `useActionFocus` hook observes activation of a currently focused button only.
If that action removes/disables the button, it focuses the surviving enclosing card
heading, unless another control already received focus. Event resolution, Crew actions
and completed purchases therefore have a predictable destination. It does not respond
to unrelated runtime changes or add commands, clock reads, storage or RNG calls.
Rebirth and import remain **inline groups**, not modal dialogs. Rebirth retains its
cancel-first entry and heading return; explicit import validation now focuses Cancel
when confirmation opens, and confirm/cancel return to Validate import. Navigation
retains the existing controllers and never executes confirmation.

Stable global polite regions retain discrete command, achievement, level, event and
storage-error feedback. Routine Dispatcher output remains visible on demand but is
no longer announced every cycle, either globally or on the automation card. Successful
autosave status is also ordinary text. Cash and progress/countdown displays remain
outside live regions. Import feedback is associated with its visibly labeled input;
the existing validation result also supplies ephemeral `aria-invalid` state. No parser
or transaction changes were made. Exported codes remain read-only/selectable.

Native progress elements expose Heat/tier (0–100), within-level XP (MAX LEVEL rather
than Level 101), and named Dispatcher/Auto-Upgrader progress with associated countdown
text. Enable/disable remains a native action button with a changing action name and
an associated explicit enabled/disabled description, not an ARIA switch or pressed
button with a changing label. Event choices form a named group with event context,
visible deterministic outcomes and native disabled affordability semantics.

Shared 3px focus-visible outlines, existing >=44px controls, spaced confirmation
buttons and wrapping badges/metrics support keyboard and touch use. Narrow screens
use non-sticky global chrome to avoid obscuring enlarged content. The centralized
reduced-motion media query removes nonessential animation/transitions and smooth
scroll behavior, without accessing gameplay timers. Existing palette tokens remain:
representative text and focus contrast pairs passed a numerical spot-check, so no
rebrand or token adjustment was needed. See `ACCESSIBILITY_REVIEW.md` for evidence
and the limits of DOM/style checks versus real-browser/assistive-technology review.
