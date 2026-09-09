import type { GameState } from '../game/game-state';
import { dashboardPresentation } from './dashboard-presentation';
import { SECTION } from './navigation';
import type { Navigate } from './navigation';
import { PlayerProgress } from './PlayerProgress';
export function OverviewSection({ state, paused, onNavigate }: {
  readonly state: GameState; readonly paused: boolean; readonly onNavigate: Navigate;
}) {
  const view = dashboardPresentation(state);
  return <div className="overview-grid">
    <article className="panel summary-card"><h2>ECONOMY</h2><p className="summary-value">{view.cash}</p>
      <p>Current total business production: <strong>{view.production} / sec</strong>{paused && ' · Session paused'}</p>
      <p>{view.autoActive ? 'Auto-Upgrader enabled — automatically spends cash when running.' : 'Manage earning and automatic spending in Operations.'}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.operations.id)}>VIEW OPERATIONS</button></article>
    <article className="panel summary-card"><h2>PLAYER</h2><PlayerProgress xp={state.progression.xp} event={undefined} paused={paused} />
      <p>Deliveries and paid business upgrades build your XP.</p></article>
    <article className="panel summary-card"><h2>CITY PRESSURE</h2><p className="summary-value">Heat {view.heat.heat} / {view.heat.maximum} · {view.heat.tier.label}</p>
      <p>Territories controlled: {view.city.ownedTerritoryCount} / {view.city.totalConfiguredTerritories}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>VIEW CITY</button></article>
    <article className="panel summary-card"><h2>CREW</h2><p>Recruited: {view.crew.recruitedCrewCount} / {view.crew.totalConfiguredCrew}</p>
      <p>Active assignments: {view.crew.activeAssignmentCount} / {view.crew.totalSlots}</p><p>Only assigned specialists provide bonuses. Manage Crew in City.</p></article>
    <article className="panel summary-card"><h2>EMPIRE</h2><p className="summary-value">{view.empire.empirePoints} EP</p>
      <p>Rebirths: {view.empire.rebirthCount}</p><p>{view.empire.eligible ? 'Rebirth requirements met — review in Empire.' : 'Build toward your next Rebirth.'}</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.empire.id)}>VIEW EMPIRE</button></article>
    <article className="panel summary-card"><h2>CITY EVENT</h2><p>{view.event.pending?.name ?? 'No active event'}</p>
      <p>{view.event.pending ? 'A choice is waiting in City. Your operation continues.' : `Next opportunity: ${view.event.countdown} · Events may appear during active play.`}</p>
      {view.event.pending && <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.city.id)}>VIEW EVENT</button>}</article>
    <article className="panel summary-card"><h2>COLLECTION</h2><p>Vehicles owned: {view.garage.ownedVehicleCount} / {view.garage.totalConfiguredVehicles}</p>
      <p>Vehicle bonuses stay with you through Rebirth.</p>
      <button className="action-button section-shortcut" onClick={() => onNavigate(SECTION.collection.id)}>VIEW COLLECTION</button></article>
  </div>;
}
