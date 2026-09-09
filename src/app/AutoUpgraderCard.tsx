import type { selectAutoUpgrader } from '../game/automation-selectors';
import { formatPrice } from './number-format';
import { formatRemainingTime } from './automation-presentation';
import { RequirementList } from './RequirementList';

export function AutoUpgraderCard({ view, paused, onPurchase, onToggle }: {
  readonly view: ReturnType<typeof selectAutoUpgrader>;
  readonly paused: boolean;
  readonly onPurchase: () => void;
  readonly onToggle: (enabled: boolean) => void;
}) {
  return <section className="panel upgrade-panel automation-card auto-spend-card" aria-labelledby="auto-upgrader-heading">
    <div className="panel-heading"><h3 id="auto-upgrader-heading">BUSINESS AUTO-UPGRADER</h3>
      <span className="ownership-badge">{view.owned ? paused ? 'PAUSED' : view.enabled ? 'ACTIVE' : 'DISABLED' : view.requirements.met ? 'AVAILABLE' : 'LOCKED'}</span>
    </div>
    <p>{view.definition.description}</p>
    <p className="automation-role">Automatic spending · Attempt every {formatRemainingTime(view.definition.intervalMs)}</p>
    {view.owned ? <>
      <p id="auto-upgrader-state">Automatic spending: {view.enabled ? 'enabled' : 'disabled'}{paused ? ' · Session paused' : ''}.</p>
      <p>{view.level === null ? 'Dockside not owned — no upgrades available.' : `Dockside Level ${view.level}`}</p>
      {view.maxed ? <p>MAX LEVEL · No further upgrades available.</p> : view.nextCost !== null && <p>Next upgrade: <strong>{formatPrice(view.nextCost)}</strong>
        {!view.canAffordNextUpgrade && ' · More cash needed'}</p>}
      <label id="auto-upgrader-timing" htmlFor="auto-upgrader-progress">Next attempt in {formatRemainingTime(view.remainingMs)}{!view.enabled || paused ? ' · Progress paused' : ''}</label>
      <progress aria-label="Business Auto-Upgrader attempt progress" aria-describedby="auto-upgrader-timing auto-upgrader-state" id="auto-upgrader-progress" max={view.definition.intervalMs} value={view.progressMs} />
      <p className="spending-disclosure" id="auto-upgrader-spending">Automatically spends cash on Dockside upgrades when affordable.</p>
      <button className="action-button secondary-button" disabled={paused || !view.canToggle}
        aria-label={`${view.enabled ? 'Disable' : 'Enable'} Business Auto-Upgrader`} aria-describedby="auto-upgrader-spending auto-upgrader-state"
        onClick={() => onToggle(!view.enabled)}>{view.enabled ? 'DISABLE' : 'ENABLE'}</button>
    </> : <>
      <p>Price: <strong>{formatPrice(view.definition.purchaseCost)}</strong></p>
      <RequirementList result={view.requirements} id="auto-upgrader-requirements" />
      {view.requirements.met && <p>{view.affordable ? 'Ready to purchase. Starts disabled.' : 'INSUFFICIENT CASH'}</p>}
      <p className="spending-disclosure" id="auto-upgrader-spending">Automatically spends cash on Dockside upgrades when affordable.</p>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase}
        aria-describedby="auto-upgrader-requirements auto-upgrader-spending" onClick={onPurchase}>Buy Business Auto-Upgrader</button>
    </>}
  </section>;
}
