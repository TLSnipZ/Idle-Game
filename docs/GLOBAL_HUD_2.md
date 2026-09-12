# Global HUD 2.0 / Activity Center

Status: **live-complete and manually accepted** after PR #7. Production typecheck/build and GitHub Pages deployment passed; desktop/mobile presentation was accepted by the user.

## Scope

Global HUD 2.0 compresses the always-visible command layer without changing gameplay authority. Cash, Player Level/XP, Heat and Empire Points remain globally visible. Primary five-section navigation remains native and unchanged in responsibility.

The new Activity Center consolidates high-value global situations:

- latest command/session feedback -> rendered inside Activity Center
- pending City Event -> navigates to City
- enabled Business Auto-Upgrader -> navigates to Operations
- Rebirth eligibility and current EP reward -> navigates to Empire
- paused/runtime-critical state -> informational system alert
- quiet state -> compact localized idle copy

All copy follows the English/German Solara localization voice contract.

## Legacy feed retirement

The pre-HUD-2 `GlobalFeedback` visual feed is retired. Normal action, achievement, level, event and automation announcements no longer render as a second visible news strip below the HUD. The live-region announcers remain visually hidden for assistive technology and compatibility, while ordinary latest command feedback is surfaced in Activity Center. Runtime and storage-critical errors remain allowed to render visibly outside the Activity Center because hiding recovery information would be unsafe UX.

There must be exactly one normal global news/activity surface: **Activity Center**.

## Architecture contract

The Activity Center is derived presentation only. It does not persist notification state, resolve events, toggle automation, perform Rebirth, mutate Heat, spend Cash or duplicate gameplay commands. Existing selectors and navigation remain authoritative.

Save v17 / CE1, GameState, economy, balance, requirements, RNG and runtime authority are unchanged.

## Presentation

Desktop uses a compact two-column command row: core stats beside the Activity Center, with primary navigation below. Smaller widths stack the Activity Center while keeping the four core stats horizontally available. Existing focus-visible behavior and native buttons are preserved.

The legacy `.global-indicators` selector remains on the Activity Center as a compatibility contract for existing navigation/runtime tests while the visual treatment is replaced by HUD 2.0.

## Acceptance result

1. production typecheck/build passed;
2. GitHub Pages deploy succeeded;
3. live desktop/mobile presentation was manually accepted;
4. Event, Auto-Upgrader and Rebirth Activity Center items remain navigation-only;
5. EN/DE copy remains localized under the Solara voice contract;
6. Save v17 / CE1 and gameplay authority remain unchanged;
7. legacy visible newsfeed is removed; Activity Center is the sole normal global activity/news surface.

## Handoff

**Next phase: Solara City Branding**, followed by Business Visual Identity / Artworks. Branding should establish the final city identity and favicon without pulling future Business artwork, Active Vehicle, Tier-1 Garage or Heat / Police 2.0 forward.
