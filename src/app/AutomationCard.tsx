import { XP_REWARDS } from '../features/progression';
import { DISPATCHER_JOBS_PER_HEAT } from '../features/heat';
import { RequirementList } from './RequirementList';
import type { selectDispatcher } from '../game/automation-selectors';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import { formatCash } from '../features/economy/ui';
import { describeAutomatedJobs, formatRemainingTime } from './automation-presentation';

export function AutomationCard({ view, paused, onPurchase, event }: {
  readonly view: ReturnType<typeof selectDispatcher>;
  readonly paused: boolean;
  readonly onPurchase: () => void;
  readonly event: RuntimeSnapshot['automationEvent'];
}) {
  return <section className="panel upgrade-panel automation-card dispatcher-card" aria-labelledby="delegation-heading">
    <div className="panel-heading"><h3 id="delegation-heading">Delegation</h3>
      <span className="ownership-badge">{view.unlocked ? paused ? 'PAUSED' : 'ACTIVE' : view.eligible ? 'AVAILABLE' : 'LOCKED'}</span>
    </div>
    <h4>{view.definition.name}</h4>
    <p>{view.definition.description}</p>
    <p className="automation-role">Automatic delivery work</p>
    <p>XP: {XP_REWARDS.dispatcherJob} base per delivery · XP modifiers and rounding apply once per batch.</p>
    <p>Heat: +1 per {DISPATCHER_JOBS_PER_HEAT} deliveries in one batch.</p>
    <p>Runs every {formatRemainingTime(view.intervalMs)} · {view.reward === null ? 'Reward unavailable' : `${formatCash(view.reward)} per delivery`}</p>
    {view.unlocked ? <>
      <label id="dispatcher-timing" htmlFor="dispatcher-progress">Next delivery in {formatRemainingTime(view.remainingMs)}{paused ? ' · Session paused' : ''}</label>
      <progress aria-label="Delivery Dispatcher progress" aria-describedby="dispatcher-timing" id="dispatcher-progress" max={view.intervalMs} value={view.progressMs} />
      <p>Manual deliveries remain available and do not reset this progress.</p>
      <p><span>{event ? `Last dispatch: ${describeAutomatedJobs(event)}` : 'Your dispatcher is ready for the next run.'}</span></p>
    </> : <>
      <p>Price: <strong>{formatCash(view.definition.purchaseCost)}</strong></p>
      <RequirementList result={view.requirements} id="dispatcher-requirement" />
      <p>{view.eligible ? view.canPurchase ? 'Ready to hire.' : 'More cash needed.' : 'LOCKED — Requirement not met.'}</p>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase}
        aria-describedby="dispatcher-requirement" onClick={onPurchase}>{paused ? 'Session paused' : `Hire ${view.definition.name}`}</button>
    </>}
  </section>;
}
