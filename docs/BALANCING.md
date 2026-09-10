# Base Game balance

Current authoritative values after **POST 3B Business Expansion I**. Non-Business Phase 9C balance is unchanged. Values remain provisional, but
this document describes the implemented game only. Feature config and central domain
helpers are the source of truth; UI uses their selectors. Phase 9C evidence and
before/after comparisons live in [BALANCE_AUDIT.md](BALANCE_AUDIT.md).

## Exact units and evaluation

Cash is a canonical non-negative integer-cent string, at most 100 digits
(0 through 10^100 − 1 cents). BigInt arithmetic preserves exact spends/additions;
invalid values and overflow fail atomically, never silently clamp or round cash.
Continuous production uses exact rational modifiers and retains both the 0–999
milli-cent remainder and the reduced sub-milli-cent fraction. Discrete job cash
floors once to cents after all modifiers. Flat additions precede multiplicative
percentage factors; distinct percentage sources multiply, not add. Ranks within
a skill sum their own percentage before joining that evaluation.

## Business Expansion I — implemented

| Business / stable ID | Acquisition | Requirements | Base $/sec | Upgrade base | Max Level |
| --- | --- | --- | --- | --- | --- |
| Dockside Detail / `business:dockside-detail` | $150 | None | $0.75 | $150 | 100 |
| Neon Laundry / `business:neon-laundry` | $35,000 | Player 5, Dockside 7 | $5 | $1,000 | 100 |
| Afterdark Customs / `business:afterdark-customs` | $125,000 | Player 10, Dockside 12 | $15 | $4,000 | 100 |
| Solara Nights / `business:solara-nights` | $400,000 | Player 16, Neon Mile | $40 | $12,000 | 100 |

All use base × Level production and upgrade base × current Level² cost. Acquisition
creates Level 1 without XP/Heat/paid-level statistics. Paid upgrades award 25 base
XP with existing modifiers and increment `businessLevelsPurchased` once. All owned
Businesses produce simultaneously; no ownership chain, KX-R gate or future risk
penalty. Dockside equipment remains scoped; global modifiers apply exactly once.
Neon Mile grants no Business production modifier. See BUSINESS_EXPANSION.md for
preserved POST 3A deterministic pacing, ROI/share and second-run evidence.

Target switching is free, requires owned automation/Business, and preserves enabled
state and 30s progress. No automatic acquisition/retargeting. Shared offline caps,
chronology and Rebirth formulas remain unchanged. The existing offline Dockside
Auto-Upgrader higher-Level/higher-EP behavior is intentionally preserved.

Current Save **v17**, CE1 unchanged: v16→v17 adds only the selected target, default
Dockside. Existing progression/fractions/timestamps remain exact, new Businesses
remain unowned. Fresh state and Rebirth reset target to Dockside; v17 import retains it.

## Opening and business progression

Fresh cash: **$0**. The manual waterfront delivery pays **$25**, **10 base XP** and
**+1 Heat after payout**. There is no cooldown. Six base deliveries fund Dockside;
ten reach Player Level 2. Heat cash penalties do not apply during those ten jobs.

**Dockside Detail** (`business:dockside-detail`):

- Purchase: **$150**, no requirements, starts at Level 1.
- Production: **$0.75/sec × current business level**, before modifiers.
- Each paid upgrade: **$150 × current Level²**, buys exactly one level, **25 base XP**.
- Maximum: **Level 100**. Initial purchase gives no XP and is not a paid-level statistic.
- Level 100 has no further purchase price. No bulk discount or refund exists.

| Current level | Next level price | Base production/sec | Total cash to acquire this level, including initial purchase |
| --- | --- | --- | --- |
| 1 | $150 | $0.75 | $150 |
| 5 | $3,750 | $3.75 | $4,650 |
| 10 | $15,000 | $7.50 | $42,900 |
| 15 | $33,750 | $11.25 | $152,400 |
| 25 | $93,750 | $18.75 | $735,150 |
| 50 | $375,000 | $37.50 | $6,063,900 |
| 100 | MAX LEVEL | $75 | $49,252,650 |

The initial purchase repays its $150 in **200 seconds** of unmodified production.
At 75 cents/sec, 14ms credits one cent with 50 milli-cent units retained. Partitioning
unchanged production never loses fractional earnings.

## Player XP

Player level is derived from cumulative XP: **100 × (Level − 1)²**, maximum displayed
level **100**. XP is not spent and can continue to Number.MAX_SAFE_INTEGER; overflow
fails the entire action. No income bonus or reward comes merely from leveling up.

| Level | Cumulative XP |
| --- | --- |
| 2 | 100 |
| 3 | 400 |
| 5 | 1,600 |
| 7 | 3,600 |
| 8 | 4,900 |
| 10 | 8,100 |
| 12 | 12,100 |
| 20 | 36,100 |
| 25 | 57,600 |
| 100 | 980,100 |

Sources: manual job **10**, Dispatcher cycle **5**, paid business level **25** base XP.
No other source awards XP. Learn the Streets modifies each award; Dispatcher first
combines the completed cycles into one base-XP batch, then floors once. At rank 1,
three cycles in one batch award 16 XP, while three separate single-cycle batches
award 15. Three separate business upgrades award 27 + 27 + 27 = **81 XP**, not 82.

## Five normal upgrades

All are once-per-run purchases. Acquisition conditions are AND lists and do not
revoke already-owned content. Cash affordability is separate from requirements.

| Name / stable ID | Price | Effect | Requirements |
| --- | --- | --- | --- |
| Commercial Pressure Washer / `upgrade:commercial-pressure-washer` | $2,500 | +25% Dockside production | Dockside owned |
| Industrial Detailing Line / `upgrade:industrial-detailing-line` | $10,000 | +50% Dockside production | Dockside Level 5 |
| Fleet Logistics / `upgrade:fleet-logistics` | $15,000 | +10% global business production | Any business, Pressure Washer, Player Level 5 |
| Street Connections / `upgrade:street-connections` | $750 | +20% job cash | Player Level 2 |
| Express Tips / `upgrade:express-tips` | $400 | +$5 job cash | None |

Either job upgrade alone gives $30 at COLD; both give **($25 + $5) × 1.20 = $36**.
At Dockside Level 4, the three production upgrades give
**$3 × 1.25 × 1.50 × 1.10 = $6.1875/sec**. Pressure Washer at Level 5 adds
$0.9375/sec, repaying its price in about 44 minutes 27 seconds.

## Automations

**Delivery Dispatcher** (`automation:delivery-dispatcher`): **$5,000**, requires
**Dockside owned and Player Level 3**. Ownership always activates one delivery per
**10,000ms**. It uses current central job cash, 5 base XP per cycle, and the Heat
batch rule below. Manual jobs remain available. Completed cycles are computed
mathematically with exact partial progress; no per-cycle simulation loop exists.
At COLD, no job upgrades / either / both pay **$25 / $30 / $36** per cycle.

**Business Auto-Upgrader** (`automation:business-auto-upgrader`):

| Property | Value |
| --- | --- |
| Purchase | **$50,000** |
| Requirements | **Player Level 12, Dockside owned at Level 15, Neon Mile controlled** |
| Target | One explicitly selected owned Business; default Dockside |
| Starts | **Disabled**, explicit enable required; no retroactive spending |
| Cadence | One attempt every **30,000ms** while enabled |
| Disabled progress | Pauses at the exact stored remainder |
| Success | One level at the current manual upgrade price, same XP and paid-level statistic |
| Failure to afford / max level | Consumes attempt, spends nothing, remains enabled |
| Heat | No Heat from purchase, toggle or upgrade |
| Offline | Works while enabled, within the shared credited duration |
| Rebirth | Both automations' ownership, enabled state and progress reset; no refund |

Dockside Auto-Upgrader level 25/26/27 purchases cost **$93,750 / $101,400 / $109,350**.
Production and spendable earnings respect purchase boundaries: old levels produce
before the purchase, new levels afterward. Dispatcher reward/XP/Heat retain one
outer batch; internal boundaries never add Event rolls. No reserve/budget exists.

## Garage and territories

**Kairo KX-R** (`vehicle:kairo-kx-r`): **$25,000**, requires Player Level 5,
Dockside owned at Level 5; **+10% global Business Production**. Ownership survives
Rebirth, including the modifier once Dockside is repurchased. No equip/tuning system.
At Dockside Level 4 with all production equipment it gives **$6.80625/sec**;
this is a valid retained-ownership example, not a waived acquisition requirement.

| Territory / stable ID | Acquisition | Requirements | Effect |
| --- | --- | --- | --- |
| Waterfront / `territory:waterfront` | Fresh baseline, free | Always present | No bonus |
| Neon Mile / `territory:neon-mile` | **$50,000**, once per run | Player Level 12; Dockside owned at Level 15 | +10% manual/Dispatcher cash; +10 Heat on acquisition |

Neon grants no production or XP. It resets on Rebirth; reacquisition pays the current
price and counts another territory action. Waterfront neither costs nor increments
the statistic. Acquired content retains ownership when current eligibility changes.

## Heat and Crew

Heat is an integer **0–100**, clamped on gains/reductions. Only job cash is penalized.

| Heat | Tier | Job cash multiplier |
| --- | --- | --- |
| 0–19 | COLD | 1.00 |
| 20–39 | NOTICED | 1.00 |
| 40–59 | WATCHED | 1.00 |
| 60–79 | HOT | 0.90 |
| 80–100 | MANHUNT | 0.75 |

- Manual job: **+1**, after old-tier payout.
- Dispatcher: **floor(completed cycles / 5)** per outer batch, then cooling.
- Neon acquisition: **+10**. Event effects are listed below.
- Cooling: **−1 per 60,000ms**, or **45,000ms with assigned Mara**.
- Lay Low: **$500**, **−10** to a minimum of zero, no cooldown/reward.

No cross-batch Dispatcher Heat counter exists: batches of 3 then 2 generate zero;
one batch of 5 generates one. Start-tier cash applies to every job in a batch.
Gain/clamp precedes cooling across the entire elapsed batch. No hidden transient peak
is reconstructed for achievements/statistics. Positive Heat retains cooling remainder;
zero clears it. Assignment changes preserve the numerical remainder; Mara's existing
50,000ms remainder cools on the next positive elapsed call, not on assignment itself.

| Crew / stable ID | Cost | Requirements | Assigned slot and effect |
| --- | --- | --- | --- |
| Rico Vale / `crew:rico-vale` | $20,000 | Player Level 8 | Operations: +10% job/Dispatcher cash |
| Mara Knox / `crew:mara-knox` | $30,000 | Player Level 10; Neon Mile | Operations: 45-second cooling |
| Jax Mercer / `crew:jax-mercer` | $40,000 | Player Level 12; Dockside Level 15 | Logistics: +15% global business production |

Only assigned Crew act. Rico and Mara compete for Operations; Jax occupies Logistics.
Recruitment gives no XP/Heat. Assignment/replacement/unassignment are free, with no
immediate decay, and all Crew reset on Rebirth. No bench bonuses or upkeep.

Full job example with both normal upgrades, Fast Talker rank 1, Neon and Rico:
**($25 + $5) × 1.20 × 1.10 × 1.10 × 1.10 = $47.916** before final cent flooring.
COLD pays **$47.91**, HOT **$43.12**, MANHUNT **$35.93**.

## City Events

Online opportunity: **600,000ms (10 minutes)**, chance **35%** (`roll < 0.35`).
At most one attempt per outer reconciliation, retaining modulo progress. No eligible
content consumes zero RNG; otherwise failed chance consumes one value, successful
chance consumes a second for uniform selection in Hot Tip → Shakedown → Warehouse
order. No weights, queue, history, pity timer or chains.

| Event / stable ID | Eligibility | Choice ID | Fixed outcome |
| --- | --- | --- | --- |
| Hot Tip / `event:hot-tip` | Player Level 5 | `choice:take-tip` | +$1,500, +5 Heat |
| Hot Tip | Same | `choice:play-safe` | −5 Heat |
| Shakedown / `event:shakedown` | Heat ≥20 | `choice:pay-off` | Spend $1,000, −10 Heat |
| Shakedown | Same | `choice:refuse` | +10 Heat |
| Warehouse Opportunity / `event:warehouse-opportunity` | Dockside owned, Player Level 10 | `choice:invest` | Spend $2,500 then receive $4,000, +5 Heat |
| Warehouse Opportunity | Same | `choice:pass` | No effect |

Each event has exactly two choices. Paid choices use current reconciled cash;
Warehouse requires the full $2,500, never just a net transaction. Money is fixed,
unmodified by job/Heat/Crew/skills, with **no XP or EP**. Heat clamps normally.
One pending event freezes only its timer; successful resolution resets it to zero.
No event cadence/RNG/choice occurs offline. Rebirth discards pending and progress.

## Rebirth, Empire Points and permanent skills

Rebirth requires **Player Level 20 AND Dockside Level 25**; neither cash nor other
content is required. Reward:
**floor(Player Level / 10) + floor(Dockside Level / 10)**.
20/25 gives **4 EP**, 37/48 gives **7 EP**, 100/100 gives **20 EP**.
There is no inherent bonus from EP or Rebirth count. Count and reward update atomically.

Vehicles, unspent EP, Rebirth count, skills, achievements and lifetime statistics
survive. Cash, XP, businesses/levels/fractions, normal upgrades, both automations,
Neon, Heat/remainder, Crew and City Events reset; Waterfront is restored. No refunds.

| Empire Foundations skill | Max rank | EP/rank | Requirement | Effect per rank |
| --- | --- | --- | --- | --- |
| Streetwise Investment | 3 | 1 | None | +5% global production |
| Fast Talker | 2 | 1 | Streetwise 1 | +10% job cash |
| Learn the Streets | 2 | 2 | Streetwise 1 | +10% XP |
| Silent Partner | 2 | 3 | Streetwise 3 | +10% global production |
| Never Sleeps | 2 | 2 | Streetwise 2 | +2 hours offline cap |

Exactly five skills, one tree; full cost **19 EP**, no respec. Three Streetwise ranks
sum to +15%, not three multiplicative 5% factors. Distinct production sources multiply.
KX-R plus Streetwise 1 gives **$0.75 × 1.10 × 1.05 = $0.86625/sec** at rebuilt
Dockside 1. Fast Talker 1 gives $27.50 base-job cash after temporary upgrades reset.

## Offline and persistence

One shared credited cap: **8h / 10h / 12h** at Never Sleeps ranks **0 / 1 / 2**.
Business production, Dispatcher Money/XP/Heat, cooling and enabled Auto-Upgrader
use that same duration. Discarded time earns nothing. From zero Dispatcher progress,
eight credited hours complete **2,880 jobs / 14,400 base XP**. At COLD this pays
$72,000 base, or $103,680 with both job upgrades, before any automated spending.
Offline is one durable candidate before publication; failures cannot partially credit it.
Import rebases timing, never simulates historical timestamps.

**POST 2C: Save v16, CE1 unchanged.** Legacy Vortex ownership maps to KX-R;
all owners use the same current +10% bonus without refund or historical simulation.
Apart from the vehicle ID mapping, stored Cash, XP, levels, progress, permanent
state and raw migration savedAt retain their exact values. New acquisition prices/gates
apply prospectively. Already-owned items receive no refund and owe no difference.

## Observational progression

Six achievements grant **no rewards**: First Steps (Player 2), Dockside Operator
(owned Dockside 10), Neon Takeover (Neon owned), Running Hot (current Heat ≥60),
Crew Chief (all three recruited in the same run), First Rebirth (count ≥1).
Unlocks are permanent; conditions observe the final authoritative command/batch state.

Eight permanent statistics grant **no rewards/modifiers**: manualJobsCompleted,
automatedJobsCompleted, businessLevelsPurchased, territoriesAcquired,
crewMembersRecruited, eventsResolved, rebirthsCompleted, peakHeat. Paid levels exclude
initial business acquisition; territory actions exclude Waterfront; recruitment counts
repeat post-Rebirth actions, never assignments; every successful event choice counts,
including PASS, never spawn/discard. Rebirth increments both counts atomically.
Peak Heat is the maximum final authoritative Heat observed, not a reconstructed
within-batch maximum. No balance evaluator reads achievements or statistics.


## Base Game freeze

Phase 9E retains every post-9C value above unchanged. Future expansion balance work
must be explicitly scoped; this release audit grants no refunds, compensation or
retrospective recalculation of stored progression.
