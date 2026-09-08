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
exist. Purchased equipment is the only source; future implemented sources join the
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
