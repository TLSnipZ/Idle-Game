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
    <div className="panel-heading"><h3 id="delegation-heading">{text('Delegation', 'Delegation')}</h3>
      <span className="ownership-badge">{view.unlocked ? paused ? text('PAUSED', 'PAUSIERT') : text('ACTIVE', 'AKTIV') : acquisition.status}</span>
    </div>
    <h4>{name}</h4>
    <p>{description}</p>
    <p className="automation-role">{text('Automatic delivery work', 'Automatische Lieferarbeit · weil selber fahren irgendwann nach Arbeit klingt')}</p>
    <p>XP: {XP_REWARDS.dispatcherJob} {text('base per delivery · Bonuses apply to XP earned.', 'Basis pro Lieferung · XP-Boni gelten natürlich auch für delegierte Fleißarbeit.')}</p>
    <p>Heat: +1 {text(`per ${DISPATCHER_JOBS_PER_HEAT} deliveries completed together.`, `pro ${DISPATCHER_JOBS_PER_HEAT} gemeinsam abgeschlossene Lieferungen.`)}</p>
    <p>{text('Runs every', 'Läuft alle')} {formatRemainingTime(view.intervalMs)} · {view.reward === null ? text('Reward unavailable', 'Auszahlung nicht verfügbar') : text(`${formatCash(view.reward)} per delivery`, `${formatCash(view.reward)} pro Lieferung`)}</p>
    {view.unlocked ? <>
      <label id="dispatcher-timing" htmlFor="dispatcher-progress">{text('Next delivery in', 'Nächste Lieferung in')} {formatRemainingTime(view.remainingMs)}{paused ? text(' · Session paused', ' · Session pausiert') : ''}</label>
      <progress aria-label={text('Delivery Dispatcher progress', 'Fortschritt des Delivery Dispatchers')} aria-describedby="dispatcher-timing" id="dispatcher-progress" max={view.intervalMs} value={view.progressMs} />
      <p>{text('Manual deliveries remain available and do not reset this progress.', 'Manuelle Lieferungen bleiben möglich und setzen den Timer nicht zurück. Doppelarbeit, aber profitabel.')}</p>
      <p><span>{event ? text(`Last dispatch: ${describeAutomatedJobs(event, locale)}`, `Letzter Dispatch: ${describeAutomatedJobs(event, locale)}`) : text('Your dispatcher is ready for the next run.', 'Dein Dispatcher ist bereit. Motivation wurde nicht geprüft.')}</span></p>
    </> : <>
      <p>{text('Price:', 'Preis:')} <strong>{formatPrice(view.definition.purchaseCost)}</strong></p>
      <RequirementList result={view.requirements} id="dispatcher-requirement" />
      <div className="card-action-area"><button className="action-button purchase-button" disabled={paused || !view.canPurchase}
        aria-describedby={acquisition.note ? "dispatcher-requirement dispatcher-helper" : "dispatcher-requirement"} onClick={onPurchase}>{paused ? text('Session paused', 'Session pausiert') : text(`Hire ${name}`, `${name} einstellen`)}</button>{acquisition.note && <p id="dispatcher-helper" className="purchase-note">{acquisition.note}</p>}</div>
    </>}
  </section>;
}
