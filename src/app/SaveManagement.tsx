import { useEffect, useRef, useState } from 'react';
import { createSaveManagement, INITIAL_SAVE_MANAGEMENT } from './save-management';
import type { SaveActions, SaveManagementState } from './save-management';
import { MAX_CODE_LENGTH } from '../game/save-code';

export function SaveManagement({ actions }: { readonly actions: SaveActions }) {
  const { state, controls } = useSaveManagement(actions);
  return <SaveManagementView state={state} controls={controls} />;
}
export function useSaveManagement(actions: SaveActions) {
  const [state, setState] = useState(INITIAL_SAVE_MANAGEMENT);
  const [controls] = useState(() => createSaveManagement(actions, setState));
  return { state, controls };
}

export function SaveManagementView({ state, controls }: {
  readonly state: SaveManagementState;
  readonly controls: ReturnType<typeof createSaveManagement>;
}) {
  const validateButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const requested = useRef(false);
  useEffect(() => { if (requested.current && state.confirming) cancelButton.current?.focus(); requested.current = false; }, [state]);
  return <section className="save-panel panel" aria-labelledby="save-heading">
    <h3 id="save-heading">Save management</h3>
    <p>Keep a portable backup or move to another browser. Codes are not encrypted. Importing never credits time from the code.</p>
    <div className="save-grid">
      <div className="export-tools"><h4>Export / Backup</h4><p>Keep a portable copy of your empire.</p>
        <button className="action-button" onClick={controls.exportCode}>Export save</button>
        {state.exported && <>
          <label htmlFor="export-code">Your exported save code</label>
          <textarea id="export-code" readOnly value={state.exported} rows={4} spellCheck={false} />
          <button className="action-button" onClick={() => { void controls.copyCode(); }}>Copy code</button>
        </>}
      </div>
      <div className="import-tools"><h4>Import / Replace save</h4>
        <label htmlFor="import-code">Paste a save code</label>
        <p id="import-instructions">Paste the complete CE1 save code, then validate it before confirming replacement.</p>
        <textarea aria-describedby="import-instructions save-feedback" aria-invalid={state.invalidInput || undefined} id="import-code" value={state.input} rows={4} maxLength={MAX_CODE_LENGTH + 1}
          spellCheck={false} autoCapitalize="off" onChange={event => controls.edit(event.target.value)} />
        <button ref={validateButton} className="action-button" onClick={() => { requested.current = true; controls.validate(); }}>Validate import</button>
        {state.confirming && <div className="save-confirm" role="group" aria-labelledby="import-warning">
          <p id="import-warning">Importing will replace your current progress and the local save stored on this browser.</p>
          <button className="action-button danger-button" onClick={() => { controls.confirm(); validateButton.current?.focus(); }}>Confirm import</button>
          <button ref={cancelButton} aria-label="Cancel import" className="action-button" onClick={() => { controls.cancel(); validateButton.current?.focus(); }}>Cancel</button>
        </div>}
        <p id="save-feedback" className={state.invalidInput ? 'save-feedback-error' : undefined} role="status" aria-live="polite" aria-atomic="true">{state.invalidInput && 'ERROR · '}{state.message}</p>
      </div>
    </div>
  </section>;
}
