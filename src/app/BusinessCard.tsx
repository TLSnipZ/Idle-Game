import { STARTER_BUSINESS } from '../features/businesses';
import { formatCash } from '../features/economy/ui';
import { businessPresentation } from './game-presentation';

interface BusinessCardProps {
  readonly owned: boolean;
  readonly canPurchase: boolean;
  readonly paused: boolean;
  readonly onPurchase: () => void;
}

export function BusinessCard({ owned, canPurchase, paused, onPurchase }: BusinessCardProps) {
  const view = businessPresentation(owned, canPurchase, paused);
  return (
    <section className={`panel business-card ${owned ? 'is-owned' : ''}`} aria-labelledby="business-name">
      <div className="garage-scene" aria-hidden="true">
        <div className="garage-sign">Dockside<span>Detailing & care</span></div>
        <div className="garage-door" /><div className="garage-light" />
        <span className="scene-caption">A foothold on the waterfront</span>
      </div>
      <div className="business-content">
        <div className="panel-heading"><span className="eyebrow">Your first business</span><span className={`ownership-badge ${owned ? 'is-owned' : ''}`}>{owned ? '✓ ' : ''}{view.status}</span></div>
        <h2 id="business-name">{STARTER_BUSINESS.name}</h2>
        <p className="business-description">{STARTER_BUSINESS.description}</p>
        <div className="business-terms">
          <div><span className="metric-label">{owned ? 'Acquisition price' : 'Purchase price'}</span><strong>{formatCash(STARTER_BUSINESS.purchaseCost)}</strong></div>
          <div className={view.live ? 'production is-live' : 'production'}>
            <span className="metric-label"><span className="status-dot" aria-hidden="true" />{view.productionLabel}</span>
            <strong>{view.live ? '+' : ''}{formatCash(STARTER_BUSINESS.baseProductionCentsPerSecond)} <small>/ sec</small></strong>
            {paused && <span className="rate-note">Base rate · currently inactive</span>}
          </div>
        </div>
        <button className="action-button purchase-button" disabled={view.disabled} onClick={onPurchase} aria-describedby="purchase-note">
          <span>{view.buttonLabel}</span><span aria-hidden="true">{owned ? '✓' : '↗'}</span>
        </button>
        <p id="purchase-note" className="purchase-note">{view.note}</p>
      </div>
    </section>
  );
}
