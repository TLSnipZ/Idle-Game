import { ModifierBreakdown } from './ModifierBreakdown';
import { formatProduction } from './stat-format';
import type { selectBusinessProgress } from '../game/selectors';
import { STARTER_BUSINESS } from '../features/businesses';
import { formatCash } from '../features/economy/ui';
import { businessPresentation } from './game-presentation';

interface BusinessCardProps {
  readonly progress: ReturnType<typeof selectBusinessProgress>;
  readonly onUpgrade: () => void;
  readonly owned: boolean;
  readonly canPurchase: boolean;
  readonly paused: boolean;
  readonly onPurchase: () => void;
}

export function BusinessCard({ progress, onUpgrade, owned, canPurchase, paused, onPurchase }: BusinessCardProps) {
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
        <h3 id="business-name">{STARTER_BUSINESS.name}</h3>
        {progress && <p className="business-level">Level {progress.level}</p>}
        <p className="business-description">{STARTER_BUSINESS.description}</p>
        <div className="business-terms">
          {!owned && <div><span className="metric-label">Purchase price</span><strong>{formatCash(STARTER_BUSINESS.purchaseCost)}</strong><p>No requirements. Production begins after purchase.</p></div>}
          <div className={view.live ? 'production is-live production-readout' : 'production production-readout'}>
            <span className="metric-label"><span className="status-dot" aria-hidden="true" />{view.productionLabel}</span>
            <strong>{view.live ? '+' : ''}{formatProduction(progress?.production ?? STARTER_BUSINESS.baseProductionCentsPerSecond)} <small>/ sec</small></strong>
            {paused && <span className="rate-note">Effective rate · currently inactive</span>}
          </div>
        </div>
        {progress && <div className="business-terms">
          <div><span className="metric-label">Next level</span><strong>{progress.nextProduction ? `${formatProduction(progress.nextProduction)} / sec` : 'MAX LEVEL'}</strong></div>
          {progress.upgradeCost && <div><span className="metric-label">Next upgrade price</span><strong>{formatCash(progress.upgradeCost)}</strong></div>}
        </div>}
        {progress && progress.modifiers.length > 0 && <div className="purchase-note"><p>Base at Level {progress.level}: {formatCash(progress.baseProduction)}/sec</p><ModifierBreakdown modifiers={progress.modifiers} /><p>Effective: {formatProduction(progress.production)}/sec</p></div>}
        <button className="action-button purchase-button" disabled={progress ? paused || !progress.canUpgrade : view.disabled} onClick={progress ? onUpgrade : onPurchase} aria-label={progress ? `Upgrade ${STARTER_BUSINESS.name}${progress.upgradeCost === null ? ", maximum level reached" : ` to Level ${progress.level + 1}`}` : `Buy ${STARTER_BUSINESS.name}`} aria-describedby="purchase-note">
          <span>{progress ? paused ? 'Session paused' : progress.upgradeCost === null ? 'MAX LEVEL' : `Upgrade to Level ${progress.level + 1}` : view.buttonLabel}</span><span aria-hidden="true">{owned ? '✓' : '↗'}</span>
        </button>
        <p id="purchase-note" className="purchase-note">{progress && !paused && progress.upgradeCost && !progress.canUpgrade ? 'More cash needed for the next level.' : view.note}</p>
      </div>
    </section>
  );
}
