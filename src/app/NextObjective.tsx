import { useState } from 'react';
import type { GameState } from '../game/game-state';
import { selectGuidance } from '../game/guidance';
import type { GuidanceDestination } from '../game/guidance';
import { guidancePercent, guidancePresentation } from './guidance-presentation';
import { formatInteger } from './number-format';

/** Global presentation only: neither tracking nor navigation touches the game/save. */
export function NextObjective({ state, onNavigate }: {
  readonly state: GameState;
  readonly onNavigate: (destination: GuidanceDestination) => void;
}) {
  const [tracked, setTracked] = useState<string | null>(null);
  const guidance = selectGuidance(state, tracked);
  const { step } = guidance;
  const view = guidancePresentation(guidance);
  return <section className="next-objective" aria-labelledby="next-objective-heading">
    <div className="objective-body">
      <p className="eyebrow">Next Objective <span>· {guidance.tracked ? 'Your chosen goal' : 'Suggested path'}</span></p>
      <h2 id="next-objective-heading">{view.title}</h2>
      <p className="objective-context">Working toward: <strong>{guidance.goal.name}</strong></p>
      <div className="objective-progress">
        {step.count && <div>
          <p id="objective-count-label">{step.count.label}: <strong>{formatInteger(step.count.current)} / {formatInteger(step.count.required)}</strong></p>
          <progress aria-labelledby="objective-count-label" max={100}
            value={guidancePercent(step.xp?.current ?? step.count.current, step.xp?.required ?? step.count.required)}
            aria-valuetext={step.xp ? `${formatInteger(step.xp.current)} / ${formatInteger(step.xp.required)} total XP for Player Level ${step.count.required}` : `${step.count.current} / ${step.count.required}`} />
        </div>}
        {step.cash && <div>
          <p id="objective-cash-label">{view.cashLabel}: <strong>{view.cashText}</strong></p>
          <progress aria-labelledby="objective-cash-label" max={100} value={guidancePercent(step.cash.current, step.cash.required)} aria-valuetext={view.cashText} />
          <span className="objective-cash-hint">{view.cashHint}</span>
        </div>}
      </div>
      <p className="objective-note">{view.note}</p>
    </div>
    <div className="objective-controls">
      <button type="button" className="action-button secondary-button" aria-label={`${view.button} for your next objective`}
        onClick={() => onNavigate(step.destination)}>{view.button}</button>
      <details>
        <summary>Choose another goal</summary>
        <label htmlFor="guidance-goal">Goal to follow</label>
        <select id="guidance-goal" value={guidance.tracked ? guidance.goal.id : ''} onChange={event => setTracked(event.currentTarget.value || null)}>
          <option value="">Suggested path</option>
          {guidance.goals.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
        </select>
        <p>Optional. Tracking is not saved and never purchases anything.</p>
      </details>
    </div>
  </section>;
}
