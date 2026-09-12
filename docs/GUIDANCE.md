# Next Objective / Guidance

Status: **implemented, deployed and manually accepted live**. The compact / expandable presentation polish merged in PR #9 and its production Pages build/deploy passed.

## Current presentation

Next Objective is shared across Overview, Operations, City, Collection and Empire. It remains presentation-only and uses the existing catalog-backed guidance selector, requirements and destination navigation.

The surface is now **compact by default** so it no longer competes visually with Global HUD 2.0 / Activity Center.

### Collapsed state

Always visible:

- Next Objective / suggested-or-tracked status;
- current step title;
- one compact key progress summary (Cash or count/level);
- localized `Details` disclosure.

Secondary flavor may disappear first on very narrow mobile widths; gameplay-critical target/progress remains visible.

### Expanded state

Opening Details reveals the existing full guidance:

- named long-term goal;
- count/XP and Cash progress bars;
- contextual note / prerequisite explanation;
- navigation-only destination button;
- optional goal selector/filter and its tracking explanation.

The disclosure uses `aria-expanded` / `aria-controls`. Existing labeled progress bars, selector, destination focus behavior and 44px touch targets remain preserved.

## Authority / persistence contract

Guidance receives state and navigation only. It cannot purchase, upgrade, recruit, assign, toggle automation, resolve Events, Rebirth or reset progress. Existing requirement evaluators, catalogs, prices, progression and reward previews remain authoritative.

The expanded/collapsed state is in-memory UI only and is not written to GameState, local storage, Save v17 or CE1. Optional goal tracking remains in-memory as before. Successful replacement/remount returns the card to its compact default.

## Freeze

PR #9 changed presentation only. Save v17 / CE1, economy, balance, gates, RNG, runtime and the guidance selection policy remain unchanged.

The next roadmap phase is **Solara City Branding**, followed after live acceptance by **Business Visual Identity / Artworks**.
