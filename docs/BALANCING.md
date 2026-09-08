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

## Phase 1C.2 — runtime cadence (no balance changes)

The browser now supplies measured `performance.now()` intervals to the same
`simulateElapsed` function every 250 ms. Four updates per second balance visible
cash changes with mobile CPU/battery cost; cadence never defines an earning reward.
Delayed callbacks in the same open session catch up by elapsed duration. Purchase
and starter-job boundaries reconcile first, preventing retroactive purchase income
and preserving accrued earnings.

Fractional runtime milliseconds are retained separately from authoritative
milli-cent production. The first purchase starts its producing interval at the
purchase timestamp, without transferring fractional unowned time. The 75-cent/sec
rate and 200-second payback remain unchanged. Overflow suspends the runtime with
its last valid cash/remainder; no partial or capped credit is applied. See
ARCHITECTURE.md for lifecycle, fractional precision and terminal failure policy.
Reload resets the game. Offline progression, saves and automation are absent;
Phase 1C.3 visual production feedback/polish remains deferred.

## Phase 3A — provisional offline cap

`OFFLINE_CAP_MS` in `src/game/offline-progress.ts` is **28,800,000 ms (eight hours)**.
This allows a normal sleep/work absence to earn at the unchanged full production
rate while bounding long absences. No efficiency multiplier or cap upgrade exists.
Only elapsed time is capped; the sole production path remains `simulateElapsed`.
Dockside Detail still earns 75 cents/second, with exact authoritative milli-cent
carry. Eight credited hours at that rate earn $21,600.00. This is provisional
single-business tuning, not a progression curve or promise for later levels.
Negative wall-clock differences receive zero time and rebase safely. Absence beyond
the cap is consumed when the new current timestamp is durably saved. No extra
rounding is introduced; saved fractions combine exactly with offline production.
The welcome card's positive-whole-cent threshold affects presentation only.
No business levels, modifiers, managers or other balance changes are included.

## Phase 3B — provisional business levels

The named maximum is **100** in the public business level module. Newly purchased
Dockside Detail starts at level 1 for the unchanged **$150.00**, earning **$0.75/sec**.
Each definition now supplies its own `baseUpgradeCost`; Dockside uses **15,000 cents**.
For current level L below the cap, the upgrade price is exactly
`baseUpgradeCost × L²` whole cents. There is no price at level 100. The quadratic
curve makes the first upgrade comparable to purchase, with increasingly long waits
later, without exponential growth or rounding. All values are provisional.

| Upgrade | Exact price |
| --- | --- |
| 1 → 2 | $150.00 |
| 2 → 3 | $600.00 |
| 3 → 4 | $1,350.00 |
| 10 → 11 | $15,000.00 |
| 99 → 100 | $1,470,150.00 |

Production is exactly `baseProductionCentsPerSecond × level`: $0.75/sec at level 1,
$1.50/sec at level 2, $5.25/sec at level 7 and $75.00/sec at level 100. Prices and
rates are derived, never cached in saves. BigInt-backed economy scaling preserves
integer cents. Fractional earned milli-cents survive all upgrades and saves.
Future businesses may set independent purchase cost, base rate and base upgrade
cost under these shared curves. No modifiers or cap upgrades exist. The offline
cap remains eight hours and uses these same derived production rates.


## Phase 4A — provisional first equipment and modifier policy

Exactly one upgrade is configured in `src/features/upgrades/config/upgrade-config.ts`:
**Commercial Pressure Washer** (`upgrade:commercial-pressure-washer`), priced at
**250,000 cents ($2,500)**. It requires owning Dockside Detail, has no level
prerequisite, can be purchased once, and adds **+25% Dockside production** through
2,500 integer basis points. It never affects other businesses or delivery rewards.

The price places it after early acquisitions/levels rather than alongside the first
$150 purchase. Its value grows with the business level: at level 5 its extra
$0.9375/sec repays $2,500 in about 44 minutes 27 seconds; at level 10, about
22 minutes 13 seconds. This creates a choice against increasingly costly levels.
The price/effect are provisional, not a full upgrade economy. Purchase price,
quadratic level costs, level cap 100 and base production remain unchanged.

| Level | Base production/sec | With equipment/sec |
| --- | --- | --- |
| 1 | $0.75 | $0.9375 |
| 4 | $3.00 | $3.75 |
| 5 | $3.75 | $4.6875 |
| 100 | $75.00 | $93.75 |

Effective production is `(75 cents × level) × 12500/10000`. All current/future
eligible percentage factors compound exactly in stable modifier-ID order. There
is no per-tick or per-second rounding. The integer milli-cent remainder plus its
new reduced sub-milli-cent fraction preserves all earned value (see architecture).
UI precision is independent from simulation. Starter delivery still pays $25.00
through the central evaluator; future fractional job rewards floor once at payout.
The eight-hour offline cap is unchanged, using the identical effective rate.
No other equipment, modifiers as content, new businesses or automation are added.

## Phase 4B — five-upgrade catalog (provisional)

The Phase 4A washer remains unchanged. Four additions provide choices between
active delivery income, stronger Dockside output and a global milestone. Delivery
upgrades are cheaper so they can matter before later business levels; production
upgrades require a substantially larger investment. No level prerequisites apply.

| ID | Name | Cost | Effect | Requirement |
| --- | --- | --- | --- | --- |
| `upgrade:commercial-pressure-washer` | Commercial Pressure Washer | $2,500 | +25% Dockside production | Own Dockside |
| `upgrade:industrial-detailing-line` | Industrial Detailing Line | $10,000 | +50% Dockside production | Own Dockside |
| `upgrade:fleet-logistics` | Fleet Logistics | $15,000 | +10% all business production | Own any business |
| `upgrade:street-connections` | Street Connections | $750 | +20% starter-job reward | None |
| `upgrade:express-tips` | Express Tips | $400 | +$5 starter-job reward | None |

Each is purchased once. This table also defines explicit catalog display order.
Evaluation applies flats first, then compounds percentages, with stable IDs within
each operation group. Base delivery remains $25: either job upgrade alone yields
$30; both yield `($25 + $5) × 1.20 = $36`, irrespective of purchase order.

Base production stays `$0.75/sec × level`. At level 4: $3 base, $3.75 with washer
alone, $4.50 with detailing line alone, $3.30 with logistics alone. All three yield
`$3 × 1.25 × 1.50 × 1.10 = $6.1875/sec` exactly. Factors are rational, never added
together or rounded between operations. Both production remainders retain all
fractions across callbacks, saves and offline catch-up. UI precision is display
only. Business purchase/level costs, level cap and eight-hour offline cap are
unchanged. Phase 4C automation and additional content are deferred.

## Phase 4C — provisional delivery delegation

**Delivery Dispatcher** (`automation:delivery-dispatcher`) costs **750,000 cents
($7,500)** and requires ownership of Dockside Detail. One permanent unlock performs
one centrally evaluated starter job per **10,000 ms (10 seconds)**; manual jobs
remain available. No level requirement, worker scaling or second automation exists.
The price sits between the washer and stronger production upgrades as a choice
between active-delivery support and business investment.

| Job modifiers | Exact reward every 10 seconds |
| --- | --- |
| None | $25.00 |
| Street Connections | $30.00 |
| Express Tips | $30.00 |
| Both | $36.00 |

Base reward, the five upgrades, business rates/level costs and the offline cap are
unchanged. Both systems share the same eight-hour offline credit window. From zero
progress, eight hours completes 2,880 deliveries ($72,000 without job upgrades or
$103,680 with both). Five seconds of saved progress plus 25 seconds credited offline
completes three deliveries: **$108 with both job upgrades**, progress zero. Extra
absence beyond the cap does not advance the cycle. Values are provisional.

Cycle payouts use the modifier set when the cycle completes; upgrades reconcile
already-completed jobs first and retain unfinished progress. Completed cycles are
batched mathematically, with no per-cycle loop and no fractional money rounding
between modifiers. Future automation/content remains a separately authorized phase.

## Phase 5A — provisional player progression

XP is an exact, non-spendable integer independent of cash. Start at **0 XP,
player Level 1**. Maximum displayed player level is **100**. Cumulative XP needed
for level L is **100 × (L − 1)²**; thresholds and rewards are centralized in the
progression feature. No player level affects income or unlocks content yet.

| Player level | Cumulative XP threshold |
| --- | --- |
| 1 | 0 |
| 2 | 100 |
| 3 | 400 |
| 4 | 900 |
| 5 | 1,600 |
| 10 | 8,100 |
| 25 | 57,600 |
| 50 | 240,100 |
| 100 | 980,100 |

Early manual progression reaches Level 2 after ten deliveries; later intervals
grow by 200 XP per level. For example, 1,850 total XP is Level 5 with **250 / 900
XP toward Level 6**, not 1,850 XP within that level. XP may continue beyond the
Level 100 threshold up to **9,007,199,254,740,991**; overflow fails atomically
without clamping or partial cash/level changes.

| Successful source | XP |
| --- | --- |
| Manual starter delivery | 10 per action |
| Completed Delivery Dispatcher cycle | 5 per cycle |
| Business level increase | 25 per level purchased |

These are the only sources. Business acquisition, equipment/delegation purchases,
passive business cash, time itself and leveling the player award no XP. Money
modifiers keep their existing $25/$30/$36 behavior and never change XP rewards.
Manual and automated execution remain independent.

Offline dispatcher jobs also earn 5 XP each within the same **eight-hour** cap:
2,880 jobs yield **14,400 XP**, regardless of cash modifiers. Five seconds saved
plus 25 seconds credited yields three jobs, **15 XP** and $108 with both job
upgrades. Discarded absence earns no XP and adds no cycle progress. Imported old
timestamps award no XP. All existing money costs, production formulas, modifiers
and automation timing remain unchanged. Skills, XP multipliers, level-up rewards,
level-based income and future unlock requirements are deferred.

## Phase 5B — acquisition gates

Only acquisition requirements change; costs, effects, business level costs,
XP rewards, production math and dispatcher timing remain unchanged.

| Content | Requirements (all must be met) |
| --- | --- |
| Dockside Detail purchase | None |
| Express Tips ($400, +$5/job) | None |
| Street Connections ($750, +20%/job) | Player Level 2 (100 XP) |
| Commercial Pressure Washer ($2,500, +25% Dockside) | Own Dockside Detail |
| Industrial Detailing Line ($10,000, +50% Dockside) | Dockside Detail Level 5, implying ownership |
| Fleet Logistics ($15,000, +10% all businesses) | Own any business; own Commercial Pressure Washer; Player Level 5 (1,600 XP) |
| Delivery Dispatcher ($7,500, every 10s) | Own Dockside Detail; Player Level 3 (400 XP) |

Requirements are checked only on purchase. Existing owned content is grandfathered:
it remains active even below these levels or without new prerequisites, including
after reload/import and offline. It does not need to be purchased again.

99/100, 399/400 and 1,599/1,600 XP are the exact locked/eligible level boundaries.
Dockside Level 4/5 is the Industrial Detailing Line boundary. Cash affordability
is a separate check. Fresh players can earn manually, acquire Dockside after six
base deliveries while still Level 1, and reach Level 2 after ten total deliveries.
No XP reward or income bonus is granted merely for becoming eligible.
These gates are provisional content balancing. No new content is introduced.


## Phase 5C — provisional first collectible vehicle

Exactly one vehicle, **Vortex S9** (`vehicle:starter-sport-sedan`), is a temporary
fictional performance-sedan identity. Price: **5,000,000 cents ($50,000)**, purchased
once. Acquisition requires **Player Level 7 (3,600 XP)**, **Dockside ownership** and
**Dockside Level 10**. This is a milestone after early equipment and delegation;
all price, label and art choices are provisional. Existing content costs, gates,
XP rewards, business levels and Dispatcher timing remain unchanged.

Ownership provides **+15% global business production**, exactly the factor
`11500/10000 = 23/20`, through the central modifier evaluator. It awards no XP and
does not affect delivery rewards. At Dockside Level 4 with washer, detailing line,
logistics and vehicle, effective production is exactly
`$3 × 1.25 × 1.50 × 1.10 × 1.15 = $7.115625/sec`.
This is a mathematical/grandfathered-ownership example; acquiring the vehicle
normally requires Dockside Level 10. UI may show `≈$7.1156/sec`; authoritative
simulation retains every fraction with no per-second rounding.

The same vehicle effect applies online and during the unchanged eight-hour offline
window. Requirements never revoke owned bonuses. No collection/set reward, equip
restriction, vehicle progression or additional vehicle is included.


## Phase 6A — provisional Rebirth balance

Eligibility requires Player Level 20 AND Dockside Detail Level 25, centrally
configured. No cash, vehicle, equipment or Dispatcher requirement exists.

`EP gained = floor(playerLevel / 10) + floor(DocksideLevel / 10)`.

| Player / Dockside level | Empire Points gained |
| --- | --- |
| 20 / 25 | 4 EP |
| 37 / 48 | 7 EP |
| 100 / 100 | 20 EP |

EP and Rebirth count are exact non-negative safe integers; overflow fails without
resetting anything. Each successful Rebirth adds its reward and one count. Thus
4 EP then 7 EP produces 11 EP and two Rebirths. Neither currency nor count provides
bonuses, and EP cannot be spent in Phase 6A. No XP or cash is awarded for Rebirth.

Cash, business ownership/levels, all normal upgrades, Dispatcher ownership/progress,
XP and both fractional production remainders reset. Garage ownership and permanent
EP/count survive. A retained Vortex S9 still applies +15% when Dockside is repurchased:
$0.75/s × 1.15 = $0.8625/s. Acquisition gates apply again to reset temporary content.
Existing business prices, XP sources, modifier rules and eight-hour offline cap are
unchanged. The reward formula and eligibility are provisional; skills and spending
belong to the separately deferred Phase 6B.


## Phase 6B — provisional permanent skill balance

Exactly one tree: **Empire Foundations** (`tree:empire-foundations`). All values
below are provisional. Empire Points are unspent currency, not lifetime earnings.

| Stable SkillId / Name | Max rank | EP per rank | Prerequisite | Effect per rank |
| --- | --- | --- | --- | --- |
| `skill:streetwise-investment` / Streetwise Investment | 3 | 1 | None | +5% global business production |
| `skill:fast-talker` / Fast Talker | 2 | 1 | Streetwise Rank 1 | +10% starter-job Money reward |
| `skill:learn-the-streets` / Learn the Streets | 2 | 2 | Streetwise Rank 1 | +10% XP gain |
| `skill:silent-partner` / Silent Partner | 2 | 3 | Streetwise Rank 3 | +10% global business production |
| `skill:never-sleeps` / Never Sleeps | 2 | 2 | Streetwise Rank 2 | +2 hours offline cap |

Ranks sum their bonus within a skill: Streetwise ranks 1/2/3 give +5/+10/+15%;
other percentage skills give +10/+20%. Distinct sources multiply exactly after
flat additions. Maxing the entire tree costs 19 EP. No respec or refunds exist.
Rebirth adds its unchanged reward to remaining EP and retains every purchased rank.
For example 4 EP minus a 2 EP purchase plus a later 7 EP Rebirth leaves 9 EP.

Canonical production: `$0.75 × 1.15 × 1.10 × 1.10 = $1.043625/s` with Vortex,
Streetwise rank 2 and Silent Partner rank 1. The latter is valid retained/imported
ownership even though acquiring it currently requires Streetwise rank 3.
Production keeps exact rational fractions without intermediate rounding.

Canonical job: `($25 + $5) × 1.20 × 1.10 = $39.60` with Express Tips, Street
Connections and Fast Talker rank 1. After Rebirth removes normal upgrades, Fast
Talker rank 1 still makes the base job $27.50. Dispatcher uses the same Money reward.

| XP source | Base | Learn rank 1 (+10%) | Learn rank 2 (+20%) |
| --- | --- | --- | --- |
| Manual job | 10 | 11 | 12 |
| Business level increase | 25 | 27 | 30 |
| One dispatcher batch of 3 jobs | 15 | 16 | 18 |

XP floors once after exact modified evaluation at each award boundary. Dispatcher
first combines N×5 base XP and floors the modified batch once. Consequently three
separate single-cycle batches at rank 1 yield 15 XP, while a single three-cycle batch
yields 16 XP. There is deliberately no saved fractional XP remainder; this policy
makes fractional XP depend on batching. Money/cycle/remainder partition guarantees
are unchanged. Level thresholds, base XP values and all old Money costs stay intact.

Never Sleeps derives one shared cap: 8h at rank 0, 10h at rank 1, 12h at rank 2.
Businesses, Dispatcher Money and Dispatcher XP use that same credited duration.
No discarded time survives in progress. Buying the skill after an 8h-capped return
does not recover previously discarded time. The cap and all ranks survive Rebirth;
the derived cap is not persisted. Further trees/content and final balance are deferred.
