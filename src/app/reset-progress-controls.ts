import { RESET_CONFIRMATION_TEXT } from '../platform/persistent-game';
import type { ResetProgressResult } from '../platform/persistent-game';

export interface ResetProgressState {
  readonly confirming: boolean;
  readonly confirmation: string;
  readonly message: string;
}
export const INITIAL_RESET_PROGRESS: ResetProgressState = { confirming: false, confirmation: '', message: '' };

export function describeResetProgress(result: ResetProgressResult): string {
  if (result.ok) return 'New Game saved. All progress has been reset. No Empire Points were awarded.';
  switch (result.error) {
    case 'confirmation-required': return 'Type RESET exactly before confirming. Nothing was reset.';
    case 'runtime-unavailable': return 'The session is not running or its clock is unavailable. Nothing was reset. Reload before trying again.';
    case 'persistence-failure': return 'New Game could not be saved. Nothing was reset; your previous save is preserved. Check storage access or reload if another tab changed the save.';
  }
}

/** Ephemeral consent only. Request/edit/cancel never call gameplay or storage. */
export function createResetProgressControls(
  reset: (confirmation: string) => ResetProgressResult,
  publish: (state: ResetProgressState) => void,
) {
  let state = INITIAL_RESET_PROGRESS;
  const update = (next: ResetProgressState) => { state = next; publish(state); };
  function request() { update({ confirming: true, confirmation: '', message: '' }); }
  function edit(confirmation: string) {
    if (state.confirming) update({ ...state, confirmation, message: '' });
  }
  function cancel() { update({ ...INITIAL_RESET_PROGRESS, message: 'New Game cancelled. Nothing was reset.' }); }
  function confirm(): ResetProgressResult | undefined {
    if (!state.confirming || state.confirmation !== RESET_CONFIRMATION_TEXT) return;
    const confirmation = state.confirmation;
    // Consume consent before the synchronous transaction, including rapid duplicate activation.
    state = INITIAL_RESET_PROGRESS;
    const result = reset(confirmation);
    update({ ...INITIAL_RESET_PROGRESS, message: describeResetProgress(result) });
    return result;
  }
  return { request, edit, cancel, confirm, getSnapshot: () => state };
}
