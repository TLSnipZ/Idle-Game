# Business Expansion I

## Status & scope

**POST 3A design complete. POST 3B IMPLEMENTED; deployment/live verification pending.**
Recovery implementation starts directly from POST 3A commit
`96ab72fffe8ced6710bca8572e573c086b0b9f8d`. The lost POST 3B SHA is historical
information, not a reproducible identity or the current implementation commit.

**CURRENT IMPLEMENTED: four Businesses; Save v17; CE1 unchanged.** The approved
three packages below now use the shared catalog, commands, exact production and
responsive Operations cards. The Auto-Upgrader has one persisted selected target.
No new artwork, dependencies, unique upgrades or POST 3C navigation are included.

The deterministic POST 3A models and architecture audit below are retained as
**historical design evidence**: “current/control” means the pre-expansion one-Business
v16 baseline; “proposed” means the approved four-Business scenario now implemented.
Those observations are not new simulations or deployment claims. Current shipped
balance is also recorded in [BALANCING.md](BALANCING.md).

### Implemented state and transaction contract

- `BUSINESS_CATALOG` supplies all four definitions in stable order. Existing generic
  `purchaseBusiness`, `upgradeBusiness`, production and selectors remain the sole
  authorities. The sparse owned map is unchanged; absence means unowned.
- `automation.businessAutoUpgradeTargetId` is the only new persisted field.
  Fresh v17, pure v16→v17 migration and Rebirth default to Dockside. Current v17
  imports preserve valid targets. Historical v1–v16 schemas remain targetless and
  Dockside-only; the sequential v15 Vortex→v16 KX-R migration is retained.
- A valid catalog target may be unowned in raw save validation. Such a target is
  dormant, never auto-acquired or silently switched. Target-change commands require
  purchased automation and an owned Business. The UI shows owned options only.
- Free target changes reconcile under the old target first, preserve enabled state
  and cadence progress, and purchase no immediate level. Each 30s attempt uses the
  selected Business and the shared paid-upgrade transition. Failed/max attempts
  are consumed; no queues, priorities or automatic switching.
- Both shared production fractions survive ordinary commands and migration. The
  existing per-ID modifier evaluation preserves Dockside-only equipment, then
  exact rational rates aggregate before the pooled payout boundary. KX-R +10%
  applies once to every contribution; Neon Mile still modifies jobs only.
- Runtime extends the baseline vehicle durable-write guard to Business transactions,
  automation purchase/toggle/target configuration and successful elapsed automatic
  upgrades. Failed writes publish no purchase/configuration changes; failed elapsed
  automatic spending pauses the session on its prior snapshot. Offline, Import and
  Rebirth still publish one complete durable candidate. A due automatic upgrade
  followed by a manual command has two chronological durable boundaries.
- All owned Businesses produce online/offline. The shared 8/10/12h cap, exact
  chronology, Dispatcher batching, Heat/Mara order, one outer Event opportunity,
  sub-ms treatment and 4,096-segment guard are unchanged. No offline acquisition or
  Rebirth. Existing offline Dockside growth and higher EP behavior remains intact.
- Rebirth empties the entire Business map, including Dockside, resets automation
  and target, and retains KX-R/EP/Skills under existing rules. Eligibility/reward
  formulas are unchanged.
- Operations uses stable-ID shared cards, actual individual/aggregate production,
  exact prices, met/unmet requirements and native controls. Wide two-column layout
  becomes one column at narrow widths. The native owned-target select preserves
  focus/countdown; existing local `preventScroll` recovery handles disabled actions.

### Recovery verification and live handoff

Domain, historical migration/CE1, production fractions, targeting, offline chronology,
Rebirth and durable transaction tests cover the recovered behavior. Mounted UI tests
cover in-place acquisition, repeated upgrades, final-level focus and target changes.
Cloud Browser rejected the local preview with `ERR_BLOCKED_BY_CLIENT`: desktop,
390px, 320px, real keyboard and real scroll review are **not completed**. Structural
and mounted DOM tests are not visual/deployment approval.

After deployment verify all four cards; Laundry/Afterdark acquisition and upgrade;
Nights P16 + Neon gate; local repeated-upgrade focus; owned-only target options;
countdown continuity and selected-only spending; mobile overflow; and Rebirth reset.
Only then proceed to separately scoped **POST 3C — Operations Long-Section
Navigation / UX**. No later phase starts here.

## Historical POST 3A design evidence

## Current Dockside baseline

Inspected authority: `features/businesses/config/business-config.ts`,
`model/business.ts`, `model/levels.ts`, `game/purchase-business.ts`,
`upgrade-business.ts`, `effective-stats.ts`, `xp-reward.ts` and `rebirth.ts`
(source paths below are relative to `src/`).

- **CURRENT LIVE ID:** `business:dockside-detail`.
- Fresh run: $0, no owned Businesses. Six base $25 manual deliveries fund its
  **$150** purchase. No progression requirement; explicit purchase creates Level 1.
  Dockside is not free and does not cost $7,500.
- Base production **$0.75 × L per second**. Next upgrade **$150 × L²**, where L
  is the current Level, buying L+1. Shared maximum **100**; no upgrade at max.
- Acquisition grants no XP/Heat or paid-level statistic. Each successful paid
  upgrade grants **25 base XP**, modified through `evaluateXpReward` and floored
  once per award; increments `businessLevelsPurchased` once. No purchase Heat.
- Owned-map absence means unowned, not a stored Level 0. No duplicates or selling.
- Rebirth resets ownership, Levels and both pooled production fractions to the
  fresh empty state. Cash, XP, normal upgrades and automation also reset.
- Online/offline use the same exact production path. Shared **8/10/12h** cap at
  Never Sleeps rank 0/1/2; no offline acquisition.

### Other current authorities used by the models

| CURRENT LIVE system | Inspected contract |
| --- | --- |
| Starter Job | $25, 10 XP, +1 Heat after payout, no cooldown; manual rate is a model assumption |
| Player Levels | `getXpThresholdForLevel`: 100 × (Level−1)²; displayed cap 100; Level 20 needs 36,100 XP |
| Dispatcher | $5,000; Dockside owned + Player 3; one job/10s, 5 base XP; no toggle |
| Normal upgrades | Express Tips $400: +$5 jobs; Street Connections $750/P2: +20% jobs; Washer $2,500/Dockside owned: +25% Dockside; Line $10,000/D5: +50% Dockside; Fleet $15,000/any Business + Washer + P5: +10% global production |
| Kairo KX-R | `vehicle:kairo-kx-r`; $25,000; P5 + owned D5; permanent +10% global Business Production |
| Neon Mile | $50,000; P12 + owned D15; +10% **job/Dispatcher cash**, +10 acquisition Heat. **No Business production or XP modifier** |
| Crew | Rico $20k/P8, assigned Operations: +10% jobs; Mara $30k/P10 + Neon, Operations: 45s cooling; Jax $40k/P12 + D15, Logistics: +15% global Business Production |
| Auto-Upgrader | $50k/P12 + owned D15 + Neon; one Dockside upgrade attempt/30s; purchased disabled; explicit enable; offline supported |
| Heat | 0–100; HOT jobs ×0.90, MANHUNT ×0.75; cooling 1/min (Mara: 45s); no production/XP penalty; dispatcher gain floor(jobs/5) per outer batch |
| Rebirth | P20 AND owned D25; EP = floor(Player Level/10) + floor(Dockside Level/10); no Cash, Territory, vehicle or other Business prerequisite |
| Permanent production skills | Streetwise Investment 3 ranks ×5%; Silent Partner 2 ranks ×10%. Ranks add within one source; distinct sources multiply |
| Other permanent skills | Fast Talker 2 ×10% job cash; Learn the Streets 2 ×10% XP; Never Sleeps 2 ×2h credited cap. Full tree 19 EP; EP/count alone gives no bonus |
| Events | Three unchanged online Events; 10-minute opportunities, 35% chance; no offline Events. Models force chance failure, with no invented expected income |

These were checked against feature configs and domain evaluators, including the
Phase 9C [BALANCE_AUDIT.md](BALANCE_AUDIT.md) and its existing deterministic helper.
The historical audit's Vortex and pre-9C prices are not current control values.

## Expansion goals & four-Business ladder

| Business | Subtitle | Position / standalone role | Future visual and synergy identity |
| --- | --- | --- | --- |
| Dockside Detail | Auto Detailing (proposed descriptive subtitle only) | Entry automotive cashflow; cheapest acquisition and first upgrades | Waterfront detail bay; low-profile; existing identity unchanged |
| Neon Laundry | Cash Front | First-run stable passive expansion | Late-night glass storefront, visible machines, restrained cyan/pink, wet neighborhood pavement; future low-attention/offline/logistics hooks |
| Afterdark Customs | Performance Workshop | Mid-run higher-output automotive investment | Open tool/lift bays, premium industrial concrete, cyan/magenta; future Garage, Crew and racing hooks |
| Solara Nights | Nightclub | Premium late-run output and city presence | Upscale Solara/Art Deco venue, restrained gold and nightlife light, coastal ambience; Neon Mile, future risk/Event hooks |

All four can be owned and produce simultaneously. New acquisitions never disable
old Businesses. Growth is cumulative, unlike future Active Vehicle bonuses.
The three names are concise and distinct; no severe naming/technical conflict was
found. No new currencies, ownership limits, managers or mandatory ownership chain.

### Neon Laundry

**PROPOSED FOR POST 3B.** A discreet neighborhood cash front expands the empire
beyond a single detail bay. Suggested flavor: “A late-night neighborhood staple.
Reliable trade keeps the machines—and the cashflow—moving.”
Stable output and accessible early upgrades establish its identity now; “offline
stability” does not grant special offline income, hours or lower Heat yet.
Avoid comedy, dilapidated coin-laundry styling and nightclub luxury.

### Afterdark Customs

**PROPOSED FOR POST 3B.** A respected performance workshop with after-hours street
clientele. Suggested flavor: “Performance work for Solara's after-hours crowd.
Build a reputation one engine bay at a time.”
No KX-R, Laundry or Neon ownership gate. General Player/Dockside milestones provide
access; Garage and Tuning are optional future synergies, not prerequisites.
Avoid a generic repair shop, dealership, race paddock or real branded vehicles.

### Solara Nights

**PROPOSED FOR POST 3B.** A visible city operation with the expansion's largest
production ceiling. Suggested flavor: “A premium address on Neon Mile.
Turn a full house into a larger empire.”
Require Neon Mile and Player 16, with no Rebirth or earlier-new-Business gate.
This is an optional extended-first-run investment; quicker resets can skip it.
Avoid casino scale, strip-club clichés and warehouse-rave styling.

## Proposed economy — final recommendation

**All new rows are PROPOSED FOR POST 3B, not live balance.** Prices/rates below are
dollars; runtime Money parameters are integer cents. P = Player Level, D = Dockside
Level; every stated gate is ANDed. Acquired content keeps its normal retention
semantics if eligibility later differs in a valid save.

| Business | Status | Acquisition | Requirements | Base production/s | Production scaling | Base upgrade cost | Upgrade scaling | Max Level | Upgrade XP | Role |
| --- | --- | ---: | --- | ---: | --- | ---: | --- | ---: | --- | --- |
| Dockside Detail | CURRENT LIVE | $150 | None | $0.75 | base × L | $150 | base × L² | 100 | 25 base/paid Level | Entry cashflow |
| Neon Laundry | IMPLEMENTED IN POST 3B | **$35,000** | **P5, owned D7** | **$5** | base × L | **$1,000** | base × L² | **100** | **25 base/paid Level** | Stable early passive cashflow |
| Afterdark Customs | IMPLEMENTED IN POST 3B | **$125,000** | **P10, owned D12** | **$15** | base × L | **$4,000** | base × L² | **100** | **25 base/paid Level** | Higher-output automotive |
| Solara Nights | IMPLEMENTED IN POST 3B | **$400,000** | **P16, Neon Mile owned** | **$40** | base × L | **$12,000** | base × L² | **100** | **25 base/paid Level** | Premium nightlife |

Proposed IDs: `business:neon-laundry`, `business:afterdark-customs`,
`business:solara-nights`. They encode canonical identity only. Existing requirements
already support arbitrary known Business IDs and Levels; no new requirement type
or total-Business-level gate is necessary. Solara's Neon gate implicitly entails
developing Dockside to 15 during ordinary acquisition; do not duplicate it in copy.

The $35k/$125k/$400k ladder separates acquisitions from KX-R $25k and the two $50k
milestones. Laundry P5/D7 overlaps the early vehicle decision intentionally, but
both ownership and investment purpose differ. Gates are unlocks, not promised
acquisition times: affordable-level spending can defer bigger purchases substantially.

## Upgrade curves & XP policy

Keep the existing shared formulas and maximum 100. Independent base rates and
upgrade-price parameters already provide different absolute growth and return
profiles; no exponent field, lookup table or separate simulation engine is needed.
Every current/proposed formula uses exact integer-factor Money multiplication.
There is no additional cost rounding; costs are exact cents. Rate modifiers and
fractions are never rounded to displayed dollars inside the model.

| Base production/s (no modifiers) | L1 | L5 | L10 | L25 | L50 | L100 |
| --- | --- | --- | --- | --- | --- | --- |
| Dockside Detail | $0.75 | $3.75 | $7.5 | $18.75 | $37.5 | $75 |
| Neon Laundry | $5 | $25 | $50 | $125 | $250 | $500 |
| Afterdark Customs | $15 | $75 | $150 | $375 | $750 | $1,500 |
| Solara Nights | $40 | $200 | $400 | $1,000 | $2,000 | $4,000 |

| Next upgrade from current L | 1→2 | 5→6 | 10→11 | 25→26 | 50→51 | 99→100 |
| --- | --- | --- | --- | --- | --- | --- |
| Dockside Detail | $150 | $3,750 | $15,000 | $93,750 | $375,000 | $1,470,150 |
| Neon Laundry | $1,000 | $25,000 | $100,000 | $625,000 | $2,500,000 | $9,801,000 |
| Afterdark Customs | $4,000 | $100,000 | $400,000 | $2,500,000 | $10,000,000 | $39,204,000 |
| Solara Nights | $12,000 | $300,000 | $1,200,000 | $7,500,000 | $30,000,000 | $117,612,000 |

| Business | Acquisition + all 99 paid upgrades |
| --- | --- |
| Dockside Detail | $49,252,650 |
| Neon Laundry | $328,385,000 |
| Afterdark Customs | $1,313,525,000 |
| Solara Nights | $3,940,600,000 |

Each marginal base output is constant; marginal payback rises smoothly with L².
The late costs are long-horizon capital sinks, not first-Rebirth requirements.
Maxed Nights is intentionally expensive; these totals are not a claim that casual
players should max four Businesses in their first run.

**Recommended common XP policy:** preserve the central `businessLevel` source of
25 base XP per paid upgrade (manual or automatic), then existing skill modifiers
and per-award floor. Acquisition remains zero XP. Cost-proportional XP would give
the expensive later Businesses disproportionate leveling power; equal rewards
give *lower* XP efficiency at the same Level as capital costs increase.

| Base XP per dollar of upgrade (acquisition excluded) | L1→2 | L10→11 | L50→51 |
| --- | --- | --- | --- |
| Dockside Detail | 0.166667 | 0.00166667 | 6.66667e-05 |
| Neon Laundry | 0.025 | 0.00025 | 1e-05 |
| Afterdark Customs | 0.00625 | 6.25e-05 | 2.5e-06 |
| Solara Nights | 0.00208333 | 2.08333e-05 | 8.33333e-07 |

At Learn rank 1 an upgrade awards 27 XP, at rank 2 it awards 30. Three separate
rank-1 upgrades award 81, not 82. Each new Business's 99 paid Levels yields 2,475
base XP; all three add at most 7,425 before Rebirth at enormous max-investment
cost, not a cheap route to the 36,100-XP gate. Early additional Levels can help,
but acquisition costs and higher base prices prevent a cheap-XP farm. No XP/Heat,
EP, achievement or territory-stat reward is attached to acquisition.

## Progression models & evidence

Reproduce with existing tooling:

```sh
npm run test -- src/game/business-expansion-analysis.test.ts --disableConsoleIntercept
```

`game/test-fixtures/business-expansion-proposals.ts` contains proposed parameters;
`business-expansion-model.ts` contains purchase policy, derived reporting and clocks.
The analysis test injects only the proposed **lookup data** at the Business config
seam, reaching existing internal ownership/production lookups. It never replaces
Money, requirements, commands, XP, modifiers, reconciliation or Rebirth algorithms.
No browser module imports these files. The test mock is isolated from existing
tests and **does not prove historical schema compatibility**; the unmodified v16
runtime still rejects these new IDs. POST 3B needs real catalog/schema work.

Control uses the same policy without the proposed acquisitions/upgrades and is
checked against the original Phase 9C helper's current-code Rebirth checkpoint.
Models start with actual fresh $0/XP0/empty Businesses; planning funds used to
rank hypothetical purchases never enter the real simulated state.

### Explicit assumptions

- **Active:** one manual Job per five seconds; after reconciliation and Job,
  purchase the first eligible affordable action in fixed order: Dockside,
  Tips/Connections/Washer, Dispatcher, Line/Fleet, KX-R, new acquisitions in ladder
  order, Rico/Jax, Neon, Mara, Auto-Upgrader, then owned Business upgrades.
  Dockside manual upgrades stop at 25; new Businesses at 10. Shopping repeats
  until nothing affordable remains. This spending-as-affordable policy can delay
  saving for bigger acquisitions; it is representative, not optimal.
- **Idle-leaning:** 40 manual Jobs at one-second intervals, then eight-hour
  absences/returns with no further manual Jobs. Same shopping policy at returns.
  The shared eight-hour cap, start-tier Dispatcher cash, batched XP/Heat and cooling
  are real `reconcileOffline` behavior. Session purchase decisions take no modeled
  wall-clock time. Timings are return windows, not continuous player activity.
- **Optimized representative:** same five-second Job rate, but save for the eligible
  purchase with shortest immediate marginal-income payback; planning includes
  Dispatcher and assigned Rico/Jax. New Businesses stop at **Level 5** before
  further goals, Dockside at 25. This finite investment envelope outperforms the
  tested Level-10 reinvestment policy for first Rebirth. It is a greedy stress
  policy, **not proof of a global optimum**; unlocks and utility are undervalued.
- All primary routes buy optional content and continue after first eligibility
  to observe later acquisitions; no implicit reset occurs. The first eligible
  snapshot is recorded separately. An explicit reset-at-eligibility variant is
  used for second-run and spending sensitivity checks.
- Auto-Upgrader is purchased but **left disabled** in primary comparisons.
  A separate enabled scenario retains the actual current **Dockside-only** target.
  No hypothetical multi-target spending or automatic acquisition finances results.
- No Events pay out: valid injected chance rolls of 0.999999 always fail. No Lay
  Low spending; active Heat reaches MANHUNT; Rico/Jax are assigned, Mara is benched.
  Five-second online calls normally complete at most one Dispatcher cycle. They
  preserve current single-cycle XP floors and batch Heat policy, but are not a
  claim of exact equivalence to every browser callback at a Heat boundary.
- No human think time, randomness windfall, uncapped 24h income, future synergy,
  fake acquisition XP or global formula change. Time/rate summaries round only
  for reporting; authoritative state and fractional earnings remain exact.

### Acquisition windows and first Rebirth

MODELED elapsed h:mm, rounded to minutes. Idle times are eight-hour return windows.
† Acquisition after first Rebirth **eligibility**, in the same deliberately extended run.

| Milestone | Active proposed | Idle-leaning proposed | Optimized proposed |
| --- | --- | --- | --- |
| Delivery Dispatcher | 0:30 | 8:01 | 0:17 |
| Kairo KX-R | 2:29 | 16:01 | 1:58 |
| Neon Laundry | 3:30 | 16:01 | 1:30 |
| Neon Mile | 4:44 | 24:01 | 4:14 † |
| Afterdark Customs | 6:36 † | 16:01 | 2:47 |
| Business Auto-Upgrader | 4:57 | 24:01 | 5:07 † |
| Solara Nights | 8:06 † | 24:01 | 4:48 † |
| Rebirth eligible | 6:20 | 32:01 | 4:10 |

| First eligible Rebirth | CURRENT control | PROPOSED | Manual Jobs current→proposed | Business capital current→proposed | XP current→proposed |
| --- | --- | --- | --- | --- | --- |
| active | 7:25 | 6:20 | 5,344 → 4,555 | $735,150 → $1,055,150 | 66,485 → 56,845 |
| idle-leaning | 32:01 | 32:01 | 40 → 40 | $735,150 → $2,408,150 | 44,200 → 44,650 |
| optimized | 6:34 | 4:10 | 4,728 → 3,002 | $735,150 → $1,045,150 | 59,180 → 37,805 |

Business capital includes acquisition and paid Levels only, not equipment, Crew,
vehicle, Territory or automation purchase. All primary first-eligibility rewards
are 4 EP. More invested Cash can still mean earlier eligibility because it earned
more production before the final Dockside purchases.

| Bottleneck | Current P20 / D25 | Proposed P20 / D25 | Interpretation |
| --- | --- | --- | --- |
| active | 4:04 / 7:25 | 4:03 / 6:20 | Late Cash/spending order remains dominant |
| idle-leaning | 32:01 / 24:01 | 32:01 / 24:01 | XP + return cadence; Cash arrives before P20 |
| optimized | 4:01 / 6:34 | 3:59 / 4:10 | Mixed; Cash finishes about 11 minutes after P20 |

Laundry is available at P5/D7 and reachable before first Rebirth in every primary
route. Active purchase-as-affordable delays it beyond its unlock and delays
Afterdark until after first eligibility; this is a spending-policy concern, not a
mandatory post-Rebirth lock. Saving exposes Afterdark as a genuine mid-run milestone.
The return-based idle route can buy Laundry and Afterdark in the same session after
accumulating eight hours of Dispatcher/Business income. Do not hide this visit
clustering behind fictitiously precise acquisition times.

### Rebirth tradeoffs, stress and later run

| Same five-second manual rate; reset at first eligibility | Rebirth h:mm | Solara Nights |
| --- | --- | --- |
| New Businesses held at Level 1 | 6:06 | Not acquired before reset |
| New Businesses held at Level 3 | 4:32 | Not acquired before reset |
| Selected Level-5 policy | 4:10 | Not acquired before reset |
| New Businesses developed to Level 10 | 5:29 | Not acquired before reset |
| Level-5 policy, skip Afterdark | 4:44 | Not acquired before reset |
| Level-5 policy, prioritize Neon/Nights | 4:42 | 4:00 |
| Level-5 policy, skip KX-R | 4:14 | Not acquired before reset |

The Nights detour acquires it at 4:00, then reaches eligibility at 4:42—about
41 minutes with the venue, not an immediate reset. It delays the lean baseline
by about 32 minutes. The ordinary optimized completion route instead skips it
until after eligibility (4:48). Thus Nights is obtainable in the first run,
but optional extended investment rather than a Rebirth gate.

Skipping Afterdark still reaches Rebirth at 4:44, about 34 minutes later; rushing
it is not a requirement. Skipping KX-R buys Afterdark roughly four minutes earlier,
but eligibility arrives about four minutes later (4:14 versus 4:10). Permanent
value is additional; neither acquisition must be forced through a prerequisite.
The Level-10 route takes 5:29 despite buying more output: overinvestment has a cost.

**Coarse second run:** actually reset the optimized first eligible snapshot,
retain KX-R and spend its 4 EP on Streetwise 1, Fast Talker 1, Learn the Streets 1.
Same policy reaches Laundry 1:20, Afterdark 2:23, and Rebirth
3:42 with 2,669 new manual Jobs (lifetime counters are not reset).
This is about 11% faster than the first proposed run, not runaway instant rebuilding.
P20 arrives at 3:41; XP and Cash are then almost coincident.

**Enabled-offline sensitivity, actual Dockside target only:** first observed
eligibility is still 32:01 at a return, but Dockside is Level 66 and recorded
Business investment is $15,722,900, compared with Level 25 in the disabled
route. Automation spent the accumulated income between visits; no additional
Business was acquired offline. This first observed reward is 8 EP (Player 20,
Dockside 66), versus 4 EP without automatic reinvestment. That is a significant
long-absence EP acceleration risk to monitor, not evidence for changing the EP
formula here. Return-time observation is not the exact in-absence eligibility
instant; the player cannot press Rebirth while absent. The proposed target choice
lets players direct spending, but adds no automatic stop-at-25 or Cash reserve.


These outcomes justify the final package without altering global XP or Rebirth.
The expansion reduces the cash grind, not the need to progress. The best tested
five-second route approaches the roughly four-hour XP window; it does not reset
minutes after a new purchase. Unlimited manual clicking already exists, so no
claimed lower bound applies to all human strategies. Later-run acceleration must
continue to be monitored after live implementation.

## ROI & production shares

Static payback = acquisition / incremental production (or upgrade price / marginal
gain), holding output/modifiers fixed. It is not time to save using the entire
empire, does not include refunds, and is not proposed Purchase Intelligence UI.

| PROPOSED acquisition payback | Base only | With Fleet ×1.10 | Fleet + KX-R + Jax ×1.3915 |
| --- | --- | --- | --- |
| Neon Laundry | 1.94h | 1.77h | 1.40h |
| Afterdark Customs | 2.31h | 2.10h | 1.66h |
| Solara Nights | 2.78h | 2.53h | 2.00h |

| Marginal upgrade payback, no modifiers | 1→2 | 5→6 | 10→11 | 25→26 |
| --- | --- | --- | --- | --- |
| Dockside Detail | 0.056h | 1.389h | 5.556h | 34.722h |
| Neon Laundry | 0.056h | 1.389h | 5.556h | 34.722h |
| Afterdark Customs | 0.074h | 1.852h | 7.407h | 46.296h |
| Solara Nights | 0.083h | 2.083h | 8.333h | 52.083h |

The first upgrade on each Business has deliberately attractive marginal ROI,
but owning the Business first is a substantial capital requirement. Comparing
the $1,000 Laundry upgrade with an unowned Dockside upgrade without the $35k
acquisition would be misleading. No Nights purchase pays for itself in minutes.
Marginal upgrade paybacks increase quadratically; no runaway exponential curve.

| Levels D/Laundry/Afterdark/Nights | Equipped total/s | Production shares D/L/A/N | KX-R incremental/s | Jax incremental/s |
| --- | --- | --- | --- | --- |
| 7/1/0/0 | $16.328125 | 66.3% / 33.7% / 0.0% / 0.0% | $1.6328125 | $2.44921875 |
| 15/5/1/0 | $67.203125 | 34.5% / 40.9% / 24.6% / 0.0% | $6.7203125 | $10.08046875 |
| 25/10/5/1 | $220.171875 | 17.6% / 25.0% / 37.5% / 20.0% | $22.0171875 | $33.02578125 |
| 50/25/15/10 | $902.34375 | 8.6% / 15.2% / 27.4% / 48.8% | $90.234375 | $135.3515625 |
| 100/100/100/100 | $6,754.6875 | 2.3% / 8.1% / 24.4% / 65.1% | $675.46875 | $1,013.203125 |

Share examples include Washer/Line (Dockside only) and Fleet (global), not Crew,
vehicle or skills unless explicitly shown. KX-R changes absolute earnings by the
listed amount and stays exactly **+10%**, not four stacked +10% bonuses. Jax is
exactly +15% across the aggregate. At equal max development Dockside's ~2.3% share
is intentionally smaller but nonzero; its low opening capital and mandatory D25
milestone keep its early role. Do not promise equal late-game production shares.

### Cross-system interpretation and risks

- **KX-R:** a permanent multiplier becomes more useful as production grows. The
  no-KX-R stress route still reaches Rebirth; its short-run gain is modest, so
  this is not a new mandatory gate. Buying temporary Laundry first versus the
  permanent vehicle remains a horizon choice. Preserve $25k/+10% and permanence.
- **Neon Mile + Nights:** combined acquisition is **$450,000**, plus general
  progression investment. Neon adds **zero** Business output; Nights adds $40/s
  base, or $44/s with Fleet. The combined production-only payback is 3.125h base
  (about 2.84h with Fleet), conservatively ignoring Neon's separate +10% job cash.
  No double Business-multiplier spike exists. Neon unlocks useful content but its
  own job-cash ROI remains slow for passive specialists.
- **Crew:** Jax's $40k becomes a strong long-run buy as aggregate income grows;
  with the three-Business sample its incremental $10.08046875/s repays in about
  66 minutes, versus 20 minutes in the four-Business sample. He is not a gate.
  Rico remains valuable to frequent Jobs; Mara's current cooling niche remains
  weaker in nonstop manual play/long absences. No Crew redesign or rebalance.
- **Skills:** Streetwise rank 3 and Silent rank 2 multiply production by 1.15×1.20;
  with KX-R and Jax, the additional factor is **1.7457** relative to the equipped
  sample. Fleet is already included. No repeated per-Business stacking. The
  tested four-EP second run accelerates without an immediate-reset loop.
- **Dispatcher:** more Businesses reduce its share of Cash, but it stays important
  for idle XP (14,400 base XP per eight credited hours). Do not add Business XP
  over time to compensate; that would erase this distinction.
- **Auto-Upgrader:** a convenience purchase, not an immediate production bonus.
  A continuously active player can skip its $50k cost and click upgrades; greedy
  ROI therefore puts it late. Enabled Dockside spending during absences is useful
  but can consume Cash reserved for new acquisitions and overinvest past D25.
  Keep explicit enablement and target selection; never market it as universally
  profitable or add silent budget/target switching.
- **XP / content pacing:** idle returns remain XP/visit limited; smaller affordable
  Business upgrades are not permission to raise XP with purchase price. Fixed
  Event cash becomes relatively less important later; Event expansion stays deferred.
  Post-launch telemetry/live review should examine first-Rebirth fatigue and
  automated higher-Dockside EP generation. Do not silently patch XP/EP/Heat here.

## Rebirth & offline contracts — PROPOSED FOR POST 3B

All four Businesses are temporary per-run ownership/Levels. Rebirth restores the
same fresh empty owned map, both zero fractions and reset normal upgrades and
automation. KX-R, skills, EP/count, achievements and statistics retain current
permanence. New Businesses never contribute to EP eligibility/reward unless a
separate later design explicitly changes that rule. No selling, refunds or
requirement to own/max all four. Solara Nights remains optional.

All owned Businesses produce online and offline through one authoritative rate
path and shared Never Sleeps **8/10/12h** cap. No per-Business clock, added Laundry
hours, passive Heat, separate offline formula or automatic acquisition. Preserve
exact old-rate/new-rate purchase boundaries, pooled fractions, safe overflow,
one durable catch-up candidate and write-before-publication. Import does not
simulate historical timestamps; bootstrap migration precedes ordinary catch-up.

## Current state architecture & future Save decision

**CURRENT LIVE findings:**

| Concern | Actual implementation | POST 3B recommendation |
| --- | --- | --- |
| Business state | `BusinessState.owned: Partial<Record<BusinessId, { level }>>`; missing key = unowned; 1…100 when owned | Extend this map; do not replace it with four fields or store owned flags/Level 0 |
| Catalog | `findBusiness` recognizes only `STARTER_BUSINESS` | Add an ordered four-entry catalog and known-ID lookup once, with separate historical validation |
| Commands | `purchaseBusiness(state,id)` / `upgradeBusiness(state,id)` already resolve IDs and use common costs/XP/counters | Reuse; no per-Business command engine |
| Requirements | `business-level` and `business-owned` accept known IDs; current content mostly points at Dockside | Reuse for the two proposed Dockside gates; no new total-level type |
| Production | `getOwnedProductionInputs` iterates the map; `effectiveProductionRates` evaluates each ID then `accrueProduction` sums exact rational rates | Retain this order because Washer/Line target Dockside, whereas Fleet/KX-R/Jax/skills are global |
| Fractions | Shared `productionRemainderMilliCents` integer 0…999 plus reduced `productionRemainderSubMilliCents` rational in [0,1) | Preserve both byte/value-exact during migration and ordinary acquisition; no per-Business remainders needed |
| Auto-Upgrader | Config `targetBusinessId = STARTER_BUSINESS.id`; selector and `attemptBusinessAutoUpgrade` read that fixed config; saved state has no target | Introduce selected target in automation state and resolve it through shared lookup |
| UI/feedback | BusinessCard, dashboard/actions and announcements still reference `STARTER_BUSINESS`; existing progress selectors accept IDs | Render shared cards from catalog, parameterize definition/feedback/action IDs, unique heading IDs; avoid section remounts |

**Recommend Save v17 for POST 3B**, because the selected automation target is new
authoritative state. The Business owned-map itself is already generic and does
not need a destructive redesign. Use **one** v16→v17 step for the expansion;
do not create one schema version for each Business. CE1 stays the transport.

### Minimal future migration contract

1. Validate the actual historical v16 shape and known IDs before transforming.
   Keep v1…v16 Business/automation validators historically accurate: current
   `save-schema.ts` shares `findBusiness` and automation validation across versions,
   so merely widening today's lookup would incorrectly widen old payloads.
2. Preserve Dockside's absent/present record and exact Level. New Businesses
   start **absent/unowned**; never infer ownership from money, Level or statistics.
3. Copy both production fractions unchanged, and preserve automation ownership,
   enabled IDs, Dispatcher progress and Auto-Upgrader elapsed progress exactly.
4. Add one conceptual `businessAutoUpgradeTargetId` using current naming style,
   default **`business:dockside-detail`**. It is a harmless dormant default before
   Dockside ownership, including a structurally valid historical automation owner
   lacking Dockside; attempts then retain the existing `not-owned` no-op behavior.
5. Preserve all unrelated GameState fields and raw `savedAt`. No historical
   income, purchases, XP, refunds, achievements or statistic reconstruction.
6. Validate current v17 before normal durable publication. Older CE1 codes follow
   the sequential chain; current export emits v17 inside CE1. Test v16 owner and
   non-owner, enabled/disabled and nonzero progress/fractions, plus import failure.

That target name is a concrete recommended field, not a field introduced by
POST 3A. Unknown target IDs must reject external payloads; do not silently repair
corrupt saves. The default-Dockside dormant exception is explicit, not permission
to select arbitrary unowned Businesses.

### Why the shared remainder remains correct

At fixed ownership/Levels/modifiers, exact rates r_i add before accrual. The
existing accumulator evaluates `(sum(r_i) × elapsedMs + retained milli-cent
fraction)`, pays whole cents and retains both remainder components. Therefore
splitting an unchanged interval cannot lose or multiply fractional earnings;
the four-rate experiment verifies whole versus partitioned intervals.
Do **not** floor each Business's income separately or sum base rates before
applying Dockside-only equipment. Passive aggregation needs one calculation per
outer interval, not four time segments. Timed spending still partitions at the
existing attempt boundaries; Business count does not multiply the segment budget.

## Business Auto-Upgrader — PROPOSED FOR POST 3B

One purchased automation, **one selected owned Business target at a time**.
Preserve $50k acquisition, P12/D15/Neon gate, disabled-on-purchase and exact 30s
cadence. Default target is Dockside; UI offers only owned Businesses for changes.
No auto-acquisition, simultaneous four-way upgrades or four automation purchases.

Target change must reconcile under the **old** target first, validate the new
owned target, persist atomically, then use it for future attempts. Preserve elapsed
cadence progress on selection (e.g. 20s accumulated means 10s to next attempt),
with no immediate purchase, extra attempt or replay. Disabled progress stays paused.
This is a meaningful spending command, unlike plain UI navigation.

Each boundary calls the common paid-upgrade command: exact cost, XP and checked
statistic. Unaffordable/max-Level attempts are consumed harmlessly; no backlog,
silent retargeting or queued purchase. At max, suggest choosing another target;
do not choose for the player. A known dormant Dockside default without ownership
does nothing; unexpected invalid internal target is an invariant failure.

Offline uses the same selected target and capped chronology. Return summary
identifies target, upgrade count and Cash spent, keeping gross earnings distinct
from spending. Rebirth resets ownership, enablement and elapsed state with the
fresh Dockside default; it never carries a Solara Nights target into the new run.
No target runtime/UI is implemented in this planning phase.

## Future synergies & deferred systems

Foundation behavior for every new Business is acquire → produce → upgrade, with
one reusable responsive card and concise title/subtitle/status. No artwork is
required for POST 3B. Future visuals follow ART_DIRECTION and the distinct storefront,
workshop and venue identities above, with fictional branding and restrained accents.

| Future branch | Design hook / boundary |
| --- | --- |
| Vehicles / Tuning | Afterdark can later offer modest automotive synergy/options; no KX-R gate/buff, Tuning access lock or current workshop discount |
| Crew depth | Current Operations chooses Rico or Mara; Logistics assigns Jax globally, not to a Business. Business targeting would need a separately designed assignment/state/UI model |
| Heat / Police 2.0 | Dockside low-profile, Laundry discreet front, Afterdark street attention, Nights high visibility. Flavor only; no passive Heat ticks or invented penalty funding today's output |
| Events | Later owned-Business eligibility for cash discrepancies, customer disputes or VIP incidents; current three Events unchanged |
| Districts / Territories | Waterfront/Dockside, neighborhood/Laundry, industrial/Afterdark, Neon/Nights thematic alignment; no new district state or Territory |
| Properties | Businesses produce Cash; future Properties can provide infrastructure/utility. No dual nightclub ownership system |
| Unique upgrades | Later small sets such as machines, dyno bay or VIP floor; unpriced, unimplemented, generic Levels remain backbone |
| Offline depth | Laundry reliability may become complementary utility; Never Sleeps keeps the shared cap progression |
| UX / guidance | Four Businesses lengthen Operations. POST 3C navigation follows live 3B; Purchase Intelligence, Reset and Next Objective remain separate |

## POST 3B IMPLEMENTATION CONTRACT — fulfilled (historical approved scope)

Implement the exact three proposed packages in the final economy table with shared
linear output/quadratic costs, maximum 100, zero acquisition XP and the existing
25-base-XP paid-level path. Current Dockside, jobs, XP thresholds, Rebirth/EP, Crew,
skills, KX-R, Territory values and normal equipment effects remain unchanged.

Extend the existing keyed owned-map/catalog, common purchase/upgrade/selectors and
per-ID modifier evaluation. Introduce the single selected Auto-Upgrader target,
v17 migration/default rules above, target-aware summary, and shared responsive
Operations cards with exact prices and non-color-only requirements/status/actions.
Retain POST 2D stable local focus, global XP/Rebirth notice and five-section shell.

Required implementation tests: exact purchase gates/prices and duplicate/failure
atomicity for each Business; paid-level XP/statistics/overflow; global versus
Dockside-specific modifiers; exact shared fractional aggregation and boundary
accrual; all-four Rebirth reset; capped offline and storage failure; v16 owner/
non-owner historical CE1 migration, target defaults and target-change atomicity;
enabled/disabled/missing-owned/maxed/unaffordable automation targets and 30s timing;
shared card locked/unaffordable/purchasable/owned/max states and mobile/focus behavior.

Preserve **reconcile-before-command**, conservative existing sub-millisecond
rate-change handling, exact fractional Money, Dispatcher batching and prefix
funding, Heat/Mara ordering, **one outer Event RNG attempt**, Auto-Upgrader chronology,
**4,096-segment safety budget**, checked overflow and one atomic durable offline/
Import/Rebirth candidate. No per-Business partial publication or extra RNG.

Explicitly excluded from 3A/3B: Business artwork/logos, unique upgrades, Crew 2.0,
Heat/Police 2.0, Business Events, Properties, Purchase Intelligence, Next Objective,
Reset Progress, Active Vehicle, Tuning, new Territories/Achievements/Statistics.
Runtime Business count changes **1→4 only in POST 3B**; all other content counts
stay 2 Territories, 3 Crew, 3 Events, 6 Achievements, 8 Statistics, 1 Vehicle,
5 permanent skills and 2 automations.

After explicit implementation authorization and successful deployed/live 3B review:
**POST 3C — Operations Long-Section Navigation / UX**, then separately scoped Reset
Progress, Next Objective / Guidance, Active Vehicle / Tier 1 Garage, and Heat /
Police 2.0, subject to actual live defects. Business artwork is a later controlled
visual phase. POST 3A stops at this planning commit.
