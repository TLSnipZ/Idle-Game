# Solara City — Design & UX 2.0

## Accepted direction

The user prioritized a whole-game visual and usability overhaul ahead of Rendan/Canto.
Keep the coastal-night identity, approved artwork, legible game values and original
EN/DE humor (plus Villager). Attractive screens must make progression and actions
clearer. No balancing, content, Save v24 / CE1 or runtime changes belong to this pass.

## Delivery sequence

1. Shared design foundation and Operations/Business portfolio (PR #45; user accepted).
2. Overview command center, richer City/Heat and Crew composition.
3. Empire views for Rebirth, Skills, Achievements, Statistics and Save/Transfer;
   integrate Garage/Workshop with the completed visual system.

The remaining page compositions are now implemented in the follow-up below.
Shared typography, navigation, cards and surfaces apply across the game.

## First slice: implementation

Operations has actual Jobs / Businesses / Equipment / Automation views. Native
pressed buttons reveal one view, then focus its heading. Hidden trees preserve
local disclosure state and cannot receive normal keyboard interaction. Jobs include
local District Heat. Primary navigation and the central runtime are unchanged.

Businesses use a compact four-storefront selector and one detailed card. Desktop
shows selection/detail together; up to 800px, selection opens a detail page with
an explicit Back control restoring tile focus. The selected Business persists
across Operations tabs. Replacement resets local inspection. Selecting a Business
never purchases it or changes the Auto-Upgrader target.

The detail retains the approved storefront without additional cropping, full
readable description, level, authoritative current/next production, cost,
requirements, modifier disclosure and the existing durable purchase/upgrade button.
Mobile owned-business metrics become full-width rows. No fake growth charts,
invented income, new upgrade formulas or decorative countdowns are introduced.

Global tokens stay in src/styles/tokens.css. DesignSystem.css applies shared
hierarchy; BusinessPortfolio.css owns this composition, scoped to Operations.
No new dependency, font download, generated artwork or image transformation.

Guidance and Activity destinations are delegated to Operations so the correct tab
and business are visible before focus. Each external request is consumed once;
returning later does not replay an old destination. Ordinary ticks and purchases
do not navigate or remount the detailed card.

## Verification and release

- Strict build and existing 2,542 tests passed before adding the focused cases.
- Four additional cases cover inspection without commands, stable acquisition/
  upgrade focus, repeated Activity navigation and specific hidden destinations.
- The production browser matrix covers two progress stages, three languages and
  five widths; selection, Back, tabs, keyboard upgrade, reload and 125% text.
- Existing whole-game/browser gates remain required. Run and release evidence is
  recorded in the PR; completion of automated checks is not user visual acceptance.


## Remaining workspaces: implementation

Overview uses a 12-column desktop composition: income, career progress, local
pressure, Empire Points and decisions. After user review, Economy no longer
displays a Business storefront: its figures describe the whole operation.
No fabricated history, projected income or additional gameplay is introduced.

City has Districts & Heat / Crew / Events panels. The user rejected the reused
Business facades in district cards. Dedicated elevated district views,
explicitly approved by the user on 2026-09-14, now replace them; see [District artwork](DISTRICT_ARTWORK.md). Crew uses monograms, explicit compatible roles, current assignments and
existing recruitment/assignment controls. Monograms also obey Villager localization.
Events keep outcome and affordability information next to their actions.

Empire separates Rebirth / Skills / Achievements / Statistics / Save & Transfer.
Skills add native rank progress; permanent records and Keep/Lose policy have
clearer visual grouping. All import, reset and Rebirth confirmations remain
explicit. Hidden mounted panels preserve local drafts, RESET text and confirmation
state. Pending forms have a labelled navigation badge; switching tabs never
executes or cancels an operation. Cross-section return reveals the pending form.

SectionWorkspace is a small shared presentation component used by City and Empire.
Its native pressed buttons select one hidden-aware panel and focus its heading.
External destinations are resolved by actual panel containment, including nested
Crew, Territory and Skill headings. App delegates these requests and routes global
Rebirth review through the same one-shot destination path. Runtime, persistence,
selectors and confirmation controllers remain above this navigation.

WorldWorkspace.css scopes the remaining page compositions; no new dependency,
external font. The subsequent district-art review adds two dedicated image
assets. Garage and Operations retain the accepted layouts.

Verification adds focused draft/destination/confirmation interaction tests and a
15-case browser matrix across EN/DE/Villager and five widths. Each City/Empire view
is checked at normal and 125% text. Tests preserve valid import, RESET and Rebirth
review through tab changes without execution and exercise repeated Event shortcuts.
The existing 225-case layout matrix now checks every subview for overflow; existing
cross-feature browser flows explicitly select the relevant City/Empire panel.
Build, complete tests, browser gates, visual review and deployment evidence are
recorded in the implementation PR. User visual acceptance remains separate.
