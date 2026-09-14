import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { VehicleId } from '../features/vehicles';
import './GarageActive.css';
import { activeTuning, VEHICLE_CATALOG } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { selectGarage, selectVehicle } from '../game/vehicle-selectors';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { VehicleArtwork } from './VehicleArtwork';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function Garage({ state, paused, onPurchase, onSelect, onWorkshop, selectedVehicle, onInspect, revealRequest = 0 }: {
  readonly onWorkshop?: (id: VehicleId) => void;
  readonly selectedVehicle?: VehicleId;
  readonly revealRequest?: number;
  readonly onInspect?: (id: VehicleId) => void;
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void;
  readonly onSelect: (id: string) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const collection = selectGarage(state);
  const [localSelection, setLocalSelection] = useState<VehicleId>(state.garage.activeVehicleId ?? VEHICLE_CATALOG[0]?.id ?? 'vehicle:kairo-kx-r');
  const preferred = selectedVehicle ?? localSelection;
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('price');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<'rail' | 'detail' | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const cars = VEHICLE_CATALOG.filter(car => filter === 'all' || state.garage.ownedVehicleIds.includes(car.id) === (filter === 'owned'))
    .slice().sort((a, b) => sort === 'name' ? text(a.name).localeCompare(text(b.name), locale === 'villager' ? 'en' : locale) : BigInt(a.purchaseCost) < BigInt(b.purchaseCost) ? -1 : BigInt(a.purchaseCost) > BigInt(b.purchaseCost) ? 1 : 0);
  const inspected = detailsOpen ? preferred : cars.find(car => car.id === preferred)?.id ?? cars[0]?.id;
  useEffect(() => { if (revealRequest) { setFilter('all'); setDetailsOpen(true); } }, [revealRequest]);
  useLayoutEffect(() => {
    const target = focusTarget.current; focusTarget.current = null;
    if (target === 'detail' && inspected) {
      document.getElementById(`${inspected}-heading`)?.focus({ preventScroll: true });
      details.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    } else if (target === 'rail') {
      (rail.current?.querySelector<HTMLButtonElement>('.garage-tile[aria-pressed="true"]') ?? rail.current?.querySelector<HTMLSelectElement>('select'))?.focus();
    }
  }, [focusRequest, inspected, detailsOpen]);
  function inspect(id: VehicleId) {
    setLocalSelection(id); onInspect?.(id); setDetailsOpen(true);
    focusTarget.current = 'detail'; setFocusRequest(n => n + 1);
  }
  const fitted = activeTuning(state.garage);
  return <section className={`garage ${detailsOpen ? 'has-open-details' : ''}`} aria-labelledby="garage-heading">
    <div className="panel-heading"><h2 id="garage-heading">{text('Garage', 'Garage')}</h2>
      <span>{text('Owned vehicles:', 'Fahrzeuge im Besitz:')} {collection.ownedVehicleCount} / {collection.totalConfiguredVehicles}</span></div>
    <div className="garage-active-summary">
      <p className="eyebrow">{text('Active vehicle', 'Aktives Fahrzeug')}</p>
      <p><strong>{collection.activeVehicle ? text(collection.activeVehicle.name) : text('No active vehicle', 'Kein aktives Fahrzeug')}</strong></p>
      <p>{collection.activeVehicle
        ? text('Only your active vehicle supplies its bonus. Ownership and selection survive Rebirth. Parking the rest is free. For now.',
          'Nur dein aktives Fahrzeug liefert seinen Bonus. Besitz und Auswahl bleiben bei Rebirth erhalten. Der Rest parkt kostenlos. Noch.')
        : text('Your first purchase activates automatically. Empty parking spaces have terrible performance.',
          'Dein erster Kauf wird automatisch aktiv. Leere Parkplätze haben erschreckend wenig Leistung.')}</p>
      {fitted && <p>{text('Fitted setup:', 'Eingebautes Setup:')} <strong>{text(fitted.name, fitted.germanName)}</strong></p>}

    </div>
    <div className="garage-showroom">
    <div className="garage-rail" ref={rail}>
      <div className="garage-filters">
        <label>{text('Show', 'Anzeigen')}<select aria-label={text('Filter vehicles', 'Fahrzeuge filtern')} value={filter} onChange={event => { setFilter(event.target.value); setDetailsOpen(false); }}>
          <option value="all">{text('All vehicles', 'Alle Fahrzeuge')}</option><option value="owned">{text('Owned', 'Im Besitz')}</option><option value="missing">{text('Not owned', 'Noch offen')}</option>
        </select></label>
        <label>{text('Sort by', 'Sortieren nach')}<select aria-label={text('Sort vehicles', 'Fahrzeuge sortieren')} value={sort} onChange={event => setSort(event.target.value)}><option value="price">{text('Price', 'Preis')}</option><option value="name">{text('Name', 'Name')}</option></select></label>
      </div>
      <div className="garage-tiles">{cars.map(car => <button type="button" className="garage-tile" key={car.id} data-vehicle-id={car.id} aria-pressed={inspected === car.id} onClick={() => inspect(car.id)}>
        <VehicleArtwork vehicleId={car.id} appearanceId={state.garage.appearances?.[car.id] ?? null} />
        <span className="tile-copy"><strong>{text(car.name)}</strong><span>{state.garage.activeVehicleId === car.id ? text('ACTIVE', 'AKTIV') : state.garage.ownedVehicleIds.includes(car.id) ? text('OWNED', 'IM BESITZ') : formatPrice(car.purchaseCost)}</span><span className="tile-bonus">{formatModifier(car.modifier)} {car.modifier.target.stat === 'business-production' ? text('Production', 'Produktion') : car.modifier.target.stat === 'job-reward' ? text('Manual Cash', 'Manueller Cash') : text('seconds · cooling', 'Sekunden · Abkühlung')}</span></span>
      </button>)}</div>
      {cars.length === 0 && <p className="garage-empty" role="status">{text('No cars here. Your parking attendant is enjoying the silence.', 'Hier steht noch nichts. Der Parkservice genießt die Stille.')}</p>}
    </div>
    <div className="garage-detail" ref={details} hidden={!inspected}>
      <button type="button" className="garage-back action-button secondary-button" onClick={() => { setDetailsOpen(false); focusTarget.current = 'rail'; setFocusRequest(n => n + 1); }}>{text('Back to vehicles', 'Zur Fahrzeugauswahl')}</button>
    <div className="garage-catalog">{VEHICLE_CATALOG.map(vehicle => {
      const view = selectVehicle(state, vehicle.id);
      if (!view) return null;
      const heading = `${vehicle.id}-heading`;
      const requirements = `${vehicle.id}-requirements`;
      const category = localizedContent(locale, vehicle.id, 'category', vehicle.category);
      const description = localizedContent(locale, vehicle.id, 'description', vehicle.description);
      return <article key={vehicle.id} className={`panel vehicle-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading} hidden={vehicle.id !== inspected}>
        <header className="showroom-stage"><p className="eyebrow">{text('Performance collection · Permanent ownership', 'Performance-Sammlung · Permanenter Besitz')}</p>
        <div className="panel-heading"><h3 id={heading} tabIndex={-1}><span className="vehicle-manufacturer">{text(vehicle.manufacturer)}</span>{' '}<span>{text(vehicle.model)}</span></h3>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.owned ? view.active ? text('OWNED · ACTIVE', 'IM BESITZ · AKTIV') : text('OWNED · INACTIVE', 'IM BESITZ · INAKTIV') : view.eligible ? text('AVAILABLE', 'VERFÜGBAR') : text('LOCKED', 'GESPERRT')}</span></div>
        <p className="eyebrow">{category}</p>
        <VehicleArtwork vehicleId={vehicle.id} appearanceId={state.garage.appearances?.[vehicle.id] ?? null} />
        </header><div className="vehicle-specification"><p>{description}</p>
        <p className="ownership-badge">{text('PERMANENT VEHICLE · Kept through Rebirth', 'PERMANENTES FAHRZEUG · Bleibt durch Rebirth erhalten')}</p>
        <p className="production">{formatModifier(vehicle.modifier)} {vehicle.modifier.target.stat === 'business-production'
          ? text('Business Production · while active', 'Business-Produktion · wenn aktiv')
          : vehicle.modifier.target.stat === 'job-reward'
            ? text('Manual Job Cash · while active', 'Manueller Job-Cash · wenn aktiv')
            : text('seconds per Heat cooling interval · while active', 'Sekunden pro Heat-Abkühlintervall · wenn aktiv')}{view.owned && paused ? text(' · Session paused', ' · Session pausiert') : ''}</p>
        {view.owned && !view.active && <button type="button" className="action-button"
          disabled={paused} onClick={() => onSelect(vehicle.id)}
          aria-label={text(`Activate ${vehicle.name}`, `${vehicle.name} aktivieren`)}>
          {paused ? text('Session paused', 'Session pausiert') : text('Set active', 'Aktivieren')}
        </button>}
        {!view.owned && <>
          <p>{text('Price:', 'Preis:')} <strong>{formatPrice(vehicle.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          {view.eligible && <p>{view.affordable ? text('Ready to purchase. The garage already cleared a suspiciously exact space.', 'Kaufbereit. In der Garage wurde auffällig genau Platz gemacht.') : text('INSUFFICIENT CASH', 'ZU WENIG CASH')}</p>}
          <button className="action-button purchase-button" disabled={paused || !view.canPurchase} aria-describedby={requirements}
            aria-label={text(`Buy ${vehicle.name}`, `${vehicle.name} kaufen`)} onClick={() => onPurchase(vehicle.id)}>{paused ? text('Session paused', 'Session pausiert') : text(`Buy ${vehicle.model}`, `${vehicle.model} kaufen`)}</button>
        </>}
        {onWorkshop && view.owned && <button type="button" className="action-button secondary-button garage-workshop-link" onClick={() => onWorkshop(vehicle.id)}>{text('Open tuning workshop', 'Tuning-Werkstatt öffnen')}</button>}
      </div></article>;
    })}</div></div></div>
  </section>;
}
