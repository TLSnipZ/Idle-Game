import { useState } from 'react';
import { TUNING_CATALOG, STARTER_VEHICLE, VEHICLE_CATALOG, findVehicle, findTuning } from '../features/vehicles';
import type { VehicleId } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { purchaseTuning } from '../game/vehicle-tuning';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { useLocalizedText } from './LocalizationProvider';
import './VehicleTuning.css';

export function VehicleTuning({ state, paused, onConfigure }: {
  readonly state: GameState; readonly paused: boolean;
  readonly onConfigure: (vehicleId: string, id: string | null, purchase: boolean) => void;
}) {
  const text = useLocalizedText();
  const [vehicleId, setVehicleId] = useState<VehicleId>(state.garage.activeVehicleId ?? STARTER_VEHICLE.id);
  const vehicle = findVehicle(vehicleId) ?? STARTER_VEHICLE;
  const owned = state.garage.ownedVehicleIds.includes(vehicle.id);
  const build = state.garage.builds?.[vehicle.id];
  const selected = findTuning(build?.selectedId);
  const parts = TUNING_CATALOG.filter(part => part.vehicleId === vehicle.id);
  const active = state.garage.activeVehicleId === vehicle.id;
  return <section className="vehicle-tuning panel" aria-labelledby="tuning-heading">
    <h3 id="tuning-heading" tabIndex={-1}>{text(`${vehicle.model} Workshop`, `${vehicle.model}-Werkstatt`)}</h3>
    <label className="tuning-vehicle-label" htmlFor="tuning-vehicle">{text('Choose workshop vehicle', 'Werkstatt-Fahrzeug wählen')}</label>
    <select id="tuning-vehicle" value={vehicle.id} onChange={event => {
      const chosen = findVehicle(event.target.value);
      if (chosen) setVehicleId(chosen.id);
    }}>{VEHICLE_CATALOG.map(car => <option key={car.id} value={car.id}>{text(car.name)} · {state.garage.ownedVehicleIds.includes(car.id) ? text('Owned', 'Im Besitz') : text('Not owned', 'Nicht im Besitz')}</option>)}</select>
    {parts.length === 0 ? <p className="stock-only-notice">{text('Factory setup only. This model has no tuning parts yet. The accountant calls that restraint.',
      'Nur Serienausstattung. Für dieses Modell gibt es noch keine Tuningteile. Der Buchhalter nennt das Zurückhaltung.')}</p> : <>
    <p>{text('One setup per car. Buy permanent parts, switch owned setups or restore stock for free. Rebirth keeps every build. Your accountant keeps every nightmare.',
      'Ein Setup pro Auto. Teile dauerhaft kaufen, gekaufte Setups oder Serie kostenlos wechseln. Rebirth behält jeden Ausbau. Dein Buchhalter behält jeden Albtraum.')}</p>
    <p className="tuning-selection">{text('Fitted:', 'Eingebaut:')} <strong>{selected ? text(selected.name, selected.germanName) : text('Stock', 'Serie')}</strong>
      {' · '}{active ? selected ? text('BONUS ACTIVE', 'BONUS AKTIV') : text('BASE BONUS ONLY', 'NUR BASISBONUS') : text('INACTIVE CAR · NO TUNING BONUS', 'AUTO INAKTIV · KEIN TUNING-BONUS')}</p>
    <p>{text('The base vehicle bonus remains. Only one fitted setup adds its effect while that car is active. Choosing a workshop or fitting parts does not activate the car.',
      'Der Basisbonus bleibt. Nur ein eingebautes Setup wirkt zusätzlich, solange dieses Auto aktiv ist. Werkstatt-Auswahl und Einbau aktivieren das Auto nicht.')}</p>
    {!owned && <p>{text(`Own a ${vehicle.name} to unlock this workshop.`, `${vehicle.name} kaufen, um diese Werkstatt freizuschalten.`)}</p>}
    <div className="tuning-options">{parts.map(part => {
      const purchased = build?.purchasedIds.includes(part.id) ?? false;
      const fitted = selected?.id === part.id;
      const canBuy = owned && purchaseTuning(state, part.id).ok;
      const effect = part.modifier.target.stat === 'heat-decay-interval'
        ? text('seconds per Heat cooling step', 'Sekunden pro Heat-Abkühlschritt')
        : part.modifier.target.stat === 'heat-response-cost'
          ? text('Decoy cost · stacks with active support', 'Ablenkungskosten · mit aktiver Unterstützung kombinierbar')
          : part.modifier.target.stat === 'business-production'
            ? text('Business Production', 'Business-Produktion')
            : text('Manual Job Cash · no Dispatcher bonus', 'Manueller Job-Cash · kein Dispatcher-Bonus');
      return <article className="tuning-option" key={part.id} data-tuning-id={part.id}>
        <p className="eyebrow">{text(part.category, part.germanCategory)}</p>
        <h4>{text(part.name, part.germanName)}</h4>
        <p>{formatModifier(part.modifier)} {effect}</p>
        <p>{text('One-time price:', 'Einmaliger Preis:')} <strong>{formatPrice(part.cost)}</strong></p>
        <p>{fitted ? text('FITTED', 'EINGEBAUT') : purchased ? text('OWNED', 'IM BESITZ')
          : !owned ? text('VEHICLE REQUIRED', 'FAHRZEUG ERFORDERLICH') : canBuy ? text('AVAILABLE', 'VERFÜGBAR') : text('INSUFFICIENT CASH', 'ZU WENIG CASH')}</p>
        <button className="action-button" disabled={paused || fitted || (!purchased && !canBuy)}
          onClick={() => onConfigure(vehicle.id, part.id, !purchased)}>{fitted ? text('Fitted', 'Eingebaut')
            : purchased ? text('Fit setup', 'Setup einbauen') : text('Buy & fit', 'Kaufen & einbauen')}</button>
      </article>;
    })}</div>
    <button className="action-button secondary-button tuning-stock" disabled={paused || !selected}
      onClick={() => onConfigure(vehicle.id, null, false)}>{text('Restore stock · keep purchased parts', 'Zur Serie wechseln · gekaufte Teile behalten')}</button>
    </>}
  </section>;
}
