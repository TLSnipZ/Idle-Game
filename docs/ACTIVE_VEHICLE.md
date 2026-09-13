# Active Vehicle Foundation

Status: implementation complete in PR #23. Release/merge status is recorded in the PR; manual live acceptance remains a separate checkpoint. PR #22 contained only this design document, not the feature implementation.

## Scope

The user approved the four Business storefronts and authorized this next gameplay slice. Keep the single canonical Kairo KX-R and its accepted artwork. No Senda/Lilt, tuning, extra currencies, vehicle costs, new art or Police changes are included.

## State and compatibility

Save v18 adds `garage.activeVehicleId`. Empty ownership requires null; a populated Garage requires exactly one known owned selection. No unowned, missing, unknown or legacy active ID is accepted. Current state validation never silently repairs an invalid selection.

The sequential v17 -> v18 migration selects KX-R for existing owners and null for non-owners. v1-v16 still pass through their historical validators and migrations, including the old Vortex identity replacement. Historical validators reject prematurely injected active fields. Migration adds no income, rewards, XP, Heat, ownership or timestamp rebase. CE1 remains the transport format. Existing owners keep the same +10% Business Production through the automatically selected Kairo.

## Selection and effects

First purchase activates automatically; later purchases retain the current selection. A free explicit selection changes only the active ID. Only that vehicle's modifier enters the shared collector. Inactive ownership remains permanent but supplies no additional bonus. No deactivation, fee, cooldown or catalog-wide stacking is introduced.

The persistent selection command rejects unavailable sessions and invalid/unowned IDs. Choosing the already active car is an identity-preserving no-op: no clock read, random call, save, reward or notification publication at the runtime boundary. An actual change revalidates after old-effect reconciliation and reuses the existing durable Garage commit guard. Write failure or storage conflict retains the reconciled old selection and previous durable save. Only a successful rate change resets runtime sub-millisecond duration; both earned production fractions are preserved.

Offline bootstrap completes and saves using the pre-return selection before interaction. Selection cannot retroactively change offline income. Rebirth retains the entire Garage, including selection. Import uses normal validation and durable replacement/rebase; failed import retains the old selection. Full New Game resets both ownership and selection.

## Garage presentation

Collection/Garage adds a compact active-vehicle summary and active/inactive ownership labels. Bonus copy states that it applies while active and that ownership/selection survive Rebirth. Owned inactive cards offer a native localized selection button; the active card has no redundant selection button. With the current one-car catalog, the normal live states are an empty Garage or automatically active KX-R. Future two-car switching is tested with a test-only synthetic catalog entry, never shipped as content.

English and German keep the original Solara satire while price, effect and ownership truth stay explicit. Styles are isolated in GarageActive.css. Business artwork, Operations grids, global HUD and accepted section spacing are not redesigned.

## Verification and release gates

Baseline `cff039f6d71f2f027e169ab26e6104d04a4e526b`: 2,176 tests, 2,112 passed and 64 failed. All baseline failures are in app presentation tests; domain and platform tests passed. Historical failures are recorded, not silently removed.

The candidate must pass strict typecheck/build, all new domain/schema/runtime/UI tests, and the relevant existing Garage/save/offline/Rebirth tests. Existing fixture shapes and expected current-save versions are updated to the actual v18 contract, not disabled. Compare full-suite failing identities against baseline. Check the actual browser at desktop/mobile widths and verify a real v17 bootstrap with Kairo ownership.

A PR, merge, successful Pages build and successful deployment are separate states. Record the final checks and release evidence in the PR and POST_ROADMAP.md. Never claim live publication from a branch build alone.

## Next

After live acceptance: separately scoped Tier-1 Garage expansion and balance/art review for Kairo Senda and Namera Lilt. Heat / Police 2.0 follows the planned Garage block. Do not start a later phase automatically.

## Implementation handoff

The actual implementation adds the pure selection command, validates the exact current
Garage shape, freezes pre-v18 vehicle identities, and strips normalized active fields
between validated historical migration steps. The persistent selection entry point
performs an IO-free preflight; real changes use the existing guarded Garage transaction.
The single production KX-R is unchanged; a second car is injected only in isolated tests.

Local shell and file tools stopped responding during dependency installation. Verification
therefore runs on GitHub Actions through a separate read-only, non-deploying workflow.
It compares the complete candidate test suite with pinned baseline `4291873`, rejects
new failures and increased skips, and checks the actual production build in Chromium
using disposable validated v17 saves in EN/DE. Reports and screenshots are CI artifacts;
manual visual acceptance remains a separate user review. Executed verification and the latest release status are recorded in PR #23. No unrun
check is considered passed.

## Executed verification — 2026-09-13

[Run 34757750344](https://github.com/TLSnipZ/Idle-Game/actions/runs/34757750344)
verified code commit `2237867d8386f6d7e6463994e5eaadd5048c4105`:

- Fresh Node 24 dependency install, strict typecheck and production build passed.
- Complete baseline: 2,176 tests, 2,112 passed, 64 failed.
- Complete candidate: 2,223 tests, 2,159 passed, the same 64 failed.
- All 47 added tests passed. No new failures, removed baseline tests or increased skips.
  The full suite is **not green**; existing app/presentation failures remain recorded
  by exact file/test identity in the report. No failing test was disabled.
- Twenty actual production Chromium cases passed: EN/DE at 320, 390, 740, 1024 and
  1440px, both empty and owned v17 Garage bootstrap, purchase/automatic activation,
  decoded KX-R art, persisted v18 selection and reload. No page errors or document
  overflow in these Garage cases. Real Settings language switching also passed.
- `git diff --check` passed. Business assets and existing stylesheets are unchanged;
  only the isolated Garage summary stylesheet was added.

[Verification artifacts and screenshots](https://github.com/TLSnipZ/Idle-Game/actions/runs/34757750344/artifacts/10318240240)
are retained for seven days. Screenshots were captured by CI; no human visual review
is claimed. Merge and Pages deployment are separate checkpoints recorded in PR #23.
