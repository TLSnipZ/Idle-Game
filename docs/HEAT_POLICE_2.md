# Heat / Police 2.0 — I: Risk & Reward

## Scope and authority

The user's request to start the next phase after PR #28 authorizes this first
vertical slice in the retained sequence: I Risk & Reward → II Police Pressure →
III District Heat → IV MANHUNT gameplay → V deeper cross-system integration.
This release implements I only. It does not claim a complete police simulation.

## Playable decision

Operations offers an optional **No-Questions Delivery** beside the normal delivery.
It pays **+50% manual delivery Cash**, **10 base XP**, and generates **+5 Heat**.
The client refuses at starting Heat **60 or above** (the existing HOT threshold).
A job starting at 59 pays at the old tier and ends at 64; the next risky job is
blocked. Standard jobs always remain available with their existing penalties.

The choice is per click, not a persistent mode. No randomness, arrest/confiscation,
forced spending, hidden failure chance, cooldown, automation or offline risky jobs.
The current reward, XP, Heat cost, current/next Heat and cutoff appear before acting.
City's Heat panel points to the optional Operations choice. EN/DE use the Solara
satirical voice; Villager converts the entire presentation to gibberish.

## Balance and rationale

| No-upgrade choice | Cash | XP | Heat |
| --- | --- | --- | --- |
| Normal delivery below HOT | $25 | 10 | +1 |
| Risky delivery below HOT | $37.50 | 10 | +5 |
| Normal delivery at HOT | $22.50 | 10 | +1 |
| Normal delivery at MANHUNT | $18.75 | 10 | +1 |

Starting cold, 12 consecutive risky deliveries reach 60 Heat and earn $450 / 120 XP.
The same 12 standard deliveries earn $300 / 120 XP and reach 12 Heat. Four risky
deliveries fund Dockside ($150) at 20 Heat versus six normal deliveries at 6 Heat.
This deliberately offers a faster cash opening, without multiplying XP.
The premium is $12.50 for four additional Heat per base job. Buying Lay Low
($500 / 10 Heat) to finance endless risk is uneconomic at base payout; cooling,
Mara and the active Lilt give existing systems a concrete role. Large modifier
stacks can change this tradeoff; no optimum-play claim is made.

## Exact integration

An action-local modifier joins the shared exact evaluator before its single final
cent floor. Flat upgrades, global/manual bonuses and the active Senda apply once.
For example ($25 + $5) × 1.2 × 1.12 × 1.1 × 1.5 = $66.528 → **$66.52**.
Dispatcher and production never collect the optional modifier.
Both manual actions use one atomic completion function for Money, XP, Heat,
manualJobsCompleted and peakHeat. Failure returns the original state.

Runtime reconciles first, then rechecks the cutoff using current Heat. Existing
achievement observation sees the completed state. Normal meaningful-command saving
applies: jobs publish then save; a storage failure is displayed and is not claimed
to roll back the already-published manual action. Guarded purchase/replacement
policies remain unchanged.

Save **v19** / **CE1**: no additional field, migration or stored mode. Existing
Heat/remainder, money, XP and lifetime observations carry the result. Import does
not replay jobs; offline cannot invoke the new action. Rebirth resets current Heat
as before and keeps lifetime statistics, skills and vehicles.

## Acceptance

Required: strict build, complete suite, exact arithmetic/boundary/overflow tests,
runtime reconciliation/save-failure tests, v19 and CE1 round trips, localized UI,
and 15 production Chromium risk flows (3 languages × 5 widths) in addition to the
existing 45 Garage + 225 all-section checks.

Verified in [PR #29](https://github.com/TLSnipZ/Idle-Game/pull/29):
[run 34775975009](https://github.com/TLSnipZ/Idle-Game/actions/runs/34775975009)
on code `577881c63554f43bb7a6603fddc4f6646b4c707e` passed strict build,
**2,315/2,315 tests** (32 added; zero failures/skips), **45 Garage + 225 all-section +
15 risk delivery Chromium cases**, and whitespace checks. Artifact: `10324165450`.
This follow-up changes documentation only. Merge and deployment evidence are
recorded in the PR; manual live acceptance remains separate.

Next separate slice: **II — Police Pressure**. Define consequences and player
counterplay before adding persistent police state; do not begin it in this release.
