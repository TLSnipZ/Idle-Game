import type { selectUpgrade } from '../game/selectors';
import { findBusiness } from '../features/businesses';
import { formatCash } from '../features/economy/ui';
import { formatModifier } from './stat-format';
export function UpgradeCard({ view, paused, onPurchase }: {
  readonly view: ReturnType<typeof selectUpgrade>; readonly paused: boolean; readonly onPurchase: () => void;
}) {
  if (!view) return null;
  const headingId = `${view.definition.id}-heading`;
  const requirementId = `${view.definition.id}-requirement`;
  const target = view.definition.modifier.target;
  const scope = target.stat === 'job-reward' ? 'Starter-job reward'
    : target.businessId === null ? 'All businesses production' : `${findBusiness(target.businessId)?.name} production`;
  return <section className="panel upgrade-panel" aria-labelledby={headingId}>
    <div className="panel-heading"><h3 id={headingId}>{view.definition.name}</h3>{view.purchased && <span className="ownership-badge is-owned">PURCHASED</span>}</div>
    <p>{view.definition.description}</p>
    <p className="production">{formatModifier(view.definition.modifier)} {scope}{view.purchased ? paused ? ' · Session paused' : ' · Active' : ''}</p>
    <p>Price: <strong>{formatCash(view.definition.purchaseCost)}</strong></p>
    <p id={requirementId}>{view.requirement}</p>
    {!view.purchased && <>
      <p>{view.eligible ? view.canPurchase ? 'Ready to purchase.' : 'More cash needed.' : 'Requirement not met.'}</p>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase} onClick={onPurchase} aria-describedby={requirementId} aria-label={`Buy ${view.definition.name}`}>{paused ? 'Session paused' : 'Buy upgrade'}</button>
    </>}
  </section>;
}
