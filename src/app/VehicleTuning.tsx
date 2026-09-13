import { TUNING_CATALOG, STARTER_VEHICLE, findTuning } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { purchaseTuning } from '../game/vehicle-tuning';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { useLocalizedText } from './LocalizationProvider';
import './VehicleTuning.css';

export function VehicleTuning({ state, paused, onConfigure }: {
  readonly state: GameState; readonly paused: boolean;
  readonly onConfigure: (id: string | null, purchase: boolean) => void;
}) {
  const text = useLocalizedText();
  const owned = state.garage.ownedVehicleIds.includes(STARTER_VEHICLE.id);
  const build = state.garage.builds?.[STARTER_VEHICLE.id];
  const selected = findTuning(build?.selectedId);
  const active = state.garage.activeVehicleId === STARTER_VEHICLE.id;
  return <section className="vehicle-tuning panel" aria-labelledby="tuning-heading">
    <h3 id="tuning-heading">{text('KX-R Workshop', 'KX-R-Werkstatt')}</h3>
    <p>{text('One car, one setup. Buy and fit permanent parts; swap owned setups or restore stock for free. Rebirth keeps the build. Your accountant keeps the nightmares.',
      'Ein Auto, ein Setup. Teile dauerhaft kaufen und einbauen. Gekaufte Setups und Serie kostenlos wechseln. Rebirth behält den Ausbau. Dein Buchhalter behält die Albträume.')}</p>
    <p className="tuning-selection">{text('Fitted:', 'Eingebaut:')} <strong>{selected ? text(selected.name, selected.germanName) : text('Stock', 'Serie')}</strong>
      {' · '}{active ? text('BONUS ACTIVE', 'BONUS AKTIV') : text('INACTIVE CAR · NO TUNING BONUS', 'AUTO INAKTIV · KEIN TUNING-BONUS')}</p>
    <p>{text('The base vehicle bonus remains. Only the fitted setup adds its effect while the KX-R is active. Buying both does not stack them.',
      'Der Basisbonus des Autos bleibt. Nur das eingebaute Setup wirkt zusätzlich, solange der KX-R aktiv ist. Beide kaufen stapelt die Boni nicht.')}</p>
    {!owned && <p>{text('Own a Kairo KX-R to unlock this workshop.', 'Kairo KX-R kaufen, um diese Werkstatt freizuschalten.')}</p>}
    <div className="tuning-options">{TUNING_CATALOG.map(part => {
      const purchased = build?.purchasedIds.includes(part.id) ?? false;
      const fitted = selected?.id === part.id;
      const canBuy = owned && purchaseTuning(state, part.id).ok;
      return <article className="tuning-option" key={part.id} data-tuning-id={part.id}>
        <p className="eyebrow">{text(part.category, part.germanCategory)}</p>
        <h4>{text(part.name, part.germanName)}</h4>
        <p>{formatModifier(part.modifier)} {part.modifier.target.stat === 'business-production'
          ? text('Business Production', 'Business-Produktion') : text('Manual Job Cash · no Dispatcher bonus', 'Manueller Job-Cash · kein Dispatcher-Bonus')}</p>
        <p>{text('One-time price:', 'Einmaliger Preis:')} <strong>{formatPrice(part.cost)}</strong></p>
        <p>{fitted ? text('FITTED', 'EINGEBAUT') : purchased ? text('OWNED', 'IM BESITZ')
          : !owned ? text('KX-R REQUIRED', 'KX-R ERFORDERLICH') : canBuy ? text('AVAILABLE', 'VERFÜGBAR') : text('INSUFFICIENT CASH', 'ZU WENIG CASH')}</p>
        <button className="action-button" disabled={paused || fitted || (!purchased && !canBuy)}
          onClick={() => onConfigure(part.id, !purchased)}>{fitted ? text('Fitted', 'Eingebaut')
            : purchased ? text('Fit setup', 'Setup einbauen') : text('Buy & fit', 'Kaufen & einbauen')}</button>
      </article>;
    })}</div>
    <button className="action-button secondary-button tuning-stock" disabled={paused || !selected}
      onClick={() => onConfigure(null, false)}>{text('Restore stock · keep purchased parts', 'Zur Serie wechseln · gekaufte Teile behalten')}</button>
  </section>;
}
