# Operations Page Overhaul

Status: implementation in review before live acceptance.

## Why this pass exists

The Operations surface had accumulated several generations of layout rules. Jobs consumed too much vertical space, Business cards exposed secondary modifier details permanently, Dockside artwork had become too dominant, and Business/Upgrade/Automation density behaved inconsistently between desktop and mobile.

This pass rebuilds the page as one coherent presentation system without changing gameplay authority.

## UX contract

### Operations navigation

Jobs / Businesses / Automation use one segmented in-page navigation surface. The controls only move focus/scroll to existing semantic destinations and never change GameState.

### Jobs

Waterfront Delivery becomes a compact action card:

- Payout, XP and Heat are visible together as three compact metrics.
- The delivery CTA remains immediately visible.
- Base reward and modifier math move into `Reward details` disclosure.
- All authoritative reward, XP and Heat values remain sourced from existing evaluators.

### Businesses

Desktop uses exactly two Business cards per row at normal wide layouts. Tablet/narrow-window and mobile layouts collapse to one column.

Every Business uses the same information hierarchy:

- identity / ownership;
- name + Level;
- short description;
- compact production / next-level / price metrics;
- optional requirements;
- `Earnings details` disclosure for base/effective production and modifiers;
- existing purchase/upgrade action.

Dockside artwork is a compact card header, not a full-width hero. Artwork never contains authoritative prices, Levels, requirements or actions.

### Upgrades

Upgrade cards use a two-column desktop grid and one-column narrow layout. Effect and price stay visible; detailed requirements collapse when locked. Purchased state remains clear without keeping dead purchase controls visible.

### Automation

Dispatcher and Business Auto-Upgrader sit side-by-side on desktop and stack on narrow layouts. Primary state, timing, payout/target and controls stay visible. Secondary mechanics/explanation move behind disclosures.

## CSS isolation

Operations-specific presentation lives in `src/app/Operations.css` and is scoped below `.operations-page`. The previous `BusinessVisualIdentity.css` is no longer imported into the app shell. Shared global `.panel`, `.action-button`, accessibility and design-token rules remain reusable foundations, but Operations does not redefine unrelated Garage, City, Empire or Collection layouts.

## Responsive acceptance

- Desktop: two Businesses per row; two Upgrades per row; two Automation cards per row.
- Narrow/tablet: one column when cards would become cramped.
- Mobile: one Business per row, compact three-metric Jobs row, touch controls remain at least 44px high.
- No horizontal overflow from cards, metrics, artwork or selects.

## Freeze

Save v17 / CE1, GameState, Business catalog, prices, production, Level formulas, gates, modifiers, automation behavior, RNG, offline simulation, XP and Heat are unchanged. This pass is presentation and information hierarchy only.
