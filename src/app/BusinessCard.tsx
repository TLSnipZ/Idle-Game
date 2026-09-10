import { RateValue } from './RateValue';
import { ModifierBreakdown } from './ModifierBreakdown';
import { formatProduction } from './stat-format';
import type { selectBusinessProgress } from '../game/selectors';
import { RequirementList } from './RequirementList';
import type { RequirementResult } from '../game/requirement';
import type { BusinessDefinition } from '../features/businesses';
import { MAX_BUSINESS_LEVEL, STARTER_BUSINESS } from '../features/businesses';
import { formatPrice } from './number-format';
import { businessPresentation } from './game-presentation';

interface BusinessCardProps {
  readonly definition?: BusinessDefinition;
  readonly requirements?: RequirementResult;
  readonly progress: ReturnType<typeof selectBusinessProgress>;
  readonly onUpgrade: () => void;
  readonly owned: boolean;
  readonly canPurchase: boolean;
  readonly paused: boolean;
  readonly onPurchase: () => void;
}

export function BusinessCard({ definition = STARTER_BUSINESS, requirements, progress, onUpgrade, owned, canPurchase, paused, onPurchase }: BusinessCardProps) {
  const view = businessPresentation(owned, canPurchase, paused, requirements?.met ?? true, progress);
  const headingId = definition.id === STARTER_BUSINESS.id ? 'business-name' : `${definition.id}-name`;
  const noteId = `${definition.id}-note`;
  return (
    <section className={`panel business-card ${owned ? 'is-owned' : ''}`} aria-labelledby={headingId}>
      <div className="business-content">
        <div className="panel-heading"><span className="eyebrow">{definition.subtitle ?? 'Business'}</span><span className={`ownership-badge ${owned ? 'is-owned' : ''}`}>{view.status}</span></div>
        <h3 id={headingId}>{definition.name}</h3>
        {progress && <p className="business-level">Level {progress.level} / {MAX_BUSINESS_LEVEL}</p>}
        <p className="business-description">{definition.description}</p>
        <div className="business-terms">
          {!owned && <div><span className="metric-label">Purchase price</span><strong>{formatPrice(definition.purchaseCost)}</strong></div>}
          <div className={view.live ? 'production is-live production-readout' : 'production production-readout'}>
            <span className="metric-label"><span className="status-dot" aria-hidden="true" />{view.productionLabel}</span>
            <strong>{view.live ? '+' : ''}<RateValue text={formatProduction(progress?.production ?? definition.baseProductionCentsPerSecond)} /></strong>
            {paused && <span className="rate-note">Effective rate · currently inactive</span>}
          </div>
        </div>
        {!owned && requirements && <RequirementList result={requirements} id={`${definition.id}-requirements`} />}
        {progress && <div className="business-terms">
          <div><span className="metric-label">Next level</span><strong>{progress.nextProduction ? <RateValue text={formatProduction(progress.nextProduction)} /> : 'MAX LEVEL'}</strong></div>
          {progress.upgradeCost && <div><span className="metric-label">Next upgrade price</span><strong>{formatPrice(progress.upgradeCost)}</strong></div>}
        </div>}
        {progress && progress.modifiers.length > 0 && <div className="purchase-note"><p>Base at Level {progress.level}: <RateValue text={formatProduction(progress.baseProduction)} /></p><ModifierBreakdown modifiers={progress.modifiers} /><p>Effective: <RateValue text={formatProduction(progress.production)} /></p></div>}
        <div className="card-action-area">
          <button className="action-button purchase-button" disabled={view.disabled} onClick={progress ? onUpgrade : onPurchase}
            aria-label={progress ? `Upgrade ${definition.name}${progress.upgradeCost === null ? ', maximum level reached' : ` to Level ${progress.level + 1}`}` : `Acquire ${definition.name}`}
            aria-describedby={view.note ? noteId : undefined}>
            <span>{view.buttonLabel}</span>{!view.disabled && <span aria-hidden="true">↗</span>}
          </button>
          {view.note && <p id={noteId} className="purchase-note">{view.note}</p>}
        </div>
      </div>
    </section>
  );
}
