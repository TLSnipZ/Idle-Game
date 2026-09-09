import type { EventId, EventChoiceId } from '../features/events';
import type { GameState } from '../game/game-state';
import { eventPresentation, describeEventSpawn } from './event-presentation';

export function CityEvents({ state, paused, announcement, onChoose }: {
  readonly state: GameState;
  readonly paused: boolean;
  readonly announcement?: { readonly id: EventId; readonly sequence: number } | undefined;
  readonly onChoose: (event: EventId, choice: EventChoiceId) => void;
}) {
  const view = eventPresentation(state);
  const pending = view.pending;
  return <section className={`panel city-events ${pending ? 'event-pending' : 'event-idle'}`} aria-labelledby="city-events-heading">
    <h2 id="city-events-heading">CITY EVENTS</h2>
    <div role="status" aria-live="polite" aria-atomic="true">
      {announcement && announcement.id === view.pendingEventId
        && <span key={announcement.sequence}>{describeEventSpawn(announcement.id)}</span>}
    </div>
    {pending ? <>
      <header className="event-story"><p className="eyebrow">Active situation</p><h3 id="pending-event-heading">{pending.name.toUpperCase()}</h3>
      <p>{pending.description}</p></header>
      <p className="event-timer-state">TIMER PAUSED · Event timer paused until resolved. Your operation continues.</p>
      <div className="event-choices" role="group" aria-labelledby="pending-event-heading">{view.choices.map(option =>
        <div className="event-choice" key={option.choice.id}>
          <h4 id={`${option.choice.id}-label`}>{option.choice.label}</h4>
          <ul id={`${option.choice.id}-effects`}>
            {option.effects.map(effect => <li key={effect}>{effect}</li>)}
          </ul>
          {option.unavailable && <p className="choice-unavailable">INSUFFICIENT CASH · {option.unavailable}</p>}
          <button className="action-button purchase-button" disabled={paused || !option.canChoose}
            aria-labelledby={`${option.choice.id}-label pending-event-heading`} aria-describedby={`${option.choice.id}-effects`}
            onClick={() => onChoose(pending.id, option.choice.id)}>{option.choice.label}</button>
        </div>)}</div>
    </> : <>
      <p>No active event</p>
      <p>Next opportunity: {view.countdown}</p>
      <p>A city situation may appear when the online opportunity timer completes.</p>
    </>}
  </section>;
}
