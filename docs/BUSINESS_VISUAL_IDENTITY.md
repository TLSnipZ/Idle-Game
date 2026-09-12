# Business Visual Identity / Artworks

Status: Dockside Golden Reference candidate review.

## Goal and sequence

Give each current Business a recognizable visual identity while preserving one coherent Solara City art language. The first approved asset is Dockside; all later Business art derives from its camera, lighting, detail density and crop behavior.

1. Dockside Detail — Golden Reference.
2. Neon Laundry — derived utility / laundromat identity.
3. Afterdark Customs — derived performance-shop / street identity.
4. Solara Nights — derived premium nightlife identity.

No later Business artwork is promoted before Dockside is explicitly approved.

## Dockside Golden Reference contract

The production reference must read as a believable premium game-rendered Business exterior inside Solara City:

- cinematic exterior three-quarter view;
- nighttime / late-evening coastal industrial district;
- Dockside Detail establishment is the focal point, not a random hero vehicle;
- wet asphalt, painted metal, glass and believable industrial material response;
- controlled cyan/pink practical lighting with restrained warm industrial highlights;
- dock containers, service/detailing-bay cues and port infrastructure support the location without dominating it;
- no real-world brands, copied franchise typography or trademarked vehicle identity;
- no baked gameplay prices, stats, requirements, buttons or UI labels;
- quiet margins keep the central establishment readable across desktop, tablet and narrow-card crops;
- detailed stylized realism consistent with the existing Kairo KX-R rendering direction, not stock-photo photorealism or cartoon art.

## First candidate review

The first generated Dockside mood candidate is useful **direction evidence**, but is not the Golden Reference yet. It establishes attractive harbor atmosphere, wet-surface lighting and a strong Solara coastal-city mood. However, it currently behaves too much like a promotional poster / city-wide harbor showcase, includes substantial baked presentation text and gives a hero vehicle too much visual priority.

The next production candidate must therefore tighten the frame around **Dockside Detail itself**, remove poster/UI copy from the image, reduce vehicle dominance and lean further into nighttime industrial cyan/pink practical light while retaining restrained warm highlights.

Generated candidates remain review material only. Nothing is imported into the runtime bundle until explicit user approval.

## Crop / integration contract after approval

The approved source must remain useful at wide desktop and narrow stacked-card widths. Keep storefront/service-bay identity in the central safe zone; secondary props may be lost at narrow crops. Critical gameplay information remains HTML.

After explicit approval:

- optimize the approved source for runtime, preferably WebP;
- map the stable Business ID to presentation artwork outside GameState;
- render it responsively in `BusinessCard` with fluid width, contained overflow and stable crop behavior;
- preserve Business name, ownership, Level, price, production, requirements and actions as HTML;
- perform live desktop/mobile crop acceptance before extending the style to the remaining Businesses.

## Freeze

This phase is visual-only. Business prices, production, levels, gates, upgrade formulas, automation, offline behavior, Save v17 / CE1, RNG, localization and runtime authority remain unchanged. Active Vehicle, Tier-1 Garage and Heat / Police 2.0 remain later phases.
