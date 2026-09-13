import './GarageActive.css';
import { VEHICLE_CATALOG } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { selectGarage, selectVehicle } from '../game/vehicle-selectors';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { vehicleArtwork } from './vehicle-artwork';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function Garage({ state, paused, onPurchase, onActivate }: {
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void; readonly onActivate: (id: string) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const collection = selectGarage(state);
  return <section className="garage" aria-labelledby="garage-heading">
    <div className="panel-heading"><h2 id="garage-heading">{text('Garage', 'Garage')}</h2>
      <span>{text('Owned vehicles:', 'Fahrzeuge im Besitz:')} {collection.ownedVehicleCount} / {collection.totalConfiguredVehicles}</span></div>
    <div className="garage-active-summary" aria-labelledby="active-vehicle-heading">
      <div><h3 id="active-vehicle-heading">{text('ACTIVE VEHICLE', 'AKTIVES FAHRZEUG')}</h3>
        <strong>{collection.activeVehicle?.name ?? text('No vehicle yet', 'Noch kein Fahrzeug')}</strong></div>
      <p>{collection.activeVehicle
        ? text(`${formatModifier(collection.activeVehicle.modifier)} Business Production · Active bonus`, `${formatModifier(collection.activeVehicle.modifier)} Business-Produktion · Aktiver Bonus`)
        : text('Your first purchase gets the keys automatically. Walking has terrible resale value.', 'Dein erster Kauf bekommt automatisch die Schlüssel. Zu Fuß ist der Wiederverkaufswert miserabel.')}</p>
      <p className="garage-selection-note">{text('Only the active vehicle provides its bonus. Ownership and selection survive Rebirth. Switching is free; past earnings stay in the past.', 'Nur das aktive Fahrzeug liefert seinen Bonus. Besitz und Auswahl bleiben bei Rebirth erhalten. Wechseln kostet nichts; vergangene Einnahmen bleiben Vergangenheit.')}</p>
    </div>
    <div className="garage-catalog">{VEHICLE_CATALOG.map(vehicle => {
      const view = selectVehicle(state, vehicle.id);
      if (!view) return null;
      const artwork = vehicleArtwork(vehicle.id);
      const heading = `${vehicle.id}-heading`;
      const requirements = `${vehicle.id}-requirements`;
      const category = localizedContent(locale, vehicle.id, 'category', vehicle.category);
      const description = localizedContent(locale, vehicle.id, 'description', vehicle.description);
      return <article key={vehicle.id} className={`panel vehicle-card ${view.owned ? 'is-owned' : ''} ${view.active ? 'is-active-vehicle' : ''}`} aria-labelledby={heading}>
        <header className="showroom-stage"><p className="eyebrow">{text('Performance collection · Permanent ownership', 'Performance-Sammlung · Permanenter Besitz')}</p>
        <div className="panel-heading"><h3 id={heading}><span className="vehicle-manufacturer">{vehicle.manufacturer}</span>{' '}<span>{vehicle.model}</span></h3>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.active ? text('OWNED · ACTIVE', 'IM BESITZ · AKTIV') : view.owned ? text('OWNED · INACTIVE', 'IM BESITZ · INAKTIV') : view.eligible ? text('AVAILABLE', 'VERFÜGBAR') : text('LOCKED', 'GESPERRT')}</span></div>
        <p className="eyebrow">{category}</p>
        {artwork && <img className="vehicle-artwork" src={artwork.src} alt={artwork.alt}
          width={artwork.width} height={artwork.height} loading="lazy" decoding="async" />}
        </header><div className="vehicle-specification"><p>{description}</p>
        <p className="ownership-badge">{text('PERMANENT VEHICLE · Ownership and selection kept through Rebirth', 'PERMANENTES FAHRZEUG · Besitz und Auswahl bleiben durch Rebirth erhalten')}</p>
        <p className="production">{formatModifier(vehicle.modifier)} {text('Business Production · while active', 'Business-Produktion · solange aktiv')}{view.owned && paused ? text(' · Session paused', ' · Session pausiert') : ''}</p>
        {view.owned && !view.active && <button type="button" className="action-button"
          disabled={paused} aria-label={text(`Set ${vehicle.name} as active vehicle`, `${vehicle.name} als aktives Fahrzeug auswählen`)}
          onClick={() => onActivate(vehicle.id)}>{text('SET ACTIVE', 'AKTIV AUSWÄHLEN')}</button>}
        {view.active && <p className="garage-current-bonus">{text('This vehicle is supplying your bonus. The others can admire the parking space.', 'Dieses Fahrzeug liefert deinen Bonus. Die anderen dürfen den Parkplatz bewundern.')}</p>}
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
