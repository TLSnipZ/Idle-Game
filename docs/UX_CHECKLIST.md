# Phase 9A feature review checklist

This maps the previous single-page interface to the new presentation. Domain and
platform source remain unchanged. Component/selector and navigation regression tests
verify the mapped controls and underlying existing transaction tests remain required.
This checklist does not claim live GitHub Pages verification.

| Previous feature | New location | Preserve during manual review |
| --- | --- | --- |
| Cash and Player Level | Global header; Overview detail | Live values, exact Money formatting, XP progress |
| Starter delivery | Operations / Starter job | Reward, button, base/effective modifier breakdown, feedback |
| Dockside Detail | Operations / Businesses | Initial buy, level upgrade, current/next rates, max and affordability |
| Five normal upgrades | Operations / Upgrades | Requirements, purchase, ownership and modifier scope |
| Delivery Dispatcher | Operations / Automation | Hire, current reward, countdown, batch feedback |
| Business Auto-Upgrader | Operations / Automation | Buy disabled, one enable/disable control, warning, progress/next cost/max |
| Solara City / territories | City | Waterfront baseline, Neon buy/Heat disclosure/controlled state |
| Heat / Lay Low | City | Tier/penalty, Mara interval/countdown, affordability and action |
| Crew | City | All three cards, two slots, recruit, assign/replace, explicit unassign |
| City Events | City; global active-event link | Both exact choices including PASS/REFUSE, affordability, paused timer |
| Garage / Vortex S9 | Collection | Locked/ready/owned, requirement list, purchase and permanent bonus |
| Rebirth and EP | Empire | Eligibility, keep/lose policy, review/confirm/cancel; permanent retention |
| Empire Foundations | Empire | Five ranked skills, current/next effects, prerequisites and EP affordability |
| Achievements | Empire | Six visible cards, progress, permanent completion, grouped global feedback |
| Statistics | Empire | Eight permanent observations and Peak Heat /100 |
| Save management | Empire / Save & Transfer | Export/copy, editable import, validate/confirm/cancel, errors |
| Welcome back | Global, before section | Income/XP, Dispatcher and Auto-Upgrader spending/levels, dismissal |
| Session feedback | Global; transfer/Rebirth also in Empire | Purchases, Crew/Heat, achievements, events, level/unlocks, save errors |

## Desktop review

- [ ] Five primary sections remain immediately accessible; active item is clear.
- [ ] Global Cash/Level/Heat/EP remain readable while scrolling.
- [ ] Overview is compact and useful; no full management rosters are duplicated.
- [ ] Operations business/upgrade/automation groups and City systems have clear headings.
- [ ] Collection contains one real vehicle and no fake placeholders for new content.
- [ ] Empire progression and Save & Transfer are easy to find.
- [ ] No accidental blank spaces or horizontal overflow.

## Narrow/mobile review

- [ ] All five native navigation buttons are touch/keyboard usable.
- [ ] Global status wraps; long balances and requirements do not overflow.
- [ ] Cards stack, event alternatives remain readable, and Crew unassign stays usable.
- [ ] Skills and Save/Import controls fit without shrinking text or horizontal scrolling.
- [ ] Switching away/back retains import drafts and pending confirmations without executing them.
- [ ] Event and automatic-spending indicators still lead to their single management location.

## Verification status

Automated checks include mounted React interaction tests with injected clocks and storage, plus section order/mapping, global values/indicators/feedback,
current-state dashboard freshness, pure navigation callbacks, no additional runtime instances/time reads/writes/RNG, unchanged runtime
simulation across section changes, retained confirmation controllers and v15/CE1.
Existing requirement/purchase/choice/skill/automation tests cover the moved cards.
The provided browser rejected the local preview (`ERR_BLOCKED_BY_CLIENT`); the
standalone Chromium download also timed out. Desktop/mobile visual inspection is
therefore **pending**, as are live GitHub Pages checks. CSS uses wrapping/minmax
grids and semantic controls; no pixel-perfect screenshot assertion substitutes for
that pending visual review. Phase 9B should retain this feature mapping and all
runtime/confirmation boundaries while carrying out its separate accessibility pass.
