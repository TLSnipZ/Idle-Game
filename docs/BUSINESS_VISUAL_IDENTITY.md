# Business Visual Identity / Artworks

## Current scope: all four approved preview storefronts

The user explicitly approved the four-business preview and requested **all four storefront images in the game**, including replacing existing images with the preview versions. This supersedes the earlier one-business-at-a-time acceptance order. The source implementation is on `art/four-approved-business-storefronts`, based on main `ed90d82608ad493cf5ede4682b13efc97bd7a1e0` after PR #20. Merge, Pages release and the user's final in-game visual review are separate checkpoints; consult the integration PR for the release result.

The task is an artwork batch, not another Operations redesign. Dockside's compact card layout remains the Golden Reference. No new image generation, recolor, stock substitute or recreation of the mock interface is used in this pass.

## Exact source and provenance

All four storefronts come from the same approved generated concept, `a_cinematic_neon_soaked_ui_dashboard_screenshot_w.png`, 1526 x 1030 pixels, supplied in this conversation.

Source SHA-256: `ecc2d1e830e4fca0a4167090e80812209bdedc50fe60fe481376e49af4e389a3`.

Crop coordinates below are `(left, top, right, bottom)`, with exclusive right/bottom. Only the illustrated storefront headers are extracted. Generated card labels, mock prices, progress, requirements and buttons are excluded. Physical signage remains part of the original environment. The source is not a live gameplay screenshot.

| Business | Source crop | Runtime pixels | WebP bytes | Integration |
| --- | --- | --- | --- | --- |
| Dockside Detail | (22, 16, 750, 205) | 728 x 189 | 21,810 | Replace the previous PR #19 crop with the approved four-business preview version. |
| Neon Laundry | (776, 16, 1508, 204) | 732 x 188 | 23,126 | Retain PR #20 bytes: this was already the exact laundromat from the same preview. |
| Afterdark Customs | (22, 569, 750, 746) | 728 x 177 | 14,224 | Add the performance-workshop storefront from the preview. |
| Solara Nights | (778, 569, 1506, 746) | 728 x 177 | 18,228 | Add the nightclub storefront from the preview. |

New crops use WebP quality 55, method 6, without resizing. The retained Laundry crop is the existing quality-70 file. These modest source images are suitable for compact card strips; they are not represented as high-resolution hero renders. No extra color grading or generative alteration was applied.

Runtime paths under `src/assets/businesses/` and SHA-256 digests:

- `dockside-detail-storefront.webp`: `1ce07fc9e361000d660e0e38006149c5b25a86bf40aeb0ff21dc04acd2640c1c`
- `neon-laundry-storefront.webp`: `152fa1bf7ef1329720d7022f067546454610b8f7dff3d405eb695ab35a93dcc5`
- `afterdark-customs-storefront.webp`: `a2674b40fcd8deab39d937047a347dede07c328954f5c7b5d06b0e8e10489192`
- `solara-nights-storefront.webp`: `07e86859648a2232541b2c7bec87296902b4b407002560533fe486e0e4ed59e4`

The older unused `dockside-detail-card.webp` remains historical and is not imported. All four active assets were decoded after checkout and matched their expected dimensions, byte counts and digests.

## Layout and authority contract

Only the presentation lookup in `business-artwork.ts` changes in production TypeScript. It maps the four stable Business IDs to distinct imported images and their actual intrinsic dimensions. Unknown IDs return null. No image path enters GameState or the feature catalog.

`BusinessArtwork.tsx`, `BusinessCard.tsx`, every stylesheet, all existing localized text and all game code remain unchanged by this batch. In particular:

- Two Business cards remain side by side above 900px; one per row at/below 900px.
- Every artwork uses the same existing bounded strip height and `object-fit: cover`; narrow screens may crop secondary edge details, never gameplay information.
- No full-row hero, new fixed height for cards, sticky category navigation or global spacing override is introduced.
- Pending artwork remains hidden and loads eagerly; a failed/empty image removes only that image slot. Names, requirements, prices and action controls stay usable.
- Ownership, Level, production, prices, Earnings Details and buttons remain real HTML driven by the existing selectors/commands, not values from the preview.
- The accepted Dockside/Laundry EN/DE copy stays unchanged. Environmental signs are decorative, not replacement translations for gameplay data.

## Verification and release boundary

Fresh Node 24 dependency installation and strict production build were executed. The focused artwork/asset/HUD suite passed **34 tests**, including every storefront's load/error/empty state and all four Businesses' EN/DE purchase/upgrade intents after image failure, with paused/max-level protection.

The full unchanged baseline has 2,158 tests: 2,094 passed / 64 failed. This candidate has 2,176 tests: 2,112 passed / the same 64 failed. Failure names were compared: no new failing cases and none removed. The complete suite is **not green**; this artwork task does not silently fix, skip or delete existing failures.

The existing portfolio test's intentional image-count assertion is updated for all three later Businesses while preserving its gameplay/requirements assertions. Image-integrity tests protect all four exact files. Responsive browser and release evidence belongs in the integration PR, including any known baseline overflow; a successful build is not a claim of universal visual acceptance.

## History and next step

PR #19 established the user-accepted compact Dockside card. PR #20 delivered Neon Laundry with its own storefront and localized identity. The user then explicitly requested the entire four-storefront preview as one batch, so Afterdark and Solara Nights no longer wait behind separate illustration tasks.

After this batch is successfully published, review the actual four-card result. The next separately authorized roadmap block is Active Vehicle + Tier-1 Garage, followed by Heat / Police 2.0. No gameplay phase starts automatically.

Save v17 / CE1, economy, balance, levels, gates, XP, Heat, RNG, offline progression, automation, dependencies and deployment workflow remain unchanged.
