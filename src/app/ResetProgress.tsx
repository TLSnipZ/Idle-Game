import { useEffect, useRef, useState } from 'react';
import { RESET_CONFIRMATION_TEXT } from '../platform/persistent-game';
import type { ResetProgressResult } from '../platform/persistent-game';
import { createResetProgressControls, INITIAL_RESET_PROGRESS } from './reset-progress-controls';
import { useLocale, useLocalizedText } from './LocalizationProvider';

/** Consent is local to this panel; leaving Empire or replacing the run discards it. */
export function ResetProgress({ unavailable, onReset }: {
  readonly unavailable: boolean;
  readonly onReset: (confirmation: string) => ResetProgressResult;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const [interaction, setInteraction] = useState(INITIAL_RESET_PROGRESS);
  const [controls] = useState(() => createResetProgressControls(onReset, setInteraction, locale));
  const cancel = useRef<HTMLButtonElement>(null);
  const review = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (interaction.confirming) cancel.current?.focus();
    else if (wasConfirming.current) {
      const target = review.current?.disabled ? heading.current : review.current;
      target?.focus({ preventScroll: true });
    }
    wasConfirming.current = interaction.confirming;
  }, [interaction.confirming]);

  return <section className="panel reset-panel" aria-labelledby="reset-heading">
    <h3 id="reset-heading" ref={heading} tabIndex={-1}>{text('New Game / Reset Progress', 'Neues Spiel / Fortschritt löschen')}</h3>
    <p id="reset-consequences"><strong>{text('This is not Rebirth.', 'Das ist kein Rebirth.')}</strong> {text('This erases all run and permanent progress: Cash, XP, Businesses, upgrades, purchased Territories, Crew, vehicles, Empire Points, skills, Rebirth history, achievements, statistics, Events and automation. You return to the original starting state, with Waterfront only. No Empire Points are awarded.', 'Hier verschwindet wirklich alles: Cash, XP, Businesses, Upgrades, gekaufte Bezirke, Crew, Fahrzeuge, Empire Points, Skills, Rebirth-Historie, Achievements, Statistiken, Events und Automation. Du landest wieder ganz am Anfang mit nur Waterfront. Keine Empire Points. Kein Trostpreis. Keine kreative Buchführung.')}</p>
    <p id="reset-backup"><strong>{text('Keep a backup first:', 'Mach vorher ein Backup:')}</strong> {text('use Export save above and copy the CE1 code somewhere safe before continuing. There is no undo; a previously exported backup can be imported later.', 'Nutz oben Save exportieren und leg den CE1-Code irgendwo sicher ab. Es gibt kein Undo. Ein alter Export kann später wieder importiert werden — dein einziger Fluchtwagen.')}</p>
    {interaction.confirming ? <div id="reset-confirmation" className="save-confirm" role="group"
      aria-labelledby="reset-warning" aria-describedby="reset-consequences reset-backup"
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); controls.cancel(); } }}>
      <h4 id="reset-warning">{text('Permanently reset all progress?', 'Wirklich sämtlichen Fortschritt endgültig löschen?')}</h4>
      <label htmlFor="reset-confirmation-text">{text(`Type ${RESET_CONFIRMATION_TEXT} to confirm`, `${RESET_CONFIRMATION_TEXT} zum Bestätigen eingeben`)}</label>
      <input id="reset-confirmation-text" type="text" value={interaction.confirmation}
        autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={20}
        aria-describedby="reset-confirmation-help" onChange={event => controls.edit(event.target.value)} />
      <p id="reset-confirmation-help">{text('Enter RESET exactly, then choose Reset all progress. Pressing Enter in this field does not reset the game.', 'RESET exakt eingeben und danach Alles löschen wählen. Enter im Feld löscht das Spiel nicht. Sogar wir haben eine Sicherung eingebaut.')}</p>
      <div className="confirmation-actions">
        <button type="button" ref={cancel} className="action-button" onClick={controls.cancel}>{text('Cancel New Game', 'Neues Spiel abbrechen')}</button>
        <button type="button" className="action-button danger-button"
          disabled={unavailable || interaction.confirmation !== RESET_CONFIRMATION_TEXT}
          onClick={() => { controls.confirm(); }}>{text('Reset all progress', 'Alles löschen')}</button>
      </div>
    </div> : <button type="button" ref={review} className="action-button danger-button"
      disabled={unavailable} aria-describedby="reset-consequences reset-backup"
      onClick={controls.request}>{text('Review New Game reset', 'Neues Spiel prüfen')}</button>}
    {unavailable && <p>{text('New Game needs a running session and a valid, unchanged local save. Reload or use the existing Import recovery flow before trying again.', 'Neues Spiel braucht eine laufende Session und einen gültigen, unveränderten lokalen Save. Neu laden oder erst über Import retten, bevor du alles anzündest.')}</p>}
    <p role="status" aria-live="polite" aria-atomic="true">{interaction.message}</p>
  </section>;
}
