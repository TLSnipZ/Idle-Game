# Heat V — Support network

## Scope and player decision

Heat I–IV connect manual risk, local pressure and MANHUNT. V gives established
Businesses, assigned Crew and the active Garage choice a direct role in paying
for MANHUNT counterplay. It completes the retained I–V sequence.

| Support | Activation | Decoy price factor |
| --- | --- | --- |
| Dockside Detail | Owned Level 10+, operating in Waterfront | ×0.80 |
| Neon Laundry | Owned Level 10+, operating in Neon Mile | ×0.80 |
| Mara Knox | Assigned to Operations | ×0.90 |
| Namera Lilt | Owned and active | ×0.90 |

Only one local Business factor can apply. Crew recruitment and vehicle ownership
alone do not activate support. Both Businesses owned does not stack them.
Local cover alone makes $1,250 into $1,000. Mara or Lilt alone gives $1,125;
both give $1,012.50; local cover plus either gives $900; all three give **$810**.
Factors multiply (35.2% total reduction), with a single final cent floor.

The same action still requires local Heat ≥80 and removes 30 local Heat, leaving
the other district untouched. No XP, payout, new achievement or saved unlock.
Lay Low keeps $500/−10; discreet deliveries and passive cooling remain free exits.
Support never changes production, job rewards, Dispatcher routing or cooling.
Mara and Lilt retain their existing cooling effects. The new discount is additional
prospective value, with no purchase refund, asset consumption or automatic payment.

## Boundaries

Typed rules live in heat config; the scoped game collector reads current Business
level, district, assigned Crew and active vehicle. Only decoy pricing consumes
these rules. The shared exact modifier evaluator gains a heat-response-cost target;
support modifiers cannot apply to job reward, XP or Business production.
UI affordability, displayed price and the command use the same evaluator.
The existing durable decoy runtime reconciles before evaluating the current price.
Failed writes or cross-tab conflicts preserve reconciled Cash and Heat.

Save **v20 / CE1 unchanged**. Support is derived from existing state, never stored
as a duplicate price/unlock. Local saves and imports immediately use current rules.
Business upgrades, travel, assignment and active-car changes update the quote.
Rebirth clears Business/Crew/district support while retaining an active permanent
Lilt and its 10% discount; no decoy is usable until the new run reaches MANHUNT.
New Game clears the Garage too. Offline simulation never purchases a decoy.

Operations/City retain the exact visible final price. A compact expandable support
network shows the base/final price, each requirement, percentage and active status.
English, German and full Villager apply to all prose and accessible descriptions.
No new page, timer, asset, dependency or duplicate state.

## Verification

Required: strict build, full suite, exact stacking and local/active boundaries,
affordability, scoped modifier isolation, saved round trips, Rebirth/offline and
durable runtime changes. Add 15 Chromium support flows (3 locales × 5 widths)
to the existing 330. Browser support flows freeze elapsed time to isolate exact
spending from Business production; other browser/runtime/offline checks retain
their existing clock coverage. Verified in [PR #33](https://github.com/TLSnipZ/Idle-Game/pull/33):
[run 34783614823](https://github.com/TLSnipZ/Idle-Game/actions/runs/34783614823)
on code `fb0c5ade7e4ed52190b6cb088fedd4ffff5fe6fc` passed strict build,
**2,441/2,441 tests** (28 added; zero failures/skips), **345 Chromium cases**
(45 Garage, 225 sections, 15 each risk/police/district/MANHUNT/support), and
whitespace checks. Evidence artifact: `10326270313`.
This follow-up changes documentation only. Merge/deployment evidence is recorded
in the PR; manual live acceptance remains separate.

## Next handoff

Heat / Police 2.0 I–V is complete at this scope. Further Business depth, Crew/Event
content and other post-roadmap priorities remain separate work to scope from
POST_ROADMAP.md; this phase does not automatically start another expansion.
