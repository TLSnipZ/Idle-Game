# Roadmap

## Current phase — Operations Balance I: analysis and decision

[PR #51](https://github.com/TLSnipZ/Idle-Game/pull/51) is the user-authorized,
bounded analysis phase following the published Garage IV-D and Workshop purchase
insight releases. Baseline: `ca49bcb25156facd127ef9d7f1036e877e312432`.

The executable experiment compares current rules with exactly two alternatives:
a fourfold base-reward increase and run-owned Business-production scaling with a
proposed shared manual cadence. It covers progression portfolios, actual online /
offline semantics, Heat, modifiers, all existing Garage setups, early Rebirth and
high-input stress. Read [OPERATIONS_BALANCE.md](OPERATIONS_BALANCE.md) for the
recommended numbers, assumptions, limitations and implementation requirements.

**Implemented here: analysis tests, their CI report and documentation only.**
**Not implemented: new rewards, a manual cooldown, content or save migration.**
Save **v26 / CE1**, prices, production rules, approved artwork and progress remain
unchanged. PR #51 owns exact verification and review status. A reviewed PR is not
a merged release, and automated verification is not personal live acceptance.

### Stop condition

Deliver reproducible evidence, one concrete recommendation and a reviewable PR.
Stop there. **Operations Balance II — reward/cadence implementation** is only a
proposed follow-on and requires a separate user instruction. Approval to merge this
analysis does not authorize that implementation. No vehicle tier or other expansion
starts implicitly. Merge and publication require the user's explicit instruction.

## Latest published scope

| Area | Status and source |
| --- | --- |
| Garage IV-D | PR #49 merged at `8f81486dba9e19f3ab6bec64361a35e6b67e1704`; Tier-2 tuning/finishes live. [Details](TIER_TWO_CUSTOMIZATION.md). |
| Workshop purchase insight | PR #50 merged at `505fac717ade2d5b9191818fa4a109887f21513b`; optional actual-effect comparisons for twelve setups live. [Release](WORKSHOP_INSIGHT.md#release--2026-09-14). |
| Published documentation baseline | `ca49bcb25156facd127ef9d7f1036e877e312432`; final deployment `34898688450` succeeded. This is not the analysis PR's release status. |
| Compatibility | Save v26 / CE1; supported older saves migrate without resets or free unlocks. No schema change in this phase. |
| Personal acceptance | Automated IV-D / Workshop live verification is documented; the player's personal acceptance remains separate. |

## Previously delivered

Base Game progression, four Businesses, equipment/automation, local saves/CE1,
offline income, Rebirth, skills, achievements/statistics and Next Objective are
implemented. Heat / Police I–V, six Garage models with customization, EN/DE/Villager
presentation and the Garage/Operations/Overview/City/Empire workspace passes are
delivered. Economy has no unrelated company image; districts use approved district
artwork. Historical visual-acceptance limits remain in their feature handoffs and
are not erased by this summary.

## Vehicle wishlist — retained, not scheduled

The [vehicle catalog](VEHICLE_CATALOG.md#future-vehicle-wishlist--user-request-2026-09-14)
retains **seventeen identities, six live**. Do not duplicate existing inspirations.

| Internal inspiration | Solara identity / status |
| --- | --- |
| Lancer Evo IX | Toseki Raizan — already planned |
| Silvia S15 | Namera Serein — already live |
| Modern GT-R, provisionally R35 | Toseki Kazan — proposed name/generation |
| Skyline R34 | Toseki Arashi — already planned |
| Nissan 180SX | Namera Shiore — proposed name |
| Classic Honda NSX | Kairo Reika — proposed name |

Use fictional manufacturers, names, badges and distinct Solara designs. New proposed
names/generations, future prices, bonuses, gates and artwork are not silently
approved. Re-evaluate historical numerical proposals before another tier. Already
approved artwork does not require a repeat approval request. The wishlist is not
a content-phase authorization.

## Future directions and history

[POST_ROADMAP.md](POST_ROADMAP.md) retains separately scoped priorities. Other
purchase assistance and amortization estimates are not part of completed Workshop
insight. The published manual/Dispatcher imbalance remains; this phase only studies
a possible response.

The previous complete roadmap is preserved **byte-for-byte** as
[ROADMAP_HISTORY.md](ROADMAP_HISTORY.md), taken from the baseline above. Its original
numbered phases, release evidence and plans remain available. Old “current” or
“next phase” labels are historical, not today's task list. Keeping the archive in
the same directory preserves its relative links. This index supersedes status labels,
not the retained plans or historical evidence.
