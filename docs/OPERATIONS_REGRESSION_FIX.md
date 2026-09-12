# Operations Regression Recovery

Status: recovery pass after rejected Dockside integration.

## Root cause

The compact Dockside correction added a new scoped stylesheet but left the earlier full-width Golden Reference rules in `sections.css`. Both rule sets were active at once. The stale rules still forced a full-width Business grid span, oversized hero dimensions and management-panel layout, so the Operations page was visually fighting itself.

## Recovery contract

- restore `sections.css` exactly to the last accepted pre-Business-art baseline;
- keep Dockside inside the existing two-column Business grid on desktop;
- scope new artwork rules only to `.dockside-reference` / `.dockside-card-art`;
- retain the collapsible earnings/modifier disclosure;
- do not restyle the global Upgrades/Automation/Jobs sections as part of Dockside artwork;
- keep narrow-screen stacking behavior from the established Operations layout;
- no gameplay, Save v17 / CE1, economy, balance, gate, RNG or runtime changes.

Future Business visual work must be additive and locally scoped. It must not overwrite or duplicate shared Operations layout rules.