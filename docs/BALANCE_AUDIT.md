# Phase 9C Balance Audit

## Baseline

Baseline: `a8889ed09e78e123676f695fc119ce2125e59683`, before any tuning.
**AUTHORITATIVE** means config/domain-derived values; **MODELED** means an explicit
purchase/click/return policy executed through those domain APIs; **ESTIMATED** means
rounded interpretation of player time. No modeled clock is a guaranteed playtime.

The baseline was recorded and simulated before changing any production config.
`src/game/test-fixtures/balance-model.ts` uses actual purchase commands, requirements,
Money spends, XP, Heat, Crew assignment and online/offline simulation. It does not
implement another economy. `src/game/balance-audit.test.ts` exercises the routes,
reports marginal paybacks, verifies early access, first-EP alternatives, subsequent
benefit, pre-Rebirth offline spending, exact v15 retention and content counts.

Reproduce the current report with:

```sh
npm run test -- src/game/balance-audit.test.ts --disableConsoleIntercept
```

For baseline comparison, the same analysis files can run in a disposable checkout
of the baseline commit; select the tests matching `can reach|capital curve|marginal`.
The new prospective acquisition tests intentionally expect post-9C values.
Logs are transient; the concise findings and checkpoint tables below are the record.

AUTHORITATIVE baseline inventory: $25 manual job; $150 Dockside acquisition;
$150 × Level² upgrade; $0.75/sec × Level; 100 × (player Level − 1)² XP;
10/5/25 XP for manual/Dispatcher/paid level. Five equipment/job upgrades cost
$400/$750/$2,500/$10,000/$15,000 with +$5/+20%/+25%/+50%/+10% effects respectively.
Dispatcher cost $7,500, Dockside + Player 3, ten seconds. Vortex cost $50,000,
Player 7 + Dockside 10, permanent +15% business output. Neon cost $100,000,
Player 12 + Dockside 15, temporary +10% job cash, +10 Heat. Rico/Mara/Jax cost
$20,000/$30,000/$40,000, with existing +10% jobs / 45s cooling / +15% production.
Heat, event, skill and offline values were inspected and are retained as inventoried
in BALANCING.md. Rebirth required 20/25 and paid floor(Player/10)+floor(Dockside/10).
Auto-Upgrader cost $250,000 at 20/25 + Neon, with 30-second opt-in attempts.

## Checkpoints

MODELED baseline elapsed time, **hours:minutes:seconds**, from a fresh save.
The idle clock includes absences; it does not mean that many hours clicking.
Eligibility does not imply affordability. These routes intentionally continue past
first Rebirth eligibility to measure optional content; they do not automatically reset.

| Checkpoint | Active | Idle-Leaning | Optimized |
| --- | --- | --- | --- |
| Player 2 | 0:00:50 | 0:00:10 | 0:00:50 |
| Dockside 1 | 0:00:30 | 0:00:06 | 0:00:30 |
| Dockside 5 | 0:12:10 | 8:00:40 | 0:25:55 |
| Delivery Dispatcher eligible | 0:03:10 | 0:00:38 | 0:03:10 |
| Delivery Dispatcher | 0:51:00 | 8:00:40 | 0:22:15 |
| Player 7 | 0:29:00 | 16:00:40 | 0:27:50 |
| Dockside 10 | 1:21:10 | 16:00:40 | 1:16:45 |
| Vortex S9 eligible | 1:21:10 | 16:00:40 | 1:16:45 |
| Vortex S9 | 4:44:30 | 16:00:40 | 2:47:10 |
| Neon Mile eligible | 2:51:15 | 16:00:40 | 3:02:00 |
| Neon Mile | 7:23:25 | 16:00:40 | 7:12:15 |
| Rico Vale | 2:07:35 | 16:00:40 | 4:33:20 |
| Mara Knox | 7:31:35 | 16:00:40 | 7:20:25 |
| Jax Mercer | 3:46:45 | 16:00:40 | 3:21:10 |
| Dockside 25 | 6:55:40 | 24:00:40 | 6:44:30 |
| Player 20 | 4:08:05 | 32:00:40 | 4:02:30 |
| Rebirth eligible | 6:55:40 | 32:00:40 | 6:44:30 |
| Business Auto-Upgrader eligible | 7:23:25 | 32:00:40 | 7:12:15 |
| Business Auto-Upgrader | 8:40:00 | 32:00:40 | 8:28:50 |

AUTHORITATIVE resource gates: Level 2/3/7/8/10/12/20 require
100/400/3,600/4,900/8,100/12,100/36,100 XP. Dockside purchase through Levels
5/10/15/25 costs a cumulative **$4,650 / $42,900 / $152,400 / $735,150**,
excluding equipment, Crew, vehicle and city purchases. Those levels grant only
100/225/350/600 XP: idle XP must principally come from Dispatcher. No circular gate
exists: ungated jobs → Dockside → Player 3 Dispatcher → all later XP gates.
Street Connections is available at ten jobs; its cash requirement never blocks jobs.

The active baseline had Player 20 at 4:08:05 but needed until 6:55:40 for Dockside 25;
**cash** was the late bottleneck. Idle had Dockside 25 at the 24-hour return but
needed another return for Player 20; **XP plus visit cadence** was its bottleneck.
First eligible Rebirth pays exactly **4 EP** at 20/25. All three modeled baseline
routes also paid 4 EP at their first observation of eligibility.

AUTHORITATIVE marginal paybacks below use all three production upgrades, no
vehicle/skills/Crew. They are static marginal ROI, not the time to accumulate a
purchase using the entire current income, and exclude resale (none exists).

| Current Dockside level | Next price | Equipped income/sec | Next-level marginal payback |
| --- | --- | --- | --- |
| 5 | $3,750 | $7.734375 | 0.67h |
| 10 | $15,000 | $15.46875 | 2.69h |
| 15 | $33,750 | $23.203125 | 6.06h |
| 25 | $93,750 | $38.671875 | 16.84h |
| 50 | $375,000 | $77.34375 | 67.34h |
| 100 | MAX | $154.6875 | No purchase |

Acquiring Level 100 costs $49,252,650 total; the final 99→100 step is $1,470,150.
High levels are long-horizon capital goals, not a required first-Rebirth route.
There is no infinite snowball: marginal level price rises quadratically while
marginal production is constant at fixed modifiers.

## Player Models

- **Active:** one manual job every five seconds, then buy the first affordable,
  eligible item in the helper's documented order; cheaper levels can delay larger
  acquisitions. This models a plausible purchase-as-affordable policy, not optimal
  cash reservation. No Lay Low spending; Heat reaches MANHUNT without stopping play.
- **Idle-Leaning:** forty initial manual jobs at one-second intervals, then eight-hour
  returns; each return uses the real capped offline candidate and spends available
  cash through normal commands. No extra jobs after bootstrap. Forty is a chosen
  sufficient route, not a claimed minimum; paid-level XP can reduce the required jobs.
- **Optimized:** the same five-second manual rate as Active, but save for the eligible
  investment with shortest immediate income payback, instead of buying a cheaper
  distraction. Planning evaluates hypothetical purchases with sufficient funds;
  actual state never receives that planning cash. Income includes assigned Rico/Jax.
  It is a greedy strategy, not a global optimizer; it undervalues utility/unlock paths.

All models buy optional content to expose every gate, assign Rico/Jax when recruited,
and leave Mara on the bench. Auto-Upgrader is purchased **but left disabled** in the
comparison, deliberately separating acquisition spending from its opt-in behavior.
The dedicated enabled-offline scenario below covers its actual utility. Holding
cash for Rebirth or enabling spending is a different legitimate player decision.

Online model reconciliation is every five seconds (one second during idle bootstrap),
not every 250ms browser paint. Each contains at most one Dispatcher cycle, preserving
its normal single-cycle XP flooring and zero per-batch Dispatcher Heat gain. It does
not claim perfect browser callback equivalence near a changing Heat tier. Offline
uses full eight-hour batches, including start-tier rewards followed by cooling.
Event chance always fails with valid injected 0.999999; no random windfall finances
these routes. Achievements are evaluated after commands; all six remain observational.

MODELED optimized second run: retain the earned Vortex, spend 4 EP on Streetwise 1,
Fast Talker 1, Learn the Streets 1, and repeat the same policy. Baseline first Rebirth
6:44:30 becomes **5:44:05**; post-9C first **6:39:30** becomes **5:39:50** (about 15%
faster). Existing lifetime job counters carry over; they are not per-run click counts.
This demonstrates noticeable permanence without a mandatory single skill path.

## Findings

**Opening / manual fatigue.** Six deliveries buy Dockside; the static payback is
3m20s. Active gets Express Tips at 24 jobs; saving policy gets Street Connections at
44. Early purchases are not flat or deadlocked. Express Tips repays in 80 unpenalized
incremental jobs; Street Connections after Tips in 125. But Dispatcher arrives at
612 active versus 267 optimized baseline jobs: affordable level spending postpones
relief. Lowering its price addresses this local cash delay, without changing job
reward, automatic cadence or the opening's six/ten-job milestones.

**Income coexistence.** Both job upgrades give $36 COLD, $32.40 HOT, $27 MANHUNT.
At one manual job per 5s, active income is $7.20/$6.48/$5.40 per second, plus
Dispatcher $3.60/$3.24/$2.70. Equipped Dockside at 5/10/25 gives
$7.734375/$15.46875/$38.671875 per second. Business overtakes moderate clicking,
while an optional one-job-per-second burst remains strong at $27–36/sec. No job
multiplier needs removal or production buff. Faster unlimited clicking is possible;
these modeled rates are assumptions, not a cooldown.

**Upgrade/vehicle/Crew value.** At Dockside 10, Washer repays in 22.22 minutes,
Line after Washer in 35.56, Fleet after both in 177.78. Fleet is weaker early,
but its own marginal return improves with future levels; keep it optional. Vortex
with all equipment repays in 359.15 minutes at 10, 239.43 at 15; permanent reuse
makes the delayed reward sensible. Jax at 15 with equipment repays in 191.55 minutes,
or about 166.56 with Vortex too; buy earlier in a long run, skip immediately before
Rebirth. Rico's $20,000 repays in 5.14h COLD / 6.86h MANHUNT at five-second manual
jobs plus Dispatcher, much longer with Dispatcher alone. It favors active/long runs,
not every first-Rebirth rush. No recruitment is required for Rebirth.

**Heat / Mara.** Twelve manual jobs/minute exceed 1/minute baseline or 1.33/minute
Mara cooling; sustained active play reaches MANHUNT. The capped 25% penalty slows
cash but cannot lock jobs, XP, businesses or Rebirth. Full recovery without new Heat
is 100 minutes normally, 75 with Mara. Mara has little value during nonstop clicking
or an eight-hour absence that already fully cools; its niche is shorter breaks and
threshold management. This is a real limitation, retained rather than pretending
a small price change would solve the future Heat design. Lay Low's $500 per ten
Heat is poor spam during sustained clicking; no model treats it as compulsory.
Batch-size Heat differences are authoritative and not a Phase 9C bug fix.

**Neon / automation timing.** Baseline Neon plus Auto-Upgrader required $350,000
beyond Dockside and other gates, and Auto-Upgrader could never precede Rebirth
eligibility. The active route bought Neon only at Dockside 25. Its +10% cash alone
repays $100,000 in about 25.72h COLD / 34.29h MANHUNT at the reference .3 jobs/sec
with both normal job upgrades (no Rico). Halving the cost does not make it a required
ROI purchase, but lowers the access toll to Mara and spending automation. Current
Neon + Auto-Upgrader is $100,000 total at 12/15, creating a real pre-Rebirth choice.

**First Rebirth / high levels.** The $735,150 business bill is substantial and later
marginal ROI is steep. However, no player must sustain the modeled 4,800+ clicks:
the tested forty-job route reaches Rebirth over four eight-hour returns. The cash
curve supplies a capital milestone while Dispatcher supplies idle XP. Halving all
level prices would also broadly accelerate automated reinvestment and high-level EP;
that systemic retuning is not justified by the local acquisition failures. Preserve
the curve, and report the remaining long-run wait honestly. Do not market 6–8 modeled
active hours as a short session. Manual-heavy first Rebirth still has fatigue risk;
idle/automation relief, not compulsory clicking, is the intended alternative.

**EP / skill alternatives.** Four EP buys Streetwise 1 + Fast Talker 1 + Learn 1;
or Streetwise 2 + Never Sleeps 1; or Streetwise 2 + Fast Talker 2. Silent Partner's
first rank requires 6 EP total including its root ranks, reachable over two minimum
Rebirths; a max production path (Streetwise 3 + Silent 2) costs 9, three such Rebirths.
Full tree 19 EP fits five minimum 4-EP Rebirths. Learn 1 improves manual/upgrade XP
but not a single-cycle Dispatcher award (5.5 floors to 5); larger offline batches
benefit. Rank 2 raises each cycle to 6. This rounding caveat is not a hidden new rule.
Delaying from Dockside 25 to 30 alone costs $548,250 for +1 EP; player 20→30 needs
another 48,000 XP for +1 EP. Earlier resets remain a meaningful alternative.

**Events / offline.** Fixed +$1,500 is 40% of the Level-5 next cost, 10% of the
Level-10 next cost, only 1.6% at 25: welcome early, modest late. At most eligible
opportunities are not guaranteed rewards. With all three eligible and immediately
choosing TAKE/INVEST/REFUSE, long-run expected net cash is about $2,100/hour,
ignoring Heat's later cost; models credit none of it. Safe/reduction choices remain
useful after cash becomes small. PAY buys a clear resolution; REFUSE remains free.
No scaling, extra reward or event change is needed.
Eight-hour COLD Dispatcher-only credit is $103,680 with both upgrades and 14,400 XP;
equipped Dockside 10 adds $445,500. The 8h base supports returns without clicking;
Never Sleeps adds 25%/50% credited duration for long absences. Keep all caps and
one-time durable catch-up. Returned players still must choose where to reinvest.

## Changes

Complete authoritative change inventory: **three acquisition groups, five scalar
changes**. No other gameplay value changes.

| Group | Old → new | Reason / expected effect | Verification and UI |
| --- | --- | --- | --- |
| Dispatcher price | $7,500 → **$5,000** | Shorten early cash wait before automatic jobs; retain Level 3/Dockside gate and 10s output | Exact-price/below-price domain tests and rendered Dispatcher card; batch/reward tests unchanged |
| Neon price | $100,000 → **$50,000** | Reduce weak immediate-return access toll to city utility and automation | Atomic spend, one-cent-short, large-Money, Heat and rendered takeover/feedback tests |
| Auto-Upgrader acquisition | $250,000 → **$50,000**; Player 20 → **12**; Dockside 25 → **15** | Spending relief can precede first Rebirth, while Neon and explicit enable remain necessary | Exact new gate/affordability tests, native locked/ready card tests and pre-Rebirth enabled offline use |

Both relevant config files own these values; UI already derives them, so no UI
formula or runtime changes are necessary. BALANCING.md and README show current
prices/gates. Historical phase records elsewhere are not current tuning authority.
Already-owned players keep their content without refund/charge; every v15 field,
including savedAt, survives validation/export exactly. No migration is added.

Same MODELED purchase policies after changes (Auto-Upgrader deliberately disabled):

| Model / checkpoint | Baseline time | Post-9C time | Manual jobs before → after | Dockside before → after |
| --- | --- | --- | --- | --- |
| active / Delivery Dispatcher | 0:51:00 | 0:30:30 | 612 → 366 | 8 → 6 |
| active / Neon Mile | 7:23:25 | 4:56:20 | 5321 → 3556 | 25 → 19 |
| active / Business Auto-Upgrader | 8:40:00 | 5:23:45 | 6240 → 3885 | 25 → 19 |
| active / Rebirth eligible | 6:55:40 | 7:32:40 | 4988 → 5432 | 25 → 25 |
| idle-leaning / Delivery Dispatcher | 8:00:40 | 8:00:40 | 40 → 40 | 2 → 2 |
| idle-leaning / Neon Mile | 16:00:40 | 16:00:40 | 40 → 40 | 15 → 15 |
| idle-leaning / Business Auto-Upgrader | 32:00:40 | 16:00:40 | 40 → 40 | 25 → 15 |
| idle-leaning / Rebirth eligible | 32:00:40 | 32:00:40 | 40 → 40 | 25 → 25 |
| optimized / Delivery Dispatcher | 0:22:15 | 0:17:20 | 267 → 208 | 4 → 4 |
| optimized / Neon Mile | 7:12:15 | 6:53:25 | 5187 → 4961 | 25 → 25 |
| optimized / Business Auto-Upgrader | 8:28:50 | 7:15:15 | 6106 → 5223 | 25 → 25 |
| optimized / Rebirth eligible | 6:44:30 | 6:39:30 | 4854 → 4794 | 25 → 25 |

The active completion route buys optional city/automation content earlier and
therefore reaches Rebirth **later**, not earlier. A player pursuing the earliest
reset may skip that spending; the optimized policy does. This is an access/convenience
change, not a claim of universally faster Rebirth. Idle observation remains at the
32-hour return because the policy checks every eight hours and XP remains limiting.

An additional AUTHORITATIVE scenario acquires Neon and Auto-Upgrader at Player 12 /
Dockside 15 with exactly $100,000, then explicitly enables with zero cash left.
Eight hours of otherwise unmodified Dockside production funds **seven levels**,
reaching **22**, spending **$344,400**, awarding **175 XP / seven paid-level counts**.
The disabled counterpart buys zero. It needs neither Rebirth eligibility nor gifted
automation ownership; production finances later attempt boundaries. This is the
convenience window the baseline acquisition gate prevented.

## Intentionally Unchanged

XP curve/rewards and level caps; $25 job; $150 initial Dockside; $150 × Level²;
$0.75/sec × Level; all five normal upgrade costs/effects/gates; ten-second Dispatcher
cadence/rewards/Heat; Vortex price/gates/permanence; Neon bonus/gates/+10 Heat;
all Crew prices/requirements/effects and slots; all Heat thresholds/penalties,
60s/45s decay, Lay Low; three fixed Events, 10-minute/35% opportunity and uniform
RNG; Rebirth 20/25 and reward formula; all five skill costs/effects/prerequisites;
8/10/12h offline caps; Auto-Upgrader 30s/opt-in/pause/reset and exact per-level costs.
Six achievement conditions and eight statistical meanings are unchanged.

## Limitations

No telemetry, player testing, global optimal-strategy solver or universal session
length claim. Reconciliation/return policy, click frequency, purchase priorities,
manual use after Dispatcher, event choices, skill spending and first-reset timing
change results. ROI ignores convenience and future rate growth except where stated.
Mara and high-level marginal business ROI remain weak in some playstyles; this
foundation audit does not claim every optional purchase is equally valuable.

Models cap manual business investment at 25 to measure the first-Rebirth route;
50/100 are evaluated by authoritative capital/rate calculations, not fake simulated
human playthroughs. Second-run comparison retains actual permanent state; the
19-EP multi-run budget is arithmetic, not a guaranteed number of hours per tree.

Rendered component tests verify prospective prices/gates/feedback, including locked,
unaffordable and owned states. No new live GitHub Pages verification is claimed;
real-browser visual review was unavailable in this environment. Existing navigation,
keyboard/focus/live-region and gameplay regression suites remain the verification
for untouched surfaces. No content, save field, runtime architecture, rebrand,
Heat/Police expansion or Phase 9D work belongs to this patch.

Phase 9D must preserve this balance, v15/CE1, Dispatcher batch floors and starting
Heat, Mara remainder, outer Event RNG and online-only cadence, Auto-Upgrader
chronology, offline durability/import timing, achievement/statistics final-state
semantics, and Phase 9A/9B navigation/accessibility/focus/live regions.
