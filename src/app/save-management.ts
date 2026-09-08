import { validateSaveCode } from '../game/save-code';
import type { ExportResult } from '../game/save-code';
import { copySaveCode } from '../platform/clipboard';
import type { ImportResult } from '../platform/persistent-game';

export interface SaveActions {
  exportCode(): ExportResult;
  importCode(code: string): ImportResult;
}
export interface SaveManagementState {
  readonly exported: string;
  readonly input: string;
  readonly confirming: boolean;
  readonly message: string;
}
export const INITIAL_SAVE_MANAGEMENT: SaveManagementState = {
  exported: '', input: '', confirming: false, message: '',
};
function failure(error: string): string {
  switch (error) {
    case 'empty-code': return 'Paste a save code first.';
    case 'oversized-code': case 'oversized': return 'This save code is too large.';
    case 'unsupported-prefix': case 'wrong-format': return 'This is not a supported Crime Empire save code.';
    case 'malformed-encoding': return 'The code encoding is damaged. Copy the complete code again.';
    case 'malformed-json': return 'The code contains damaged save data.';
    case 'unsupported-version': return 'This save requires a newer game version.';
    case 'persistence-failure': return 'Import could not be saved. Current progress was not replaced. Check storage access or reload if another tab changed the save.';
    case 'runtime-unavailable': return 'The session is not running. Reload before transferring a save.';
    case 'clock-unavailable': return 'The export timestamp could not be read. Try again.';
    default: return 'The save data is invalid. Current progress was not replaced.';
  }
}

/** Runtime-only interaction state; holds the exact validated code for confirmation. */
export function createSaveManagement(
  actions: SaveActions,
  publish: (state: SaveManagementState) => void,
  copy: (code: string) => Promise<boolean> = copySaveCode,
) {
  let state = INITIAL_SAVE_MANAGEMENT;
  let pending: string | null = null;
  let revision = 0;
  const update = (patch: Partial<SaveManagementState>) => {
    state = { ...state, ...patch }; publish(state);
  };
  function edit(input: string) {
    revision++; pending = null;
    update({ input, confirming: false, message: '' });
  }
  function exportCode() {
    revision++;
    const result = actions.exportCode();
    update(result.ok ? { exported: result.code, message: 'Save code ready. Copy it or select the text manually.' }
      : { message: failure(result.error) });
  }
  async function copyCode() {
    if (!state.exported) return;
    const current = ++revision;
    const copied = await copy(state.exported);
    if (revision === current) update({ message: copied ? 'Save code copied.'
      : 'Clipboard unavailable. Your code is still below; select and copy it manually.' });
  }
  function validate() {
    revision++;
    const result = validateSaveCode(state.input);
    pending = result.ok ? state.input : null;
    update({ confirming: result.ok, message: result.ok ? 'Valid save. Confirm below to replace current progress.' : failure(result.error) });
  }
  function cancel() {
    revision++; pending = null;
    update({ confirming: false, message: 'Import cancelled. Current progress was not replaced.' });
  }
  function confirm() {
    if (pending === null) return;
    revision++;
    const result = actions.importCode(pending);
    pending = null;
    update({ confirming: false, message: result.ok ? 'Save imported and stored locally. No offline income added.' : failure(result.error) });
  }
  return { edit, exportCode, copyCode, validate, cancel, confirm, getSnapshot: () => state };
}
