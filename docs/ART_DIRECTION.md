# Solara City Art Direction

## Identity and scope

Solara City is a premium crime-empire game set in a dark tropical coastal city at
night: nightlife, underground street culture and automotive luxury. Miami Art Deco
informs restrained geometry and pink/turquoise contrast, not franchise imitation.
POST 1A establishes the reusable visual foundation; it does not finish every card.
No logo, font files, generated artwork or Golden References are delivered here.
The text wordmark is system typography, not an approved logo asset.

## Tokens and palette

`src/styles/tokens.css` is the implementation source of truth. `App.css` applies
these roles to the frozen five-section layout. Values are presentation-only.

| Role / token | Value | Use |
| --- | --- | --- |
| `--color-background` | `#080e1b` | Calm near-black navy page and inset tracks |
| `--color-surface` | `#111c2e` | HUD, standard cards, forms |
| `--color-surface-elevated` | `#20253d` | Violet/navy feature elevation |
| `--color-border` | `#3c4963` | Quiet separators; never the sole state signal |
| `--color-text` | `#f4f3fa` | Primary readable copy |
| `--color-secondary` | `#c7cede` | Supporting descriptions |
| `--color-muted` | `#abb6cc` | Labels and unavailable controls; never low-opacity copy |
| `--color-accent` | `#ff91c4` | Magenta navigation and event emphasis |
| `--color-cool` | `#78e4dc` | Turquoise cash, operational information, progress |
| `--color-warm` | `#f2ca87` | Restrained gold for permanent progression |
| `--color-success` | `#97e5be` | Owned/positive status |
| `--color-warning` | `#ffd18e` | Caution and noticed Heat |
| `--color-danger` | `#ffacb5` | Reset, errors and MANHUNT |
| `--color-info` | `#a5d9ff` | Discrete ordinary feedback |
| `--color-violet` | `#c9b3ff` | Reserved premium detail within this palette |
| `--color-hot` | `#ffb184` | HOT Heat |
| `--color-focus` | `#b1fff3` | Strong solid keyboard outline |
| `--color-action` / `--color-action-end` | `#98255d` / `#663a96` | Consistent primary-action gradient, white labels |

Ambient pink/cool tints and shadows are centralized too. New reusable colors must
be tokens, not repeated component literals. The existing CSS Dockside storefront
is a decorative foundation illustration, not an approved asset reference.

## Typography and geometry

Use the native system sans stack for body, controls and numbers; Arial/Helvetica
fallbacks provide a sturdy display stack. No remote font request or font binary.

| Element | Direction |
| --- | --- |
| Text wordmark | Uppercase, bold, wide tracking; no GTA-like lettering |
| Section h1 | Responsive 1.7–2.5rem, wide uppercase; one active heading |
| Subsection / card headings | Strong weight, logical h2/h3; appearance never determines semantics |
| Vortex model name | 2–3.5rem display emphasis, future showroom anchor |
| Body | 1rem default, comfortable line height, readable supporting copy |
| HUD / stats | Tabular numbers, `--text-stat`, wrapping for very large Money |
| Labels / badges | `--text-label`, restrained tracking, explicit words |
| Buttons | Clear contextual names, medium/bold weight, practical touch area |

Spacing: xs .25rem, sm .5rem, md 1rem, lg 1.5rem, xl 2rem, 2xl 3rem.
Existing numbered spacing aliases remain compatible. Use the scale for new work;
responsive clamps may remain where useful. Radii: control .5rem, card .75rem,
feature 1rem. Avoid bubble-like pills and arbitrary new radii.

Quiet cool borders organize surfaces. Active navigation adds a magenta inset edge,
background and underline. Standard/elevated shadows convey depth; accent glow is
reserved for rare emphasis, never every card. Focus uses a **3px solid outline**
with an offset and dark separation, not glow alone.

Static dark surface gradients may enrich feature cards. Primary buttons use the
single magenta-to-violet action gradient. Atmospheric page gradients stay faint.
Sunset orange-to-magenta is reserved for future special moments, not every panel.

## Component language

- **Status cards:** compact Overview summaries and HUD. Cash/Level lead; Heat and
  EP remain visible. Overview routes to management rather than duplicating it.
- **Standard cards:** shared surface, quiet border, coherent padding. Requirements
  remain readable even when locked. Met/Required text stays separate from cash.
- **Feature cards:** Rebirth, City Events and the Vortex showroom use elevated
  surfaces, more space and selective accent edges. No empty fake artwork slot.
- **Primary actions:** purchases, upgrades and delivery share magenta/violet with
  white text. **Secondary** management uses dark surfaces and cool borders.
  **Utility** navigation uses quiet surfaces. **Danger** review/confirm/import
  replacement uses a rose-tinted surface plus explicit consequence text.
- **Disabled:** native disabled behavior, readable muted text, nearby reason.
  LOCKED, AVAILABLE, INSUFFICIENT CASH, OWNED, ACTIVE, DISABLED, CONTROLLED,
  MAX LEVEL and COMPLETED remain words, not colored dots alone.
- **Feedback:** stable existing regions; informational blue, achievement gold,
  event magenta, error/reset rose. Command success/warning tone comes from the existing result in ephemeral UI
  feedback; never infer severity by parsing message text.
- **Progress:** native semantic progress controls, dark track and steady fill.
  Heat is COLD turquoise, NOTICED pale amber, WATCHED gold, HOT orange, MANHUNT rose.
  Tier text remains authoritative and visible. No siren, flashing or shimmer.

Operations favors turquoise utility lines; City favors magenta/nightlife and Heat
semantics; Collection favors a spacious premium showroom; Empire favors gold and
violet permanence. All share one card/button language. The five section identities,
order, grouping and central runtime are unchanged.

## Accessibility, responsive layout and performance

Preserve skip-to-main, native keyboard controls, focus recovery, contextual names,
restrained live regions and progress labels. No continuously updating stat is a
live announcement. Ordinary runtime updates must never steal focus.

Review foreground/background pairs for body, muted/disabled copy, primary buttons,
requirements, danger feedback and focus. Automated contrast spot checks are a
regression aid, not WCAG or assistive-technology certification. Text/status must
carry meaning independently of color. Never place critical values inside artwork.

Desktop uses balanced grids and a persistent HUD/navigation strip. Mobile stacks
cards and wraps HUD/badges/requirements; navigation spans two rows rather than
shrinking five targets. Preserve approximately 44px practical targets, text zoom,
form resizing and spacing between confirm/cancel. No fixed-height text clipping.

Use static gradients, borders and small shadows. No viewport blur chains, animated
backgrounds, pulsing, autoplay decorative motion or JavaScript visual timers.
Fast/standard transitions are 120/200ms and all are neutralized by the global
`prefers-reduced-motion: reduce` rule. Styling adds no runtime/persistence work.

## Future asset contracts

All categories share cinematic nighttime lighting, navy shadow detail, controlled
pink/cyan practical light and warm highlights. Materials: wet asphalt, painted
metal, glass, brushed metal and restrained stone. Avoid plastic neon everywhere.
Keep subjects readable at card size and under responsive cropping. Text is HTML.

| Category | Locked direction to validate with future references |
| --- | --- |
| Vehicles | Consistent front 3/4 perspective, low but natural camera height, medium/long focal-length feel without wide-angle distortion. Lock scale, frame position, light direction and contact-shadow softness. Premium detailed game rendering, Solara showroom/street environment, fictionalized marques and badges. Center the whole vehicle with generous edge clearance for desktop/mobile crops. |
| Crew | Consistent chest-up portrait, camera distance and eye level, coherent detailed game rendering. One controlled key light and restrained rim; quiet city-night background. Clear silhouette and face, safe head/shoulder margins for narrow crops. |
| Businesses | Consistent exterior 3/4 perspective, cinematic practical lighting, comparable detail density and integration into its district. Establishment is the focal point; leave quiet margins for card overlays and mobile cropping. |
| Territories | Recognizable district silhouette and landmarks within one coherent coastal city. Elevated cinematic district view, shared lighting direction, district-specific accents. Central focal area supports hero cards and future map context without making a map now. |
| Events | One clear scenario, cinematic lighting, medium framing. Keep background low-detail around text-safe edges; make the central action readable in a small card. Do not bake outcomes, prices or text into art. |
| UI icons / decoration | Original simple SVG geometry, consistent stroke/optical weight and readable small silhouettes. Art Deco lines/corners are restrained and decorative. No large icon package, emoji dependence or trademark silhouettes. |

Final camera, cropping and lighting choices become locked only after approval of
actual references. Test desktop/tablet/mobile crops before promoting references.
Decorative imagery gets empty alt/presentation treatment. Informative imagery gets
useful alt; gameplay facts must remain in HTML even when visually illustrated.

## Golden Reference governance

1. Future agents first inspect this document, the relevant approved reference
   folder, and previously approved category assets.
2. Generate a **small candidate batch**, then review composition/style and correct it.
3. Obtain **explicit user approval** of selected candidates and their visual contract.
4. Promote only approved assets into the category reference folder, with approval
   context and framing/lighting notes. Approved Golden References are authoritative.
5. Compare every subsequent small batch against those references before expanding.
6. Reject/correct drift; never dilute the reference pool to accommodate inconsistent art.

Ordinary existing or generated images are **not automatically approved references**.
No reference folders need empty Git placeholders. POST 1A creates no candidate batch.
POST 1B must build on these tokens/contracts; it does not automatically authorize art.

## Organization, naming and licensing

Future folders under `src/assets/`: `branding/`, `vehicles/`, `crew/`, `businesses/`,
`territories/`, `events/`, `ui/`, plus `reference/vehicles/`, `reference/crew/`,
`reference/businesses/`, `reference/territories/`, `reference/events/` for approvals.

Use lowercase descriptive names, e.g. `vehicle_vortex_s9_showroom.webp`,
`crew_rico_vale_portrait.webp`, `territory_neon_mile_hero.webp`. Filenames are
presentation details, **not stable gameplay IDs**. GameState never stores asset
paths. A presentation registry can replace art without a save migration.

Prefer optimized WebP; PNG only for justified transparency/lossless needs; SVG for
simple original UI vectors. Keep source masters outside runtime bundles and avoid
huge unoptimized exports. No pipeline dependency is needed for this foundation.
Use original/generated/properly licensed work; record provenance when importing.
Do not assume internet images are reusable, copy protected franchise art/logos,
or use third-party brands without permission. Fictionalize vehicle branding.
No font files are distributed in POST 1A.

## Prohibited drift / handoff

No GTA/Vice City typography or copied layout, cyberpunk circuitry, generic synthwave
sun grids, vaporwave memes, casino chips, rainbow neon outlines, giant blur halos,
flashing MANHUNT effects or dense SaaS-dashboard chrome. Tropical atmosphere and
luxury are conveyed through restraint, composition and future approved materials.

POST 1B may refine individual components within this foundation. Preserve Save v15,
CE1, stable IDs, post-9C balance, 9D safeguards, five-section navigation and 9B
accessibility. Golden References require a separately reviewed process. New gameplay,
vehicles, tuning, maps, Crew, Events and other expansions are outside POST 1A.

## POST 1A verification record

Three new static tests cover token categories/usage, foreground/background contrast
spot checks and focus/motion/wrapping rules. One existing mounted navigation test
now also checks tier styling, Collection permanence and stable success/achievement
feedback across a runtime tick. The existing suite protects all five sections,
actions, progress semantics, save migrations, content/balance and runtime contracts.

Fresh install, typecheck, all **1,815 tests in 85 files**, production build and
`git diff --check` pass. No authoritative feature/game/platform/shared code, config,
save field, dependency or asset binary changes. Command feedback gains only an
ephemeral UI tone from its existing success/failure result.

Browser review was attempted against the local Vite preview but the cloud browser
returned `ERR_BLOCKED_BY_CLIENT`. Desktop/mobile composition, focus and visual
identity therefore have DOM/static review only here; actual browser/live visual
approval remains pending. No GitHub Pages visual verification or WCAG certification
is claimed. User review should cover all five sections, HOT/MANHUNT, pending Events,
locked cards, Rebirth confirmation and Save/Import at desktop and narrow widths.

## POST 1B composition refinement

POST 1A was manually verified live by the user; its palette, typography, material
language and Golden Reference governance remain authoritative. POST 1B applies
that identity more deeply through composition, without new tokens or imagery.

| Surface | Composition and hierarchy |
| --- | --- |
| Overview | Cash anchors a wider economy block beside Level/XP. Heat and Empire support it; pending Events become a feature strip, idle Events stay compact. Mobile reads economy, player, pressure, empire, event, Crew, Collection. Management stays in its existing section. |
| Operations | Starter work exposes payout/XP/Heat together; Dockside is the larger production anchor. Equipment stays compact below, with a distinct Automation group. Auto-spend disclosure sits immediately before its control; paused/max states remain explicit. |
| City | District control and Heat sit side by side on wide screens. Heat emphasizes value, tier, penalty, cooling and Lay Low in that order. Active assignments precede the Crew roster. Pending situations use two outcome-first choice surfaces; idle state stays compact. |
| Collection | A text-complete showroom stage carries vehicle identity beside permanent effect and acquisition information. Owned vehicles remove purchase clutter. Only the actual catalog appears. |
| Empire | Rebirth pairs readiness/reward with explicit You Keep/You Lose groups. Confirmation presents Cancel first. The foundation skill spans the tree above indented branches, whose textual prerequisites remain authoritative. Achievements form a completion gallery; statistics use a numeric record grid. Export and replacement Import have separate surfaces. |

`src/app/sections.css` contains these domain compositions, grouped by section with
responsive rules last. Shared controls, tokens, focus and reduced motion remain in
the existing stylesheets. No generic card framework, new visual timers, image
requests, motion effects or viewport blur layers are introduced. Use the existing
1000px/740px breakpoints; collapse columns rather than shrinking labels. Keep
content heights flexible, requirements/buttons wrapping and focus rings unclipped.

### Optional artwork insertion points

- **Vehicles:** `showroom-stage` can receive a responsive wide image (approximately
  16:9) while keeping the model heading and permanent status in HTML. It is complete
  with text now; never reserve a giant empty image box.
- **Crew:** `crew-identity` can accept a portrait beside the identity block. Keep
  role/effect/assignment readable without imagery and collapse gracefully on mobile.
- **Territories:** `territory-story` can accept a wide district hero above its
  description. Control, effect, acquisition Heat and requirements remain separate HTML.
- **Events:** `event-story` can accept a wide cinematic hero. Text-safe cropping must
  preserve the title/description and keep both choices and exact outcomes outside art.

These are optional presentation regions, not saved paths or approved references.
No assets or Golden References were generated in POST 1B. The next reference phase
must be separately requested and use a tiny candidate batch with explicit user
approval before promotion. Preserve POST 1A contracts and this component hierarchy.

### POST 1B review limits

New deterministic composition tests cover reading order, Dockside states, paused/
max Auto-Upgrader disclosure, Heat/Mara, Crew groups, all three Event choice panels,
Garage permanence without images, starter outcomes and Cancel-first Rebirth order.
Existing mounted tests continue to cover actions, navigation without reconciliation,
focus recovery, stable live regions and import/Rebirth state across section changes.
Heat text assertions now ignore inline markup rather than requiring an unbroken
HTML string; exact values and progress semantics remain asserted.

Local browser review was attempted but returned `ERR_BLOCKED_BY_CLIENT`. Desktop,
mobile, zoom and visual identity therefore have structural/static review only in
this environment. Live visual verification remains pending; no GitHub Pages visual
review or accessibility certification is claimed.

## POST 1C presentation conventions

The approved POST 1A identity and POST 1B hierarchy remain unchanged. Live findings
are addressed through compact spacing/copy, never smaller touch targets or hidden
core HUD values. On mobile, whole navigation controls wrap; labels never split.
Cash, Level, Heat and EP stay visible. The redundant mobile tagline may be hidden.
Healthy autosave is a quiet, non-live header label; saving failures retain visible,
polite feedback. Overview has a direct VIEW CREW shortcut to City.

| Context | Deterministic English/US display policy |
| --- | --- |
| Cash balance | Full exact cents, fixed two decimals, grouping: `$1,234.56`. No compact balance by default. |
| Purchase / exact costs | Full exact value; omit `.00` on whole-dollar prices: `$50,000`. Never compact a purchase requirement. |
| Cash rewards | Full exact cents, fixed two decimals; signed outcomes put the sign before `$`. |
| Business rates | Round only display to nearest cent, half up: `$49.40/sec`, `$51.55/sec`, `$0.86/sec`. Fixed two decimals, no approximation prefix. |
| XP / EP / levels / statistics / Heat | Integers, grouped where useful; no decimal zeros. |
| Percent effects | Signed concise percentages, e.g. `+15%`, `-10%`, `+0.01%`; no trailing fractional zeros. |
| Optional large summaries | Central helper keeps values below 1,000,000 full; M/B/T use two decimals. Beyond the T range, retain full digits. Not applied to prices, costs, rewards or current Cash. |

`src/app/number-format.ts` consumes exact already-derived cents/rationals and never
feeds display rounding back to simulation. Existing `formatCash` and XP/bonus
entry points reuse that policy. `RateValue` groups the rate and `/sec` in an inline
flex row; exceptionally long digits can wrap inside the value while the unit stays
beside it. Never apply nowrap to whole panels or hide exact prices in tooltips.

Status: LOCKED means missing progression prerequisites, followed by concrete
Required/Met rows. Avoid repeating generic “requirements not met” beneath them.
AVAILABLE means unlocked, not necessarily funded; show INSUFFICIENT CASH/EP when
needed. Skills with funds say READY TO PURCHASE, maxed skills retain MAX RANK.
Empty slots have one absence message and static assignment guidance. Normal cards
explain consequences, not fractional remainders or batch-rounding internals.

No gameplay, assets, fonts, dependencies or guidance engine are introduced. Preserve
these conventions in subsequent Garage/asset work along with approved reference governance. See
[POST_ROADMAP.md](POST_ROADMAP.md) for current status and deferred priorities.


## POST 2A — Vehicle Art Style and canonical models

[VEHICLE_CATALOG.md](VEHICLE_CATALOG.md) is the future Garage planning authority.
The user approved earlier external **Candidate A for Vehicle Art-Style Direction
only**: premium realistic game-render quality, front 3/4 low natural automotive
camera, vehicle-dominant responsive framing, Solara coastal-night showroom,
wet/polished floor, grounded contact shadow, restrained reflections and navy /
turquoise / magenta / warm lighting. Its depicted sedan is **not** an approved
production model. No image is integrated or promoted by this documentation pass.

An **Art-Style Reference** defines shared camera, rendering, lighting, environment
and composition. A **Vehicle Model Reference** defines one canonical fictional
body, proportions, lamps, grille, surfaces, aero, wheels and badges. No Golden
Vehicle Model Reference exists yet. Kairo Motors / Kairo KX-R is the confirmed
future first-car concept; Vortex stays live pending explicit implementation.

Future models may strongly evoke real automotive eras/archetypes, but must alter
identifying lamps, intakes, bumpers, rear graphics, surfaces, aero and branding.
Do not commission exact real cars with logos removed. Real-model references stay
in developer notes; player names and badges are fictional. The KX-R keeps compact
1990s performance-hatch DNA with its own canonical details. The next phase is
**POST 2B — Kairo KX-R Golden Reference**, a small user-reviewed candidate set.

Future tuning uses each approved base Model Reference to create controlled reviewed
variants while retaining identity and the shared Art Style. Favor curated feasible
image combinations; do not promise arbitrary in-browser generation, a 3D configurator
or thousands of full renders. Keep files independent of saved vehicle/build IDs.
Inspect this document, the applicable explicitly approved assets and catalog model
notes before any generation. Missing approved image sources must be recovered or
requested, never replaced silently. User approval precedes reference promotion.
