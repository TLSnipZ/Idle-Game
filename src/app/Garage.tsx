import { VEHICLE_CATALOG } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { selectGarage, selectVehicle } from '../game/vehicle-selectors';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { vehicleArtwork } from './vehicle-artwork';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function Garage({ state, paused, onPurchase }: {
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const collection = selectGarage(state);
  return <section className="garage" aria-labelledby="garage-heading">
    <div className="panel-heading"><h2 id="garage-heading">{text('Garage', 'Garage')}</h2>
      <span>{text('Owned vehicles:', 'Fahrzeuge im Besitz:')} {collection.ownedVehicleCount} / {collection.totalConfiguredVehicles}</span></div>
    <p>{text('Collect permanent performance bonuses disguised as financially irresponsible machinery.', 'Sammle permanente Performance-Boni, die zufällig wie finanziell unverantwortliche Maschinen aussehen.')}</p>
    <div className="garage-catalog">{VEHICLE_CATALOG.map(vehicle => {
      const view = selectVehicle(state, vehicle.id);
      if (!view) return null;
      const artwork = vehicleArtwork(vehicle.id);
      const heading = `${vehicle.id}-heading`;
      const requirements = `${vehicle.id}-requirements`;
      const category = localizedContent(locale, vehicle.id, 'category', vehicle.category);
      const description = localizedContent(locale, vehicle.id, 'description', vehicle.description);
      return <article key={vehicle.id} className={`panel vehicle-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading}>
        <header className="showroom-stage"><p className="eyebrow">{text('Performance collection · Permanent ownership', 'Performance-Sammlung · Permanenter Besitz')}</p>
        <div className="panel-heading"><h3 id={heading}><span className="vehicle-manufacturer">{vehicle.manufacturer}</span>{' '}<span>{vehicle.model}</span></h3>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.owned ? text('OWNED', 'IM BESITZ') : view.eligible ? text('AVAILABLE', 'VERFÜGBAR') : text('LOCKED', 'GESPERRT')}</span></div>
        <p className="eyebrow">{category}</p>
        {artwork && <img className="vehicle-artwork" src={artwork.src} alt={artwork.alt}
          width={artwork.width} height={artwork.height} loading="lazy" decoding="async" />}
        </header><div className="vehicle-specification"><p>{description}</p>
        <p className="ownership-badge">{text('PERMANENT VEHICLE · Kept through Rebirth', 'PERMANENTES FAHRZEUG · Bleibt durch Rebirth erhalten')}</p>
        <p className="production">{formatModifier(vehicle.modifier)} {text('Business Production', 'Business-Produktion')}{view.owned && paused ? text(' · Session paused', ' · Session pausiert') : ''}</p>
        {!view.owned && <>
          <p>{text('Price:', 'Preis:')} <strong>{formatPrice(vehicle.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          {view.eligible && <p>{view.affordable ? text('Ready to purchase. The garage already cleared a suspiciously exact space.', 'Kaufbereit. In der Garage wurde auffällig genau Platz gemacht.') : text('INSUFFICIENT CASH', 'ZU WENIG CASH')}</p>}
          <button className="action-button purchase-button" disabled={paused || !view.canPurchase} aria-describedby={requirements}
            aria-label={text(`Buy ${vehicle.name}`, `${vehicle.name} kaufen`)} onClick={() => onPurchase(vehicle.id)}>{paused ? text('Session paused', 'Session pausiert') : text(`Buy ${vehicle.model}`, `${vehicle.model} kaufen`)}</button>
        </>}
      </div></article>;
    })}</div>
  </section>;
}
