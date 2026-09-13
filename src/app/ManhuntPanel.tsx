import type { GameState } from '../game/game-state';
import { selectDecoy } from '../game/deploy-decoy';
import { useLocalizedText } from './LocalizationProvider';
import { formatPrice } from './number-format';
import './ManhuntPanel.css';

export function ManhuntPanel({ state, paused, onDecoy, nested = false }: {
  readonly nested?: boolean;
  readonly state: GameState; readonly paused: boolean; readonly onDecoy: () => void;
}) {
  const text = useLocalizedText(), view = selectDecoy(state);
  const Heading = nested ? 'h4' : 'h3';
  return <section className={`manhunt-panel ${view.active ? 'is-active' : ''}`} aria-labelledby="manhunt-heading">
    <Heading id="manhunt-heading">{text('MANHUNT', 'GROSSFAHNDUNG')}</Heading>
    <p className="manhunt-status">{view.active
      ? text(`Local roadblocks active. Lose ${view.heatToClear} Heat to reopen travel.`,
        `Lokale Straßensperren aktiv. ${view.heatToClear} Heat abbauen, um wieder zu reisen.`)
      : text(`From ${view.threshold} local Heat, police roadblocks stop district travel.`,
        `Ab ${view.threshold} lokalem Heat sperrt die Polizei den Bezirkswechsel.`)}</p>
    <p>{text('Normal and discreet deliveries, Lay Low and passive cooling still work. A cold district cannot hide your exit through a roadblock.',
      'Normale und diskrete Lieferungen, Untertauchen und passive Abkühlung funktionieren weiter. Ein kalter Nachbarbezirk hilft wenig, wenn die Ausfahrt voller Cops ist.')}</p>
    <p id="decoy-effect">{text(`Decoy convoy: ${formatPrice(view.cost)} for −${view.reduction} local Heat. Only during MANHUNT. No Cash reward or XP.`,
      `Ablenkungsmanöver: ${formatPrice(view.cost)} für −${view.reduction} lokales Heat. Nur während der Großfahndung. Keine Cash-Belohnung und keine XP.`)}</p>
    {view.active && <p>{text(`Heat after decoy: ${view.heatAfterDecoy}. Travel reopens once any pending City Event is resolved.`,
      `Heat danach: ${view.heatAfterDecoy}. Nach Abschluss eines offenen Stadtevents ist der Bezirkswechsel wieder frei.`)}</p>}
    <p>{text('Cheaper exits: discreet deliveries pay while cooling; Lay Low costs less for a smaller reduction. Waiting costs no Cash.',
      'Günstigere Auswege: Diskrete Lieferungen zahlen beim Abkühlen. Untertauchen kostet weniger und senkt Heat weniger stark. Warten kostet kein Cash.')}</p>
    {view.active && !view.affordable && <p>{text('Not enough Cash for the decoy. Free cooling remains available.',
      'Zu wenig Cash fürs Ablenkungsmanöver. Kostenloses Abkühlen bleibt möglich.')}</p>}
    <button className="action-button secondary-button manhunt-decoy-button" disabled={paused || !view.available}
      aria-describedby="decoy-effect" onClick={onDecoy}>{text('DEPLOY DECOY', 'ABLENKUNG STARTEN')} · {formatPrice(view.cost)}</button>
  </section>;
}
