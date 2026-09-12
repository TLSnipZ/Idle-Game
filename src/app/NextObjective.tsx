import { useState } from 'react';
import type { GameState } from '../game/game-state';
import { selectGuidance } from '../game/guidance';
import type { GuidanceDestination } from '../game/guidance';
import { guidancePercent, guidancePresentation } from './guidance-presentation';
import { formatInteger } from './number-format';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

function countLabel(label: string, locale: 'en' | 'de') {
  if (locale === 'en') return label;
  if (label === 'Player Level') return 'Spielerlevel';
  if (label === 'Business Level') return 'Business-Level';
  if (label === 'Skill rank') return 'Skill-Rang';
  return label;
}

/** Global presentation only: tracking, expansion and navigation never touch game/save state. */
export function NextObjective({ state, onNavigate }: {
  readonly state: GameState;
  readonly onNavigate: (destination: GuidanceDestination) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const [tracked, setTracked] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const guidance = selectGuidance(state, tracked);
  const { step } = guidance;
  const view = guidancePresentation(guidance, locale);
  const goalName = guidance.goal.id === 'guidance:rebirth' ? 'Rebirth' : localizedContent(locale, guidance.goal.id, 'name', guidance.goal.name);
  const compactProgress = step.cash ? `${view.cashLabel}: ${view.cashText}` : step.count ? `${countLabel(step.count.label, locale)}: ${formatInteger(step.count.current)} / ${formatInteger(step.count.required)}` : text('Ready for the next bad idea.', 'Bereit für die nächste schlechte Idee.');

  return <section className={`next-objective ${expanded ? 'is-expanded' : 'is-collapsed'}`} aria-labelledby="next-objective-heading">
    <div className="objective-summary">
      <div className="objective-summary-copy">
        <p className="eyebrow">{text('Next Objective', 'Nächstes Ziel')} <span>· {guidance.tracked ? text('Your chosen goal', 'Dein gewähltes Ziel') : text('Suggested path', 'Empfohlener Weg')}</span></p>
        <h2 id="next-objective-heading">{view.title}</h2>
        <p className="objective-compact-progress">{compactProgress}</p>
      </div>
      <button type="button" className="objective-expand" aria-expanded={expanded} aria-controls="next-objective-details" onClick={() => setExpanded(value => !value)}>
        <span>{expanded ? text('Hide details', 'Details einklappen') : text('Details', 'Details')}</span><span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>
    </div>

    {expanded && <div id="next-objective-details" className="objective-details">
      <div className="objective-body">
        <p className="objective-context">{text('Working toward:', 'Auf dem Weg zu:')} <strong>{goalName}</strong></p>
        <div className="objective-progress">
          {step.count && <div>
            <p id="objective-count-label">{countLabel(step.count.label, locale)}: <strong>{formatInteger(step.count.current)} / {formatInteger(step.count.required)}</strong></p>
            <progress aria-labelledby="objective-count-label" max={100}
              value={guidancePercent(step.xp?.current ?? step.count.current, step.xp?.required ?? step.count.required)}
              aria-valuetext={step.xp ? text(`${formatInteger(step.xp.current)} / ${formatInteger(step.xp.required)} total XP for Player Level ${step.count.required}`, `${formatInteger(step.xp.current)} / ${formatInteger(step.xp.required)} XP gesamt für Spielerlevel ${step.count.required}`) : `${step.count.current} / ${step.count.required}`} />
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
        <button type="button" className="action-button secondary-button" aria-label={text(`${view.button} for your next objective`, `${view.button} für dein nächstes Ziel`)}
          onClick={() => onNavigate(step.destination)}>{view.button}</button>
        <details>
          <summary>{text('Choose another goal', 'Anderes Ziel wählen')}</summary>
          <label htmlFor="guidance-goal">{text('Goal to follow', 'Ziel verfolgen')}</label>
          <select id="guidance-goal" value={guidance.tracked ? guidance.goal.id : ''} onChange={event => setTracked(event.currentTarget.value || null)}>
            <option value="">{text('Suggested path', 'Empfohlener Weg')}</option>
            {guidance.goals.map(goal => <option key={goal.id} value={goal.id}>{goal.id === 'guidance:rebirth' ? 'Rebirth' : localizedContent(locale, goal.id, 'name', goal.name)}</option>)}
          </select>
          <p>{text('Optional. Tracking is not saved and never purchases anything.', 'Optional. Das Tracking wird nicht gespeichert und kauft niemals etwas. Dein Konto bleibt Herr seiner eigenen Fehlentscheidungen.')}</p>
        </details>
      </div>
    </div>}
  </section>;
}
