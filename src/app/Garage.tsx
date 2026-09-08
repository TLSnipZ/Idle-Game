import { VEHICLE_CATALOG } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { selectGarage, selectVehicle } from '../game/vehicle-selectors';
import { formatCash } from '../features/economy/ui';
import { formatModifier } from './stat-format';
import { RequirementList } from './RequirementList';
import { vehicleArtwork } from './vehicle-artwork';

export function Garage({ state, paused, onPurchase }: {
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void;
}) {
  const collection = selectGarage(state);
  return <section className="garage" aria-labelledby="garage-heading">
    <div className="panel-heading"><h2 id="garage-heading">Garage</h2>
      <span>Owned vehicles: {collection.ownedVehicleCount} / {collection.totalConfiguredVehicles}</span></div>
    <div className="upgrade-catalog">{VEHICLE_CATALOG.map(vehicle => {
      const view = selectVehicle(state, vehicle.id);
      if (!view) return null;
      const heading = `${vehicle.id}-heading`;
      const requirements = `${vehicle.id}-requirements`;
      const art = vehicleArtwork(vehicle.id);
      return <article key={vehicle.id} className={`panel vehicle-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading}>
        {art && <div className={art.className} aria-hidden="true"><span>PERFORMANCE COLLECTION</span><small>{art.label}</small></div>}
        <div className="panel-heading"><h3 id={heading}>{vehicle.name}</h3>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.owned ? 'OWNED' : 'NOT OWNED'}</span></div>
        <p className="eyebrow">{vehicle.category}</p><p>{vehicle.description}</p>
        <p className="production">{formatModifier(vehicle.modifier)} global business production{view.owned ? paused ? ' · Session paused' : ' · Active' : ''}</p>
        {!view.owned && <>
          <p>Price: <strong>{formatCash(vehicle.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          <p>{!view.eligible ? 'LOCKED — Requirements not met.' : view.affordable ? 'Ready to collect.' : 'More cash needed.'}</p>
          <button className="action-button purchase-button" disabled={paused || !view.canPurchase} aria-describedby={requirements}
            aria-label={`Buy ${vehicle.name}`} onClick={() => onPurchase(vehicle.id)}>{paused ? 'Session paused' : 'Collect vehicle'}</button>
        </>}
      </article>;
    })}</div>
  </section>;
}
