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
    <div className="panel-heading"><h3 id="auto-upgrader-heading">{text('BUSINESS AUTO-UPGRADER', 'BUSINESS AUTO-UPGRADER')}</h3>
      <span className="ownership-badge">{view.owned ? paused ? text('PAUSED', 'PAUSIERT') : view.enabled ? text('ACTIVE', 'AKTIV') : text('DISABLED', 'DEAKTIVIERT') : acquisition.status}</span>
    </div>
    <p>{description}</p>
    <p className="automation-role">{text('Automatic spending · Attempt every', 'Automatisches Geldausgeben · Versuch alle')} {formatRemainingTime(view.definition.intervalMs)}</p>
    {view.owned ? <>
      {view.targets.length > 1 || (view.level === null && view.targets.length > 0) ? <div className="auto-target">
        <label htmlFor="auto-upgrader-target">{text('Target Business', 'Ziel-Business')}</label>
        <select id="auto-upgrader-target" value={view.level === null ? '' : view.target.id} disabled={paused}
          onChange={event => onTargetChange?.(event.currentTarget.value)}>
          {view.level === null && <option value="" disabled>{text('Choose an owned Business', 'Wähle ein eigenes Business')}</option>}
          {view.targets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}
        </select>
      </div> : <p>{text('Target Business:', 'Ziel-Business:')} <strong>{view.target.name}</strong></p>}
      <p id="auto-upgrader-state">{text('Automatic spending:', 'Automatische Ausgaben:')} {view.enabled ? text('enabled', 'aktiviert') : text('disabled', 'deaktiviert')}{paused ? text(' · Session paused', ' · Session pausiert') : ''}.</p>
      <p>{view.level === null ? text(`${view.target.name} not owned — no upgrades available.`, `${view.target.name} gehört dir nicht — kein fremdes Eigentum upgraden, heute jedenfalls.`) : `${view.target.name} Level ${view.level}`}</p>
      {view.maxed ? <p>{text('TARGET MAXED · No further upgrades available.', 'ZIEL AUF MAX · Keine weiteren Upgrades verfügbar.')}{view.targets.length > 1 && text(' Choose another target when ready.', ' Nimm das nächste Opfer deiner Wachstumsstrategie.')}</p> : view.nextCost !== null && <p>{text('Next upgrade:', 'Nächstes Upgrade:')} <strong>{formatPrice(view.nextCost)}</strong>
        {!view.canAffordNextUpgrade && text(' · More cash needed', ' · Mehr Cash nötig')}</p>}
      <label id="auto-upgrader-timing" htmlFor="auto-upgrader-progress">{text('Next attempt in', 'Nächster Versuch in')} {formatRemainingTime(view.remainingMs)}{!view.enabled || paused ? text(' · Progress paused', ' · Fortschritt pausiert') : ''}</label>
      <progress aria-label={text('Business Auto-Upgrader attempt progress', 'Fortschritt des Business Auto-Upgraders')} aria-describedby="auto-upgrader-timing auto-upgrader-state" id="auto-upgrader-progress" max={view.definition.intervalMs} value={view.progressMs} />
      <p className="spending-disclosure" id="auto-upgrader-spending">{text('Automatically spends cash on the selected Business: one upgrade every 30s when affordable.', 'Gibt automatisch Cash fürs gewählte Business aus: alle 30s ein Upgrade, wenn bezahlbar. Dein Konto hat jetzt Autopilot.')}</p>
      <button className="action-button secondary-button" disabled={paused || !view.canToggle}
        aria-label={text(`${view.enabled ? 'Disable' : 'Enable'} Business Auto-Upgrader`, `Business Auto-Upgrader ${view.enabled ? 'deaktivieren' : 'aktivieren'}`)} aria-describedby="auto-upgrader-spending auto-upgrader-state"
        onClick={() => onToggle(!view.enabled)}>{view.enabled ? text('DISABLE', 'DEAKTIVIEREN') : text('ENABLE', 'AKTIVIEREN')}</button>
    </> : <>
      <p>{text('Price:', 'Preis:')} <strong>{formatPrice(view.definition.purchaseCost)}</strong></p>
      <p className="spending-disclosure" id="auto-upgrader-spending">{text('Automatically spends cash on the selected Business: one upgrade every 30s when affordable. Starts disabled.', 'Gibt automatisch Cash fürs gewählte Business aus: alle 30s ein Upgrade, wenn bezahlbar. Startet deaktiviert — wir sind ja keine Tiere.')}</p>
      <RequirementList result={view.requirements} id="auto-upgrader-requirements" />
      <div className="card-action-area"><button className="action-button purchase-button" disabled={paused || !view.canPurchase}
        aria-describedby={acquisition.note ? "auto-upgrader-requirements auto-upgrader-spending auto-upgrader-helper" : "auto-upgrader-requirements auto-upgrader-spending"} onClick={onPurchase}>{text('Buy Business Auto-Upgrader', 'Business Auto-Upgrader kaufen')}</button>{acquisition.note && <p id="auto-upgrader-helper" className="purchase-note">{acquisition.note}</p>}</div>
    </>}
  </section>;
}
