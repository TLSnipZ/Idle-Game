import { selectCrew } from '../game/crew-selectors';
import { MANUAL_JOB_HEAT, DISPATCHER_JOBS_PER_HEAT } from '../features/heat';
import type { GameState } from '../game/game-state';
import { heatPresentation } from './heat-presentation';
import { formatPrice } from './number-format';
import { useLocale, useLocalizedText } from './LocalizationProvider';
export function HeatPanel({ state, paused, onLayLow }: {
  readonly state: GameState; readonly paused: boolean; readonly onLayLow: () => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const view = heatPresentation(state, locale);
  const coolingCrew = selectCrew(state).slots.find(slot => slot.occupant?.effect.type === 'heat-decay-interval')?.occupant;
  return <article className={`panel heat-panel heat-${view.tier.id}`} aria-labelledby="heat-heading">
    <div className="panel-heading"><h3 id="heat-heading">HEAT</h3>
      <span className="ownership-badge">{view.tier.label}</span></div>
    <div className="heat-readout"><strong>{view.heat}</strong><span> / {view.maximum} — {view.tier.label}</span></div>
    <div className="heat-details">
    <progress aria-label={text(`Current Heat: ${view.heat} of ${view.maximum}, ${view.tier.label}`, `Aktuelles Heat: ${view.heat} von ${view.maximum}, ${view.tier.label}`)} max={view.maximum} value={view.heat} />
    <p className="heat-penalty">{view.penalty} · {text('XP and business production unaffected.', 'XP und Business-Produktion bleiben unbeeindruckt. Die Cops sind nicht fürs Controlling zuständig.')}</p>
    <p>{view.cooling}</p>
    {coolingCrew && <p className="crew-cooling">{text('CREW EFFECT', 'CREW-EFFEKT')} · {coolingCrew.name}</p>}
    {view.countdown !== null ? <p>{view.countdown}{paused && text(' · Session paused', ' · Session pausiert')}</p> : <p>{text('COOL · No active Heat', 'EISKALT · Kein aktives Heat')}</p>}
    <p>{text(`Manual delivery: +${MANUAL_JOB_HEAT} Heat. Dispatcher: +1 per ${DISPATCHER_JOBS_PER_HEAT} deliveries completed together.`, `Manuelle Lieferung: +${MANUAL_JOB_HEAT} Heat. Dispatcher: +1 pro ${DISPATCHER_JOBS_PER_HEAT} gemeinsam abgeschlossene Lieferungen.`)}</p>
    </div><div className="heat-action"><p>{text(`Lay low · Reduce Heat by ${view.reduction} · Cost: ${formatPrice(view.cost)}`, `Untertauchen · Heat um ${view.reduction} senken · Kosten: ${formatPrice(view.cost)}`)}</p>
    <p>{view.availability}</p>
    <button className="action-button secondary-button" aria-label={text('Lay low to reduce Heat', 'Untertauchen, um Heat zu reduzieren')}
      disabled={paused || !view.canLayLow} onClick={onLayLow}>{paused ? text('Session paused', 'Session pausiert') : text('LAY LOW', 'UNTERTAUCHEN')}</button></div>
  </article>;
}
