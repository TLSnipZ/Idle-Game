import type { EventId, EventChoiceId } from '../features/events';
import type { GameState } from '../game/game-state';
import { eventPresentation, describeEventSpawn } from './event-presentation';
import { useLocale, useLocalizedText } from './LocalizationProvider';

export function CityEvents({ state, paused, announcement, onChoose }: {
  readonly state: GameState;
  readonly paused: boolean;
  readonly announcement?: { readonly id: EventId; readonly sequence: number } | undefined;
  readonly onChoose: (event: EventId, choice: EventChoiceId) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const view = eventPresentation(state, locale);
  const pending = view.pending;
  return <section className={`panel city-events ${pending ? 'event-pending' : 'event-idle'}`} aria-labelledby="city-events-heading">
    <h2 id="city-events-heading">{text('CITY EVENTS', 'STADTEVENTS')}</h2>
    <div role="status" aria-live="polite" aria-atomic="true">
      {announcement && announcement.id === view.pendingEventId
        && <span key={announcement.sequence}>{describeEventSpawn(announcement.id, locale)}</span>}
    </div>
    {pending ? <>
      <header className="event-story"><p className="eyebrow">{text('Active situation', 'Aktuelle Lage · bestimmt völlig harmlos')}</p><h3 id="pending-event-heading">{pending.name.toUpperCase()}</h3>
      <p>{pending.description}</p></header>
      <p className="event-timer-state">{text('TIMER PAUSED · Event timer paused until resolved. Your operation continues.', 'TIMER PAUSIERT · Das Event wartet auf deine Entscheidung. Dein Imperium verdient natürlich trotzdem weiter.')}</p>
      <div className="event-choices" role="group" aria-labelledby="pending-event-heading">{view.choices.map(option =>
        <div className="event-choice" key={option.choice.id}>
          <h4 id={`${option.choice.id}-label`}>{option.choice.label}</h4>
          <ul id={`${option.choice.id}-effects`}>
            {option.effects.map(effect => <li key={effect}>{effect}</li>)}
          </ul>
          {option.unavailable && <p className="choice-unavailable">{text('INSUFFICIENT CASH', 'ZU WENIG CASH')} · {option.unavailable}</p>}
          <button className="action-button purchase-button" disabled={paused || !option.canChoose}
            aria-labelledby={`${option.choice.id}-label pending-event-heading`} aria-describedby={`${option.choice.id}-effects`}
            onClick={() => onChoose(pending.id, option.choice.id)}>{option.choice.label}</button>
        </div>)}</div>
    </> : <>
      <p>{text('No active event', 'Kein aktives Event · die Stadt plant wahrscheinlich schon das nächste Problem')}</p>
      <p>{text('Next opportunity:', 'Nächste Gelegenheit:')} {view.countdown}</p>
      <p>{text('A city situation may appear when the online opportunity timer completes.', 'Wenn der Online-Timer endet, kann Solara dir spontan eine neue schlechte Idee mit zwei Buttons anbieten.')}</p>
    </>}
  </section>;
}
