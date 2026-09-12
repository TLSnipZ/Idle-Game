# Solara City Branding

Status: implementation in progress.

## Goal

Give Solara City a recognizable identity before the Business artwork pass without introducing new gameplay, content authority or save state.

The direction is **sunset crime-city sophistication**, not generic casino neon. Solara should feel warm, expensive, slightly dangerous and unmistakably after-dark while remaining compatible with the existing cool dark UI.

## Core identity

### Symbol

The canonical mark combines:

- a warm setting sun;
- a cool geometric horizon / street-line motif;
- a rounded dark container that reads clearly at favicon and compact UI sizes.

The symbol intentionally avoids vehicle, weapon, dollar-sign or real-world brand imagery so it can represent the whole city rather than one feature.

### Wordmark

The primary lockup uses `SOLARA` as the dominant name and `CITY` as the spaced secondary line. Warm sunset color is reserved for `CITY` and the symbol while the main word remains high-contrast.

The header uses the full lockup. Compact surfaces may use the symbol alone.

## Surfaces in this phase

- application header lockup;
- browser favicon;
- browser title / application metadata;
- subtle header/footer brand accents.

This phase does **not** create Business artwork, district art, crew portraits, vehicle art, a city map, splash screen or loading screen. Those remain separately scoped.

## Accessibility / implementation contract

The visual symbol is decorative inside the header; the lockup exposes one accessible `Solara City` label instead of reading decorative pieces separately. The favicon is an SVG asset and has no gameplay dependency.

Branding is presentation-only. Save v17 / CE1, GameState, economy, balance, requirements, RNG, localization authority and runtime behavior remain unchanged.

## Handoff

After live visual acceptance, the next phase is **Business Visual Identity / Artworks**. It starts with Dockside as the Golden Reference before extending the approved direction to Neon Laundry, Afterdark Customs and Solara Nights.
