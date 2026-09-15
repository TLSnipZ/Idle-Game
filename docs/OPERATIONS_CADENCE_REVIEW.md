# Operations cadence review — standard clicker

Status: **user-requested correction identified during Garage V-A**.

## Problem

Operations Balance II intentionally put standard, risky and discreet manual deliveries on one shared 10-second readiness slot. The user has now clarified that this pacing is undesirable for the **standard clicker job**: the ordinary manual action should remain freely repeatable, while cooldown pacing is appropriate for the two special jobs.

This means the merged PR #52 cadence is not the desired final UX even though its portfolio-scaled reward formula remains useful.

## Recommended correction

Split manual cadence by action class:

- **Standard delivery:** no cooldown/readiness gate. It remains the repeatable clicker action.
- **Risky delivery:** 10-second special-action cooldown.
- **Discreet delivery:** 10-second special-action cooldown.
- **Risky + discreet share one special-action cooldown** so a player cannot alternate them to bypass pacing.
- Standard clicks neither consume nor wait for the special-action cooldown.
- Failed risky/discreet commands do not consume the special cooldown.
- No offline backlog of special actions is created; elapsed time can restore at most one ready special action.
- The Operations Balance II reward formulas remain unchanged unless a separate balance analysis proves the unrestricted standard clicker makes the portfolio-scaled manual payout too strong.

## Required implementation follow-up

Before shipping more economy-sensitive Tier-3 balance assumptions, implement and verify this cadence correction as a bounded Operations patch. Update domain state, Save migration if required, EN/DE/Villager UI, tests, browser verification, balance documentation and roadmap. Preserve existing player progress.

Garage V-A should evaluate Tier-3 economics against the corrected standard-clicker contract rather than treating the shared 10-second cooldown as permanent design authority.
