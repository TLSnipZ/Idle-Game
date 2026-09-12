import { RateValue } from './RateValue';
import { formatInteger } from './number-format';
import type { GameState } from '../game/game-state';
import { dashboardPresentation } from './dashboard-presentation';
import { SECTION } from './navigation';
import type { Navigate } from './navigation';
import { heatPresentation } from './heat-presentation';
import { PlayerProgress } from './PlayerProgress';
import { useLocale, useLocalizedText } from './LocalizationProvider';
export function OverviewSection({ state, paused, onNavigate }: {
  readonly state: GameState; readonly paused: boolean; readonly onNavigate: Navigate;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const view = dashboardPresentation(state);
  const heat = heatPresentation(state, locale);
  return <div className="overview-command">
    <article className="panel summary-card overview-economy"><h2>{text('ECONOMY', 'KOHLE & KONSEQUENZEN')}</h2><p className="summary-value">{view.cash}</p>
      <p>{text('Current total business production:', 'Aktuelle Gesamtproduktion deiner völlig seriösen Betriebe:')} <strong><RateValue text={view.production} /></strong>{paused && text(' · Session paused', ' · Session pausiert')}</p>
      <p>{view.autoActive ? text('Auto-Upgrader enabled — automatically spends cash while you pretend this is passive income.', 'Auto-Upgrader aktiv — gibt dein Cash automatisch aus, während du so tust, als wäre das passives Einkommen.') : text('Manage earning and automatic spending in Operations. Your accountant asked for boundaries.', 'Einnahmen und automatische Ausgaben findest du unter Operationen. Die Buchhaltung wollte klare Zuständigkeiten.')}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.operations.id)}>{text('VIEW OPERATIONS', 'OPERATIONEN ÖFFNEN')}</button></article>
    <article className="panel summary-card overview-player"><h2>{text('PLAYER', 'KARRIERE')}</h2><PlayerProgress xp={state.progression.xp} event={undefined} paused={paused} />
      <p>{text('Deliveries and paid business upgrades build your XP. Apparently experience can be invoiced.', 'Lieferungen und bezahlte Business-Upgrades bringen XP. Erfahrung ist in Solara offenbar steuerpflichtig.')}</p></article>
    <article className={`panel summary-card overview-pressure heat-${view.heat.tier.id}`}><h2>{text('CITY PRESSURE', 'DRUCK VON OBEN')}</h2><p className="summary-value">Heat {view.heat.heat} / {view.heat.maximum} · {heat.tier.label}</p>
      <p>{heat.penalty}</p><p>{text('Territories controlled:', 'Kontrollierte Bezirke:')} {view.city.ownedTerritoryCount} / {view.city.totalConfiguredTerritories}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>{text('VIEW CITY', 'STADT ÖFFNEN')}</button></article>
    <article className="panel summary-card overview-empire"><h2>{text('EMPIRE', 'IMPERIUM')}</h2><p className="summary-value">{formatInteger(view.empire.empirePoints)} EP</p>
      <p>{text('Rebirths:', 'Rebirths:')} {formatInteger(view.empire.rebirthCount)}</p><p>{view.empire.eligible ? text('Rebirth requirements met — the reset button is wearing a suit now.', 'Rebirth-Voraussetzungen erfüllt — der Reset-Knopf trägt jetzt Anzug.') : text('Build toward your next Rebirth. Temporary money, permanent ego.', 'Arbeite auf den nächsten Rebirth hin. Temporäres Geld, permanentes Ego.')}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.empire.id)}>{text('VIEW EMPIRE', 'IMPERIUM ÖFFNEN')}</button></article>
    <article className={`panel summary-card overview-event ${view.event.pending ? 'is-pending' : 'is-idle'}`}><h2>{text('CITY EVENT', 'STADTEVENT')}</h2><p>{view.event.pending?.name ?? text('No active event', 'Kein aktives Event')}</p>
      <p>{view.event.pending ? text('A choice is waiting in City. Your operation keeps earning while consequences queue politely.', 'In der Stadt wartet eine Entscheidung. Dein Laden verdient weiter, während die Konsequenzen höflich Schlange stehen.') : text(`Next opportunity: ${view.event.countdown} · Solara may manufacture a new problem when the timer ends.`, `Nächste Gelegenheit: ${view.event.countdown} · Danach produziert Solara vielleicht wieder ein Problem mit Geschäftsmodell.`)}</p>
      {view.event.pending && <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>{text('VIEW EVENT', 'EVENT ANSEHEN')}</button>}</article>
    <article className="panel summary-card overview-crew"><h2>{text('CREW', 'CREW')}</h2><p>{text('Recruited:', 'Rekrutiert:')} {view.crew.recruitedCrewCount} / {view.crew.totalConfiguredCrew}</p>
      <p>{text('Active assignments:', 'Aktive Einsätze:')} {view.crew.activeAssignmentCount} / {view.crew.totalSlots}</p><p>{text('Only assigned specialists provide bonuses. Standing around remains unpaid.', 'Nur zugewiesene Spezialisten liefern Boni. Rumstehen bleibt unbezahlt.')}</p><button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>{text('VIEW CREW', 'CREW ÖFFNEN')}</button></article>
    <article className="panel summary-card overview-collection"><h2>{text('COLLECTION', 'SAMMLUNG')}</h2><p>{text('Vehicles owned:', 'Fahrzeuge im Besitz:')} {view.garage.ownedVehicleCount} / {view.garage.totalConfiguredVehicles}</p>
      <p>{text('Vehicle bonuses survive Rebirth. Depreciation mysteriously does not.', 'Fahrzeugboni überleben Rebirth. Wertverlust wurde aus dramaturgischen Gründen abgeschafft.')}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.collection.id)}>{text('VIEW COLLECTION', 'SAMMLUNG ÖFFNEN')}</button></article>
  </div>;
}
