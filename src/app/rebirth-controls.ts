import type { RebirthTransactionResult } from '../platform/persistent-game';

export interface RebirthControlsState { readonly confirming: boolean; readonly message: string }
export const INITIAL_REBIRTH_CONTROLS: RebirthControlsState = { confirming: false, message: '' };
export function describeRebirth(result: RebirthTransactionResult): string {
  if (result.ok) return `REBIRTH COMPLETE · +${result.reward} Empire Points. Your operation begins again at Level 1.`;
  switch (result.error) {
    case 'statistics-overflow': return 'Lifetime statistics limit reached. The action was not completed.';
    case 'requirements-not-met': return 'Rebirth unavailable: ' + result.requirements.requirements.filter(detail => !detail.met).map(detail => detail.description).join('; ') + '. Nothing was reset.';
    case 'overflow': return 'Permanent progression limit reached. Nothing was reset.';
    case 'persistence-failure': return 'Rebirth could not be saved. Nothing was reset and no Empire Points were granted. Your previous save is preserved; check storage access or reload if another tab changed it.';
    case 'runtime-unavailable': return 'The session is not running. Nothing was reset. Reload before trying again.';
  }
}
/** Opening/cancelling changes only UI state; final confirmation reads live runtime state. */
export function createRebirthControls(rebirth: () => RebirthTransactionResult, publish: (state: RebirthControlsState) => void) {
  let state = INITIAL_REBIRTH_CONTROLS;
  const update = (next: RebirthControlsState) => { state = next; publish(state); };
  function request() { update({ confirming: true, message: '' }); }
  function cancel() { update({ confirming: false, message: 'Rebirth cancelled. Nothing was reset.' }); }
  function confirm() {
    if (!state.confirming) return;
    // Consume confirmation before the synchronous destructive transaction; no rapid duplicate submit.
    state = { ...state, confirming: false };
    const result = rebirth();
    update({ confirming: false, message: describeRebirth(result) });
  }
  return { request, cancel, confirm, getSnapshot: () => state };
}
