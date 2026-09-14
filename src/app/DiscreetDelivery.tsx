import type { GameState } from '../game/game-state';
import { selectDiscreetDelivery } from '../game/discreet-delivery';
import { DISCREET_DELIVERY_HEAT_REDUCTION } from '../features/heat';
import { isManualJobReady, manualJobRemainingMs } from '../game/manual-job-readiness';
import { formatReward } from './number-format';
import { useLocalizedText } from './LocalizationProvider';

export function DiscreetDelivery({ state, paused, onRun }: {
  readonly state: GameState; readonly paused: boolean; readonly onRun: () => void;
}) {
  const text = useLocalizedText(), view = selectDiscreetDelivery(state);
  const ready = isManualJobReady(state.manualJobs);
  const remainingSeconds = Math.ceil(manualJobRemainingMs(state.manualJobs) / 1000);
  return <article className="risky-delivery discreet-delivery" aria-labelledby="discreet-heading">
    <h3 id="discreet-heading">{text('Discreet Delivery', 'Diskrete Lieferung')}</h3>
    <p>{text('Half the usual delivery Cash, zero XP. Use the indicators. Ruin your street credibility.',
      'Halbes normales Liefer-Cash, null XP. Benutz den Blinker. Ruinier deinen Straßenruf.')}</p>
    <dl className="job-metrics">
      <div><dt>{text('Payout', 'Auszahlung')}</dt><dd>{view.reward.ok ? formatReward(view.reward.reward) : text('Unavailable', 'Nicht verfügbar')}</dd></div>
      <div><dt>{text('XP')}</dt><dd>0</dd></div>
      <div><dt>{text('Heat')}</dt><dd>−{view.reduction}</dd></div>
    </dl>
    <p className={`manual-readiness ${ready ? 'is-ready' : ''}`} aria-live="polite">{ready
      ? text('DELIVERY READY · Shared manual slot is clear.', 'LIEFERUNG BEREIT · Gemeinsamer manueller Slot ist frei.')
      : text(`CREW RESET · ${remainingSeconds}s until any manual delivery is ready.`, `CREW RESET · Noch ${remainingSeconds}s bis irgendeine manuelle Lieferung bereit ist.`)}</p>
    <p id="discreet-help">{text(
      `Reduce Heat by up to ${DISCREET_DELIVERY_HEAT_REDUCTION}. Heat after delivery: ${view.resultingHeat}. Current police penalties are included in the payout.`,
      `Senkt Heat um bis zu ${DISCREET_DELIVERY_HEAT_REDUCTION}. Heat danach: ${view.resultingHeat}. Aktuelle Polizei-Abzüge sind in der Auszahlung enthalten.`)}</p>
    <button className="action-button secondary-button discreet-delivery-button" aria-describedby="discreet-help"
      disabled={paused || !ready || !view.canRun} onClick={onRun}>
      {paused ? text('Session paused', 'Session pausiert') : !ready
        ? text(`Crew resetting · ${remainingSeconds}s`, `Crew sortiert sich · ${remainingSeconds}s`)
        : view.reduction === 0 ? text('Already cold', 'Schon eiskalt') : text('Run discreet delivery', 'Diskrete Lieferung fahren')}
    </button>
  </article>;
}
