# Heat IV — MANHUNT

## Playable rules

MANHUNT is the existing local 80–100 Heat tier with an enforced police roadblock:
the player cannot leave that operating district until Heat is below 80.
Current-location selection remains a no-op. Entering an owned hunted district is
allowed and then its roadblock applies; a cold parked district does not bypass it.
Open City Events retain their independent travel gate and must still be resolved.

The optional **Decoy convoy** costs **$1,250** and removes **30 local Heat**.
It is available only during local MANHUNT and when affordable, so one successful
use ends the pursuit and another click cannot charge again. At 80/90/100 it ends
at 50/60/70. The maximum case clears the roadblock but remains HOT; risky jobs
still require Heat below 60. No Cash reward, XP, job count, event resolution,
vehicle consumption or permanent reward is granted. Parked Heat is untouched.

Normal/discreet deliveries remain available, and Dispatcher routing/batching,
job penalties, production, events and passive cooling retain their existing rules.
At 79 a normal delivery can enter MANHUNT; a discreet job at 80 ends it at 78.
This creates a travel decision before pushing a district to the top tier.

## Balance and free recovery

A decoy removes 30 Heat for $1,250, compared with $1,500 for three Lay Low actions
removing the same amount. It is a pursuit-only bulk discount, paid voluntarily.
At 80, one $500 Lay Low or one paid discreet delivery already reopens travel;
the decoy buys extra breathing room. At 100, eleven discreet deliveries or 21
base cooling intervals clear the pursuit without a payment. Mara/Lilt shorten
cooling as before. No random arrest, confiscation, compulsory fine or cash deadlock.
Offline cooling can clear roadblocks but never auto-buys decoys.

## Authority, persistence and UI

Save **v20 / CE1 unchanged**. Pursuit, blockade and exact preview derive from the
existing authoritative local Heat; no saved duplicate flag, countdown or mode.
Old valid saves retain all values and gain the prospective travel rule.
Import/reload reconstruct the same pursuit from district Heat. Rebirth/New Game
clear it through the existing fresh-city reset.

The pure command validates the complete state, checks current local pursuit, and
spends/cools atomically. Its dedicated runtime entry reconciles first, then uses
the existing guarded write-before-publication path. Failed storage/conflicting
tabs retain reconciled money and Heat; success feedback follows durable storage.
If cooling ended the pursuit before the click, no payment occurs. Travel treats
a Heat-based preflight rejection as dynamic and reconciles before rechecking it;
fixed invalid IDs/ownership, same-location no-ops and event gates keep their rules.

Operations and City show local roadblocks, the Heat required to clear them,
exact cost and post-action Heat, and cheaper/free alternatives. Disabled travel
has an explanation. The same component handles both sections. All prose and
accessible descriptions use English, German and full Villager localization.
No new timers, dependencies, artwork or speculative police systems.

## Verification

Required: strict build; complete suite; boundary, exact payment, atomic failure,
two-district, offline, v20/CE1, Rebirth and runtime persistence tests. Existing
315 Chromium cases plus 15 MANHUNT flows across three locales and five widths,
including keyboard activation, payment, travel, reload and overflow checks.
CI evidence pending. Manual live acceptance is recorded separately.

## Next handoff

Heat V — deeper cross-system integration, separately scoped from this release.
