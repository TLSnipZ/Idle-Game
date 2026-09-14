# Post-roadmap priorities

## Current phase — Garage IV-A: Tier-2 catalog/progression analysis

Completed the isolated comparison of proposed Tier-2 cars against today's stock
and tuned Tier-1 choices. Serein, Rendan and Canto Club now have revised proposed
roles and Afterdark-based gates; see [Tier-2 decision](TIER_TWO_GARAGE.md) for numbers,
opportunity costs, eight executable analysis cases and implementation acceptance.
This checkpoint adds no playable cars and keeps Save v23 / CE1 unchanged.
Next bounded phase: **IV-B — Serein model reference and production pilot**;
then IV-C Rendan/Canto and IV-D model-specific customization.
The user deferred remaining paint imperfections; PR #41 is not full visual acceptance.


## Patch — KX-R paint mask

Corrected missed bodywork and rear-lamp color leakage with refined contours and
subtractive masking. The browser verifier checks 32 real rendered pixel samples
for body coverage and protected details. Save v23 / CE1 and gameplay are unchanged.
See [Vehicle finishes](VEHICLE_APPEARANCE.md); release evidence is in the patch PR.

## Current phase — Garage 2.0 III: curated vehicle finishes

Implemented: two signature finishes plus factory paint for each current car,
explicit preview/apply/discard, free owned-vehicle customization and matching
Garage presentation. Save **v23 / CE1** preserves prior tuning and progress;
applied looks survive Rebirth. See [Vehicle finishes](VEHICLE_APPEARANCE.md)
for rendering, persistence and verification boundaries. Release evidence is in the PR.
Next separate scope: later vehicle tiers, starting with catalog/progression analysis.

## Current phase — Garage 2.0 II: model-specific tuning

Implemented: two permanent setups each for Senda and Lilt, per-model workshop
selection, independent stock/fit commands, cooling and decoy integration.
Save **v22 / CE1** preserves existing KX-R builds without grants.
See [Model tuning](MODEL_TUNING.md) for prices, exact balance, save boundaries
and verification. Release evidence is tracked in the PR.
Next separate scope: curated visual customization; later car tiers remain planned.


## Current phase — Garage 2.0 I: KX-R tuning

Implemented in [PR #35](https://github.com/TLSnipZ/Idle-Game/pull/35): permanent Fleet gearing / Courier ECU, one fitted setup, free stock/owned switching and durable Garage writes. Save **v21 / CE1** migrates existing stock garages without granting parts. See [Tuning pilot](GARAGE_TUNING.md) for prices, balance, persistence and verification scope.

This completes the first tuning pilot only. Next separate scope: model-specific Senda/Lilt tuning after reviewing this slice; visual customization and later vehicle tiers remain planned. Release evidence is tracked in the PR; user live acceptance remains separate.


## Current phase — Heat V: Support network

Implemented: local Level-10 Business cover, assigned Mara and active Lilt reduce
the MANHUNT decoy cost through exact shared modifiers, down to **$810**.
Save **v20 / CE1 unchanged**. See [Heat support](HEAT_SUPPORT.md). Verification passed; see [PR #33](https://github.com/TLSnipZ/Idle-Game/pull/33).
Verified in [PR #33](https://github.com/TLSnipZ/Idle-Game/pull/33):
[run 34783614823](https://github.com/TLSnipZ/Idle-Game/actions/runs/34783614823)
on code `fb0c5ade7e4ed52190b6cb088fedd4ffff5fe6fc` passed strict build,
**2,441/2,441 tests** (28 added; zero failures/skips), **345 Chromium cases**
(45 Garage, 225 sections, 15 each risk/police/district/MANHUNT/support), and
whitespace checks. Evidence artifact: `10326270313`.
This follow-up changes documentation only. Merge/deployment evidence is recorded
in the PR; manual live acceptance remains separate.

The retained Heat / Police 2.0 **I–V sequence is complete** at this scope.
Further post-roadmap expansions require their own scope. Older records below are historical.


## Current phase — Heat IV: MANHUNT

Implemented: local roadblocks from 80 Heat and a voluntary $1,250 / −30 Heat
decoy, with durable payment and free recovery paths. Save **v20 / CE1 unchanged**.
See [MANHUNT](MANHUNT.md) for balance, persistence and acceptance. Verification passed; see [PR #32](https://github.com/TLSnipZ/Idle-Game/pull/32).
Verified in [PR #32](https://github.com/TLSnipZ/Idle-Game/pull/32):
[run 34781843741](https://github.com/TLSnipZ/Idle-Game/actions/runs/34781843741)
on code `4545e8bf32b267f9930cbb3f307d710cbc363abe`: strict build,
**2,413/2,413 tests** (29 added; zero failures/skips), **330 Chromium cases**
(45 Garage, 225 sections, 15 each risk/police/district/MANHUNT), and whitespace
checks passed. Evidence artifact: `10325630553`.
The final follow-up changes documentation only. Merge and deployment evidence
are recorded in the PR; manual live acceptance remains separate.

Next separate phase: **Heat V — deeper cross-system integration**.
Earlier phase records below are historical.


## Current phase — Heat III: District Heat

Implemented: separate Waterfront/Neon Heat, durable owned-district travel,
local manual actions/events and Waterfront Dispatcher. Save **v20**, CE1 unchanged.
See [District Heat](DISTRICT_HEAT.md) for rules and compatibility. Verification passed; see the [PR #31 evidence](https://github.com/TLSnipZ/Idle-Game/pull/31).
Verified in [PR #31](https://github.com/TLSnipZ/Idle-Game/pull/31):
[run 34780604928](https://github.com/TLSnipZ/Idle-Game/actions/runs/34780604928)
on code `91749a14e3bf7a00f95abf388f70d371bece984e` passed strict build,
**2,384/2,384 tests** (30 added, zero failures/skips), **45 Garage + 225 section +
15 risk + 15 police + 15 district Chromium cases**, and whitespace checks.
Evidence artifact: `10325411638`. This final follow-up changes documentation only.
Merge/deployment evidence is recorded in the PR; manual live acceptance remains separate.

Next separate scope: **Heat IV — MANHUNT**. Earlier phase records below are historical.

## Current phase — II Police Pressure

Implemented on `feat/police-pressure`: WATCHED reduces risk premium to +25%;
discreet delivery pays half normal Cash, zero XP, and cools up to 2 Heat.
See [POLICE_PRESSURE.md](POLICE_PRESSURE.md). Save v19 / CE1 unchanged.
Verified in [PR #30](https://github.com/TLSnipZ/Idle-Game/pull/30):
[run 34777563745](https://github.com/TLSnipZ/Idle-Game/actions/runs/34777563745)
on `bf28818fd514cc68baf74f6bd90c18dc6b11ae7b`: strict build, **2,354/2,354 tests**
(39 added, zero failures/skips), **45 Garage + 225 section + 15 risk + 15 police
Chromium cases**, and whitespace checks passed. Evidence artifact: `10323499963`.
This final follow-up changes documentation only. Merge/deployment evidence is
recorded in the PR; manual live acceptance remains separate.
PR #29 completed and deployed Heat I.
Next separate scope: III District Heat. Earlier handoffs below are historical.

## Current phase — Heat / Police 2.0 I: Risk & Reward

Implemented on `feat/heat-risk-reward`: optional +50% Cash / +5 Heat delivery,
available below HOT, exact shared rewards and all three languages. Save v19 / CE1.
See [HEAT_POLICE_2.md](HEAT_POLICE_2.md) for balance, contracts and acceptance.
Verified in [PR #29](https://github.com/TLSnipZ/Idle-Game/pull/29):
[run 34775975009](https://github.com/TLSnipZ/Idle-Game/actions/runs/34775975009)
on code `577881c63554f43bb7a6603fddc4f6646b4c707e` passed strict build,
**2,315/2,315 tests** (32 added; zero failures/skips), **45 Garage + 225 all-section +
15 risk delivery Chromium cases**, and whitespace checks. Artifact: `10324165450`.
This follow-up changes documentation only. Merge and deployment evidence are
recorded in the PR; manual live acceptance remains separate.
PR #28 completed and deployed the Garage.
Next separate phase: II Police Pressure; not started.

The following handoffs are historical.


## Current artwork handoff

Tier-1 artwork is implemented and verified in [PR #28](https://github.com/TLSnipZ/Idle-Game/pull/28). [Run 34774339210](https://github.com/TLSnipZ/Idle-Game/actions/runs/34774339210) verified code commit `298ef28287bfe6f090736698f06861c7b0adb35a`: strict build, 2,283/2,283 tests (zero failures/skips), 45 Garage and 225 whole-game Chromium cases, and whitespace checks passed. Evidence artifact: `10322962950`. This documentation-only follow-up does not change the verified runtime or tests. The PR records merge/deployment separately. Heat / Police 2.0 is the next separate phase and has not started.

This is the current post-roadmap status and priority source.

## Current priority — Tier-1 Garage (gameplay and artwork verified)

The authorized Garage expansion adds Senda and Lilt mechanics, Save v19 and three
localized cards. See [TIER_ONE_GARAGE.md](TIER_ONE_GARAGE.md) for exact contracts,
balance limits and artwork approval provenance. All **2,283 tests and 270 Chromium cases pass** in
[run 34766756642](https://github.com/TLSnipZ/Idle-Game/actions/runs/34766756642).
PR #27 delivered the gameplay. PR #28 completes the approved model artwork; its verification is recorded above and its release is tracked in the PR. Heat / Police 2.0 is next and has not started.

The user moved the whole-game audit and regression repairs ahead of new content. See [GAME_AUDIT.md](GAME_AUDIT.md)
for implementation, defects, verification and overhaul priorities.
PR #24 implements Villager and the audit fixes. Verification run 34759819504 passed:
2,190 tests passing, 62 inherited UI failures (down from 64), no new regressions,
and 255 production Chromium section/Garage cases plus cross-feature flows.
Villager overkill is merged and deployed in PR #25. PR #26 completes the P1 UI
regression restoration: **2,252 / 2,252 tests pass, zero failures/skips**, and all
255 Chromium cases pass. CI now requires a fully passing suite. Verification:
[run 34764804304](https://github.com/TLSnipZ/Idle-Game/actions/runs/34764804304).
The audit handed off to the current Tier-1 Garage work above; Heat / Police 2.0
follows the Tier-1 artwork release.

## Active Vehicle implementation — merged PR #23

Active Vehicle Foundation and Save v18 are implemented in PR #23.
Its verification and release evidence are recorded below and in the PR. Manual live
acceptance remains separate. PR #22 was a design-only checkpoint.
The four storefronts were merged in PR #21 and deployed successfully. PR #23 supplies the actual selection/migration/UI patch and CI evidence.
The audit and P1 test-repair acceptance are complete; current Tier-1 status is recorded above.
Verification: run [34757750344](https://github.com/TLSnipZ/Idle-Game/actions/runs/34757750344)
passed typecheck/build, regression comparison (2,159 passed / the same 64 existing
failures; all 47 new tests passed) and 20 EN/DE production Chromium cases. No baseline
tests were removed. See [ACTIVE_VEHICLE.md](ACTIVE_VEHICLE.md) for scope and evidence.

The following numbered entries retain their historical save-version and acceptance records. ROADMAP.md retains
historical Base Game records. Main before this branch used Save v17 / CE1, including POST 2C vehicle
identity migration and POST 3B selected Business targeting. Non-vehicle Phase 9C balance, Phase 9D runtime safeguards and
Phase 9B accessibility remain preserved contracts.

## Immediate sequence

- POST 1A: approved visual foundation, manually verified live.
- POST 1B: Deep UI Transformation, manually verified live by the user.
- POST 1C: Live UX Polish & Number Formatting, **manually verified live by the user**.
- POST 2A: **Vehicle Catalog Design Pass implementation complete**. Design and
  analysis only; live-game changes: none. See [VEHICLE_CATALOG.md](VEHICLE_CATALOG.md).
- POST 2B: **Kairo KX-R Final Refinement approved** as canonical Model Reference.
- POST 2C: **Kairo KX-R Production Integration implementation complete**;
  **manually reviewed live by the user; canonical KX-R visually approved**. One vehicle only; Save v16 / CE1.
- POST 2D: **Interaction & Progression Polish implemented; live verification pending**.
  In-section focus/scroll stability, global HUD XP, Rebirth Ready and compact KX-R layout.
- POST 3A: **Business Expansion I design and deterministic analysis complete**;
  [BUSINESS_EXPANSION.md](BUSINESS_EXPANSION.md) retains the approved balance evidence.
- POST 3B: **Business Expansion I deployed and live, confirmed by the user**.
  Four Businesses, shared cards/production, selected Auto-Upgrader target and minimal
  Save v17 migration. Recovery starts directly from the preserved POST 3A baseline;
  the lost implementation SHA is not recreated. No non-Business rebalance.
- POST 3C: **Operations Long-Section Navigation & UX Polish implemented; live review pending**.
  Non-sticky Jobs / Businesses / Automation jumps, semantic focus destinations,
  shared requirements/action spacing and progression-vs-Cash helper copy. Save v17,
  CE1, Business gates and all gameplay remain unchanged.
- POST 3D: **Business Progression Gates & Shared Requirement Polish implemented**;
  deployment/live review pending. Laundry stays Player 5 / Dockside 7; Afterdark is
  Player 10 / Laundry 10; Nights is Player 16 / Afterdark 8 / Neon Mile. Acquisition
  gates only: existing owners remain valid, Save v17 / CE1 and runtime unchanged.
  Territory/Crew share requirements/action spacing and locked versus Cash helpers.
- **Reset Progress / New Game: implemented and merged; user reported working live after PR #1.**
  Empire → Save & Transfer offers a full canonical restart with explicit `RESET`
  consent and guarded durable replacement. Save v17 / CE1 unchanged. See
  [RESET_PROGRESS.md](RESET_PROGRESS.md).
- **Next Objective / Guidance: implemented, deployed and manually accepted; compact UX polish merged in PR #9.**
  Read-only all-section guidance keeps the suggested/tracked step and key progress
  visible in a compact default card. Detailed progress, destination navigation and
  optional goal selection expand on demand. Expansion/tracking remain in-memory UI
  only; Save v17 / CE1 and gameplay authority are unchanged. Pages build/deploy
  passed and the compact presentation was manually accepted. See [GUIDANCE.md](GUIDANCE.md).
- **Settings & Localization Foundation: implemented and merged in PR #3; live accepted as functional.**
  Global Settings, English/Deutsch, typed translation keys, locale presentation and
  reduced-motion preferences are device-local and do not alter Save v17 / CE1.
  See [SETTINGS_LOCALIZATION.md](SETTINGS_LOCALIZATION.md).
- **Localization Voice Pass: merged in PR #4; build compatibility hotfixed in PR #5.**
  Canonical original Solara City writing contract established for English and German.
- **Full UI Localization & Solara Voice Pass: merged in PR #6; Pages build/deploy passed and manually accepted live.**
  Overview, Guidance, Operations, Businesses, Upgrades, Dispatcher, Auto-Upgrader,
  Requirements, City, Territories, Heat, Crew, Events, Garage, Rebirth, Skills,
  Achievements, Statistics, Save/Transfer, Reset, Offline Return, accessibility copy
  and runtime/action feedback follow the EN/DE Solara voice. Save v17 / CE1 and
  gameplay remain language-neutral. See [FULL_UI_LOCALIZATION.md](FULL_UI_LOCALIZATION.md)
  and [LOCALIZATION_VOICE.md](LOCALIZATION_VOICE.md).
- **Global HUD 2.0 / Activity Center: merged in PR #7, deployed and manually accepted live.**
  Compact always-visible Cash / Level+XP / Heat / EP command layer plus a localized
  Activity Center for City Events, automation, Rebirth readiness and system state.
  PR #8 retired the duplicate visible legacy newsfeed; ordinary latest feedback now
  belongs to Activity Center while accessibility announcements and critical recovery
  errors remain preserved. See [GLOBAL_HUD_2.md](GLOBAL_HUD_2.md).
- **HUD XP column containment: merged in PR #17; production typecheck/build/deploy passed after retry.**
  Reproduced native XP progress overflowing into Heat after PR #16. Only HUD CSS
  changes: fluid contained progress and a separate wrapping XP caption. 35 offline
  Chromium layout cases passed before merge; 22 additional checks passed against
  the freshly built Pages artifact with no injected fix stylesheet. Compiled game
  JavaScript is byte-identical to the previous build. Three Vitest regression guards
  were added but the suite was not run locally or by the Pages workflow.
  Run `34722063196` built commit `68d6bbb21bb8e916a58ed3051fcc54cbe0189f0b` successfully;
  the user restarted its queued deployment and reported success. The latest attempt's
  build and deploy jobs are now both confirmed successful through the GitHub API.
  Manual visual acceptance remains separate. Operations layout and gameplay are
  untouched. Details: [GLOBAL_HUD_2.md](GLOBAL_HUD_2.md).
- **Solara City Branding: merged in PR #10; live accepted before Business Visual Identity.**
  Canonical city symbol, `SOLARA / CITY` lockup, favicon and restrained shell accents.
  See [SOLARA_CITY_BRANDING.md](SOLARA_CITY_BRANDING.md).
- **Operations Page Overhaul: merged in PR #15, refined by PR #16; final live acceptance pending.**
  Jobs, Businesses, Upgrades and Automation use one isolated responsive UX system.
  Desktop uses two Businesses per row; mobile stacks one per row. Secondary reward,
  earnings and mechanics detail move into disclosures while key gameplay truth stays
  immediately visible. PR #16 removes the unfinished artwork slot and sticky category
  bar and refines the finance snapshot. Operations styling is in `Operations.css`;
  gameplay, Save v17 / CE1 and balance remain unchanged. See [OPERATIONS_OVERHAUL.md](OPERATIONS_OVERHAUL.md).
- **Overview / City card spacing: merged in PR #18; checked build/deploy passed; manual live acceptance pending.**
  Fix reproduced zero-gap Overview cards and district-to-Heat boundary using only
  scoped container rules in `sections.css`: 1.5rem above 740px and 1rem on narrow
  views. Preserve existing City catalog columns and section gaps; remove Heat's
  duplicate bottom margin. 22 before/after Chromium cases passed across EN/DE,
  320–1920px and enlarged text. HUD, Operations, Garage and Empire geometry are
  unchanged. No artwork, React or gameplay changes. See [SECTION_SPACING.md](SECTION_SPACING.md).
  Release run `34723960641` successfully built and deployed commit
  `f559bb3486f5710bd82724763f7e6113c624a6bb`. Another 18 cases passed against that
  exact production artifact without injecting fix CSS; compiled JavaScript is
  byte-identical to the previous release. Full Vitest suite was not run.
- **Historical Dockside storefront reference: PR #19 deployed and live accepted; artwork superseded by the four-preview batch below.**
  User-authorized reintegration uses a storefront-only crop of the approved concept:
  564x270 WebP, 24,454 bytes, verified checksum. The bounded strip is isolated in
  `BusinessArtwork.css`; pending or failed images leave no empty placeholder.
  Existing Operations grid, Earnings Details, gameplay and HUD/spacing fixes remain.
  Run `34725691641` built and deployed commit
  `1e0a5151072e6679e54fce71ceda7effe63c01a7` successfully. Artifact `10307672623`
  contains the exact inspected image bytes. Its actual compiled CSS/JS passed 16
  additional EN/DE Chromium cases at 320–1920px without a candidate component/CSS
  patch, plus delivery, acquisition, equipment purchase, upgrade, Earnings Details,
  navigation-return and failed-image checks. Before merge, 16 candidate and 16
  baseline cases passed. The offline harness embeds assets and provides test storage.
  Six Vitest tests were added but not executed during that original release session;
  the Pages workflow does not run them. The user subsequently approved the actual
  Dockside card and authorized the same treatment for the remaining Businesses.
  Source provenance and corrected history:
  [BUSINESS_VISUAL_IDENTITY.md](BUSINESS_VISUAL_IDENTITY.md).
- **Neon Laundry: complete storefront + EN/DE identity package implemented in PR #20; live review after release.**
  Supersedes the earlier text-only draft. Own laundromat storefront WebP is committed
  (732x188, 23,126 bytes) and mapped to the existing load-safe BusinessArtwork renderer.
  Optional localized taglines and the Laundry description remain presentation-only.
  Dockside's accepted asset, all stylesheets, the two/one-column grid, Earnings Details,
  HUD, section spacing, gameplay, saves and balance are unchanged.
  Node 24 checked production build and 16 focused tests passed. Regression coverage
  is now committed in existing test files; the previously blocked standalone test
  file remains unnecessary and absent. Full baseline: 2,087 passed / 64 failed;
  full candidate: 2,094 passed / the same 64 failed. No additional failing cases,
  but the full suite is NOT green. Historical failures remain separate work.
  Sixteen paired EN/DE Chromium cases at 320–1920px passed against actual production
  builds, plus purchase/upgrade, Earnings Details, reload, Settings language-switch
  and blocked-image action checks. German 320px still has the same pre-existing
  10px document overflow; this pass does not claim to fix it.
  Consult PR #20's release-verification comment for final merge/Pages status.
  The user subsequently approved the full four-business preview and authorized a
  single batch below, superseding the prior sequential artwork gate. Source, checks and authority boundaries: [BUSINESS_VISUAL_IDENTITY.md](BUSINESS_VISUAL_IDENTITY.md).
- **Four approved preview storefronts: implemented on `art/four-approved-business-storefronts`; release/live review checkpoint follows.**
  Explicit user request: use all four images from the same approved preview, replacing
  existing artwork where needed. Dockside is replaced; Afterdark Customs and Solara
  Nights are added; Neon Laundry already uses that exact preview and is preserved.
  Only the asset lookup and three image files change in production. Every stylesheet,
  the shared renderer, card controls, EN/DE text, HUD, spacing and gameplay remain
  unchanged. All four decoded image files match their recorded checksums.
  Fresh checked production build and 34 targeted tests passed. Full baseline:
  2,094 passed / 64 failed; candidate: 2,112 passed / the same 64 failed, with no new
  or removed failing cases. Existing failures remain separate work, not hidden.
  See [BUSINESS_VISUAL_IDENTITY.md](BUSINESS_VISUAL_IDENTITY.md) and the integration
  PR for exact crops, responsive checks and final merge/Pages release evidence.
- **Current sequence:** four-preview artwork batch release/live review →
  **Active Vehicle + Tier-1 Garage → Heat / Police 2.0**. The previous individual
  Afterdark/club artwork order is superseded by this explicitly authorized batch.
- Later separately scoped Active Vehicle architecture, controlled Tier 1 expansion
  (Kairo Senda / Namera Lilt), Garage comparison/usability and Tuning Foundation.
- Crew / Territory / Event references and later asset batches remain separately
  scoped and not started.

The earlier Vortex Golden Reference model-integration plan is cancelled. External
Candidate A is approved only for Vehicle Art-Style Direction; its sedan is not a
canonical in-game model. Kairo KX-R Final Refinement is the approved Model Reference,
now the sole production vehicle. Preserve ART_DIRECTION.md, the canonical model
and the shared camera/lighting/showroom language.

## Audited future work — retained

| Priority | Item | Constraints / direction |
| --- | --- | --- |
| Implemented | Next Objective / Guidance | Catalog-driven suggested path and optional goals, exact prerequisite progress / missing Cash, navigation-only actions. Compact-by-default details are live accepted; see GUIDANCE.md. |
| Implemented | Global HUD 2.0 / Activity Center | Compact global command layer; Activity Center is the sole normal global news/activity surface after PR #8. |
| Deployed / live review pending | HUD XP containment | PR #17; checked build and browser geometry passed; run 34722063196 deploy succeeded after retry. |
| Implemented | Solara City Branding | Canonical symbol/lockup/favicon and restrained shell accents; merged PR #10. |
| Deployed / live review pending | Overview / City spacing | PR #18; checked build/deploy passed in run 34723960641; 22 candidate plus 18 production browser cases passed. See SECTION_SPACING.md. |
| Live review pending | Operations Page Overhaul | Rebuild Jobs/Businesses/Upgrades/Automation as a compact isolated responsive system; desktop two-Business grid, mobile one-column. |
| Live accepted layout / replacement artwork in current batch | Dockside Business artwork | Preserve PR #19 compact layout; use the new approved preview crop. |
| Implemented / release and live review | Neon Laundry identity | PR #20 now includes own storefront, EN/DE copy and committed regression coverage. See PR for final release status. |
| Implemented in current batch | Afterdark Customs artwork | Approved preview workshop mapped to the unchanged compact renderer. |
| Implemented in current batch | Solara Nights artwork | Approved preview nightclub mapped to the unchanged compact renderer. |
| P1 | Long-section navigation | Preserve focus/back behavior and critical information; avoid nested accordions and new gameplay state. |
| P2 | Purchase Intelligence | Show authoritative impact/payback estimates with explicit assumptions; no balance mutation. |
| P2 | Rebirth Guidance | Eligibility progress, expected EP and Keep/Lose clarity; no reward/reset change. |
| P2 | City Visual Layer | District imagery, compact city overview and eventually a Solara map with ownership/Heat/Event context. |
| P2 | Crew Visual Identity | Approved portraits, role icons and assignment visualization within the Golden Reference style. |
| Implemented | Reset Progress / New Game | Explicit `RESET` confirmation and canonical durable fresh replacement. |

## Major expansions retained

Garage 2.0 and Vehicle Tuning remain high-priority future implementations. The
14-vehicle planning catalog is documented in VEHICLE_CATALOG.md. No runtime catalog,
filters, tuning or builds are implemented by the design pass.

Heat expansion sequence remains: I Risk & Reward; II Police Pressure; III District
Heat; IV MANHUNT gameplay state; V deep integration with Tuning, Safehouses, Heists,
Crew and other systems. Current Foundation Heat is unchanged. Properties, activities
and deeper city/Empire systems require separate scopes and save compatibility review.

## Current presentation handoff

The presentation stack is now: full EN/DE Solara voice → compact Global HUD 2.0 /
Activity Center → compact expandable Next Objective → canonical Solara City branding.
These surfaces were manually accepted before the later HUD sizing regression;
see the current hotfix above. Ordinary global feedback belongs to Activity Center;
critical recovery errors may still render outside it.

**Current task: Active Vehicle Foundation, implemented in PR #23.**
The approved four-storefront package was merged and deployed in PR #21. PR #22
contained the Garage design only. PR #23 adds the actual selection, Save v18 migration,
active-only modifier, durable runtime transaction and localized Garage UI.
Preserve Save v18 / CE1, active ownership invariants and the existing economy,
Business balance, automation, RNG, offline and Rebirth protections. Tier-1 cars are
the next separate scope after acceptance; Heat / Police 2.0 follows the Garage block.


Villager correction: replace the readable-gloss prototype with complete nonsense
throughout presentation. This stays within the language/audit priority; no Garage
or Heat content expansion is included. See SETTINGS_LOCALIZATION.md.
