import { acquisitionPresentation } from './game-presentation';
import { XP_REWARDS } from '../features/progression';
import { DISPATCHER_JOBS_PER_HEAT } from '../features/heat';
import { RequirementList } from './RequirementList';
import type { selectDispatcher } from '../game/automation-selectors';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import { formatCash, formatPrice } from './number-format';
import { describeAutomatedJobs, formatRemainingTime } from './automation-presentation';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function AutomationCard({ view, paused, onPurchase, event }: {
  readonly view: ReturnType<typeof selectDispatcher>;
  readonly paused: boolean;
  readonly onPurchase: () => void;
  readonly event: RuntimeSnapshot['automationEvent'];
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const acquisition = acquisitionPresentation(view.eligible, view.canPurchase, 'automation', 'hire', locale);
  const name = localizedContent(locale, view.definition.id, 'name', view.definition.name);
  const description = localizedContent(locale, view.definition.id, 'description', view.definition.description);

  return <section className="panel upgrade-panel automation-card dispatcher-card" aria-labelledby="delegation-heading">
    <div className="panel-heading"><span className="eyebrow">{text('DELEGATION', 'DELEGATION')}</span><span className="ownership-badge">{view.unlocked ? paused ? text('PAUSED', 'PAUSIERT') : text('ACTIVE', 'AKTIV') : acquisition.status}</span></div>
    <h3 id="delegation-heading">{name}</h3>
    <p>{description}</p>
    <div className="automation-metrics">
      <div><span>{text('Interval', 'Intervall')}</span><strong>{formatRemainingTime(view.intervalMs)}</strong></div>
      <div><span>{text('Payout', 'Auszahlung')}</span><strong>{view.reward === null ? '—' : formatCash(view.reward)}</strong></div>
    </div>
    {view.unlocked ? <>
      <label id="dispatcher-timing" htmlFor="dispatcher-progress">{text('Next delivery in', 'Nächste Lieferung in')} <strong>{formatRemainingTime(view.remainingMs)}</strong>{paused ? text(' · Session paused', ' · Session pausiert') : ''}</label>
      <progress aria-label={text('Delivery Dispatcher progress', 'Fortschritt des Delivery Dispatchers')} aria-describedby="dispatcher-timing" id="dispatcher-progress" max={view.intervalMs} value={view.progressMs} />
      <details className="operations-disclosure"><summary>{text('Dispatcher details', 'Dispatcher-Details')}</summary><div className="operations-disclosure-body"><p>XP: <strong>{XP_REWARDS.dispatcherJob}</strong> {text('base per delivery.', 'Basis pro Lieferung.')}</p><p>Heat: <strong>+1</strong> {text(`per ${DISPATCHER_JOBS_PER_HEAT} deliveries completed together.`, `pro ${DISPATCHER_JOBS_PER_HEAT} gemeinsam abgeschlossene Lieferungen.`)}</p><p>{text('Manual deliveries remain available and do not reset this progress.', 'Manuelle Lieferungen bleiben möglich und setzen den Timer nicht zurück.')}</p><p>{event ? text(`Last dispatch: ${describeAutomatedJobs(event, locale)}`, `Letzter Dispatch: ${describeAutomatedJobs(event, locale)}`) : text('Your dispatcher is ready for the next run.', 'Dein Dispatcher ist bereit. Motivation wurde nicht geprüft.')}</p></div></details>
    </> : <>
      <div className="automation-price"><span>{text('Price', 'Preis')}</span><strong>{formatPrice(view.definition.purchaseCost)}</strong></div>
      {!view.requirements.met && <details className="operations-disclosure compact-requirements"><summary>{text('Requirements', 'Voraussetzungen')}</summary><RequirementList result={view.requirements} id="dispatcher-requirement" /></details>}
      <div className="card-action-area"><button className="action-button purchase-button" disabled={paused || !view.canPurchase}
        aria-describedby={acquisition.note ? "dispatcher-helper" : undefined} onClick={onPurchase}>{paused ? text('Session paused', 'Session pausiert') : text(`Hire ${name}`, `${name} einstellen`)}</button>{acquisition.note && <p id="dispatcher-helper" className="purchase-note">{acquisition.note}</p>}</div>
    </>}
  </section>;
}
