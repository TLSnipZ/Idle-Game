# Business Visual Identity / Artworks

Status: Dockside is deployed through PR #19 and explicitly accepted live by the user. Its compact artwork/card integration is now the Golden Reference. Neon Laundry is the next authorized task on `neon-laundry-card-identity`; its artwork integration is not yet complete or deployed. Afterdark Customs and Solara Nights remain later steps.

## Goal and sequence

Give each Business a recognizable identity in one original Solara City crime/coastal-city art language. Preserve the compact Operations page rather than rebuilding the page around an image.

1. Dockside Detail — deployed and explicitly accepted live; preserve as the Golden Reference.
2. Neon Laundry — next authorized implementation, following the accepted Dockside treatment.
3. Afterdark Customs — derived performance-shop identity.
4. Solara Nights — derived nightlife identity.

## Recovery history

The first full-width Dockside hero was rejected. The later image-slot integration was also rejected, and PR #16 removed it entirely. The previous version of this document incorrectly described that removed crop as the current integrated reference. It is not the accepted baseline.

The Dockside reintegration started from main `b2d62718021718c034ea5a25ccf7348f3fe2b853`, after the Operations overhaul, HUD containment and Overview/City spacing fixes. PR #19 subsequently delivered the actual storefront crop. The user explicitly accepted that live result and requested the same approach for Neon Laundry, Afterdark Customs and Solara Nights. Neon Laundry starts from the preserved post-PR-19 baseline, not from an earlier rejected layout.

## Actual artwork provenance

Source: the user-approved generated Dockside UI concept provided in this conversation, `a_polished_cinematic_ui_concept_infographic_layou.png` (1024 x 1536). The original concept is not a gameplay screenshot and is not shipped wholesale.

The runtime image is the storefront-only crop `(left=460, top=170, right=1024, bottom=440)`: Dockside's physical sign, lit service bay, palms and warm waterfront skyline. Baked statistics, mock buttons, prices and other mock UI outside this crop are excluded. No new illustration, franchise asset or CSS imitation replaces the reference.

- Runtime path: `src/assets/businesses/dockside-detail-storefront.webp`.
- Size: 564 x 270 pixels, 24,454 bytes, WebP quality 55.
- SHA-256: `1a11043748570e62bab09bc877b145780e8f1ee0fea144d33e83b398b66d7441`.
- Git blob: `d521c442360be013a11b1b89f683dfb3c51ec1ec`.
- Uploaded blob hash matches the locally decoded/inspected asset exactly.

The small source is suitable for a compact strip, not a high-resolution full-screen hero. It must not be represented as a new high-resolution render. The legacy `dockside-detail-card.webp` is unused; this pass does not depend on it.

## Layout and implementation contract

`business-artwork.ts` currently maps only the stable Dockside ID to a presentation asset. `BusinessArtwork.tsx` is decorative and has no game commands. BusinessCard adds this component above its existing content without replacing stats, requirements, navigation targets or action controls.

`BusinessArtwork.css` scopes every rule to artwork inside Operations Business cards. It does not redefine `.panel`, the Business grid, HUD, Operations navigation, Overview, City or Garage. Existing two-card rows above 900px and one-card rows at/below 900px remain unchanged.

The strip has bounded height (normally 112–160px depending on viewport and root font), fluid width and `object-fit: cover`. It never spans the whole Business row. Pending images remain hidden and use eager loading; a failed or zero-width decode removes the entire artwork component. No empty black image placeholder remains. Navigation away/back remounts the artwork so a later valid load can succeed.

There is a small layout reveal when the image finishes loading; avoiding a persistent empty slot takes precedence here. Artwork is 24KB and eager. Name, status, level, all values, Earnings Details and purchase/upgrade buttons remain real localized HTML. Existing English/German copy and original Solara satire are preserved.

## Historical Dockside verification checkpoint before release

The previous production artifact was rendered in offline Chromium, with a source-equivalent tiny artwork component patch and the exact candidate stylesheet/image. Browser navigation to local HTTP was blocked in that sandbox, so the harness embedded the real bundle/assets and supplied an in-memory localStorage adapter. It did not fabricate the game DOM or inject GameState.

- 16 candidate geometry cases plus the same 16 baseline cases passed: EN/DE at 320, 390, 740, 900, 901, 1024, 1440 and 1920px.
- Exactly one decoded 564x270 artwork; two/one Business columns at the unchanged breakpoint; no page overflow at those sizes; static Operations category bar and contained HUD XP.
- Actual delivery, Dockside acquisition, equipment purchase, Business upgrade and Earnings Details interactions passed.
- Navigation away/back retained gameplay and reloaded the decorative image.
- An invalid image removed the artwork slot while all four Business cards and their buttons remained present.
- Desktop and mobile screenshots inspected; asset RIFF length and exact checksum verified.

Six Vitest regression tests were added for mapping, pending/ready/failed/empty loading and binary integrity; they were not executed during that original integration session. PR #19 and its release-verification comment contain the subsequent production-build and artifact evidence. These historical results are not a test report for Neon Laundry.

## Neon Laundry handoff

Preserve the accepted Dockside artwork, component behavior and responsive card layout. Neon Laundry needs its own laundromat storefront image, not a recolored Dockside image or an empty placeholder. Keep every price, requirement, production figure and action in the existing game-driven HTML.

The intended English/German tagline pair is `Fresh sheets. Questionable receipts.` / `Saubere Wäsche. Fragwürdige Belege.`. Flavor copy belongs in the presentation localization layer, not gameplay state. The next implementation must distinguish completed code, available artwork, executed checks, GitHub commits and actual deployment. No Neon Laundry image is approved or integrated merely by recording this handoff.

## Freeze and handoff

Presentation only. No GameState, Save v17 / CE1, prices, production, levels, gates, automation, XP, Heat, RNG or offline changes. Dockside's accepted result remains unchanged.

Complete and verify Neon Laundry before proceeding to Afterdark Customs and Solara Nights. Each new artwork/card result needs live visual review. Active Vehicle, Tier-1 Garage and Heat / Police 2.0 remain later phases.
