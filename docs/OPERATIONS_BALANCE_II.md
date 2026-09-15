# Operations Balance II — portfolio rewards and shared cadence

Status: **merged via PR #52 and deployed to GitHub Pages**. Final feature head: `da976b6ee450573af8db652c385adb8741cc4d4b`; merge commit: `1a7067e3c4b77b4dae286de86496c8a30e4bb61d`. Verify Solara City #146 passed on the exact PR head, evidence artifact `10394829835`; Pages deploy #98 succeeded from the merge commit. This document is the authoritative implementation handoff for the second Operations balance pass.

## Reward contract

Let `P` be the sum of **unmodified** production rates of every currently owned Business at its current level, expressed as Cash per second.

- Standard/risky/discreet manual delivery base Cash: `max($25, P × 8 seconds)`.
- Dispatcher base Cash per completed job: `max($25, P × 1 second)`.
- Existing scoped flat additions and percentage modifiers are applied only after the base is selected.
- Business-production modifiers do not feed `P`; this avoids double-dipping production bonuses into delivery rewards.
- Risky/discreet modifiers, Heat pressure, Crew, Territories, Upgrades, active vehicles/tuning and permanent skills keep their existing scope and ordering.

Dispatcher keeps its existing interval and ownership gate. A Dispatcher batch evaluates its reward once against the outer batch-start state, multiplies by completed jobs, and floors XP on the same existing outer batch. Auto-Upgrader purchases reached inside that elapsed window therefore never reprice earlier/prefix Dispatcher jobs.

## Shared manual readiness

Normal, risky and discreet manual deliveries share one **10,000 ms** readiness slot.

- A fresh or fully recovered game is ready immediately.
- Only a successful manual action consumes readiness.
- Domain failures such as `too-hot`, `already-cold`, overflow or other rejected commands do not consume the slot.
- While pending, the authoritative state is `manualJobs: { elapsedMs }` with `0 <= elapsedMs < 10000`.
- Ready is canonicalized as **absence of `manualJobs`**.
- Elapsed simulation restores readiness after the remaining duration and never banks a second action. Long online/offline elapsed therefore yields at most one ready manual action, never historic manual Cash/XP/Heat.
- Queued same-frame intents consume latest state, so at most the first successful intent is accepted before the UI rerenders.

## Persistence and replacement semantics

Save **v27 / CE1** is current.

- v26 and earlier migrations enter v27 ready and receive no Cash, XP, ownership, unlocks or historic manual work.
- v27 validates the optional pending readiness slice strictly.
- Export/import round-trips the exact remaining pending delay. Import does not treat the imported `savedAt` as manual elapsed; runtime replacement establishes a fresh local clock anchor.
- Rebirth retains a pending manual delay. Rebirth must not gift a ready click merely because run-scoped economy/progression reset.
- Offline reconciliation may advance a pending delay to ready, but never creates a manual backlog or payout.

## Presentation

Operations shows the shared Ready/countdown state on standard, risky and discreet cards. Buttons respect the same authoritative domain state rather than owning independent cooldowns. Copy is provided in English, German and the full Villager locale. Narrow/mobile and desktop layouts must not introduce horizontal overflow.

## Startup playtest

With no Business owned, the $25 floor applies. The first action is immediate, so a player acting whenever ready reaches:

- **30 seconds:** 4 successful standard jobs = **$100** and **40 XP**.
- **50 seconds:** 6 successful standard jobs = **$150** and **60 XP**, exactly enough to buy Dockside Detail.
- **90 seconds:** 10 uninterrupted standard floor jobs = **$250** and **100 XP**, the earliest Player Level 2 threshold.

This keeps the opening actionable immediately while removing one-click spam. Dockside arrives at a clear ~50-second milestone; Player Level 2 follows around 90 seconds on the uninterrupted manual route, leaving early acquisition and XP gates distinct without making either a long wait.

## Verification contract

The final PR head passed all of the following before merge:

- TypeScript typecheck and production Vite build.
- Complete Vitest suite (**2,650 / 2,650 passed, 0 failed, 0 skipped**).
- Existing full Chromium regression matrix.
- Dedicated Operations Balance II browser verifier across **EN / DE / Villager × 390 / 1440 px**, including fresh Ready state, shared consumption, restored readiness, discreet action, screenshots and no horizontal overflow.
- `git diff --check`.

Verification evidence corresponds to exact feature head `da976b6ee450573af8db652c385adb8741cc4d4b`: Verify Solara City #146, artifact `10394829835`. Merge commit `1a7067e3c4b77b4dae286de86496c8a30e4bb61d` deployed successfully through GitHub Pages run #98.

No vehicle/content/artwork expansion, price changes outside the approved reward formula or unrelated layout overhaul was part of this phase.