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
  return <section className="panel upgrade-panel" aria-labelledby="delegation-heading">
    <div className="panel-heading"><h2 id="delegation-heading">Delegation</h2>
      {view.unlocked && <span className="ownership-badge is-owned">{paused ? 'PAUSED' : 'ACTIVE'}</span>}
    </div>
    <h3>{view.definition.name}</h3>
    <p>{view.definition.description}</p>
    <p>Runs every {formatRemainingTime(view.intervalMs)} · {view.reward === null ? 'Reward unavailable' : `${formatCash(view.reward)} per delivery`}</p>
    {view.unlocked ? <>
      <label htmlFor="dispatcher-progress">Next delivery in {formatRemainingTime(view.remainingMs)}{paused ? ' · Session paused' : ''}</label>
      <progress id="dispatcher-progress" max={view.intervalMs} value={view.progressMs} />
      <p>Manual deliveries remain available and do not reset this progress.</p>
      <p role="status" aria-live="polite" aria-atomic="true"><span key={event?.sequence}>{event ? `Last dispatch: ${describeAutomatedJobs(event)}` : 'Your dispatcher is ready for the next run.'}</span></p>
    </> : <>
      <p>Price: <strong>{formatCash(view.definition.purchaseCost)}</strong></p>
      <RequirementList result={view.requirements} id="dispatcher-requirement" />
      <p>{view.eligible ? view.canPurchase ? 'Ready to hire.' : 'More cash needed.' : 'LOCKED — Requirement not met.'}</p>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase}
        aria-describedby="dispatcher-requirement" onClick={onPurchase}>{paused ? 'Session paused' : `Hire ${view.definition.name}`}</button>
    </>}
  </section>;
}
