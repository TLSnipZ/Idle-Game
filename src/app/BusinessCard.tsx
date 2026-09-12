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
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

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
  const locale = useLocale();
  const text = useLocalizedText();
  const view = businessPresentation(owned, canPurchase, paused, requirements?.met ?? true, progress, locale);
  const headingId = definition.id === STARTER_BUSINESS.id ? 'business-name' : `${definition.id}-name`;
  const noteId = `${definition.id}-note`;
  const subtitle = localizedContent(locale, definition.id, 'subtitle', definition.subtitle ?? 'Business');
  const description = localizedContent(locale, definition.id, 'description', definition.description);
  const isDockside = definition.id === STARTER_BUSINESS.id;

  return <section className={`panel business-card operations-business-card ${owned ? 'is-owned' : ''}`} aria-labelledby={headingId}>
    <div className="business-content">
      <div className="panel-heading business-card-heading"><span className="eyebrow">{subtitle}</span><span className={`ownership-badge ${owned ? 'is-owned' : ''}`}>{view.status}</span></div>
      <div className="business-title-row"><div><h3 id={headingId}>{definition.name}</h3>{isDockside && <p className="dockside-tagline">{text('Clean cars. Dirty money.', 'Saubere Autos. Schmutziges Geld.')}</p>}</div>{progress && <span className="business-level">Level {progress.level} / {MAX_BUSINESS_LEVEL}</span>}</div>
      <p className="business-description">{description}</p>

      <div className={`business-stat-grid ${progress ? 'is-three-up' : 'is-acquisition'}`}>
        {!owned && !progress && <div><span>{text('Purchase price', 'Kaufpreis')}</span><strong>{formatPrice(definition.purchaseCost)}</strong></div>}
        <div className={view.live ? 'is-live' : ''}><span>{view.productionLabel}</span><strong>{view.live ? '+' : ''}<RateValue text={formatProduction(progress?.production ?? definition.baseProductionCentsPerSecond)} /></strong></div>
        {progress && <div><span>{text('Next level', 'Nächstes Level')}</span><strong>{progress.nextProduction ? <RateValue text={formatProduction(progress.nextProduction)} /> : text('MAX LEVEL', 'MAX-LEVEL')}</strong></div>}
        {progress && <div><span>{text('Upgrade', 'Upgrade')}</span><strong>{progress.upgradeCost ? formatPrice(progress.upgradeCost) : text('MAX', 'MAX')}</strong></div>}
      </div>

      {!owned && requirements && <RequirementList result={requirements} id={`${definition.id}-requirements`} />}
      {progress && progress.modifiers.length > 0 && <details className="operations-disclosure earnings-disclosure"><summary>{text('Earnings details', 'Einnahmen-Details')}</summary><div className="operations-disclosure-body"><p>{text(`Base at Level ${progress.level}:`, `Basis auf Level ${progress.level}:`)} <strong><RateValue text={formatProduction(progress.baseProduction)} /></strong></p><ModifierBreakdown modifiers={progress.modifiers} /><p>{text('Effective:', 'Effektiv:')} <strong><RateValue text={formatProduction(progress.production)} /></strong></p></div></details>}

      <div className="card-action-area business-card-action">
        <button className="action-button purchase-button" disabled={view.disabled} onClick={progress ? onUpgrade : onPurchase}
          aria-label={progress ? text(`Upgrade ${definition.name}${progress.upgradeCost === null ? ', maximum level reached' : ` to Level ${progress.level + 1}`}`, `${definition.name} upgraden${progress.upgradeCost === null ? ', Max-Level erreicht' : ` auf Level ${progress.level + 1}`}`) : text(`Acquire ${definition.name}`, `${definition.name} übernehmen`)}
          aria-describedby={view.note ? noteId : undefined}>
          <span>{view.buttonLabel}</span>{!view.disabled && <span aria-hidden="true">↗</span>}
        </button>
        {paused && <span className="rate-note">{text('Session paused', 'Session pausiert')}</span>}
        {view.note && <p id={noteId} className="purchase-note">{view.note}</p>}
      </div>
    </div>
  </section>;
}
