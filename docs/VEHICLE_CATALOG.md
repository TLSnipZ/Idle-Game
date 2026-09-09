# Solara City Vehicle Catalog

## Status & scope

**POST 2A design complete; POST 2B Model Reference approved; POST 2C integration
implemented, live verification pending.** POST 2C descends from
`10f170447d09e12f7ef1293539ef979c506fa563`.

This catalog contains fourteen identities: **Kairo KX-R implemented, thirteen
remaining vehicles planned**. Proposed names/values for rows 2–14 are not live.
Active Vehicle and Tuning remain future systems. BALANCING.md is live balance authority.

### Current production behavior

| Current property | Implementation |
| --- | --- |
| Name / stable ID | Kairo KX-R / `vehicle:kairo-kx-r` |
| Manufacturer / role | Kairo Motors / Business starter |
| Price | $25,000 (`2500000` integer cents) |
| Acquisition | Player Level 5, Dockside owned at Level 5; no additional gate |
| Effect | +10% global Business Production (1,000 basis points) while owned |
| Modifier ID | `modifier:kairo-kx-r-production` |
| Permanence | Ownership survives Rebirth; bonus applies to rebuilt businesses |
| State | `garage: { ownedVehicleIds: [...] }`; one current vehicle, no active/build/manufacturer fields |
| Save / transfer | Save v16 / unchanged `CE1-` container |
| Model Reference | User-approved Final Refinement, first canonical Vehicle Model Reference |

An owner stores `garage: { ownedVehicleIds: ['vehicle:kairo-kx-r'] }`; fresh players
have an empty array. Images, price, bonuses and manufacturer are not saved.
The former Vortex S9 was `$50,000 / P7 / D10 / +15%`, stored as
`vehicle:starter-sport-sedan`. Historical ownership migrates, without compensation,
to KX-R. No hidden Vortex catalog entry remains. Six Achievements and eight
Statistics are unchanged. See the migration record below.

## Vehicle design philosophy

Recognizable automotive archetypes, original fictional manufacturers/models and
altered identifying details create a coherent coastal enthusiast world. Vehicles
are permanent collection investments and future build platforms. KX-R introduces
the Garage; iconic tuner cars are later milestones, not the opening purchase.
Prices represent gameplay timing, utility and permanence, never real-world MSRP.
The most expensive car must not become the automatic best economy choice.

Kairo Motors has Japanese-inspired mass-market roots, accessible enthusiast
platforms and a serious performance culture. It is not a direct Honda parody.
**Kairo KX-R** is a lightweight, rev-happy 1990s performance hatch: attainable,
purposeful, youthful and tuner-friendly. Its developer archetype is the Honda Civic
EK9-era category; that reference is not player-facing copy. Role: **BUSINESS STARTER /
TUNER FOUNDATION**, first purchasable vehicle. No free car is added before it.

## Vehicle Art Style vs Model References

Candidate A from the earlier external review is **APPROVED VEHICLE ART-STYLE
DIRECTION ONLY**. Its depicted sedan is **not a canonical vehicle** and must not
be integrated as Vortex or KX-R. B/C have no reference authority. **Kairo KX-R Final Refinement is user-approved
as the first canonical Vehicle Model Reference**, integrated in POST 2C.

- **Art-Style Reference:** shared front 3/4 composition, low believable camera,
  natural automotive focal-length feel, vehicle-dominant framing with crop room,
  premium realistic game rendering, Solara nighttime open-air/semi-covered showroom,
  coastal skyline, wet/polished floor, believable contact shadows and controlled
  reflections. Deep navy, turquoise environment light, restrained magenta and small
  warm accents remain the approved family. No baked UI or essential gameplay text.
- **Model Reference:** the explicitly approved fictional body's proportions,
  lighting signatures, grille, surfacing, aero, badges and wheels. It identifies
  one model independently from the shared lighting/environment treatment.

The KX-R Model Reference preserves the separately approved shared Art Style. Do not treat any ordinary image, rejected candidate or renamed file as
an approved reference. POST 2A itself added no assets; POST 2C retains only the approved reference and WebP derivative.
Paths: `src/assets/reference/vehicles/kairo-kx-r-reference.png` and
`src/assets/vehicles/kairo-kx-r.webp`.

## Fictionalization rules

Developer archetypes below are internal design references only. Proposed player
names/copy use fictional branding. Never brief an exact real car with its logo
removed. Preserve broad era/body/drivetrain character while changing identifiable
lights, grille, bumper openings, taillight graphics, body surfaces, wheels, aero and
badges. Use original/licensed/generated work, not copied game artwork or unchanged
third-party logos. Name review here is a project/confusion check, not trademark clearance.

KX-R retains compact hatch proportions, a clean greenhouse, functional stance,
restrained factory aero and subtle rear spoiler. Its front/rear lamps, openings,
bumpers, wheel/spoiler details and badges must form a distinct canonical identity.
Tuning later preserves that identity. No real brand/model names are needed in UI.

## Manufacturer identities

Seven proposed manufacturers cover fourteen models. Only Kairo's name is already
user-approved; the other six are recommendations. Naming was checked against current
Crew, territory, event, skill, automation and Solara identifiers; no exact conflicts
were found. Names avoid obvious manufacturer spelling parodies and famous model codes.

| Manufacturer / short form | Culture inspiration | Identity and plausible range | Planned models |
| --- | --- | --- | --- |
| **Kairo Motors / Kairo** | Japanese | Mass-market engineering, accessible performance division; hatchbacks and light coupes | KX-R, Senda |
| **Namera** | Japanese | Small sports-car specialist; roadsters and FR coupes, responsive chassis and tuner support | Lilt, Serein, Luma |
| **Toseki** | Japanese | Broad performance engineering: rally AWD, high-output GTs, technical flagship coupes | Rendan, Raizan, Tenrai, Arashi |
| **Sevrin** | Central European | Executive-performance engineering; compact coupes through modern sport fastbacks | Canto Club, Caron |
| **Avelin** | European | Low-volume precision sports cars; focused chassis and road/track heritage | Strada; future sports derivatives |
| **Calder** | American | V8 street-performance brand, muscle coupes and aggressive grand touring | Furnace; future accessible muscle models |
| **Orsella** | Southern European | Small coastal luxury/exotic marque; expressive performance flagships | Serata; future exotic derivatives |

Avelin, Calder and Orsella each occupy one deliberate specialist slot in this initial
JDM-weighted selection; they are not arbitrary new brands for ordinary cars. Toseki's
rally sedans and GT division remain recognizably related, not Italian or American
cars under a Japanese badge. Do not preserve **Vortex** as a manufacturer: it adds
no needed niche here. Vortex S9 is historical placeholder terminology, retired by the v16 migration.

## Initial vehicle catalog

Two tables share row numbers: this identity table and the pricing/effect table below
together define every vehicle. Distribution is **3 / 3 / 4 / 2 / 2** across five tiers.
Row 1 is implemented in POST 2C; rows 2–14 remain proposed concepts.
Real-world names in this table describe developer archetypes, never player-facing names.

| # / Tier | Fictional manufacturer / model | Developer archetype | Body / era | Identity and future tuning personality |
| --- | --- | --- | --- | --- |
| 1 / T1 Street Entry | Kairo **KX-R** | Civic EK9-era performance hatch | 3-door hatch / 1990s | Lightweight, rev-happy first serious purchase; approachable all-round street/track builds |
| 2 / T1 | Kairo **Senda** | GT86/BRZ-era lightweight FR culture | 2-door coupe / 2010s | Playful affordable driving focus; handling, tires and balanced street setup |
| 3 / T1 | Namera **Lilt** | Small Japanese roadster culture, MX-5-era | 2-seat roadster / 1990s | Low-key coastal runabout, distinct open body; light OEM+ and discreet utility |
| 4 / T2 Street Performance | Namera **Serein** | Silvia S15-era FR tuner | 2-door coupe / turn of millennium | Clean street/drift favorite; handling/boost specialization |
| 5 / T2 | Toseki **Rendan** | Impreza WRX STI-era rally street sedan | 4-door AWD sedan / late 1990s | Attainable all-weather operator; grip/launch and practical street build |
| 6 / T2 | Sevrin **Canto Club** | Older M3-era compact European performance | 2-door coupe / 1990s–2000s | Restrained executive coupe; precise chassis and efficient daily-duty build |
| 7 / T3 Performance Icon | Toseki **Raizan** | Lancer Evolution IX-era AWD icon | 4-door AWD sedan / mid-2000s | Purposeful city operator and tuner milestone; grip, launch and Heat utility |
| 8 / T3 | Namera **Luma** | RX-7 FD-era lightweight sports coupe | Low 2-door coupe / 1990s | Flowing, high-character active specialist; lightweight performance, future racing depth |
| 9 / T3 | Toseki **Tenrai** | Supra Mk4-era powerful tuner GT | Muscular 2-door GT / 1990s | High-output long-session machine; power/induction and automated earning build |
| 10 / T3 | Sevrin **Caron** | Modern German executive sport-fastback culture | 5-door fastback / 2020s | Modern passive-business anchor; quieter long-session alternative to active JDM icons |
| 11 / T4 Elite Performance | Toseki **Arashi** | Skyline GT-R R34-era technical flagship | Squared AWD coupe / late 1990s–2000s | Elite technical tuner goal; balanced grip/power, city work and permanent-progression identity |
| 12 / T4 | Avelin **Strada** | 911-era European sports-car culture | Compact sports coupe / modern | Precision and prestige; future technical racing/activity specialist |
| 13 / T5 Prestige / Exotic | Calder **Furnace** | Modern American supercharged V8 flagship | Broad performance coupe / modern | Loud high-output active specialist; future high-risk operations/getaway builds |
| 14 / T5 | Orsella **Serata** | Broad Italian exotic/supercar culture | Mid-engine exotic / modern | Coastal collection centerpiece; modest economy/learning hybrid, future elite activities |

Caron is the modern wildcard because a contemporary executive fastback adds both
body/era contrast and a patient passive role between highly active tuner icons.
The fourteenth archetype beyond the required set is the early roadster (row 3).
No invented horsepower, torque, weight, acceleration or handling scores are assigned.

### Canonical design distinctions for future model review

| Model | Keep broad DNA | Deliberately change identifying details |
| --- | --- | --- |
| Raizan | Compact squared early-2000s four-door AWD stance, purposeful vents, functional pronounced wing | Independent paired light shapes, split intake proportions, hood channels, rear graphics, wing supports, bumper surfacing and badges; no logo-less Evo replica |
| Luma | Low hood, flowing compact sports body and rounded cabin | Own lamp/lid geometry, rear graphic, front apertures, spoiler arc and fender seams; do not trace the RX-style body |
| Tenrai | Heavier muscular 1990s GT silhouette and power-oriented proportions | Own headlamp internals, intake layout, rear-light arrangement, greenhouse details and aero; no copied Supra face/tail |
| Arashi | Squared technical-era coupe, planted AWD posture | Distinct front signature, non-copied rear-light pattern, grille, quarter surfacing and spoiler; no copied Skyline round-light identity |
| Strada | Compact premium precision sports-car proportions and curved cabin | Distinct nose/lamp shape, rear graphics, side apertures, greenhouse and surfacing; no direct Porsche body or model naming |

Other rows follow the same fictionalization contract; Rendan must remain visibly a
different model/era from Raizan. No future image prompts or logos are produced here.

## Vehicle progression & pricing

**Row 1 is live and applies while owned. Rows 2–14 are future proposals assuming
ONE active vehicle; Active Vehicle is not implemented yet.**
P = current Player Level; D = owned Dockside Level; R = lifetime Rebirth count;
N = Neon Mile controlled. These are acquisition-only gates: resetting temporary
requirements never deactivates an owned vehicle. No previous-car ownership gates.
Tier is design metadata, not saved state.

**CURRENT-COMPATIBLE (C)** means existing progression can fund/unlock the design and
existing systems can express it after the limited integration work specified below.
It does **not** mean today's config already supports every effect/gate. **FUTURE-
DEPENDENT (F)** means a meaningful release depends on a named future system/economy
pass; do not ship a guessed gate. Exactly **11 C / 3 F** unlock proposals.

| # / Vehicle | Tier | Price proposal | Unlock proposal (AND) | Role | Base effect while active | Compatibility / expected window | Status |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| 1 Kairo KX-R | T1 | $25,000 | P5, D5 | BUSINESS STARTER | +10% Business Production | C / early first-run investment | Implemented — POST 2C |
| 2 Kairo Senda | T1 | $40,000 | P6, D7 | STREET EARNER | +12% Manual Job Cash | C / first-run active alternative | Proposed |
| 3 Namera Lilt | T1 | $55,000 | P7, D8 | COOL RUNNER | Cooling interval −3 seconds: 60→57s; Mara 45→42s | C / first-run short-break utility choice | Proposed |
| 4 Namera Serein | T2 | $80,000 | P9, D10 | DRIFT SPECIALIST | +16% Manual Job Cash | C / later first run; drift/racing depth future | Proposed |
| 5 Toseki Rendan | T2 | $115,000 | P12, D15 | AWD OPERATOR | +10% Job + Dispatcher Cash | C / established first run or early rebuild | Proposed |
| 6 Sevrin Canto Club | T2 | $165,000 | P14, D18 | LOGISTICS COUPE | +12% Dispatcher Cash; +5% Business Production | C / long first run or early rebuild | Proposed |
| 7 Toseki Raizan | T3 | $240,000 | P16, N, R1 | CITY OPERATOR | +12% Job + Dispatcher Cash; cooling interval −6s (60→54s, Mara 45→39s) | C / first post-Rebirth icon | Proposed |
| 8 Namera Luma | T3 | $310,000 | P18, D22, R1 | ACTIVE TUNER ICON | +22% Manual Job Cash | C / active second-run target; racing/Event utility future only | Proposed |
| 9 Toseki Tenrai | T3 | $410,000 | P20, D25, R1 | BUSINESS GT | +18% Dispatcher Cash; +10% Business Production | C / extended second run; not a Rebirth prerequisite | Proposed |
| 10 Sevrin Caron | T3 | $520,000 | P20, D28, R1 | BUSINESS SPECIALIST | +16% Business Production | C / patient post-Rebirth capital goal | Proposed |
| 11 Toseki Arashi | T4 | $850,000 | P25, D30, R2 | ELITE CITY GT | +15% Job + Dispatcher Cash; cooling interval −4s (60→56s, Mara 45→41s) | C / multi-Rebirth, deliberately extended run | Proposed |
| 12 Avelin Strada | T4 | $1,250,000 | P25, R2, future Racing Reputation milestone (threshold deferred) | PRECISION SPORT | +18% Manual Job Cash; +8% Business Production | F / racing release with validated income pacing | Proposed, release blocked on dependency |
| 13 Calder Furnace | T5 | $2,000,000 | P30, R3, future high-tier Operation completion (mission deferred) | ACTIVE FLAGSHIP | +28% Manual Job Cash | F / expanded Operations/economy; high-risk depth future | Proposed, release blocked on dependency |
| 14 Orsella Serata | T5 | $3,200,000 | P30, R3, future expanded Empire milestone (definition deferred) | EMPIRE FLAGSHIP | +14% Business Production; +5% XP from existing sources | F / expanded Empire/economy, not a first-run grind target | Proposed, release blocked on dependency |

The $520k T3 ceiling slightly exceeds the initial $500k guidance to separate Caron
from Tenrai without inventing a sixth tier. A 27% price gap buys a distinct passive
specialist, not a hybrid that wins everything. Arashi sacrifices some Raizan cooling
for higher delivery cash; Serata does not beat Caron's business specialization.
Serein/Luma improve one active niche vertically; KX-R still offers a cheaper passive
choice and retained build platform. Not every old stock car stays best forever.

### Short price/role rationale

1. KX-R halves the placeholder price and lowers the gate; permanent 10% warrants
   more than temporary Fleet's price, and earlier acquisition makes it relevant.
2. Senda spends more for a manual-focused alternative, not universal idle strength.
3. Lilt sells short-break/threshold convenience; not a faster universal income car.
   Its narrow Foundation Heat value is intentional and needs a player test before shipping.
4. Serein is a clear enthusiast step above entry choices; handling/drift is future
   personality, not a fabricated current stat.
5. Rendan benefits both active and unattended deliveries, but leaves businesses alone.
6. Canto Club prioritizes delegation, with small business support for long sessions.
7. Raizan is a substantial first-Rebirth milestone; Heat utility does not require Police 2.0.
8. Luma rewards sustained manual play; deeper Event/racing utility is deferred.
9. Tenrai rewards Dispatcher plus production and long sessions; unlike KX-R its
   second benefit and capital cost target automation, not the opening.
10. Caron offers a stronger pure business option, foregoing delivery/Heat specialization.
11. Arashi needs a permanent milestone and an extended run, rather than merely P15 cash.
12. Strada's hybrid remains restrained; racing must supply its distinctive high-tier purpose.
13. Furnace is an active flagship; operations, not an enormous passive multiplier, justify prestige.
14. Serata combines controlled production/XP; its exotic value requires future Empire/activity context.

### Evidence and KX-R pacing

Authority inspected: BALANCE_AUDIT.md, BALANCING.md and current economy/business,
automation, upgrade, vehicle, territory, Crew, skill, Heat, XP, Rebirth and offline
config/helpers. Current $25 jobs give 10 XP/+1 Heat; Dispatcher costs $5,000 at
P3/Dockside and performs a 5-XP delivery every 10s. Dockside costs $150, produces
$0.75 × level/sec, upgrades cost $150 × current level². Level gates derive from
100 × (P−1)² XP. Equipment costs $400/$750/$2,500/$10,000/$15,000. Neon and
Auto-Upgrader cost $50,000 each at P12/D15, with Neon also required by the latter.
Rico/Mara/Jax cost $20k/$30k/$40k. First Rebirth at P20/D25 gives exactly 4 EP;
there is no inherent income bonus from count or unspent EP. Skills cost 19 EP total.
Offline shares 8/10/12h caps. None of these live values changes.

Recommendation: **$25,000; P5 and owned D5; +10% global Business Production;
permanent ownership; no Neon, Rebirth or other requirement.** Eligibility is not
immediate affordability. Dispatcher should normally come first, though no purchase
chain enforces it. The hypothetical KX-R retains the existing production modifier
surface; it neither generates XP nor changes business cost/Heat/remainder math.

Reproduce the counterfactual with:

```sh
npm run test -- src/game/vehicle-design-analysis.test.ts --disableConsoleIntercept
```

The test reuses `test-fixtures/balance-model.ts` and real commands/evaluation/
online/offline simulation. It substitutes only a test-local vehicle definition
(price/gates/effect) or declines vehicle purchases. It deliberately uses the old ID
as an isolated test stand-in, not a migration/new production ID. Real config remains
frozen. Three scenarios × three existing policies; no gifted gameplay cash,
wall-clock sleeps, random windfalls or rewritten economy. Its bounded 60s test timeout
is execution headroom for nine routes, not a performance acceptance threshold.

MODELED time **h:mm:ss**, measured from fresh state, not guaranteed player playtime:

| Policy | Dispatcher (all three scenarios) | Historical Vortex bought | KX-R bought | First Rebirth: no car | First Rebirth: Vortex | First Rebirth: KX-R |
| --- | --- | --- | --- | --- | --- | --- |
| Active | 0:30:30 | 4:38:55 (D19) | 2:29:25 (D13) | 7:33:50 | 7:32:40 | 7:25:20 |
| Greedy payback / optimized | 0:17:20 | 2:42:15 (D14) | 2:01:20 (D12) | 6:39:40 | 6:39:30 | 6:34:00 |
| Idle-leaning | 8:00:40 | 16:00:40 (D10) | 16:00:40 (D8) | 32:00:40 | 32:00:40 | 32:00:40 |

Active/optimized use one manual job per 5s; idle uses 40 initial jobs then 8h returns.
Policies buy optional equipment/Crew/city/automation, cap manual levels at 25 and
leave Auto-Upgrader disabled; they are not fastest-Rebirth solvers. Online Event
chance deterministically fails. Single-cycle online versus batched offline Heat/XP
semantics remain authoritative. No-car and car routes may alter subsequent purchase
order, so the table is integrated policy impact, not an isolated causal multiplier.
Active KX-R eligibility occurs at 0:12:30, optimized at 0:20:55; buying later reflects
capital priorities. Dispatcher timing is unchanged in all three policies. Relative
to no-car, KX-R gains 8m30s / 5m40s before Rebirth; idle observation remains coarse.
Each modeled first Rebirth gives four EP and retains the acquired Garage slice.

Static marginal interpretation (all three production upgrades, no Crew/skills/car):
D5/D10/D25 produce $7.734375/$15.46875/$38.671875 per second. KX-R adds exactly
10%, repaying $25k at unchanged output in **8.98h / 4.49h / 1.80h**. These are
marginal paybacks, not purchase wait times; growth and Rebirth change output. Vortex
at D10 needs 5.99h to repay $50k from its 15% increment. KX-R's lower cost improves
entry value without doubling the opening economy. Rebuilt unmodified D1 produces
$0.825/sec with KX-R versus $0.75 without; Streetwise rank 1 takes it to $0.86625.
Ownership, not temporary levels/equipment, carries across the reset.

A late purchase can still delay Rebirth: at P20/D24, zero cash, all production
upgrades, no jobs/Dispatcher/Crew/skills, the final $86,400 level takes about 38m47s.
Saving for KX-R first then the level takes about 46m29s (25k at $37.125/sec, then
86.4k at $40.8375/sec): **about 7m42s longer**, in exchange for permanent ownership.
This is a static continuous-time estimate, excluding sub-cent boundary milliseconds.
Therefore KX-R is sensible early/over repeated runs, not mandatory immediately before
reset. Do not advertise the optional-content route as proof every buyer resets faster.

### Economy scale and future dependencies

D5/D10/D15/D25 acquisition plus levels cost $4,650/$42,900/$152,400/$735,150;
D100 costs $49,252,650 before extras. Quadratic capital costs grow faster than linear
production. D25 with equipment produces $1,113,750 over eight hours before other
modifiers, illustrating that Tier 3/Arashi prices are mathematically reachable in
longer established runs. That is **gross production**, not free disposable cash;
reinvestment, reset timing and XP gates compete with saving. Rebirth count does not
itself accelerate earning; permanent skills/vehicles do. Higher caps cost EP.

Tier 1 costs $120k in total but buying all three is optional and does not stack
bonuses. Tier 2 is largely plausible before new systems, especially when delaying
reset or rebuilding. Row 11 is a long multi-Rebirth goal, not a simulated playtime
promise. Rows 12–14 are deliberately F: today cash can mathematically accumulate,
but there is no racing/operation/expanded-Empire purpose or verified satisfying
income window for these purchases. Their prices are budget anchors to re-model with
those releases, not claims that current Dockside should finance the whole Garage.

## Vehicle gameplay roles and bonus stacking rules

**OWNED does not equal ACTIVE BONUS.** Each row has one primary and at most one
small secondary effect; no primary bonuses from inactive cars. Distinct permitted
sources still multiply exactly through the central evaluator; never add rounded UI
rates or stack the full catalog. No large economic collection rewards. Future
collection recognition may be cosmetic/milestone-based or small capped prestige,
subject to its own design, not a new Prestige resource here.

Integration limits identified in current code:

- Global Business Production and combined Job/Dispatcher Cash already have modifier
  targets. Manual-only/Dispatcher-only are **not separate today**: extend shared
  reward context explicitly in the future, preserving exact flooring and outer
  Dispatcher semantics. Rows 2/4/6/8/9/12/13 depend on that limited shared extension,
  not bespoke per-car runtime branches. Row 9 also needs two declarative effects,
  whereas current VehicleDefinition holds a single modifier.
- Heat cooling already accepts a derived integer interval via `getHeatDecayIntervalMs`.
  Proposed reductions subtract 3/6/4 seconds from the Crew-derived 60s or 45s value;
  they are not vague resistance percentages. Extend that one derivation, not gain,
  penalty or Police logic. Retain numerical cooling remainder, zero-Heat no banking,
  positive-elapsed application and gain-before-decay; switch itself grants no tick.
  Minimum future interval needs a shared bound before utility tuning expands further.
- Rebirth count exists but the current Requirement union has **no count predicate**.
  Rows using R require a small shared typed predicate/evaluator extension. It is
  current-system-compatible data, not already accepted vehicle config.
- XP already evaluates the shared modifier collector, including vehicle sources.
  Serata can use that existing target once multiple declarative vehicle effects
  are supported; require exact per-award/outer-batch tests. It is the only XP
  vehicle. No extra XP sources or altered curve are proposed.
- No current Event-success, racing, upgrade-discount, property or prestige stat
  surface is invented. Those deeper hooks are F even on C base vehicles.

Rico's 10% combined delivery benefit remains stackable with the one active car;
Senda's 12% is manual-only and costs twice Rico, while occupying the vehicle choice.
Lilt changes default cooling by only 3s versus Mara's 15s; Mara remains useful and
further reduces the interval. At uninterrupted manual spam both are limited by the
current Heat model; no escape mechanic is implied. Raizan is expensive/post-Rebirth
and still benefits Mara. KX-R's 10% is below Jax's 15% and complements Logistics;
permanence is paid for with capital and the opportunity cost of another active car.

Streetwise/Silent Partner remain always-on permanent EP investments, unlike active
vehicle selection. Fast Talker remains useful across manual/Dispatcher contexts.
Serata's expensive future 5% XP is below Learn the Streets' 10% per rank and must
preserve single-cycle flooring. No vehicle extends the offline cap: Never Sleeps
alone retains 8/10/12h. Dispatcher-focused vehicles help unattended earning within
that cap; no offline Event spawning or retrospectively boosted absence is proposed.

## Ownership model — recommended future Garage model

Multiple vehicles can be permanently owned; **exactly one is active when the Garage
is populated**, zero when empty. Only its base/build effects apply. No concrete
architectural blocker was found; one active source avoids permanent catalog inflation,
supports specialized switching and gives Tuning a clear target.

Fresh state owns none, conceptually `activeVehicleId: null`. The first purchase
auto-activates; later purchases preserve current selection. Acquire each model once;
no duplicates, sales, ordinary switching fee/cooldown, fuel, maintenance, insurance,
repair or storage charges. Inactive cars remain owned, visible, built and selectable.
No car-chain prerequisite; cosmetics/collection identity need not grant idle bonuses.

Garage hero should show active model/art/role/effect/build; other cards show locked,
available, owned or active. Active implies owned. Owned inactive cards offer SET
ACTIVE; the current car shows ACTIVE without a redundant action. Explain **bonus
applies while active**. Preserve AVAILABLE versus affordability distinction from
POST 1C. Compare role/effect/price/gates/build personality, not mechanical spreadsheets.
No sixth nav section; customization belongs inside Collection/Garage.

## Rebirth / offline / switching contracts — future

Free explicit switching is prospective: reconcile old vehicle → validate requested
known owned ID → prepare switch → guarded durable write → publish new selection →
future elapsed uses new vehicle. A failed switch/write leaves the reconciled old
selection and previous durable save; it must not publish a half-switched build.
This is a recommended **durable replacement** command like import/Rebirth, stronger
than current ordinary purchase/Crew publish-then-save behavior. Do not misdescribe
all current commands as write-before-publication. Treat selecting the same car as
an idempotent no-change intent; no bonus/Heat tick, statistics or extra Event roll.

Offline catch-up is completed durably using the pre-return selected vehicle/build
before switching is available. No retrospectively changed production, Dispatcher
cash/XP/Heat, resolved Events or counters. Preserve all outer batching, sub-ms
boundary policy, 4,096-segment safeguard and both earned production fractions.
Do not split an outer interval to farm event attempts or recalculated starting Heat.

Rebirth preserves ownership, active selection and purchased/selected builds; it
resets temporary systems normally. Acquisition gates do not revoke retained effects.
Future activity-specific vehicle locks are separate decisions, not ordinary cooldowns.
Review later flat-reward/event utility against free-switch exploitation before adding
it; this catalog changes no Event outcomes and adds no historical claim bonuses.

## Future Tuning compatibility — planned, not implemented

A build belongs to one owned canonical vehicle and survives Rebirth. Inactive builds
retain purchased upgrades and selected appearance/configuration but supply no global
bonuses; reactivation restores that build's active effects. No account-wide tuning
stack and no duplicate vehicles to store alternate builds. Loadout rules are future.

- **Visual:** paint, wheel design/finish, functional ride height, aero/spoiler and
  selected bumper/lighting details. Primarily cosmetic, no forced bonuses. OEM+,
  street, track, drift/show influences use fictional parts/badges, no unlicensed logos.
- **Performance:** compact engine, induction, drivetrain, suspension, brakes and
  tires concepts. Mix vertical improvement with horizontal specialization; avoid
  hundreds of parts or identical +1% ladders. No exact prices/specs/stat fields now.
- **Utility:** limited deliberate Heat/Dispatcher/activity support. Deeper pressure,
  escape, territory, transport/getaway and heist hooks wait for their real systems;
  basic vehicle usefulness does not depend on Police 2.0.

Tuned KX-R should remain a useful lightweight, approachable platform with several
viable directions; it is the first tutorial/pipeline test. It need not outperform
all elite cars: base capabilities, ceilings and activity strengths preserve tier
value. Higher-tier identity is not just larger versions of KX-R numbers. Future
racing may need acceleration/speed/handling/grip/braking, but none is invented now.
Costs should reflect tier, depth, impact and permanence; no blanket refund/respec
assumption. Cosmetics may be purchased/earned through activities/progression without
gacha. Temporary consumable preparation would be a separate system.

Canonical model → reviewed variants → approved tuning assets. Preserve the body,
lights, proportions and distinctive details, not independent full regeneration for
each wheel/paint. Likely web approach: curated full renders or controlled edits and
limited compatible combinations. Do not promise arbitrary browser generation, a
real-time 3D configurator or 20×30×10×14 full renders. Pilot KX-R with a small set of
paints/wheels and 2–3 aero directions, compact performance paths and limited utility;
curate valid combinations rather than promising their Cartesian product. Prove file
sizes, mobile crops and model consistency before expanding. No asset work in POST 2A.

## Stable ID strategy

Current canonical ID is `vehicle:kairo-kx-r`, following the existing
`vehicle:` namespace and kebab-case conventions. Use `vehicle:<make>-<model>` for
new models at implementation, with collision review. Price, tier, real archetype,
bonus, asset path and build never belong in identity. Manufacturer definitions may
be static config; ownership does not require separately saved manufacturer state.
POST 2C introduced only KX-R; remaining model IDs are future work.

## Vortex S9 → Kairo KX-R migration — implemented in POST 2C

Strategy A (retain `vehicle:starter-sport-sedan` while relabeling) would avoid an ID
migration, but leave misleading placeholder identity in future builds/config.
Strategy B is implemented: **sequential v15 → v16**, mapping that exact legacy ID
to `vehicle:kairo-kx-r`. This changes no state shape and adds no fields.

**Owner → KX-R owner; non-owner → non-owner.** No repurchase, refund, XP/EP/Heat,
statistics, achievement, price history or historical income is added. Cash, all
unrelated slices, both production fractions and raw migration `savedAt` stay exact.
One canonical +10% effect applies to every owner; no hidden legacy +15% version.
The explicit rebalance from the foundation placeholder preserves ownership while
avoiding permanent account divergence early in catalog development. No price refund.

Historical v6–v15 validation accepts only the original ID and rejects duplicate or
unknown IDs. Sequential steps preserve it until v16 mapping; current validation
accepts only current config IDs. There is no hidden runtime Vortex or legacy
modifier branch. Migration is deterministic, with no clock/RNG/storage calls.

Historical **CE1** imports use the existing sequential pipeline, then durable
replacement rebases timing without historical earnings. Local bootstrap migrates
first, then calculates normal capped offline progress with KX-R's current +10%
modifier, and saves before publishing. There is no stored pre-update rate history
and no double bonus. Current CE1 re-exports v16/KX-R only.

Tests cover owners/non-owners, historical version chains, exact unrelated-state and
timestamp retention, strict invalid IDs, CE1 import/roundtrip/re-export, durable
failure, Rebirth retention and online/offline modifier semantics. The standalone
purchase writes the completed candidate before ownership/success publication.
A failed write retains reconciled old state and reports failure without spending.

### Future selection/build migration — not implemented

Introduce Active Vehicle before a second production vehicle. Existing sole KX-R
owners should select it; empty garages select null. Future invariants permit null
or a valid owned canonical ID; deterministic catalog order handles pre-existing
multiple ownership, preserving any valid selection. No randomness or saved asset
paths. Add build state only when Tuning ships, keyed by canonical ID. Future tests
must cover free old-effect-first switching, durable rollback, selection/build
Rebirth persistence and no retroactive offline switching.

## Golden Reference / asset production and implementation order

1. POST 2A catalog design complete; remaining values/names still need review.
2. POST 2B Final Refinement explicitly user-approved as KX-R Model Reference.
3. POST 2C integrates KX-R only, Save v16 identity migration and approved artwork;
   **live verification pending**. Active Vehicle/Tuning are not bundled into v16.
4. After live verification, separately design Active Vehicle and controlled Tier 1
   expansion (Kairo Senda / Namera Lilt), including its own save/runtime boundary.
5. Pilot Tuning on canonical KX-R, then expand gradually. No mass asset generation.
6. First Raizan/Luma/Tenrai/Arashi models need individual user approval; other asset
   categories remain separate controlled branches.

## Deferred decisions and validation limits

Names and proposed numeric values for rows 2–14 need user/design review; no legal
clearance is claimed. No simulation of all fourteen cars, optimal play solver, player
telemetry or guaranteed completion time exists. Only KX-R/Vortex/no-car policies were
modeled. Re-run later tiers with Active Vehicle integration, real unlock extensions
and any future economy. Utility tradeoffs need actual player testing.

Future-specific milestones, tuning costs/caps/refunds/loadouts, asset option budgets,
activity locks and collection recognition are deferred. Keep Reset Progress, Next
Objective, long-section navigation, Purchase Intelligence, Rebirth Guidance, Heat/
Police, city, Crew/Event and Garage/Tuning branches in POST_ROADMAP.md. This catalog
plan does not authorize those implementations.

Historical POST 2A verification covered documentation, the regression suite and
three isolated analysis tests. That design phase left save v15/CE1 and production
unchanged and added no artwork. POST 2C is the separately authorized integration
above; its deployed live verification remains pending.
