# Global HUD 2.0 / Activity Center

Status: initial HUD 2.0 was manually accepted after PR #7. The later XP sizing regression is addressed by the focused hotfix below; original acceptance is not a claim of acceptance for that hotfix.

## Scope

Global HUD 2.0 compresses the always-visible command layer without changing gameplay authority. Cash, Player Level/XP, Heat and Empire Points remain globally visible. Primary five-section navigation remains native and unchanged in responsibility.

The new Activity Center consolidates high-value global situations:

- latest command/session feedback -> rendered inside Activity Center
- pending City Event -> navigates to City
- enabled Business Auto-Upgrader -> navigates to Operations
- Rebirth eligibility and current EP reward -> navigates to Empire
- paused/runtime-critical state -> informational system alert
- quiet state -> compact localized idle copy

All copy follows the English/German Solara localization voice contract.

## Legacy feed retirement

The pre-HUD-2 `GlobalFeedback` visual feed is retired. Normal action, achievement, level, event and automation announcements no longer render as a second visible news strip below the HUD. The live-region announcers remain visually hidden for assistive technology and compatibility, while ordinary latest command feedback is surfaced in Activity Center. Runtime and storage-critical errors remain allowed to render visibly outside the Activity Center because hiding recovery information would be unsafe UX.

There must be exactly one normal global news/activity surface: **Activity Center**.

## Architecture contract

The Activity Center is derived presentation only. It does not persist notification state, resolve events, toggle automation, perform Rebirth, mutate Heat, spend Cash or duplicate gameplay commands. Existing selectors and navigation remain authoritative.

Save v17 / CE1, GameState, economy, balance, requirements, RNG and runtime authority are unchanged.

## Presentation

Desktop uses a compact two-column command row: core stats beside the Activity Center, with primary navigation below. Smaller widths stack the Activity Center while keeping the four core stats horizontally available. Existing focus-visible behavior and native buttons are preserved.

The legacy `.global-indicators` selector remains on the Activity Center as a compatibility contract for existing navigation/runtime tests while the visual treatment is replaced by HUD 2.0.

## Original acceptance result

1. production typecheck/build passed;
2. GitHub Pages deploy succeeded;
3. live desktop/mobile presentation was manually accepted;
4. Event, Auto-Upgrader and Rebirth Activity Center items remain navigation-only;
5. EN/DE copy remains localized under the Solara voice contract;
6. Save v17 / CE1 and gameplay authority remain unchanged;
7. legacy visible newsfeed is removed; Activity Center is the sole normal global activity/news surface.

## XP column containment hotfix

Baseline: `4ff6346779f791ce61d8e24503bd8cacaf485b2b`, after Operations card polish PR #16.
The reported desktop screenshot shows XP progress entering the Heat column.

Reproduced against the actual Pages artifact from run `34720507557`: at a 2048px
viewport the native progress element measured 216px wide, while the Level content
column was about 165.52px wide. The HUD stylesheet specified height but neither
width nor block flow. Native intrinsic sizing and the surrounding large inline
line boxes caused both the overflow and unnecessary row height.

The only runtime-source change is in `Hud2.css`:

- constrain the existing progress to `width: 100%`, `max-width: 100%`, `min-width: 0`;
- use block flow and border-box sizing for the native progress;
- place the XP caption on its own wrapping line with an explicit line height;
- allow the stat group/Level content to shrink within the existing grid.

No React markup, XP calculation, settings, gameplay or Operations styles change.
Do not fix this by hiding the overflowing bar, changing global progress styles,
rewriting App.css/sections.css or moving the Operations category navigation.

### Verification before merge

35 Chromium layout cases passed using the downloaded production bundle in an
isolated offline harness with the proposed HUD stylesheet. The imported vehicle
URL was inlined and storage was an in-memory test adapter; no user's save or live
site was modified. Direct localhost navigation was blocked by browser policy.

Cases cover 320-2048px viewport widths, both sides of the 740/980px HUD breakpoints,
English/German through real Settings controls, root-font scaling, a long XP caption,
all five real navigation buttons and Activity Center delivery feedback. The bar
and caption stay inside Level; the bar never enters Heat; navigation stays below
the HUD. The Operations two-column desktop/one-column narrow grid and non-sticky
category bar were also checked unchanged. Screenshots were inspected.

The default 2048px test row shrank from about 104.78px to 80.92px without fixed-height
clipping. The corrected progress width exactly matched its available 165.52px.

A pre-existing, out-of-scope Operations text-zoom issue remains: German at 390px
with a 20px root font has a 393px document width, from the category label text.
It is identical before/after this HUD fix; the HUD itself remains contained.

`hud-layout.test.ts` adds three Vitest guards for the source-level regression.
The local environment could not resolve github.com for a source checkout, so no
local npm build or Vitest-suite pass is claimed. The existing Pages workflow will
perform the production typecheck/build/deploy after merge. Manual live acceptance
of the hotfix remains pending.

## Handoff

Use POST_ROADMAP.md for the current phase order; Branding has already shipped.
Further Business artwork remains behind Operations/live acceptance. This hotfix
must not alter that sequence or reopen accepted layouts outside the HUD.
