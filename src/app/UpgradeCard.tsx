import { RequirementList } from './RequirementList';
import type { selectUpgrade } from '../game/selectors';
import { findBusiness } from '../features/businesses';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
export function UpgradeCard({ view, paused, onPurchase }: {
  readonly view: ReturnType<typeof selectUpgrade>; readonly paused: boolean; readonly onPurchase: () => void;
}) {
  if (!view) return null;
  const headingId = `${view.definition.id}-heading`;
  const requirementId = `${view.definition.id}-requirement`;
  const target = view.definition.modifier.target;
  const scope = target.stat !== 'business-production' ? (target.stat === 'xp-reward' ? 'XP reward' : 'Starter Job reward')
    : target.businessId === null ? 'All businesses production' : `${findBusiness(target.businessId)?.name} production`;
  return <section className="panel upgrade-panel" aria-labelledby={headingId}>
    <div className="panel-heading"><h3 id={headingId}>{view.definition.name}</h3>{view.purchased && <span className="ownership-badge is-owned">PURCHASED</span>}</div>
    <p>{view.definition.description}</p>
    <p className="production">{formatModifier(view.definition.modifier)} {scope}{view.purchased ? paused ? ' · Session paused' : ' · Active' : ''}</p>
    <p>Price: <strong>{formatPrice(view.definition.purchaseCost)}</strong></p>
    {!view.purchased && <>
      <RequirementList result={view.requirements} id={requirementId} />
      <p>{view.eligible ? view.canPurchase ? 'Ready to purchase.' : 'INSUFFICIENT CASH' : 'LOCKED'}</p>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase} onClick={onPurchase} aria-describedby={requirementId} aria-label={`Buy ${view.definition.name}`}>{paused ? 'Session paused' : 'Buy upgrade'}</button>
    </>}
  </section>;
}
