import type { selectUpgrade } from '../game/selectors';
import { formatCash } from '../features/economy/ui';
import { formatBonus } from './stat-format';
export function UpgradeCard({ view, paused, onPurchase }: {
  readonly view: ReturnType<typeof selectUpgrade>; readonly paused: boolean; readonly onPurchase: () => void;
}) {
  if (!view) return null;
  return <section className="panel upgrade-panel" aria-labelledby="upgrades-heading">
    <div className="panel-heading"><h2 id="upgrades-heading">Upgrades</h2>{view.purchased && <span className="ownership-badge is-owned">PURCHASED</span>}</div>
    <h3>{view.definition.name}</h3>
    <p>{view.definition.description}</p>
    <p className="production">{formatBonus(view.definition.modifier.bonusBasisPoints)} {view.requirement} production{view.purchased ? paused ? ' · Session paused' : ' · Active' : ''}</p>
    {!view.purchased && <>
      <p>Price: <strong>{formatCash(view.definition.purchaseCost)}</strong></p>
      <p id="equipment-requirement">{view.eligible ? view.canPurchase ? 'Ready to purchase.' : 'More cash needed.' : `Requires ownership of ${view.requirement}.`}</p>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase} onClick={onPurchase} aria-describedby="equipment-requirement">{paused ? 'Session paused' : 'Buy equipment'}</button>
    </>}
  </section>;
}
