# Business Visual Identity / Artworks

Status: Dockside compact Golden Reference integration under live review.

## Goal and sequence

Give each current Business a recognizable visual identity while preserving one coherent Solara City art language. Dockside establishes the reference; later Businesses derive its artwork treatment without changing the compact two-card Operations layout.

1. Dockside Detail — compact Golden Reference.
2. Neon Laundry — derived utility / laundromat identity.
3. Afterdark Customs — derived performance-shop / street identity.
4. Solara Nights — derived premium nightlife identity.

No later Business artwork is promoted before the corrected Dockside card is explicitly accepted live.

## Locked layout rule

Business artwork must **not** turn a normal Business into a full-width hero surface. On wide layouts, two Business cards remain able to sit beside each other just as before the artwork pass. Artwork enriches the card; it does not redefine the entire Operations hierarchy.

Dockside therefore uses:

- a compact 16:9 artwork strip inside the existing card footprint;
- the existing Business name, status, Level, production and upgrade controls as HTML;
- an optional disclosure for Earnings / modifier details;
- normal grid participation rather than spanning the full Business row;
- responsive stacking only at the existing narrow breakpoints.

## Dockside artwork direction

The approved visual target is the previously user-approved Dockside concept direction: premium cinematic Solara waterfront detailing, wet reflective pavement, service bays, harbor infrastructure, warm sunset/industrial practical light against dark cyan/navy shadows, and a high-end criminal-business feel.

The first live implementation was rejected because its visible treatment did not resemble the approved concept closely enough and the card became too large/present. The correction uses a crop derived directly from the approved concept artwork as the current runtime reference, removes the oversized hero layout, and keeps gameplay information outside the image.

The crop is presentation-only and may be refined further after live review. No fake statistics, buttons or gameplay outcomes from the concept mockup are authoritative.

## Integration contract

- runtime art is optimized WebP;
- asset location is presentation-only and never stored in GameState / Save v17 / CE1;
- Business name, ownership, Level, price, production, requirements and actions remain real HTML/game data;
- artwork uses fluid width with crop-safe `object-fit: cover`;
- Earnings details remain optional and collapsible;
- desktop preserves two-card Business density; mobile stacks normally.

## Freeze

This phase is visual-only. Business prices, production, levels, gates, upgrade formulas, automation, offline behavior, Save v17 / CE1, RNG, localization and runtime authority remain unchanged. Active Vehicle, Tier-1 Garage and Heat / Police 2.0 remain later phases.
