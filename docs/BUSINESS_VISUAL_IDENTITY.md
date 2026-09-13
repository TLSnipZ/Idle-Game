# Business Visual Identity / Artworks

Status: Dockside is deployed through PR #19 and explicitly accepted live as the Golden Reference. PR #20 now contains the complete Neon Laundry storefront and EN/DE identity package, not just the earlier text checkpoint. Local production build, focused tests and browser checks passed. Consult PR #20's release-verification comment for the final merge/deployment status. User visual acceptance of Neon Laundry remains separate. Afterdark Customs and Solara Nights are not integrated by this pass.

## Goal and sequence

Give each Business a recognizable identity in one original Solara City crime/coastal-city art language. Preserve the compact Operations page rather than rebuilding it around an image.

1. Dockside Detail — deployed and explicitly accepted live; preserve the Golden Reference.
2. Neon Laundry — complete artwork/copy package in PR #20; live review after release.
3. Afterdark Customs — next performance-shop identity after Laundry acceptance.
4. Solara Nights — subsequent nightlife identity.

## Recovery history

The first full-width Dockside hero and subsequent unfinished image-slot treatment were rejected; PR #16 removed that slot. Dockside reintegration started from main `b2d62718021718c034ea5a25ccf7348f3fe2b853`, after Operations, HUD and section-spacing fixes. PR #19 delivered the actual storefront crop, and the user explicitly approved its live result. The Neon Laundry work preserves the post-PR-19 baseline `a71d70062a9ab6999397c9de9d21fd5b7b4d404c`.

PR #20 initially held only presentation copy. Its missing-artwork checkpoint is superseded by the complete asset integration and verification below. No standalone generated UI mockup replaces the game.

## Dockside artwork provenance — unchanged

Source: the user-approved generated concept `a_polished_cinematic_ui_concept_infographic_layou.png` (1024 x 1536), storefront crop `(460, 170, 1024, 440)`. The source is not a gameplay screenshot. Baked mock statistics and controls are excluded.

- Runtime path: `src/assets/businesses/dockside-detail-storefront.webp`.
- Size: 564 x 270, 24,454 bytes, WebP quality 55.
- SHA-256: `1a11043748570e62bab09bc877b145780e8f1ee0fea144d33e83b398b66d7441`.
- Git blob: `d521c442360be013a11b1b89f683dfb3c51ec1ec`.

This modest source is for a compact strip, not a high-resolution hero. The legacy `dockside-detail-card.webp` remains unused. Original integration and production-artifact verification are recorded in PR #19; those historical checks are not the Neon Laundry test report.

## Neon Laundry artwork provenance

Source: the original generated Solara concept `a_cinematic_neon_soaked_ui_dashboard_screenshot_w.png` (1526 x 1030) from this conversation. Only the upper-right laundromat facade was extracted: `(left=776, top=16, right=1508, bottom=204)`. The rest of that generated concept, including its mock UI and other Business images, is NOT shipped.

The crop contains the physical Neon Laundry sign, washing-machine windows and coastal evening setting. No copied franchise assets, real-world brands, gameplay values, buttons or mock requirements are baked into the runtime strip. Its in-game visual acceptance has not been assumed.

- Runtime path: `src/assets/businesses/neon-laundry-storefront.webp`.
- Size: 732 x 188, 23,126 bytes, WebP quality 70.
- SHA-256: `152fa1bf7ef1329720d7022f067546454610b8f7dff3d405eb695ab35a93dcc5`.
- Git blob: `76faaa7cf11946f41bc37dae50b3bc6f0a6a4739`.
- Uploaded blob, checked-out image and decoded dimensions were verified against the inspected crop.

## Layout and authority contract

`business-artwork.ts` maps the stable Dockside and Neon Laundry IDs to distinct presentation assets. The existing `BusinessArtwork` renderer is reused without modification. Pending images are hidden but loaded eagerly; failed or empty images remove the complete strip, not the card or its controls. The small image reveal on successful load remains the existing tradeoff against reserving a black placeholder.

All stylesheets are unchanged by PR #20. Both strips therefore use the same bounded height and crop rules. The existing grid retains two Business cards above 900px and one at/below 900px. No full-row span, HUD modification, sticky category bar or new empty slots for later Businesses are introduced.

Prices, ownership, Level, production, requirements, Earnings Details and actions remain HTML driven by existing selectors and commands. The optional Business tagline now comes from presentation localization. Dockside's accepted text is unchanged. Laundry uses `Fresh sheets. Questionable receipts.` / `Saubere Wäsche. Fragwürdige Belege.` and its own localized description.

## Executed Neon Laundry verification

A fresh checkout and `npm ci --include=optional --no-audit --no-fund` ran under Node 24.21.0. `npm run build` passed strict TypeScript and production bundling.

- 16 focused tests passed: both assets' mapping/loading/error behavior, EN/DE Laundry purchase/upgrade intents after an image failure, asset integrity and existing HUD guards. These tests are committed in existing test files, unlike the earlier blocked new-file upload.
- Full unchanged-main suite: 2,151 tests, 2,087 passed and 64 failed. Candidate: 2,158 tests, 2,094 passed and the same 64 failures. No new failing cases; the complete suite is NOT green, and prior failures remain separate work.
- 16 paired Chromium cases (32 page renders): EN/DE at 320, 390, 740, 900, 901, 1024, 1440 and 1920px. Real baseline/candidate Vite production builds were served over local HTTP; no simulated component markup or injected candidate CSS.
- Both decoded storefronts display with equal strip heights; Business column counts/widths, static category navigation, contained HUD XP, Overview/City gaps and navigation through all five sections remain intact.
- Two EN/DE real-app action flows passed: Laundry purchase, upgrade, Earnings Details, save/reload and changing language through Settings.
- Two EN/DE blocked-image flows passed: no Laundry image slot remains, and acquisition still works.
- Known baseline issue retained: German 320px viewport has 10px document overflow both before and after. No new overflow was introduced; do not claim universal zero overflow.

The browser used disposable, schema-validated test saves. No user save was accessed or modified. Generated screenshots and reports are verification artifacts, not runtime assets. The main-only Pages workflow must independently pass after merge; it does not run Vitest.

## Freeze and handoff

Presentation only. No GameState, Save v17 / CE1, prices, production, levels, gates, automation, XP, Heat, RNG, offline rules, package manifests or workflow changes. Keep the repaired Operations, HUD and section-spacing baseline.

After PR #20 is successfully released, request live review of the actual Laundry card. Only then continue with Afterdark Customs followed by Solara Nights. Active Vehicle, Tier-1 Garage and Heat / Police 2.0 remain later phases.
