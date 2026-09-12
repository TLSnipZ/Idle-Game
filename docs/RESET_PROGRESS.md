# Reset Progress / New Game

## Scope and status

Implemented as a focused follow-up to POST 3D. Browser/deployed acceptance is
reported separately. Current Save **v17**, **CE1**, migration chain, economy,
content catalogs and Rebirth formulas are unchanged. No dependency or artwork.

## Player flow

Open **Empire → Save & Transfer → New Game / Reset Progress**. The panel explains
that this is not Rebirth, awards no EP and removes both run and permanent progress.
Use the existing **Export save** first and copy the CE1 code somewhere safe.

**Review New Game reset** opens an inline confirmation. Cancel is first and gets
focus. Enter **RESET** exactly and then activate **Reset all progress**. Enter in
the text field alone is not a submission. Cancel/Escape clears consent and returns
focus locally without scrolling to the top. Leaving Empire discards reset consent.

After a successful reset, return to Overview with heading focus and a concise
success message. A failed reset stays in Empire, preserves the existing run/save,
and explains the failure. A retry requires a fresh review and typed consent.

## Exact reset and retention

`createInitialGameState()` is the sole reset template. There is no second manual
reset field list and no use of `performRebirth`. This clears Cash, XP, all purchased
Businesses/Levels/equipment, Crew/assignments, Garage, EP, skills, Rebirth history,
achievements, lifetime statistics, pending Events/cadence and automation/progress.
It restores canonical defaults including Waterfront ownership and Dockside as the
inactive Auto-Upgrader target. It grants no Rebirth reward or fresh achievements.

Only the existing game-save storage key is written. No `localStorage.clear()`,
remove-then-recreate operation, unrelated browser preference deletion, schema bump,
compensation or stored notification/reset counter. A separately copied CE1 backup
can still restore the old empire through normal explicit import.

## Transaction and clocks

`createPersistentGame.resetProgress(confirmation)` validates the exact confirmation,
a running runtime and a non-blocked persistence state. It creates a fresh candidate,
prepares the existing synchronous runtime replacement, writes the candidate with
`createLocalSave.save`, and only then publishes the replacement. There is no await
between preparation, write and commit.

The discarded run is **not reconciled** on reset: no old income, automatic purchases,
XP, Heat, Event RNG or Rebirth rewards are simulated. Failed preparation/write does
not change the authoritative state, saved bytes, runtime baseline or offline summary.
The existing guarded save refuses cross-tab conflicts and corrupt/newer storage;
New Game is not a force-overwrite recovery shortcut. A stopped/suspended runtime
must be reloaded before resetting. Existing explicit Import recovery stays intact.

On success the save receives a fresh wall-clock timestamp, runtime replacement
rebases monotonic elapsed time, and all authoritative/runtime fractions start from
the canonical defaults. Runtime achievement/Level/Event/dispatch notices and the
old offline summary are cleared. Autosave is restarted once and its generation
invalidates callbacks queued before reset. One runtime timer and one autosave timer
remain; no page reload, extra runtime or business timers are introduced.

## UI lifetime and stale-consent safety

The typed consent controller is ephemeral and consumes consent **before** the
synchronous transaction. Rapid duplicate activation cannot reset a newly started
run. A successful reset clears Save/Transfer input, export text, validated Import
approval, pending clipboard callbacks and pending Rebirth approval.

`useGame.replacementSequence` is ephemeral UI state, not Save state. It increments
only on successful Import, Rebirth or New Game. Only the Reset panel uses it as a
key, invalidating consent for an old run. Ordinary gameplay ticks never remount
this panel or the active section. Existing Import/Rebirth navigation behavior is
otherwise unchanged.

## Accessibility and presentation

The danger panel is separate from Export/Import and Rebirth. Native buttons, a
labeled text field, explicit consequences and one polite result status provide
keyboard/screen-reader access. Cancel comes before confirmation; failure recovers
focus locally, while success intentionally navigates to Overview. Text/input and
actions wrap without fixed card heights, and controls retain at least 44px height.
No animation, asset, new primary section, settings system or localization is added.

## Verification contract

Tests cover complete canonical replacement, zero reward/RNG, write-before-publication,
invalid consent, quota/conflict/clock failures, protected corrupt/newer saves,
old autosave callbacks, fresh timestamps/fractions, reload, continued play, CE1
backup restoration, one-shot UI consent, Cancel/Escape/Enter behavior, navigation,
stale Import/Rebirth approval and invalidation after other run replacements.

The full existing suite, typecheck and build must remain green. Browser checks use
isolated local test saves, never the player's live browser storage. The next scoped
feature remains **Next Objective / Guidance**; Settings, Global HUD 2.0, branding,
Business artwork, Garage expansion and Heat/Police work remain deferred.


### Implementation verification

Local typecheck, full suite and production build pass: **2,077 tests in 101 files**,
including 46 new reset cases across three suites. One older navigation assertion
that forbade any New Game UI was updated to require its separation from Rebirth;
existing Rebirth ordering/retention assertions remain intact. Local checks used
Node 22.16 with restored lockfile dependencies; fresh Node 24 installation/checks
are run separately on the isolated GitHub verification branch before review.

Chromium could not open the local preview (`ERR_BLOCKED_BY_ADMINISTRATOR`).
Desktop, 390px, 320px and real keyboard/scroll visual acceptance remain pending.
Mounted DOM tests are not browser or deployed approval. No player's live save
was reset during development or verification.
