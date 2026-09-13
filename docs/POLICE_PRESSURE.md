# Heat / Police 2.0 II — Police Pressure

## Current phase — Heat III: District Heat

Implemented: separate Waterfront/Neon Heat, durable owned-district travel,
local manual actions/events and Waterfront Dispatcher. Save **v20**, CE1 unchanged.
See [District Heat](DISTRICT_HEAT.md) for rules and compatibility. Verification passed; see the [PR #31 evidence](https://github.com/TLSnipZ/Idle-Game/pull/31).
Next separate scope: **Heat IV — MANHUNT**. Earlier phase records below are historical.

## Scope

Authorized by the next-phase request after PR #29. Police Pressure is derived from
existing city Heat, with visible consequences and active counterplay. Save **v19**
and **CE1** remain unchanged. This completes II only; District Heat is next.

## Rules and balance

| Starting Heat | Risk premium | Ordinary job multiplier | Discreet base payout |
| --- | --- | --- | --- |
| 0–39 | +50% | 1.00 | $12.50 (positive Heat required) |
| 40–59 | +25% | 1.00 | $12.50 |
| 60–79 | Risk unavailable | 0.90 | $11.25 |
| 80–100 | Risk unavailable | 0.75 | $9.37 |

This prospectively changes the Phase I premium at WATCHED. Standard delivery,
Dispatcher, business production and passive cooling rules are unchanged.
Police Pressure uses the same authoritative Heat thresholds; it is not a second
meter, separate saved state or random encounter system.

**Discreet Delivery** is a manual Operations action: 50% of the exact standard
manual Cash calculation, zero XP, and up to **−2 Heat**. Disabled at zero Heat.
At Heat 1 it removes 1 and clears the cooling remainder; positive Heat preserves
the remainder. Bonuses and the start-tier penalty apply before one final cent floor.
A job starting at 80 therefore pays $9.37 and ends at 78; the next pays $11.25.
It counts once as a completed manual job and preserves historical peak Heat.

No cooldown or automation: this is active player counterplay. A cold base cycle
of one risky delivery and three discreet deliveries earns $75 / 10 XP over four
clicks and returns to zero Heat. Four normal deliveries earn $100 / 40 XP and
add four Heat. Repeating the cooling loop trades Cash/XP efficiency for discretion.
Lay Low retains its instant $500 / −10 alternative; Mara/Lilt retain passive value
for idle play. This is a transparent local tradeoff, not a global optimality claim.
Below 40, risky pays $37.50; at 40–59, $31.25, with unchanged +5 Heat / base 10 XP.

## Integration and presentation

Feature-public pressure derivation supplies both UI and exact action modifiers.
The existing atomic manual completion now supports a cooling delta and explicit
zero-XP action. Failures cannot partially spend, earn, count or cool. Runtime
reconciles before selecting the reward and before checking positive Heat.
The existing publish-then-save policy for manual actions remains; save failures
are surfaced, not represented as successful durable persistence.

Operations shows current risk premium, cash, XP, Heat change and the discrete
cooling action. City adds Police Pressure with thresholds and countermeasures.
EN/DE use original satirical Solara copy; Villager transforms all text.
No new timer, saved mode, confiscation, forced fine, arrest or offline action.
Rebirth still resets Heat; permanent statistics and vehicles retain existing rules.

## Acceptance

Strict build, full suite, pressure threshold/rounding/atomic failure/save tests,
reconciliation and persistence tests, localized UI, and 15 production browser
pressure flows over all three locales at 320/390/740/1024/1440px. Existing 285
browser cases remain required.

Verified in [PR #30](https://github.com/TLSnipZ/Idle-Game/pull/30):
[run 34777563745](https://github.com/TLSnipZ/Idle-Game/actions/runs/34777563745)
on `bf28818fd514cc68baf74f6bd90c18dc6b11ae7b`: strict build, **2,354/2,354 tests**
(39 added, zero failures/skips), **45 Garage + 225 section + 15 risk + 15 police
Chromium cases**, and whitespace checks passed. Evidence artifact: `10323499963`.
This final follow-up changes documentation only. Merge/deployment evidence is
recorded in the PR; manual live acceptance remains separate.

## Next handoff

**III — District Heat**: separately scope territorial Heat ownership, travel/action
attribution and migration before implementation. Existing MANHUNT remains the
80+ label/cash penalty, not the future full pursuit state.
