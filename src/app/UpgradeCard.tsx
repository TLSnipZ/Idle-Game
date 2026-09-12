import { RequirementList } from './RequirementList';
import type { selectUpgrade } from '../game/selectors';
import { findBusiness } from '../features/businesses';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function UpgradeCard({ view, paused, onPurchase }: {
  readonly view: ReturnType<typeof selectUpgrade>; readonly paused: boolean; readonly onPurchase: () => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  if (!view) return null;
  const headingId = `${view.definition.id}-heading`;
  const requirementId = `${view.definition.id}-requirement`;
  const target = view.definition.modifier.target;
  const scope = target.stat !== 'business-production' ? (target.stat === 'xp-reward' ? text('XP reward', 'XP-Auszahlung') : text('Starter Job reward', 'Job-Auszahlung'))
    : target.businessId === null ? text('All businesses production', 'Produktion aller Businesses') : text(`${findBusiness(target.businessId)?.name} production`, `${findBusiness(target.businessId)?.name} Produktion`);
  const name = localizedContent(locale, view.definition.id, 'name', view.definition.name);
  const description = localizedContent(locale, view.definition.id, 'description', view.definition.description);

  return <section className="panel upgrade-panel operations-upgrade-card" aria-labelledby={headingId}>
    <div className="panel-heading"><span className="eyebrow">{text('UPGRADE', 'UPGRADE')}</span>{view.purchased && <span className="ownership-badge is-owned">{text('PURCHASED', 'GEKAUFT')}</span>}</div>
    <h3 id={headingId}>{name}</h3>
    <p>{description}</p>
    <div className="upgrade-metrics">
      <div><span>{text('Effect', 'Effekt')}</span><strong>{formatModifier(view.definition.modifier)}</strong><small>{scope}</small></div>
      <div><span>{text('Price', 'Preis')}</span><strong>{formatPrice(view.definition.purchaseCost)}</strong></div>
    </div>
    {!view.purchased && <>
      {!view.requirements.met && <details className="operations-disclosure compact-requirements"><summary>{text('Requirements', 'Voraussetzungen')}</summary><RequirementList result={view.requirements} id={requirementId} /></details>}
      <div className="upgrade-state">{view.eligible ? view.canPurchase ? text('Ready to purchase. Your wallet has been warned.', 'Kaufbereit. Dein Konto wurde vorsorglich informiert.') : text('INSUFFICIENT CASH', 'ZU WENIG CASH') : text('LOCKED', 'GESPERRT')}</div>
      <button className="action-button purchase-button" disabled={paused || !view.canPurchase} onClick={onPurchase} aria-describedby={!view.requirements.met ? requirementId : undefined} aria-label={text(`Buy ${name}`, `${name} kaufen`)}>{paused ? text('Session paused', 'Session pausiert') : text('Buy upgrade', 'Upgrade kaufen')}</button>
    </>}
    {view.purchased && <p className="upgrade-state is-active">{paused ? text('Session paused', 'Session pausiert') : text('ACTIVE · already earning its keep.', 'AKTIV · verdient bereits seinen Unterhalt.')}</p>}
  </section>;
}
