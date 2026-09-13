import type { GameState } from '../game/game-state';
import { selectRiskyDelivery } from '../game/risky-delivery';
import { evaluateXpReward } from '../game/xp-reward';
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
  return <article className="risky-delivery" aria-labelledby="risky-delivery-heading">
    <h3 id="risky-delivery-heading">{text('No-Questions Delivery', 'Keine-Fragen-Lieferung')}</h3>
    <p>{text(`+${bonus}% delivery Cash. Five-star customer service, one-star legal advice.`,
      `+${bonus}% Liefer-Cash. Fünf Sterne beim Service, ein Stern beim Rechtsbeistand.`)}</p>
    <dl className="job-metrics">
      <div><dt>{text('Payout', 'Auszahlung')}</dt><dd>{view.reward.ok ? formatReward(view.reward.reward) : text('Unavailable', 'Nicht verfügbar')}</dd></div>
      <div><dt>{text('XP')}</dt><dd>+{xp.ok ? formatXp(xp.reward) : '—'}</dd></div>
      <div><dt>{text('Heat')}</dt><dd>+{view.heatGain}</dd></div>
    </dl>
    <p id="risky-delivery-help">{text(
      `Available below ${view.heatLimit} Heat. Current Heat: ${state.city.heat}. Normal deliveries remain available.`,
      `Verfügbar unter ${view.heatLimit} Heat. Aktuell: ${state.city.heat}. Normale Lieferungen bleiben verfügbar.`)}</p>
    {!view.tooHot && <p>{text(`Heat after delivery: ${view.resultingHeat}.`, `Heat nach der Lieferung: ${view.resultingHeat}.`)}</p>}
    <button className="action-button secondary-button risky-delivery-button" aria-describedby="risky-delivery-help"
      disabled={paused || !view.canRun || !xp.ok} onClick={onRun}>
      {paused ? text('Session paused', 'Session pausiert') : view.tooHot
        ? text('Too hot · Cool down first', 'Zu heiß · Erst abkühlen')
        : text('Run risky delivery', 'Risiko-Lieferung fahren')}
    </button>
  </article>;
}
