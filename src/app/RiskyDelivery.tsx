import type { GameState } from '../game/game-state';
import { selectRiskyDelivery } from '../game/risky-delivery';
import { evaluateXpReward } from '../game/xp-reward';
import { isManualJobReady, manualJobRemainingMs } from '../game/manual-job-readiness';
import { formatReward } from './number-format';
import { formatXp } from './progression-presentation';
import { useLocalizedText } from './LocalizationProvider';

export function RiskyDelivery({ state, paused, onRun }: {
  readonly state: GameState; readonly paused: boolean; readonly onRun: () => void;
}) {
  const text = useLocalizedText();
  const view = selectRiskyDelivery(state);
  const xp = evaluateXpReward(state, 'manualJob');
  const bonus = view.bonusBasisPoints / 100;
  const ready = isManualJobReady(state.manualJobs);
  const remainingSeconds = Math.ceil(manualJobRemainingMs(state.manualJobs) / 1000);
  return <article className="risky-delivery" aria-labelledby="risky-delivery-heading">
    <h3 id="risky-delivery-heading">{text('No-Questions Delivery', 'Keine-Fragen-Lieferung')}</h3>
    <p>{text(`+${bonus}% delivery Cash. Five-star customer service, one-star legal advice.`,
      `+${bonus}% Liefer-Cash. Fünf Sterne beim Service, ein Stern beim Rechtsbeistand.`)}</p>
    <dl className="job-metrics">
      <div><dt>{text('Payout', 'Auszahlung')}</dt><dd>{view.reward.ok ? formatReward(view.reward.reward) : text('Unavailable', 'Nicht verfügbar')}</dd></div>
      <div><dt>{text('XP')}</dt><dd>+{xp.ok ? formatXp(xp.reward) : '—'}</dd></div>
      <div><dt>{text('Heat')}</dt><dd>+{view.heatGain}</dd></div>
    </dl>
    <p className={`manual-readiness ${ready ? 'is-ready' : ''}`} aria-live="polite">{ready
      ? text('DELIVERY READY · Shared manual slot is clear.', 'LIEFERUNG BEREIT · Gemeinsamer manueller Slot ist frei.')
      : text(`CREW RESET · ${remainingSeconds}s until any manual delivery is ready.`, `CREW RESET · Noch ${remainingSeconds}s bis irgendeine manuelle Lieferung bereit ist.`)}</p>
    <p id="risky-delivery-help">{text(
      `Available below ${view.heatLimit} Heat. Current Heat: ${state.city.heat}. Normal deliveries share the same readiness timer.`,
      `Verfügbar unter ${view.heatLimit} Heat. Aktuell: ${state.city.heat}. Normale Lieferungen teilen denselben Bereitschaftstimer.`)}</p>
    {!view.tooHot && <p>{text(`Heat after delivery: ${view.resultingHeat}.`, `Heat nach der Lieferung: ${view.resultingHeat}.`)}</p>}
    <button className="action-button secondary-button risky-delivery-button" aria-describedby="risky-delivery-help"
      disabled={paused || !ready || !view.canRun || !xp.ok} onClick={onRun}>
      {paused ? text('Session paused', 'Session pausiert') : !ready
        ? text(`Crew resetting · ${remainingSeconds}s`, `Crew sortiert sich · ${remainingSeconds}s`)
        : view.tooHot ? text('Too hot · Cool down first', 'Zu heiß · Erst abkühlen')
          : text('Run risky delivery', 'Risiko-Lieferung fahren')}
    </button>
  </article>;
}
