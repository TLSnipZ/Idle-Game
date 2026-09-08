import { useEffect, useRef, useState } from 'react';
import { REBIRTH_POLICY, selectRebirth } from '../game/rebirth';
import type { GameState } from '../game/game-state';
import type { RebirthTransactionResult } from '../platform/persistent-game';
import { RequirementList } from './RequirementList';
import { createRebirthControls, INITIAL_REBIRTH_CONTROLS } from './rebirth-controls';
import type { RebirthControlsState } from './rebirth-controls';

export function RebirthPanel({ state, unavailable, onRebirth }: {
  readonly state: GameState; readonly unavailable: boolean; readonly onRebirth: () => RebirthTransactionResult;
}) {
  const [interaction, setInteraction] = useState(INITIAL_REBIRTH_CONTROLS);
  const [controls] = useState(() => createRebirthControls(onRebirth, setInteraction));
  return <RebirthPanelView preview={selectRebirth(state)} unavailable={unavailable} interaction={interaction} controls={controls} />;
}
export function RebirthPanelView({ preview, unavailable, interaction, controls }: {
  readonly preview: ReturnType<typeof selectRebirth>; readonly unavailable: boolean;
  readonly interaction: RebirthControlsState; readonly controls: ReturnType<typeof createRebirthControls>;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (interaction.confirming) cancel.current?.focus(); }, [interaction.confirming]);
  const policy = Object.values(REBIRTH_POLICY);
  return <section className="panel rebirth-panel" aria-labelledby="rebirth-heading">
    <div className="panel-heading"><h2 id="rebirth-heading" ref={heading} tabIndex={-1}>Rebirth</h2>
      <span className="ownership-badge">{preview.eligible ? 'REBIRTH AVAILABLE' : 'BUILD YOUR LEGACY'}</span></div>
    <p>Restart your temporary operation in exchange for permanent Empire Points.</p>
    <dl className="permanent-totals"><div><dt>Empire Points</dt><dd>{preview.empirePoints} EP</dd></div>
      <div><dt>Rebirths</dt><dd>{preview.rebirthCount}</dd></div></dl>
    <p>Invest unspent Empire Points in permanent skills that survive Rebirth.</p>
    <RequirementList result={preview.requirements} id="rebirth-requirements" />
    <p className="production">Reward: {preview.reward === null ? 'Not eligible' : `+${preview.reward} Empire Points`}</p>
    <div id="rebirth-policy" className="rebirth-policy">
      <div><h3>You keep</h3><ul>{policy.filter(item => item.action !== 'reset').flatMap(item => item.labels).map(label => <li key={label}>{label}</li>)}</ul></div>
      <div><h3>You lose</h3><ul>{policy.filter(item => item.action === 'reset').flatMap(item => item.labels).map(label => <li key={label}>{label}</li>)}</ul></div>
    </div>
    {interaction.confirming ? <div className="save-confirm" role="group" aria-labelledby="rebirth-warning" aria-describedby="rebirth-policy">
      <h3 id="rebirth-warning">Confirm your Rebirth</h3>
      <p>{preview.reward === null ? 'Requirements are no longer met.' : `Reset the listed temporary progress for +${preview.reward} Empire Points?`}</p>
      <p>The reward is recalculated from current progress when confirmed. This replaces your local save.</p>
      <button className="action-button rebirth-button" disabled={unavailable || !preview.eligible}
        onClick={() => { controls.confirm(); heading.current?.focus(); }}>Confirm Rebirth</button>
      <button ref={cancel} className="action-button" onClick={() => { controls.cancel(); heading.current?.focus(); }}>Cancel</button>
    </div> : <button className="action-button rebirth-button" disabled={unavailable || !preview.eligible}
      aria-describedby="rebirth-requirements rebirth-policy" onClick={controls.request}>Review Rebirth</button>}
    {unavailable && <p>Rebirth requires a running session with available local saving.</p>}
    <p role="status" aria-live="polite" aria-atomic="true">{interaction.message}</p>
  </section>;
}
