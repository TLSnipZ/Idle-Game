import { VEHICLE_CATALOG } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { selectGarage, selectVehicle } from '../game/vehicle-selectors';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { vehicleArtwork } from './vehicle-artwork';
import { RequirementList } from './RequirementList';

export function Garage({ state, paused, onPurchase }: {
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void;
}) {
  const collection = selectGarage(state);
  return <section className="garage" aria-labelledby="garage-heading">
    <div className="panel-heading"><h2 id="garage-heading">Garage</h2>
      <span>Owned vehicles: {collection.ownedVehicleCount} / {collection.totalConfiguredVehicles}</span></div>
    <div className="garage-catalog">{VEHICLE_CATALOG.map(vehicle => {
      const view = selectVehicle(state, vehicle.id);
      if (!view) return null;
      const artwork = vehicleArtwork(vehicle.id);
      const heading = `${vehicle.id}-heading`;
      const requirements = `${vehicle.id}-requirements`;
      return <article key={vehicle.id} className={`panel vehicle-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading}>
        <header className="showroom-stage"><p className="eyebrow">Performance collection · Permanent ownership</p>
        <div className="panel-heading"><h3 id={heading}><span className="vehicle-manufacturer">{vehicle.manufacturer}</span>{' '}<span>{vehicle.model}</span></h3>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.owned ? 'OWNED' : view.eligible ? 'AVAILABLE' : 'LOCKED'}</span></div>
        <p className="eyebrow">{vehicle.category}</p>
        {artwork && <img className="vehicle-artwork" src={artwork.src} alt={artwork.alt}
          width={artwork.width} height={artwork.height} loading="lazy" decoding="async" />}
        </header><div className="vehicle-specification"><p>{vehicle.description}</p>
        <p className="ownership-badge">PERMANENT VEHICLE · Kept through Rebirth</p>
        <p className="production">{formatModifier(vehicle.modifier)} Business Production{view.owned && paused ? ' · Session paused' : ''}</p>
        {!view.owned && <>
          <p>Price: <strong>{formatPrice(vehicle.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          {view.eligible && <p>{view.affordable ? 'Ready to purchase.' : 'INSUFFICIENT CASH'}</p>}
          <button className="action-button purchase-button" disabled={paused || !view.canPurchase} aria-describedby={requirements}
            aria-label={`Buy ${vehicle.name}`} onClick={() => onPurchase(vehicle.id)}>{paused ? 'Session paused' : `Buy ${vehicle.model}`}</button>
        </>}
      </div></article>;
    })}</div>
  </section>;
}
