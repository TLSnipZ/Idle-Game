import { MANUAL_JOB_HEAT, DISPATCHER_JOBS_PER_HEAT } from '../features/heat';
import type { GameState } from '../game/game-state';
import { heatPresentation } from './heat-presentation';
import { formatCash } from '../features/economy/ui';
export function HeatPanel({ state, paused, onLayLow }: {
  readonly state: GameState; readonly paused: boolean; readonly onLayLow: () => void;
}) {
  const view = heatPresentation(state);
  return <article className={`panel heat-panel heat-${view.tier.id}`} aria-labelledby="heat-heading">
    <div className="panel-heading"><h3 id="heat-heading">HEAT</h3>
      <span>{view.heat} / {view.maximum} — {view.tier.label}</span></div>
    <progress aria-label={`Current Heat: ${view.heat} of ${view.maximum}, ${view.tier.label}`} max={view.maximum} value={view.heat} />
    <p>{view.penalty} · XP and business production unaffected.</p>
    <p>{view.cooling}</p>
    {view.countdown !== null && <p>{view.countdown}</p>}
    <p>Manual delivery: +{MANUAL_JOB_HEAT} Heat. Dispatcher: +1 per {DISPATCHER_JOBS_PER_HEAT} deliveries in one batch.</p>
    <p>Lay low · Reduce Heat by {view.reduction} · Cost: {formatCash(view.cost)}</p>
    <p>{view.availability}</p>
    <button className="action-button secondary-button" aria-label="Lay low to reduce Heat"
      disabled={paused || !view.canLayLow} onClick={onLayLow}>{paused ? 'Session paused' : 'LAY LOW'}</button>
  </article>;
}
