import { useRef, useState } from 'react';
import { createSaveManagement, INITIAL_SAVE_MANAGEMENT } from './save-management';
import type { SaveActions, SaveManagementState } from './save-management';
import { MAX_CODE_LENGTH } from '../game/save-code';

export function SaveManagement({ actions }: { readonly actions: SaveActions }) {
  const [state, setState] = useState(INITIAL_SAVE_MANAGEMENT);
  const [controls] = useState(() => createSaveManagement(actions, setState));
  return <SaveManagementView state={state} controls={controls} />;
}

export function SaveManagementView({ state, controls }: {
  readonly state: SaveManagementState;
  readonly controls: ReturnType<typeof createSaveManagement>;
}) {
  const validateButton = useRef<HTMLButtonElement>(null);
  return <section className="save-panel panel" aria-labelledby="save-heading">
    <h2 id="save-heading">Save management</h2>
    <p>Keep a portable backup or move to another browser. Codes are not encrypted. Importing never credits time from the code.</p>
    <div className="save-grid">
      <div>
        <button className="action-button" onClick={controls.exportCode}>Export save</button>
        {state.exported && <>
          <label htmlFor="export-code">Your exported save code</label>
          <textarea id="export-code" readOnly value={state.exported} rows={4} spellCheck={false} />
          <button className="action-button" onClick={() => { void controls.copyCode(); }}>Copy code</button>
        </>}
      </div>
      <div>
        <label htmlFor="import-code">Paste a save code</label>
        <textarea id="import-code" value={state.input} rows={4} maxLength={MAX_CODE_LENGTH + 1}
          spellCheck={false} autoCapitalize="off" onChange={event => controls.edit(event.target.value)} />
        <button ref={validateButton} className="action-button" onClick={controls.validate}>Validate import</button>
        {state.confirming && <div className="save-confirm" role="group" aria-labelledby="import-warning">
          <p id="import-warning">Importing will replace your current progress and the local save stored on this browser.</p>
          <button className="action-button" onClick={() => { controls.confirm(); validateButton.current?.focus(); }}>Confirm import</button>
          <button className="action-button" onClick={() => { controls.cancel(); validateButton.current?.focus(); }}>Cancel</button>
        </div>}
      </div>
    </div>
    <p role="status" aria-live="polite" aria-atomic="true">{state.message}</p>
  </section>;
}
