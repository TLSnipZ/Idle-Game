# Villager language and whole-game audit — 2026-09-13

## Scope and decision

Requested ahead of Tier-1 Garage. This review covers the current five-section game:
Overview, Operations, City, Collection and Empire, including fresh, midgame and
advanced states. It combines a source review of presentation/runtime/persistence
boundaries, the complete automated suite, and production Chromium interactions.
It is not a claim of exhaustive absence of bugs.

## Third language

Settings now offers **English / Deutsch / Villager · Hrrm**. Villager is an original
written novelty dialect. The initial readable-gloss prototype was superseded at
the user’s request: every word is now Hrrm/Hmm/Mhm gibberish, intentionally
incomprehensible even in choices, requirements and confirmations. This is text,
not sampled Minecraft speech or an audio pack.

Keyed shell copy, inline text, requirements, catalog flavor, actions, Heat and
statistics share the third locale. Displayed names and units also become gibberish. Exact amounts, canonical data,
identifiers, CE1 codes and the literal RESET input token remain intact. Preferences are device-local
under `solara-city:settings`; `html[lang]` uses `en-x-villager` with English number
formatting. Flag icons provide a non-verbal way to switch back. Save v18 and CE1 are unchanged.

## Concrete defects addressed

| Finding | Effect before this change | Fix / regression coverage |
| --- | --- | --- |
| Runtime language reset on every render | German command feedback could revert to English after a tick/action; a mutable global also coupled hook instances | Per-runtime locale ref; repeated deliveries across two differently localized runtimes |
| Wrong localized unlock identity | German notices could announce the first translated equipment name regardless of what unlocked | Resolve the exact canonical name to its catalog ID before translating; known/unknown identity tests |
| Stale Rebirth and New Game controller locale | Changing language during a review left later confirmation/cancellation feedback in the old language | Synchronize controller locale without consuming or discarding consent; controller and browser checks |
| Settings only claimed modal behavior | Background controls remained reachable by keyboard; focus was not deliberately restored | Native modal dialog with Escape, backdrop dismissal and return focus |
| Generic territory failure message | A blocked acquisition did not say which gates were missing | Report actual unmet requirements, translated through one shared helper; restores the existing territory assertion |
| Excessive live announcements | Latest command appeared in two simultaneous status regions; automatic Dispatcher updates repeatedly interrupted reading | Keep one command announcement; periodic dispatch summaries remain readable without announcing each cycle |
| Narrow layouts and long labels | Chromium reproduced 10px German Operations overflow; Villager revealed a 36px overflow from shrinking navigation buttons with nowrap text | Wrap complete navigation controls at their text width and heading rows; wrap long metric labels/values; bound the skip link to the viewport |

The requirement translation helper replaces four diverging copies. Changes are
presentation and diagnostics only; there is no rebalancing, extra car, save-schema
change, dependency addition, or change to economic command authority.

## Verification

Baseline: merged Active Vehicle commit
`d758fbb207d1ecb91dc0971d105391476498266d`, 2,223 tests:
2,159 passing and 64 pre-existing presentation failures.

Final code verification succeeded in
[Actions run 34759819504](https://github.com/TLSnipZ/Idle-Game/actions/runs/34759819504),
against code commit `1e98681382790f650b6048332255d950c07ca79b`:
**2,252 tests — 2,190 pass, 62 inherited failures, zero new failures, zero removed
tests, no increase in skips. All 29 added tests pass.** Two inherited tests now
pass following actual territory-message and Dispatcher-announcement fixes.

The full production browser matrix passed: **225 section cases + 30 Garage cases**,
plus the language/confirmation and three advanced gameplay flows below. Maximum
document overflow was **0px** and no clipped checked metrics/navigation labels or
JavaScript page errors were reported. Evidence:
[verification artifact 10318422800](https://github.com/TLSnipZ/Idle-Game/actions/runs/34759819504/artifacts/10318422800).
PR [#24](https://github.com/TLSnipZ/Idle-Game/pull/24) records final review and release.
Subsequent changes to this report are documentation only.

The workflow installs dependencies with npm ci, builds with strict TypeScript,
runs candidate and baseline full suites, rejects new failures/removed tests/more
skips, and performs git diff --check. Its JSON reports and screenshots are retained
as Actions artifacts for seven days; the run log retains counts and failure IDs.

Browser checks:
- 225 section cases: five sections × EN/DE/Villager × widths 320, 390, 740, 1024,
  1440 × fresh/mid/advanced validated saves.
- 30 Garage cases: three locales × five widths × empty/owned v17 migration,
  purchase/activation, artwork decoding and save/reload.
- Actual Settings selection/reload, dialog keyboard entry, Tab/Shift+Tab, Escape
  and restored trigger focus; repeated delivery feedback after language changes.
- Backup export, invalid import rejection and cancellation of a pending New Game.
- Advanced commands in all three locales: Auto-Upgrader toggle/target, Business
  upgrade, Lay Low, crew unassignment, event choice, skill purchase, Rebirth
  review/cancel/commit, retained active vehicle, exact RESET consent and reload.
- Page overflow, clipped financial metrics and JavaScript page errors are checked.

Automated layout measurements and captured screenshots do not constitute visual
approval. Safari/Firefox, actual mobile hardware, screen-reader listening,
200% zoom and long-session playtesting remain separate acceptance work.

## Prioritized overhaul backlog

| Priority | Work | Why / evidence | Acceptance before closing |
| --- | --- | --- | --- |
| P1 — completed in PR #26 | Restore the inherited UI regression suite | Baseline has 64 failures across 14 presentation files. Many tests still assume expanded Guidance, old selectors/wording, or call hook components as plain functions. This prevents later assertions from exercising the real behavior. The territory diagnostic and periodic-announcement defects are repaired here; remaining failures must be individually checked, not waived as harmless text changes. | Exercise actual expansion/navigation and React mounting; retain money, focus, disabled-action and save assertions; reach zero failures without removing/ignoring tests; replace the temporary baseline comparison with a normal green-suite gate. |
| P2 | Unify localization and requirement presentation | Keyed strings, inline EN/DE pairs and catalog fields remain distributed. Parsing English requirement sentences is fragile. This patch centralizes the repeated helper but does not redesign all messages. | Typed message parameters and requirement discriminants; parity checks for all supported locales; canonical identities and exact amounts remain unchanged. |
| P2 | Consolidate responsive CSS and clarify Operations metrics | Historical overrides are split across App.css, sections.css and Operations.css. The German mobile overflow was real; rigid columns and nowrap financial values are fragile under long text. | Feature-owned styles, exact prices/rates visible at 320px and zoom, no overflow-hiding workaround; keep browser matrix coverage. |
| P2 | Make save guarantees clearer per action | Business/Garage/automation configuration uses save-before-publish; some older actions intentionally retain live progress with a warning if saving fails. This is covered by existing persistence tests, not a newly proven rollback defect. | Deliberately choose and document one player-facing policy; clearly distinguish saved success from volatile progress; preserve conflict protection, old saves and offline chronology. |
| P2 | Review Activity Center density and announcements on devices | The measured chrome reaches 494px at 320px width in the Villager advanced-state fixture (900px viewport height). Horizontal scrolling and long translated copy warrant direct mobile/assistive-technology review. Duplicate command status was removed here. | Useful first-screen actions, visible pending events, one intelligible announcement per event and focus retained during ticks. |
| P3 — roadmap content | Add meaningful Garage/city decisions after reliability work | Only KX-R is purchasable today, so the active-vehicle foundation has little choice yet. Territory and Heat depth are still intentionally small. Existing balance tests cover the numerical contracts, not player enjoyment. | Follow Tier-1 Kairo Senda/Namera Lilt design, then Heat/Police 2.0; test distinct tradeoffs instead of stacking unrelated bonuses. |

No new economy, save, migration or offline failure was observed in the executed
full-suite comparison. This is evidence for the tested contracts, not a guarantee
against every browser/storage condition.

## Handoff

This audit's automated acceptance checks have passed; PR #24 carries the release.
The inherited UI-test repair is now completed in PR #26 (evidence below).
Next content phase is Tier-1 Garage, followed by Heat/Police 2.0.
Do not silently start those content phases as part of this audit.


## Villager overkill verification — PR #25

The user explicitly replaced the readable-gloss contract with intentionally
incomprehensible Villager copy. Production code commit
`08a3c494ec443d8a190e58fc73fe88fb49bc79a1` passed [verification run 34763014203](https://github.com/TLSnipZ/Idle-Game/actions/runs/34763014203).

- Strict TypeScript / Vite production build and git diff --check passed.
- Full suite: 2,252 tests, 2,190 passed, 62 inherited failures; unchanged from
  PR #24. The regression gate found no new failures, removed baseline tests or
  increased skips. The obsolete gloss assertion now tests the requested gibberish
  contract; no test was disabled.
- All 255 Chromium matrix cases passed (225 section cases plus 30 Garage cases),
  with no root overflow, clipped checked metrics or page errors.
- Villager prose audit passed across all five sections, three progression states
  and five widths, expanded Guidance, collapsed disclosure content, Settings,
  accessibility descriptions, CSS pseudo-element text and browser title.
- Real locale switching, repeated delivery feedback, export/invalid import,
  pending confirmation preservation, advanced actions, Rebirth retention and
  full New Game/reset/reload checks passed. Backup/input values and the literal
  RESET confirmation token are deliberately excluded from prose translation.

Evidence: [test reports, browser results and screenshots](https://github.com/TLSnipZ/Idle-Game/actions/runs/34763014203/artifacts/10319487928).
Screenshots were generated, not manually inspected. Previous manual/device review
limitations and the remaining audit backlog still apply. No new gameplay phase
was started.


## P1 UI regression restoration — PR #26

Baseline: merged PR #25, `141b24cbb00109aca34bfb098bd137f47169bd4a`, 2,252 tests with 62
inherited failures. All existing test cases remain enabled. Guidance tests now
expand the default compact card before selecting/following goals and after a
successful replacement; pending consent, write failures, exact costs, focus and
runtime isolation assertions remain. Hook components mount through React with
proper cleanup and deterministic runtime fixtures. Updated text and layout checks
follow the current HUD/Operations surfaces rather than obsolete markup.

Concrete product repairs found while restoring the suite:
- Auto-Upgrader enable/disable links to spending details. Its purchase action
  explains opt-in spending and links to description, consent and requirements.
- Dispatcher purchase links to both requirements and the current helper. Met
  requirements remain available in collapsed disclosures until purchase.
- Explicit Operations jumps use instant scrolling as specified, including reduced
  motion; ordinary actions still preserve local focus and do not navigate.
- Shared acquisition action spacing is restored between requirements, buttons and
  helper text; the overwritten stylesheet had lost that contract.

CI now fails directly on any test failure, requires zero skips/TODO/runtime errors
and preserves a minimum 2,252 cases. The temporary inherited-failure comparison is
no longer a release gate. Full build/test and 255-case browser verification are
required; final results will be recorded below. Save v18, CE1, content, balance and
economy/persistence authority are unchanged. P2 overhaul items remain open.


### P1 acceptance results

[Verification run 34764804304](https://github.com/TLSnipZ/Idle-Game/actions/runs/34764804304)
succeeded against code commit `059a992f2aa8d85e7b38f69a4fc7776fba897aa4`:
**2,252 / 2,252 tests passed; zero failures, skips, TODOs or runtime-error suites.**
All 62 inherited failing cases now pass, with no deleted test cases. Strict
TypeScript/Vite build, the new zero-failure gate and git diff --check passed.
All **255 Chromium cases** passed, including all locales, five viewport widths,
three progression states, Garage migration/purchase/reload, language and consent
switching, advanced commands, Rebirth and full reset. The browser checks also
resolve automation description links and retain the Villager prose audit.

[Evidence artifact](https://github.com/TLSnipZ/Idle-Game/actions/runs/34764804304/artifacts/10320475162)
contains reports, browser results and screenshots. Screenshots were not manually
inspected; previous real-device, alternate-browser, screenreader and zoom review
limitations remain. The final evidence/status commit changes documentation only.
P1 is complete. Tier-1 Garage is next; P2 overhaul findings remain tracked and no
additional content phase was implemented in this PR.

## UX follow-up — PR #34

[UX_POLISH.md](UX_POLISH.md) records the bounded post-Heat pass: jobs-first Operations, cooling disclosures, compact mobile stats/activity and explicit last-save semantics. A 320px save-disclosure overflow found by the new browser check was repaired. The runtime's mixed persistence policies are preserved and explained. Broader localization consolidation, historical CSS cleanup and unifying all action persistence remain separate backlog work; this pass does not mark the entire P2 backlog complete.
