import { RateValue } from './RateValue';
import { formatInteger } from './number-format';
import type { GameState } from '../game/game-state';
import { dashboardPresentation } from './dashboard-presentation';
import { SECTION } from './navigation';
import type { Navigate } from './navigation';
import { heatPresentation } from './heat-presentation';
import { PlayerProgress } from './PlayerProgress';
export function OverviewSection({ state, paused, onNavigate }: {
  readonly state: GameState; readonly paused: boolean; readonly onNavigate: Navigate;
}) {
  const view = dashboardPresentation(state);
  const heat = heatPresentation(state);
  return <div className="overview-command">
    <article className="panel summary-card overview-economy"><h2>ECONOMY</h2><p className="summary-value">{view.cash}</p>
      <p>Current total business production: <strong><RateValue text={view.production} /></strong>{paused && ' · Session paused'}</p>
      <p>{view.autoActive ? 'Auto-Upgrader enabled — automatically spends cash when running.' : 'Manage earning and automatic spending in Operations.'}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.operations.id)}>VIEW OPERATIONS</button></article>
    <article className="panel summary-card overview-player"><h2>PLAYER</h2><PlayerProgress xp={state.progression.xp} event={undefined} paused={paused} />
      <p>Deliveries and paid business upgrades build your XP.</p></article>
    <article className={`panel summary-card overview-pressure heat-${view.heat.tier.id}`}><h2>CITY PRESSURE</h2><p className="summary-value">Heat {view.heat.heat} / {view.heat.maximum} · {view.heat.tier.label}</p>
      <p>{heat.penalty}</p><p>Territories controlled: {view.city.ownedTerritoryCount} / {view.city.totalConfiguredTerritories}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>VIEW CITY</button></article>
    <article className="panel summary-card overview-empire"><h2>EMPIRE</h2><p className="summary-value">{formatInteger(view.empire.empirePoints)} EP</p>
      <p>Rebirths: {formatInteger(view.empire.rebirthCount)}</p><p>{view.empire.eligible ? 'Rebirth requirements met — review in Empire.' : 'Build toward your next Rebirth.'}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.empire.id)}>VIEW EMPIRE</button></article>
    <article className={`panel summary-card overview-event ${view.event.pending ? 'is-pending' : 'is-idle'}`}><h2>CITY EVENT</h2><p>{view.event.pending?.name ?? 'No active event'}</p>
      <p>{view.event.pending ? 'A choice is waiting in City. Your operation continues.' : `Next opportunity: ${view.event.countdown} · A city situation may appear when the online opportunity timer completes.`}</p>
      {view.event.pending && <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>VIEW EVENT</button>}</article>
    <article className="panel summary-card overview-crew"><h2>CREW</h2><p>Recruited: {view.crew.recruitedCrewCount} / {view.crew.totalConfiguredCrew}</p>
      <p>Active assignments: {view.crew.activeAssignmentCount} / {view.crew.totalSlots}</p><p>Only assigned specialists provide bonuses.</p><button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>VIEW CREW</button></article>
    <article className="panel summary-card overview-collection"><h2>COLLECTION</h2><p>Vehicles owned: {view.garage.ownedVehicleCount} / {view.garage.totalConfiguredVehicles}</p>
      <p>Vehicle bonuses stay with you through Rebirth.</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.collection.id)}>VIEW COLLECTION</button></article>
  </div>;
}
