import { selectCrew } from '../game/crew-selectors';
import { MANUAL_JOB_HEAT, DISPATCHER_JOBS_PER_HEAT } from '../features/heat';
import type { GameState } from '../game/game-state';
import { heatPresentation } from './heat-presentation';
import { formatPrice } from './number-format';
export function HeatPanel({ state, paused, onLayLow }: {
  readonly state: GameState; readonly paused: boolean; readonly onLayLow: () => void;
}) {
  const view = heatPresentation(state);
  const coolingCrew = selectCrew(state).slots.find(slot => slot.occupant?.effect.type === 'heat-decay-interval')?.occupant;
  return <article className={`panel heat-panel heat-${view.tier.id}`} aria-labelledby="heat-heading">
    <div className="panel-heading"><h3 id="heat-heading">HEAT</h3>
      <span className="ownership-badge">{view.tier.label}</span></div>
    <div className="heat-readout"><strong>{view.heat}</strong><span> / {view.maximum} — {view.tier.label}</span></div>
    <div className="heat-details">
    <progress aria-label={`Current Heat: ${view.heat} of ${view.maximum}, ${view.tier.label}`} max={view.maximum} value={view.heat} />
    <p className="heat-penalty">{view.penalty} · XP and business production unaffected.</p>
    <p>{view.cooling}</p>
    {coolingCrew && <p className="crew-cooling">CREW EFFECT · {coolingCrew.name}</p>}
    {view.countdown !== null ? <p>{view.countdown}{paused && ' · Session paused'}</p> : <p>COOL · No active Heat</p>}
    <p>Manual delivery: +{MANUAL_JOB_HEAT} Heat. Dispatcher: +1 per {DISPATCHER_JOBS_PER_HEAT} deliveries completed together.</p>
    </div><div className="heat-action"><p>Lay low · Reduce Heat by {view.reduction} · Cost: {formatPrice(view.cost)}</p>
    <p>{view.availability}</p>
    <button className="action-button secondary-button" aria-label="Lay low to reduce Heat"
      disabled={paused || !view.canLayLow} onClick={onLayLow}>{paused ? 'Session paused' : 'LAY LOW'}</button></div>
  </article>;
}
