import { useState } from 'react';
import { APPEARANCE_CATALOG, STARTER_VEHICLE, VEHICLE_CATALOG, findVehicle, findAppearance } from '../features/vehicles';
import type { AppearanceId, VehicleId } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { useLocalizedText } from './LocalizationProvider';
import { VehicleArtwork } from './VehicleArtwork';
import { FINISH_PALETTE } from './vehicle-finishes';
import './VehicleAppearance.css';

export function VehicleAppearance({ state, paused, onApply }: {
  readonly state: GameState; readonly paused: boolean;
  readonly onApply: (vehicleId: string, appearanceId: string | null) => void;
}) {
  const text = useLocalizedText();
  const [vehicleId, setVehicleId] = useState<VehicleId>(state.garage.activeVehicleId ?? STARTER_VEHICLE.id);
  const vehicle = findVehicle(vehicleId) ?? STARTER_VEHICLE;
  // A draft belongs to its car, never to the active-vehicle command or the saved Garage.
  const [drafts, setDrafts] = useState<Partial<Record<VehicleId, AppearanceId | null>>>({});
  const saved = state.garage.appearances?.[vehicle.id] ?? null;
  const draft = Object.hasOwn(drafts, vehicle.id) ? drafts[vehicle.id] ?? null : saved;
  const selected = findAppearance(draft), savedLook = findAppearance(saved);
  const owned = state.garage.ownedVehicleIds.includes(vehicle.id);
  const changed = draft !== saved;
  function preview(id: AppearanceId | null) { setDrafts(previous => ({ ...previous, [vehicle.id]: id })); }
  return <section className="vehicle-appearance panel" aria-labelledby="appearance-heading">
    <div className="panel-heading"><div>
      <p className="eyebrow">{text('SOLARA CUSTOMS · PAINT STUDIO', 'SOLARA CUSTOMS · LACKSTUDIO')}</p>
      <h3 id="appearance-heading" tabIndex={-1}>{text('Make it yours', 'Dein Auto. Dein Auftritt.')}</h3>
    </div><span className="ownership-badge">{text('COSMETIC · FREE', 'KOSMETISCH · KOSTENLOS')}</span></div>
    <p>{text('Two signature finishes per car. Same questionable business model, better curb appeal.',
      'Zwei besondere Lackierungen pro Auto. Dasselbe fragwürdige Geschäftsmodell, besserer erster Eindruck.')}</p>
    <label htmlFor="appearance-vehicle">{text('Choose paint studio vehicle', 'Fahrzeug fürs Lackstudio wählen')}</label>
    <select id="appearance-vehicle" value={vehicle.id} onChange={event => {
      const chosen = findVehicle(event.target.value);
      if (chosen) setVehicleId(chosen.id);
    }}>{VEHICLE_CATALOG.map(car => <option key={car.id} value={car.id}>
      {text(car.name)} · {state.garage.ownedVehicleIds.includes(car.id) ? text('Owned', 'Im Besitz') : text('Not owned', 'Nicht im Besitz')}
    </option>)}</select>
    <div className="paint-studio-layout">
      <div className="paint-preview">
        <VehicleArtwork vehicleId={vehicle.id} appearanceId={draft} />
        <div className="paint-caption"><strong>{text(vehicle.name)}</strong>
          <span>{selected ? text(selected.name, selected.germanName) : text('Factory finish', 'Werkslackierung')}</span>
          <span className="eyebrow">{changed ? text('PREVIEW · NOT APPLIED', 'VORSCHAU · NICHT ÜBERNOMMEN') : text('CURRENT LOOK', 'AKTUELLER LOOK')}</span>
        </div>
      </div>
      <div className="paint-controls">
        <fieldset><legend>{text('Choose a finish to preview', 'Lackierung zur Vorschau wählen')}</legend>
          <button type="button" className="finish-option" aria-pressed={draft === null} onClick={() => preview(null)}>
            <span className="finish-swatch factory-swatch" aria-hidden="true" />
            <span>{text('Factory finish', 'Werkslackierung')}</span>
          </button>
          {APPEARANCE_CATALOG.filter(look => look.vehicleId === vehicle.id).map(look =>
            <button key={look.id} type="button" className="finish-option" data-look-id={look.id}
              aria-pressed={draft === look.id} onClick={() => preview(look.id)}>
              <span className="finish-swatch" style={{ backgroundColor: FINISH_PALETTE[look.id].swatch }} aria-hidden="true" />
              <span>{text(look.name, look.germanName)}</span>
            </button>)}
        </fieldset>
        <p className="paint-saved">{text('Applied:', 'Übernommen:')} <strong>{savedLook ? text(savedLook.name, savedLook.germanName) : text('Factory finish', 'Werkslackierung')}</strong></p>
        <p>{text('Free changes. Saved per vehicle and kept through Rebirth. Performance stays with your tuning setup.',
          'Kostenlos wechseln. Pro Fahrzeug gespeichert und bei Rebirth behalten. Die Leistung kommt weiterhin vom Tuning-Setup.')}</p>
        {!owned && <p>{text('Own this vehicle to apply a look. Window shopping remains legal.',
          'Kaufe dieses Fahrzeug, um einen Look zu übernehmen. Schaufensterbummeln ist noch legal.')}</p>}
        <button type="button" className="action-button apply-appearance" disabled={paused || !owned || !changed}
          onClick={() => onApply(vehicle.id, draft)}>{paused ? text('Session paused', 'Session pausiert')
            : !owned ? text('Vehicle required', 'Fahrzeug erforderlich')
              : changed ? text('Apply look · free', 'Look übernehmen · kostenlos') : text('Look applied', 'Look übernommen')}</button>
        {changed && <button type="button" className="action-button secondary-button discard-appearance" onClick={() => preview(saved)}>
          {text('Discard preview', 'Vorschau verwerfen')}</button>}
      </div>
    </div>
  </section>;
}
