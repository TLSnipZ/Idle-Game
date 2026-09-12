import { useEffect, useRef, useState } from 'react';
import { RESET_CONFIRMATION_TEXT } from '../platform/persistent-game';
import type { ResetProgressResult } from '../platform/persistent-game';
import { createResetProgressControls, INITIAL_RESET_PROGRESS } from './reset-progress-controls';

/** Consent is local to this panel; leaving Empire or replacing the run discards it. */
export function ResetProgress({ unavailable, onReset }: {
  readonly unavailable: boolean;
  readonly onReset: (confirmation: string) => ResetProgressResult;
}) {
  const [interaction, setInteraction] = useState(INITIAL_RESET_PROGRESS);
  const [controls] = useState(() => createResetProgressControls(onReset, setInteraction));
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
    <h3 id="reset-heading" ref={heading} tabIndex={-1}>New Game / Reset Progress</h3>
    <p id="reset-consequences"><strong>This is not Rebirth.</strong> This erases all run and permanent
      progress: Cash, XP, Businesses, upgrades, purchased Territories, Crew, vehicles, Empire Points,
      skills, Rebirth history, achievements, statistics, Events and automation.
      You return to the original starting state, with Waterfront only. No Empire Points are awarded.</p>
    <p id="reset-backup"><strong>Keep a backup first:</strong> use <strong>Export save</strong> above and
      copy the CE1 code somewhere safe before continuing. There is no undo; a previously exported
      backup can be imported later.</p>
    {interaction.confirming ? <div id="reset-confirmation" className="save-confirm" role="group"
      aria-labelledby="reset-warning" aria-describedby="reset-consequences reset-backup"
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); controls.cancel(); } }}>
      <h4 id="reset-warning">Permanently reset all progress?</h4>
      <label htmlFor="reset-confirmation-text">Type {RESET_CONFIRMATION_TEXT} to confirm</label>
      <input id="reset-confirmation-text" type="text" value={interaction.confirmation}
        autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={20}
        aria-describedby="reset-confirmation-help" onChange={event => controls.edit(event.target.value)} />
      <p id="reset-confirmation-help">Enter RESET exactly, then choose Reset all progress. Pressing Enter in this field does not reset the game.</p>
      <div className="confirmation-actions">
        <button type="button" ref={cancel} className="action-button" onClick={controls.cancel}>Cancel New Game</button>
        <button type="button" className="action-button danger-button"
          disabled={unavailable || interaction.confirmation !== RESET_CONFIRMATION_TEXT}
          onClick={() => { controls.confirm(); }}>Reset all progress</button>
      </div>
    </div> : <button type="button" ref={review} className="action-button danger-button"
      disabled={unavailable} aria-describedby="reset-consequences reset-backup"
      onClick={controls.request}>Review New Game reset</button>}
    {unavailable && <p>New Game needs a running session and a valid, unchanged local save. Reload or use the existing Import recovery flow before trying again.</p>}
    <p role="status" aria-live="polite" aria-atomic="true">{interaction.message}</p>
  </section>;
}
