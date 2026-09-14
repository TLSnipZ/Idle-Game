# Operations Balance I — reward and pacing decision

## Status and authority

This is the bounded **analysis and decision phase** authorized after the published
Garage IV-D / Workshop purchase-insight releases. Baseline:
`ca49bcb25156facd127ef9d7f1036e877e312432` (Save v26 / CE1).
Implementation/review: [PR #51](https://github.com/TLSnipZ/Idle-Game/pull/51).

Only an isolated analysis test, its CI reporting step and documentation change.
**No proposed reward, cooldown, price, vehicle, artwork or save field is enabled
in the game.** The current imbalance remains in the published build. The player's
personal acceptance of PR #49/#50 remains separate from their automated release
verification. Do not infer approval for a new gameplay phase, merge or deployment.

## Decision

**Recommend candidate B, `portfolio-paced`, as one indivisible reward-and-cadence
proposal. Reject candidate A, `flat-x4`.** Do not release the larger manual rewards
without the shared pacing/safety contract below. This recommendation is ready for
user review; it is not a claim of player-tested fun or a production authorization.

Let `P` be the sum of the **unmodified production rates of currently owned
Businesses at their current levels**, in Cash/second. Use the existing Business
production inputs, not displayed or effective income.

| Rule | Recommended candidate B |
| --- | --- |
| Standard manual base Cash per successful job | `max($25, P × 8 seconds)` |
| Dispatcher base Cash per completed job | `max($25, P × 1 second)` |
| Manual cadence | One shared 10-second readiness interval across normal, risky and discreet deliveries; consumed only by a successful action |
| Dispatcher cadence and ownership | Existing 10-second interval and purchase requirements; no free Dispatcher |
| Existing modifiers | Apply real scoped flat/percentage modifiers and action-local risk/discreet factors after selecting the base; floor the final discrete payout once |
| Business income | No changes to production constants, effective modifiers, prices or levels |
| XP | Existing XP per accepted action; no XP from rejected cooldown attempts; discreet jobs remain zero XP |
| Offline manual work | None; elapsed time may restore one ready action, never accumulate a backlog of manual payments |

The factors are durations multiplying a rate, not percentages of the Cash balance.
All monetary arithmetic remains integer/rational and uses the existing evaluator.
Production equipment, skills, Crew, territory effects and active-car production
bonuses must **not** increase `P`. Their own legitimate reward modifiers still apply
normally. This avoids double-counting production specialization as delivery pay.

### Why not candidate A?

A changes both base payouts from $25 to $100, leaving manual frequency unlimited.
It funds the $150 first Business in two normal jobs instead of six, yet still loses
relative relevance as Businesses grow. In the established-workshop fixture, an
occasional-click profile improves from about $139.58/s to only $149.58/s; at the
nightclub it improves from about $257.42/s to $268.42/s. Meanwhile, a high-input
player can multiply manual income almost linearly by clicking faster. A is a
front-loaded increase, not a durable progression/pacing solution.

B retains the $25 floor, scales with run development and bounds accepted manual
actions. Above the floor, before other bonuses/Heat, the Dispatcher adds about 10%
of `P`; a standard manual job every 30 seconds adds about 26.7% of `P`, with a
normal-job ceiling of 80% of `P` at the proposed 10-second cadence. These are
reference design ratios, not guarantees relative to fully modified Business income.

## Reproducible method

Run with the repository's Node/npm versions:

```sh
npm ci
npx vitest run src/game/operations-balance-analysis.test.ts --reporter=verbose
npm run test
npm run build
```

[The experiment](../src/game/operations-balance-analysis.test.ts) contains 34 cases.
It imports the real Business/vehicle/tuning catalogs, source-modifier collector,
reward evaluator, requirements, `simulateGameElapsed`, manual commands and Rebirth.
No copied car bonuses or alternative runtime catalog are introduced.

Current-rule adapter payouts are checked against the actual command/evaluator
results. Candidate bases and cadence exist only in the test. Candidate Cash is
kept in a separate ledger while real game commands govern production, Heat, XP,
automation progress and other existing transitions. No candidate Cash or timer is
published to GameState, storage, UI or a save migration.

The main fixtures run **30 minutes at 250ms reconciliation** with fixed ownership,
starting Heat zero and either Businesses alone, an already-purchased eligible
Dispatcher, or that idle profile plus one normal manual attempt every 30 seconds.
The Dispatcher stays absent when its actual ownership/level requirements are not
met. No automatic purchase happens when the player gains a level mid-window.

One-hour stress windows test starting Heat 80 and attempts every 1s/250ms. Separate
8-hour batches exercise actual offline semantics. Garage comparisons cover six
stock cars and twelve fitted setups. Other cases cover stacked equipment/Crew/skills,
scoped district Heat, risk/discreet rewards and availability, real Rebirth and the
current Level-100 maximum portfolio.

These are already-funded ownership snapshots, **not routes to acquire the assets**.
No reinvestment, auto-upgrade spending, Events, travel, decoy spending, purchase
refunds or changing ownership occurs during a comparison window. No player save is
read. A larger income result is not proof of a proportionally earlier XP gate,
faster complete run, optimal purchase or guaranteed payback.

## Progression fixtures and proposed payouts

The four levels below are Dockside / Laundry / Afterdark / Nights; zero means
unowned. Fixtures have the actual necessary player levels. The nightclub owns
Neon Mile, so its displayed delivery Cash includes the existing +10% reward effect.
Other rows have no Crew, equipment, skills, car or territory bonuses.

| Fixture | Business levels | Player level | `P` / second | B normal job, cold | B Dispatcher job, cold |
| --- | --- | ---: | ---: | ---: | ---: |
| Fresh | 0 / 0 / 0 / 0 | 1 | $0.00 | $25.00 | Unowned / ineligible |
| First Business | 1 / 0 / 0 / 0 | 1 | $0.75 | $25.00 | Unowned / ineligible |
| Laundry entry | 7 / 1 / 0 / 0 | 5 | $10.25 | $82.00 | $25.00 |
| Workshop entry | 7 / 10 / 1 / 0 | 10 | $70.25 | $562.00 | $70.25 |
| Established workshop | 15 / 10 / 5 / 0 | 14 | $136.25 | $1,090.00 | $136.25 |
| Nightclub | 25 / 15 / 8 / 1 | 16 | $253.75 | $2,233.00 | $279.12 |

The nightclub's **bases** are $2,030.00 manual / $253.75 Dispatcher; $2,233.00 and
$279.12 are the actual hypothetical payouts after Neon's multiplier and cent
flooring. Do not present the two different concepts as interchangeable.

### Observed 30-minute Cash, one normal manual attempt every 30 seconds

Eligible rows include an already-purchased Dispatcher. Business levels and all
other assumptions stay fixed. All 60 manual attempts are accepted by both current
rules and B. Heat finishes below the payout-penalty threshold in these windows;
that does not mean the same income can be sustained indefinitely.

| Fixture | Current total Cash earned | B total Cash earned |
| --- | ---: | ---: |
| Fresh | $1,500.00 | $1,500.00 |
| First Business | $2,850.00 | $2,850.00 |
| Laundry entry | $24,450.00 | $27,870.00 |
| Workshop entry | $132,450.00 | $172,815.00 |
| Established workshop | $251,250.00 | $335,175.00 |
| Nightclub | $463,350.00 | $640,971.60 |

At the established workshop, B's idle income is $149.875/s and its occasional
normal-job profile averages about $186.21/s in this window: approximately **24.2%
more than B's own idle profile**. Idle-only still progresses. That is a calibration
point, not a universal active/idle ratio after every possible bonus combination.

## Pacing and Heat are material, not footnotes

### Startup tradeoff

The $150 first Business still costs six normal $25 jobs in B. With the first action
ready immediately and later actions spaced 10 seconds apart, that normal route
needs **50 seconds**, not six instant clicks. Existing risky deliveries offer a
different route: four cold $37.50 jobs can fund it in **30 seconds**, generating
20 Heat before any cooling step. Thus 50 seconds is the normal-route minimum,
**not the earliest possible acquisition**. Starting pace must be personally tested
before accepting an implementation; no user approval of this delay is assumed.

For users who already play at intervals of at least 10 seconds, normal-job counts
and per-action XP are unchanged. Rapid manual grinding would award fewer completed
jobs and therefore less XP per hour. The analysis does not disguise this as an
income-only change or silently increase XP rewards to compensate.

### High-input experiment

At the established workshop, attempts every 1s and 250ms over a one-hour window
produce 3,600 and 14,400 successful manual jobs under the current rules and A.
B accepts **360 jobs in each tested window**. The equal accepted count, rather than
a larger Heat penalty, is what prevents a faster input rate from multiplying B's
manual income. The first attempt is at its stated interval, not at t=0.

Heat still matters. A one-hour B window starting at Heat 80 with one normal job
every 30 seconds remains in MANHUNT reward conditions and ends at Heat 100.
Consequently, cold reward/rate tables must not be advertised as sustained earnings.
Existing discreet/risky choices and support retain their real costs and effects.
The experiment checks their reward calculations and availability, but does not
claim an exhaustive optimized rotation across every Crew/car/Heat state.

A manual cooldown is pacing, **not tamper-proof anti-cheat** in a client-only game.
It must cover all paid manual variants together; three independent timers would
allow the very multi-action bypass this recommendation is intended to avoid.

### Preserve the actual batch boundary

Current Dispatcher rewards are evaluated using the starting reward/Heat of the
outer elapsed-time batch. Dispatcher Heat is `floor(completedJobs / 5)` **per
batch**, with no cross-batch carry. Ordinary 250ms online ticks usually finish
one Dispatcher job at a time and therefore add zero Dispatcher Heat. One 50-second
batch instead finishes five jobs and adds one Heat before cooling. Both behaviors
are explicitly covered; this phase does not silently change them.

An 8-hour offline comparison therefore uses one real existing batch, not a made-up
per-job Heat trajectory. Its starting Heat may affect every dispatch even though
cooling leaves the final state cold. Manual work contributes nothing offline.

The Auto-Upgrader currently preserves one outer Dispatcher reward/XP plan while
Business purchases are chronological. Any later implementation of B must retain
that policy: derive the Dispatcher base from the outer batch's starting owned
portfolio, not future purchases or separately re-priced prefixes. The new analysis
intentionally excludes reinvestment; it is not evidence for a changed purchase route
or Auto-Upgrader profitability. Chronological cash/affordability integration needs
its own implementation regression coverage.

## Garage usefulness, not an optimal-buy claim

All existing vehicle/setup effects are read from the real catalog. No prices or
bonuses change. The following B comparisons use the nightclub portfolio, owned
Neon, starting Heat zero and no other bonuses. Rates are fixed-state comparisons,
not sustained Heat simulations. Assets are already owned; acquisition cost and
foregone Business upgrades are not subtracted.

| Active build | Idle Cash/s | Plus normal job every 30s | Plus normal job every 10s |
| --- | ---: | ---: | ---: |
| KX-R / Fleet gearing | $320.99 | $395.43 | $544.29 |
| Serein / Nightshift ECU | $281.66 | $382.95 | $585.53 |
| Rendan / Dispatch gearing | $290.64 | $378.47 | $554.13 |
| Canto Club / Boardroom gearing | $345.66 | $420.09 | $568.96 |

Production builds still suit idle/occasional play. Serein can lead these cold
high-activity comparisons, but Heat can change that ordering. Rendan still has a
Dispatcher-payout niche; it is **not** automatically the best aggregate idle income.
Lilt's cooling/decoy utility is not assigned invented Cash value. A delivery-focused
setup can still lose more Business income than it adds to deliveries when replacing
a production setup. The Workshop's replacement comparison remains important.

The absolute marginal return on existing delivery bonuses becomes larger, but no
universal payback or “best buy” badge follows. Later vehicle tiers still require
fresh cost/role analysis. The seventeen-identity wishlist remains untouched.

## Rebirth and upper bounds

The experiment executes the actual Rebirth command on an eligible state with a
retained Serein/Nightshift build. Businesses, Dispatcher and run progression reset
as in production; the Garage remains. `P` returns to zero, the manual base returns
to $25, and the retained car/setup still produces its existing **$34.02** cold
normal payout. No late-run wage, free Business or free automation leaks into the
new run. With Dockside Level 1 and a 30-second manual cadence, current rules and B
both earn $1,130.40 in the tested ten-minute early-Rebirth window.

With all four current Businesses at Level 100, unmodified `P` is $6,075/s. B's bases
would be $48,600 manual / $6,075 Dispatcher before modifiers. Those large values
are deliberately recorded: this is proportional late-run scaling, not an unnoticed
constant-size buff. New Businesses or changed base rates must trigger a new balance
review rather than silently inheriting an assumed acceptable scale.

## Required boundaries for a separately authorized implementation

The proposed follow-on is **Operations Balance II — implement the approved reward
and shared-cadence contract**, not another vehicle or content phase. It must:

1. Put the chosen typed constants and pure reward-base selector behind the existing
   game boundaries. Keep the shared source collector, modifier scopes and final
   cent flooring. No economy formulas in React and no effective-production feedback.
2. Enforce one successful-action cadence across normal/risky/discreet commands,
   including queued same-frame inputs and failed-action nonconsumption. It must
   not be bypassed by changing language, tabs, district, vehicle or setup.
3. Introduce validated timer state only when that implementation starts. Select the
   next schema version against the then-current main, migrate supported saves
   without grants/resets and retain CE1. A migrated player may start ready; this
   must not award Cash or invent prior completed jobs.
4. Reconcile elapsed time exactly once. Reload and offline catch-up may complete
   the remaining delay but never bank multiple manual actions. Import retains its
   validated remaining delay and starts new local timing; no historic manual pay.
   Rebirth must retain a pending delay rather than manufacture an extra ready action.
   New Game may initialize ready. Durable failures retain the previous coherent
   Cash/Heat/XP/readiness state; do not publish paid progress before a required save.
5. Keep Dispatcher timing, outer-batch Heat/XP policy, purchase requirements and
   existing Auto-Upgrader chronology. Test that a changed Business level cannot
   retrospectively re-price earlier jobs or spend future money. Verify overflow,
   retained fractions, old saves, quota/conflict failures, offline, imports and
   Rebirth with the existing regression suite.
6. Explain base versus modified payout and the shared readiness in compact
   EN/DE/Villager UI. Preserve current layouts and artwork; do not redesign the
   whole game or imply a guaranteed income forecast. Include mobile/keyboard checks
   and a playtest of the 30s/50s startup routes, XP gates and active/idle feel.

These are requirements for a possible next phase, **not implemented features or
claims that timer persistence has already been tested**. The current analysis
contains no timer in saved state, no UI cooldown and no new schema version.

## Verification and handoff

Analysis/CI source commit: `f341bde73018f825c25ca01b06a6110d911edf28`.
[Run 34903211540](https://github.com/TLSnipZ/Idle-Game/actions/runs/34903211540)
is the exact verification record. Its dedicated report step prints the scenario
records; the full suite and every existing browser matrix remain enabled.
The final PR description records the observed test totals, full-run conclusion,
review status and any later documentation-only commit separately.

Local GitHub cloning was unavailable in this execution environment; no local full
suite or browser run is claimed. Executable verification is performed by the
existing GitHub-hosted workflow, including dependency installation and strict build.
No live-site test or new personal acceptance is claimed: no deployment is requested.

README and the current roadmap indexes distinguish this analysis from the last
published gameplay. The old ROADMAP and POST_ROADMAP files are preserved unchanged
as same-directory history documents; their old “next phase” labels are not resumed.
Production source/configuration, artwork and Save v26 / CE1 are unchanged.

**Stop after the reviewable PR. Do not merge, deploy, change rewards or start
another phase without the user's instruction.**
