# Business Visual Identity / Artworks

Status: Dockside reference reintegration implemented on `dockside-approved-artwork-integration`; checked production build/deployment and user live acceptance are separate release gates. Further Business artwork is not started.

## Goal and sequence

Give each Business a recognizable identity in one original Solara City crime/coastal-city art language. Preserve the compact Operations page rather than rebuilding the page around an image.

1. Dockside Detail — compact reference integration and live acceptance.
2. Neon Laundry — derived laundromat identity, only after Dockside acceptance.
3. Afterdark Customs — derived performance-shop identity.
4. Solara Nights — derived nightlife identity.

## Recovery history

The first full-width Dockside hero was rejected. The later image-slot integration was also rejected, and PR #16 removed it entirely. The previous version of this document incorrectly described that removed crop as the current integrated reference. It is not the accepted baseline.

This pass starts from main `b2d62718021718c034ea5a25ccf7348f3fe2b853`, after the Operations overhaul, HUD containment and Overview/City spacing fixes. The user explicitly resumed Dockside work. Approval of the original concept is not automatic acceptance of this new in-game crop.

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

`business-artwork.ts` maps only the stable Dockside ID to a presentation asset. `BusinessArtwork.tsx` is decorative and has no game commands. BusinessCard adds this component above its existing content without replacing stats, requirements, navigation targets or action controls.

`BusinessArtwork.css` scopes every rule to artwork inside Operations Business cards. It does not redefine `.panel`, the Business grid, HUD, Operations navigation, Overview, City or Garage. Existing two-card rows above 900px and one-card rows at/below 900px remain unchanged.

The strip has bounded height (normally 112–160px depending on viewport and root font), fluid width and `object-fit: cover`. It never spans the whole Business row. Pending images remain hidden and use eager loading; a failed or zero-width decode removes the entire artwork component. No empty black image placeholder remains. Navigation away/back remounts the artwork so a later valid load can succeed.

There is a small layout reveal when the image finishes loading; avoiding a persistent empty slot takes precedence here. Artwork is 24KB and eager. Name, status, level, all values, Earnings Details and purchase/upgrade buttons remain real localized HTML. Existing English/German copy and original Solara satire are preserved.

## Verification checkpoint before release

The current production artifact was rendered in offline Chromium, with a source-equivalent tiny artwork component patch and the exact candidate stylesheet/image. Browser navigation to local HTTP is blocked in the sandbox, so the harness embeds the real bundle/assets and supplies an in-memory localStorage adapter. It does not fabricate the game DOM or inject GameState.

- 16 candidate geometry cases plus the same 16 baseline cases passed: EN/DE at 320, 390, 740, 900, 901, 1024, 1440 and 1920px.
- Exactly one decoded 564x270 artwork; two/one Business columns at the unchanged breakpoint; no page overflow at those sizes; static Operations category bar and contained HUD XP.
- Actual delivery, Dockside acquisition, equipment purchase, Business upgrade and Earnings Details interactions passed.
- Navigation away/back retains gameplay and reloads the decorative image.
- An invalid image removes the artwork slot while all four Business cards and their buttons remain present.
- Desktop and mobile screenshots inspected; asset RIFF length and exact checksum verified.

Six Vitest regression tests cover mapping, pending/ready/failed/empty loading and binary integrity. They have been added, not executed locally: source/dependency checkout is unavailable because sandbox DNS is blocked. The normal checked Pages build and post-build artifact inspection are still required. Record final release evidence in the PR; do not treat the candidate harness as a substitute for that build.

## Freeze and handoff

Presentation only. No GameState, Save v17 / CE1, prices, production, levels, gates, automation, XP, Heat, RNG or offline changes. No other Business art is generated or integrated in this pass.

After successful release, request live review of the actual Dockside card. Only explicit approval makes this crop/integration the reference for Neon Laundry. Active Vehicle, Tier-1 Garage and Heat / Police 2.0 remain later phases.
