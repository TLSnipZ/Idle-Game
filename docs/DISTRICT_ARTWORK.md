# District artwork correction

## User review and scope

The user rejected the PR #46 storefront reuse in both Economy and Districts.
Economy summarizes all Cash and Business production, so a particular company's
facade gives the wrong meaning. District cards describe neighborhoods, not venues.
Remove Economy imagery and replace the two district facades with dedicated views.
No gameplay, save, balance, navigation, Business artwork or vehicle changes.

## Candidate contract — pending user selection

Both candidates were generated with the built-in Imagegen tool on 2026-09-14.
They are original environment images, not edits of the user's review screenshots.
They are NOT approved Golden References. The source PNGs are the generated images
displayed in the conversation; no file is promoted into `assets/reference`.
The user must select the territory reference candidates before publication,
following `ART_DIRECTION.md`'s new-category review process.

| District | Source generation identifier | Review runtime asset |
| --- | --- | --- |
| Waterfront | `exec-9d28abf9-7c59-459e-8c95-91ce0dea1d6c.png` | `src/assets/territories/waterfront-candidate.webp` |
| Neon Mile | `exec-3743f3c0-571a-4b2b-a320-11c7e39aaded.png` | `src/assets/territories/neon-mile-candidate.webp` |

Each is 1672 × 941, converted directly to WebP quality 88 / method 6 without
cropping, resizing, retouching or color changes. Waterfront is 368,886 bytes;
Neon Mile is 382,374 bytes. Only these derivatives are imported by Vite.

Prompt direction: premium realistic Solara City environment rendering, elevated
oblique views over several connected coastal city blocks at blue-hour night;
readable navy shadows, warm practical light, restrained pink/turquoise accents,
wet roads, palms, distant bay/skyline/hills, natural perspective and safe margins.
No UI, logo, readable text, collage, maps, isometric camera, sci-fi towers or grids.
Waterfront: working harbor basin, warehouses, modest garages, loading yards,
connecting service roads, cranes and workboats. Neon Mile: a palm-lined boulevard
through multiple blocks of Art Deco hotels, cafes, clubs and side streets with
pedestrians and ordinary late-night traffic. A whole district is the subject.

## Presentation

`TerritoryArtwork.tsx` maps the two explicit territory IDs to separate assets;
unknown future districts receive no misleading fallback image. The entire image
is displayed with intrinsic dimensions, width 100% and automatic height on desktop
and mobile. It is decorative, lazy/async loaded and removed on loading failure.
Names, control state, effects, costs and all actions remain separate HTML.
Economy retains its values, automation disclosure and Operations shortcut.

## Verification

The existing world-workspace browser matrix checks that Economy has no image,
both district images decode, have distinct sources and keep their intrinsic
ratio at five viewport widths in EN/DE/Villager. Existing navigation, 125% text,
draft preservation and confirmation checks remain. Build/test/browser evidence
and the outstanding user artwork selection are recorded in the draft PR.
