# Balancing policy

## Phase 1A

The Phase 1A balance values live in
`src/features/economy/config/economy-config.ts`: initial cash is 0 cents and the
waterfront delivery reward is 2,500 cents ($25.00). The reward validates the domain
slice; it is provisional starter tuning, not a progression curve or clicker loop.
Phase 1B adds the single fixed purchase cost below; Phase 1C.1 adds one fixed
production rate. No cooldowns exist. Candidate models below remain future proposals.

## Source of truth

Place typed balance/content definitions in each feature's config directory. Shared
constants require a real shared owner. UI consumes definitions and selectors; it
must not duplicate costs, growth rates, thresholds, caps or bonus magnitudes.
Presentation tokens belong in styles and are unrelated to game balance.

Use explicit units and state whether a value is base or effective. Costs and income
must follow the economy's agreed numeric range and rounding policy. Derive values
where possible instead of keeping contradictory config fields.

## Candidate models for later evaluation

| Concern | Candidate | Decision required before implementation |
| --- | --- | --- |
| Business cost scaling | baseCost × growthRate^owned | Growth curve, limits, rounding and bulk purchase behavior |
| Production | Base rate adjusted by effective modifiers | Units, level curve, cycle/rate semantics and caps |
| Upgrade value | Cost / additional effective income | Target payback windows and meaningful alternatives |
| Rebirth reward | Function of eligible run achievement | Eligibility, scaling, reset/retention matrix and exploit prevention |
| Offline reward | Shared simulation over bounded elapsed time | Cap, efficiency, clock changes, expired effects and random event policy |
| Collections | Explicit set requirements and modifier sources | Duplicate ownership and stacking eligibility |
| Heat | Explicit penalties/recovery tied to actions/time | Bounds, risk visibility and active/idle fairness |

Modifier evaluation order is owned by ARCHITECTURE.md; do not redefine it per
feature. Keep prices, income and speed as distinct targets with explicit clamps
and rounding. For example, doubling production speed need not mean doubling a
stored duration: the stat semantics must say which quantity is modified.

## Goals and tuning practice

Measure time to first purchase, time to automation, marginal upgrade payback,
collection completion pace, rebirth duration and the value of permanent choices.
Set actual target ranges in the relevant phase. Preserve useful choices instead
of one dominant purchase path; automation should remove repetition without making
all decisions disappear. Temporary bonuses, permanent bonuses and collectibles
must not multiply without understood bounds.

Record balance changes here or beside the relevant config with: rationale, changed
values, simulation scenario, observed progression impact and save compatibility.
Balance-only changes normally recalculate derived stats; changes to owned state,
ID meaning or numeric representation may require migrations. No balancing tools,
simulators, spreadsheets or telemetry infrastructure are needed in Phase 0.

## Validation once systems exist

Test affordability at boundaries; no NaN/Infinity, negative funds or overflow;
modifier stacking/expiry/scopes; active vs automated action consistency; online vs
offline progression; prestige retention; and save migrations. Use deterministic
fixtures and simulations for actual rules, not duplicated implementation tests.

## Exact cash and limits

Store canonical integer-cent strings, with at most 100 digits: 0 through
10^100 − 1 cents. Native BigInt performs exact helper arithmetic without floating
point drift. Equal amounts compare exactly. Add/subtract never round; fractional
cents, Number inputs, nonfinite values, negative values and noncanonical strings
are invalid. No implicit dollar-to-cent conversion exists. Enter config amounts
through `moneyFromMinorUnits`; never calculate or duplicate rewards in React.

Zero earns/spends succeed; insufficient funds and exceeding the maximum fail
without changing state. Invalid amounts fail explicitly, rather than clamping.
The numeric limit is a resource bound, not a cap designed to be reached by players.
Balance tests pin the starter reward through repeated-action outcomes; update those
expectations deliberately if tuning changes. Arithmetic precision fixtures are
technical boundary values, not additional balance configuration.

Phase 1C.1 defines exact fractional accrual for integer cents/second below. Future
modifiers still require a separate precision and rounding policy. A future representation change must preserve callers'
economy APIs and explicitly migrate any persisted integer-cent strings. Increasing
the digit bound also requires revisiting older-client validation. See architecture
for serialization and error contracts. No actual save system is implemented.

## Phase 1B — provisional first acquisition

- Business: **Dockside Detail** (`business:dockside-detail`), an original small
  waterfront detailing garage chosen for the automotive/Florida setting.
- Definition and price source: `src/features/businesses/config/business-config.ts`.
- Purchase cost: **15,000 cents ($150.00)**, validated through `moneyFromMinorUnits`.
- Initial cash remains **$0.00**. Each existing delivery still earns **$25.00**.
  Exactly **six deliveries** fund the purchase; spending the exact cost leaves zero.
- One-time ownership only: no repeat purchases, levels, scaling, refunds or pricing
  curve. The cost is deliberately provisional and is not a realistic property valuation.
- There is no production rate, passive income, clock, manager or offline behavior.
  Ownership has no economic effect beyond its one-time purchase cost in this phase.

Integration tests pin six deliveries, the exact spend and duplicate-purchase
rejection. Boundary fixtures above Number's safe-integer range verify that buying
still preserves cents through the existing money/spend API. The explicitly chosen
Phase 1C.1 rate follows; runtime clock tuning remains separate.

## Phase 1C.1 — provisional base production

Dockside Detail produces **75 cents per second ($0.75/sec)** in pure simulation.
The rate lives only in `baseProductionCentsPerSecond` on the existing business
config, constructed through `moneyFromMinorUnits('75')`. The $150 purchase cost
is recovered in exactly **200 seconds (3 minutes 20 seconds)**. A $25 delivery
still equals about 33.33 seconds of base production, so active earning retains
value. This is one provisional rate, not a scaling or modifier system.

Integer elapsed milliseconds multiply whole cents/second exactly. The intermediate
unit is thousandths of a cent (1,000 per cent). Retain a pooled integer remainder
0..999 in `businesses.productionRemainderMilliCents`. At 75 cents/sec, 1 ms earns
75 remainder units; 13 ms earns 975; 14 ms credits 1 cent and retains 50. A 100 ms
step credits 7 cents and retains 500, so a second 100 ms step credits 8 cents.
A full second or any valid partition of it credits exactly 75 cents, without
per-step rounding loss. Multiple rates are summed before extracting whole cents.

There are no fractional-cent/second config rates, levels, bonuses, growth formulas
or offline caps. Invalid elapsed is rejected; valid elapsed ranges from zero to
Number.MAX_SAFE_INTEGER integer ms. Integer quotient/modulo keeps earned fractions,
never silently clamps income. If the Money limit is exceeded, the whole transition
fails and both cash and remainder stay unchanged. Partition equivalence assumes
successful intervals and unchanged rates/ownership; rejected overflow intervals
cannot be treated as partially applied. Architecture documents validation and the
future runtime clock boundary.

This rate is not active in the browser yet: no timer calls the simulation. Phase
1C.2 will supply explicit elapsed intervals to the same domain function, without
reimplementing the rate math or truncating stored fractions. Offline progression,
saves and automation are not implemented.
