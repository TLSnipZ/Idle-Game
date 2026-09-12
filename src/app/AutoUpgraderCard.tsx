import { acquisitionPresentation } from './game-presentation';
import type { selectAutoUpgrader } from '../game/automation-selectors';
import { formatPrice } from './number-format';
import { formatRemainingTime } from './automation-presentation';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function AutoUpgraderCard({ view, paused, onPurchase, onToggle, onTargetChange }: {
  readonly view: ReturnType<typeof selectAutoUpgrader>;
  readonly paused: boolean;
  readonly onPurchase: () => void;
  readonly onTargetChange?: (id: string) => void;
  readonly onToggle: (enabled: boolean) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const acquisition = acquisitionPresentation(view.requirements.met, view.affordable, 'automation', 'buy', locale);
  const description = localizedContent(locale, view.definition.id, 'description', view.definition.description);

  return <section className="panel upgrade-panel automation-card auto-spend-card" aria-labelledby="auto-upgrader-heading">
    <div className="panel-heading"><span className="eyebrow">{text('AUTO SPEND', 'AUTO-SPEND')}</span><span className="ownership-badge">{view.owned ? paused ? text('PAUSED', 'PAUSIERT') : view.enabled ? text('ACTIVE', 'AKTIV') : text('DISABLED', 'DEAKTIVIERT') : acquisition.status}</span></div>
    <h3 id="auto-upgrader-heading">{text('Business Auto-Upgrader', 'Business Auto-Upgrader')}</h3>
    <p>{description}</p>
    <div className="automation-metrics">
      <div><span>{text('Attempt', 'Versuch')}</span><strong>{formatRemainingTime(view.definition.intervalMs)}</strong></div>
      <div><span>{text('Target', 'Ziel')}</span><strong>{view.owned ? view.target.name : '—'}</strong></div>
    </div>
    {view.owned ? <>
      {view.targets.length > 1 || (view.level === null && view.targets.length > 0) ? <div className="auto-target">
        <label htmlFor="auto-upgrader-target">{text('Target Business', 'Ziel-Business')}</label>
        <select id="auto-upgrader-target" value={view.level === null ? '' : view.target.id} disabled={paused} onChange={event => onTargetChange?.(event.currentTarget.value)}>
          {view.level === null && <option value="" disabled>{text('Choose an owned Business', 'Wähle ein eigenes Business')}</option>}
          {view.targets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}
        </select>
      </div> : null}
      <div className="automation-next-state">
        <span>{view.level === null ? text('No owned target', 'Kein eigenes Ziel') : `${view.target.name} · Level ${view.level}`}</span>
        <strong>{view.maxed ? text('MAXED', 'MAX') : view.nextCost !== null ? formatPrice(view.nextCost) : '—'}</strong>
      </div>
      <label id="auto-upgrader-timing" htmlFor="auto-upgrader-progress">{text('Next attempt in', 'Nächster Versuch in')} <strong>{formatRemainingTime(view.remainingMs)}</strong>{!view.enabled || paused ? text(' · Progress paused', ' · Fortschritt pausiert') : ''}</label>
      <progress aria-label={text('Business Auto-Upgrader attempt progress', 'Fortschritt des Business Auto-Upgraders')} aria-describedby="auto-upgrader-timing auto-upgrader-state" id="auto-upgrader-progress" max={view.definition.intervalMs} value={view.progressMs} />
      <p className="sr-only" id="auto-upgrader-state">{text('Automatic spending:', 'Automatische Ausgaben:')} {view.enabled ? text('enabled', 'aktiviert') : text('disabled', 'deaktiviert')}.</p>
      <details className="operations-disclosure"><summary>{text('Spending details', 'Ausgaben-Details')}</summary><div className="operations-disclosure-body"><p>{text('Automatically buys one upgrade for the selected Business every 30s when affordable.', 'Kauft alle 30s automatisch ein Upgrade fürs gewählte Business, wenn genug Cash da ist.')}</p>{!view.maxed && !view.canAffordNextUpgrade && <p>{text('More cash needed for the next upgrade.', 'Für das nächste Upgrade fehlt noch Cash.')}</p>}</div></details>
      <button className="action-button secondary-button" disabled={paused || !view.canToggle} aria-label={text(`${view.enabled ? 'Disable' : 'Enable'} Business Auto-Upgrader`, `Business Auto-Upgrader ${view.enabled ? 'deaktivieren' : 'aktivieren'}`)} onClick={() => onToggle(!view.enabled)}>{view.enabled ? text('DISABLE', 'DEAKTIVIEREN') : text('ENABLE', 'AKTIVIEREN')}</button>
    </> : <>
      <div className="automation-price"><span>{text('Price', 'Preis')}</span><strong>{formatPrice(view.definition.purchaseCost)}</strong></div>
      {!view.requirements.met && <details className="operations-disclosure compact-requirements"><summary>{text('Requirements', 'Voraussetzungen')}</summary><RequirementList result={view.requirements} id="auto-upgrader-requirements" /></details>}
      <div className="card-action-area"><button className="action-button purchase-button" disabled={paused || !view.canPurchase} onClick={onPurchase}>{text('Buy Business Auto-Upgrader', 'Business Auto-Upgrader kaufen')}</button>{acquisition.note && <p className="purchase-note">{acquisition.note}</p>}</div>
    </>}
  </section>;
}
