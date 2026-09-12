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

  if (isDockside) {
    return <section className={`panel business-card dockside-reference ${owned ? 'is-owned' : ''}`} aria-labelledby={headingId}>
      <div className="dockside-hero">
        <div className="dockside-hero-copy">
          <span className="eyebrow">{text('BUSINESS', 'BUSINESS')}</span>
          <h3 id={headingId}>{definition.name}</h3>
          <p className="dockside-tagline">{text('Clean cars. Dirty money.', 'Saubere Autos. Schmutziges Geld.')}</p>
          <div className="dockside-badges" aria-label={text('Business traits', 'Business-Merkmale')}>
            <span>{text('Vehicle services', 'Fahrzeugservice')}</span><span>{text('Passive income', 'Passives Einkommen')}</span><span>{text('Solara original', 'Solara Original')}</span>
          </div>
          <p className="business-description">{description}</p>
          <blockquote>{text('Same dirt. Higher standards.', 'Gleicher Dreck. Höhere Standards.')}</blockquote>
        </div>
        <span className={`ownership-badge dockside-status ${owned ? 'is-owned' : ''}`}>{view.status}</span>
      </div>
      <div className="dockside-management">
        <div className="dockside-level-panel">
          <div className="panel-heading"><span className="eyebrow">{subtitle}</span>{progress && <strong>Level {progress.level} / {MAX_BUSINESS_LEVEL}</strong>}</div>
          <div className="dockside-stat-grid">
            {!owned && <div><span>{text('Purchase price', 'Kaufpreis')}</span><strong>{formatPrice(definition.purchaseCost)}</strong></div>}
            <div className={view.live ? 'is-live' : ''}><span>{view.productionLabel}</span><strong>{view.live ? '+' : ''}<RateValue text={formatProduction(progress?.production ?? definition.baseProductionCentsPerSecond)} /></strong></div>
            {progress && <div><span>{text('Next level', 'Nächstes Level')}</span><strong>{progress.nextProduction ? <RateValue text={formatProduction(progress.nextProduction)} /> : text('MAX LEVEL', 'MAX-LEVEL')}</strong></div>}
            {progress?.upgradeCost && <div><span>{text('Upgrade cost', 'Upgrade-Kosten')}</span><strong>{formatPrice(progress.upgradeCost)}</strong></div>}
          </div>
          {!owned && requirements && <RequirementList result={requirements} id={`${definition.id}-requirements`} />}
          {progress && progress.modifiers.length > 0 && <details className="dockside-breakdown"><summary>{text('Income breakdown', 'Einkommensdetails')}</summary><p>{text(`Base at Level ${progress.level}:`, `Basis auf Level ${progress.level}:`)} <RateValue text={formatProduction(progress.baseProduction)} /></p><ModifierBreakdown modifiers={progress.modifiers} /><p>{text('Effective:', 'Effektiv:')} <RateValue text={formatProduction(progress.production)} /></p></details>}
        </div>
        <div className="dockside-upgrade-panel">
          <span className="eyebrow">{progress ? text('UPGRADE BUSINESS', 'BUSINESS UPGRADEN') : text('ACQUIRE BUSINESS', 'BUSINESS ÜBERNEHMEN')}</span>
          <h4>{progress ? text(`Level ${progress.level + 1}`, `Level ${progress.level + 1}`) : definition.name}</h4>
          <p>{progress ? text('Increase output. Improve the operation. Give the accountant another small crisis.', 'Mehr Output. Besserer Betrieb. Schenk dem Buchhalter die nächste kleine Krise.') : text('Secure Dockside and make the waterfront suspiciously profitable.', 'Sicher dir Dockside und mach die Waterfront verdächtig profitabel.')}</p>
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

  return (
    <section className={`panel business-card ${owned ? 'is-owned' : ''}`} aria-labelledby={headingId}>
      <div className="business-content">
        <div className="panel-heading"><span className="eyebrow">{subtitle}</span><span className={`ownership-badge ${owned ? 'is-owned' : ''}`}>{view.status}</span></div>
        <h3 id={headingId}>{definition.name}</h3>
        {progress && <p className="business-level">Level {progress.level} / {MAX_BUSINESS_LEVEL}</p>}
        <p className="business-description">{description}</p>
        <div className="business-terms">
          {!owned && <div><span className="metric-label">{text('Purchase price', 'Kaufpreis')}</span><strong>{formatPrice(definition.purchaseCost)}</strong></div>}
          <div className={view.live ? 'production is-live production-readout' : 'production production-readout'}>
            <span className="metric-label"><span className="status-dot" aria-hidden="true" />{view.productionLabel}</span>
            <strong>{view.live ? '+' : ''}<RateValue text={formatProduction(progress?.production ?? definition.baseProductionCentsPerSecond)} /></strong>
            {paused && <span className="rate-note">{text('Effective rate · currently inactive', 'Effektive Rate · aktuell inaktiv')}</span>}
          </div>
        </div>
        {!owned && requirements && <RequirementList result={requirements} id={`${definition.id}-requirements`} />}
        {progress && <div className="business-terms">
          <div><span className="metric-label">{text('Next level', 'Nächstes Level')}</span><strong>{progress.nextProduction ? <RateValue text={formatProduction(progress.nextProduction)} /> : text('MAX LEVEL', 'MAX-LEVEL')}</strong></div>
          {progress.upgradeCost && <div><span className="metric-label">{text('Next upgrade price', 'Nächster Upgrade-Preis')}</span><strong>{formatPrice(progress.upgradeCost)}</strong></div>}
        </div>}
        {progress && progress.modifiers.length > 0 && <div className="purchase-note"><p>{text(`Base at Level ${progress.level}:`, `Basis auf Level ${progress.level}:`)} <RateValue text={formatProduction(progress.baseProduction)} /></p><ModifierBreakdown modifiers={progress.modifiers} /><p>{text('Effective:', 'Effektiv:')} <RateValue text={formatProduction(progress.production)} /></p></div>}
        <div className="card-action-area">
          <button className="action-button purchase-button" disabled={view.disabled} onClick={progress ? onUpgrade : onPurchase}
            aria-label={progress ? text(`Upgrade ${definition.name}${progress.upgradeCost === null ? ', maximum level reached' : ` to Level ${progress.level + 1}`}`, `${definition.name} upgraden${progress.upgradeCost === null ? ', Max-Level erreicht' : ` auf Level ${progress.level + 1}`}`) : text(`Acquire ${definition.name}`, `${definition.name} übernehmen`)}
            aria-describedby={view.note ? noteId : undefined}>
            <span>{view.buttonLabel}</span>{!view.disabled && <span aria-hidden="true">↗</span>}
          </button>
          {view.note && <p id={noteId} className="purchase-note">{view.note}</p>}
        </div>
      </div>
    </section>
  );
}
