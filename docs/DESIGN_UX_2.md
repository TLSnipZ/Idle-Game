# Solara City — Design & UX 2.0

## Accepted direction

The user prioritized a whole-game visual and usability overhaul ahead of Rendan/Canto.
Keep the coastal-night identity, approved artwork, legible game values and original
EN/DE humor (plus Villager). Attractive screens must make progression and actions
clearer. No balancing, content, Save v24 / CE1 or runtime changes belong to this pass.

## Delivery sequence

1. Shared design foundation and Operations/Business portfolio (this change).
2. Overview command center, richer City/Heat and Crew composition.
3. Empire views for Rebirth, Skills, Achievements, Statistics and Save/Transfer;
   integrate Garage/Workshop with the completed visual system.

The later page redesigns are planned, not delivered by this first slice. Current
shared typography, navigation, cards and surfaces already apply across the game.

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
