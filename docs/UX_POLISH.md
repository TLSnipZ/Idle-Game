# UX polish after Heat V

This phase addresses the Operations and global chrome density findings from the game audit. Garage 2.0 / tuning remains a separate next phase.

## Player experience

- Operations puts the normal, risky and discreet delivery actions before district management. Current district and Heat remain in the global HUD.
- MANHUNT status, cost, support details and the decoy action remain reachable. General cooling and escape explanations use a native disclosure.
- Pending City Events lead the Activity Center. Latest feedback expands on demand; its existing live announcement remains the single action announcement. Tick updates do not reset disclosure state or move focus.
- Mobile Cash, Level/XP, Heat/district and EP fit a two-column grid. Operations category labels wrap with text zoom.
- A localized header disclosure exposes the last storage result and save policy. Failed/blocked/offline-error states have a visible warning label; the existing global error remains visible without opening the disclosure.

## Persistence contract

Presentation changes only: Save v20 / CE1, economics and runtime transitions are unchanged.
The status describes the **last save result**, not a guarantee that every later live tick is durable.

Business ownership spending, Garage changes, automation configuration, district changes and decoys retain their save-before-publish guards. Ordinary actions can publish live progress before a failed save; the error explains possible loss on reload. Offline failures and save conflicts keep their existing protections. Reset/import/rebirth replacement policies are unchanged.

## Verification

The existing full suite and Chromium matrix remain the release gate.
Additional browser assertions exercise job ordering, pending-event priority, native disclosure keyboard operation and focus over ticks, 125% text scaling in all three locales at five widths, and a failed ordinary-delivery save followed by a successful retry. The stored save must remain unchanged during failure while live Cash advances; the warning must clear after recovery. The expanded save explanation must fit 320px.

Release evidence is recorded in PR #34 and the roadmap. Automated verification does not stand in for the user's live acceptance.
