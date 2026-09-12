import { useEffect, useRef, useState } from 'react';
import { createSaveManagement, INITIAL_SAVE_MANAGEMENT } from './save-management';
import type { SaveActions, SaveManagementState } from './save-management';
import { MAX_CODE_LENGTH } from '../game/save-code';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { useLocale, useLocalizedText } from './LocalizationProvider';

export function SaveManagement({ actions }: { readonly actions: SaveActions }) {
  const locale = useLocale();
  const { state, controls } = useSaveManagement(actions, locale);
  return <SaveManagementView state={state} controls={controls} />;
}
export function useSaveManagement(actions: SaveActions, locale: Locale = DEFAULT_LOCALE) {
  const [state, setState] = useState(INITIAL_SAVE_MANAGEMENT);
  const [controls] = useState(() => createSaveManagement(actions, setState, undefined, locale));
  useEffect(() => { controls.setLocale(locale); }, [controls, locale]);
  return { state, controls };
}

export function SaveManagementView({ state, controls }: {
  readonly state: SaveManagementState;
  readonly controls: ReturnType<typeof createSaveManagement>;
}) {
  const text = useLocalizedText();
  const validateButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const requested = useRef(false);
  useEffect(() => { if (requested.current && state.confirming) cancelButton.current?.focus(); requested.current = false; }, [state]);
  return <section className="save-panel panel" aria-labelledby="save-heading">
    <h3 id="save-heading">{text('Save management', 'Save-Verwaltung')}</h3>
    <p>{text('Keep a portable backup or move to another browser. Codes are not encrypted. Importing never credits time from the code.', 'Behalte ein portables Backup oder zieh in einen anderen Browser um. Codes sind nicht verschlüsselt. Beim Import gibt’s keine Offline-Zeit aus dem Code — wir sind dubios, nicht dumm.')}</p>
    <div className="save-grid">
      <div className="export-tools"><h4>{text('Export / Backup', 'Export / Backup')}</h4><p>{text('Keep a portable copy of your empire.', 'Pack dein Imperium in Textform. Zollkontrolle optional.')}</p>
        <button className="action-button" onClick={controls.exportCode}>{text('Export save', 'Save exportieren')}</button>
        {state.exported && <>
          <label htmlFor="export-code">{text('Your exported save code', 'Dein exportierter Save-Code')}</label>
          <textarea id="export-code" readOnly value={state.exported} rows={4} spellCheck={false} />
          <button className="action-button" onClick={() => { void controls.copyCode(); }}>{text('Copy code', 'Code kopieren')}</button>
        </>}
      </div>
      <div className="import-tools"><h4>{text('Import / Replace save', 'Import / Save ersetzen')}</h4>
        <label htmlFor="import-code">{text('Paste a save code', 'Save-Code einfügen')}</label>
        <p id="import-instructions">{text('Paste the complete CE1 save code, then validate it before confirming replacement.', 'Füge den kompletten CE1-Code ein, prüf ihn und bestätige erst danach den Austausch. Wir ersetzen hier ein Imperium, keinen Einkaufszettel.')}</p>
        <textarea aria-describedby="import-instructions save-feedback" aria-invalid={state.invalidInput || undefined} id="import-code" value={state.input} rows={4} maxLength={MAX_CODE_LENGTH + 1}
          spellCheck={false} autoCapitalize="off" onChange={event => controls.edit(event.target.value)} />
        <button ref={validateButton} className="action-button" onClick={() => { requested.current = true; controls.validate(); }}>{text('Validate import', 'Import prüfen')}</button>
        {state.confirming && <div className="save-confirm" role="group" aria-labelledby="import-warning">
          <p id="import-warning">{text('Importing will replace your current progress and the local save stored on this browser.', 'Der Import ersetzt deinen aktuellen Fortschritt und den lokalen Save in diesem Browser. Ja, wirklich ersetzt.')}</p>
          <button className="action-button danger-button" onClick={() => { controls.confirm(); validateButton.current?.focus(); }}>{text('Confirm import', 'Import bestätigen')}</button>
          <button ref={cancelButton} aria-label={text('Cancel import', 'Import abbrechen')} className="action-button" onClick={() => { controls.cancel(); validateButton.current?.focus(); }}>{text('Cancel', 'Abbrechen')}</button>
        </div>}
        <p id="save-feedback" className={state.invalidInput ? 'save-feedback-error' : undefined} role="status" aria-live="polite" aria-atomic="true">{state.invalidInput && `${text('ERROR', 'FEHLER')} · `}{state.message}</p>
      </div>
    </div>
  </section>;
}
