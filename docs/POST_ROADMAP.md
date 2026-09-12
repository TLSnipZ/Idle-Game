# Post-roadmap priorities

This is the current post-roadmap status and priority source. ROADMAP.md retains
historical Base Game records. Current Save v17 / CE1 includes POST 2C vehicle
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
  Overview, Guidance, Operations, Businesses, Upgrades, Automation, City, Territories,
  Heat, Crew, Events, Garage, Rebirth, Skills, Achievements, Statistics, Save/Transfer,
  Reset, Offline Return, requirements, accessibility copy and runtime/action feedback
  follow the EN/DE Solara voice. Save v17 / CE1 and gameplay remain language-neutral.
  See [FULL_UI_LOCALIZATION.md](FULL_UI_LOCALIZATION.md) and [LOCALIZATION_VOICE.md](LOCALIZATION_VOICE.md).
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
- **Business Visual Identity / Artworks: Dockside integration resumed by explicit user request.**
  A storefront-only crop of the user-approved concept is integrated on branch
  `dockside-approved-artwork-integration`: 564x270 WebP, 24,454 bytes, checked asset
  checksum. The bounded artwork strip is isolated in `BusinessArtwork.css`; pending
  or failed images leave no empty placeholder. Existing Operations grid, Earnings
  Details, gameplay and previous HUD/spacing fixes are preserved. Six regression
  tests added (not run locally); 16 candidate and 16 baseline EN/DE browser cases
  passed. Production build/deploy and the new crop's manual live acceptance are
  still distinct gates; consult the integration PR for final release evidence.
  The stale document claiming the removed PR #16 image was still integrated has
  been corrected. See [BUSINESS_VISUAL_IDENTITY.md](BUSINESS_VISUAL_IDENTITY.md).
- **After Dockside live acceptance:** Neon Laundry → Afterdark Customs → Solara Nights,
  then **Active Vehicle + Tier-1 Garage → Heat / Police 2.0**.
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
| Current | Business Visual Identity | User resumed Dockside storefront integration; keep the repaired layout. Build/deploy and crop acceptance before later Businesses. |
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

**Current task: Dockside reference integration, explicitly resumed by the user.**
Keep the repaired Operations, HUD and section-spacing baseline. All work remains
presentation-only and must preserve Save v17 / CE1, GameState, economy, balance,
gates, automation authority, RNG, localization and runtime behavior. The new Dockside
crop needs its own live acceptance; no later Business artwork or gameplay phase
starts automatically.
