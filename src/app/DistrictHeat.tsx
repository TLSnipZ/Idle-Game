import { ManhuntPanel } from './ManhuntPanel';
import { TERRITORY_CATALOG, getActiveDistrictId, getDistrictHeat } from '../features/territories';
import type { GameState } from '../game/game-state';
import { useLocalizedText, useLocale } from './LocalizationProvider';
import { getHeatTier, getManhunt } from '../features/heat';
import { heatTierLabel } from './heat-presentation';
import './DistrictHeat.css';

export function DistrictHeat({ state, paused, onChoose, onDecoy, nested = false }: {
  readonly nested?: boolean;
  readonly onDecoy?: () => void;
  readonly state: GameState; readonly paused: boolean; readonly onChoose: (id: string) => void;
}) {
  const text = useLocalizedText(), locale = useLocale();
  const Heading = nested ? 'h3' : 'h2';
  const pursuit = getManhunt(state.city.heat);
  const blocked = state.events.pendingEventId !== null;
  return <section className="district-heat" aria-labelledby="district-heat-heading">
    <Heading id="district-heat-heading">{text('DISTRICT HEAT', 'HEAT NACH BEZIRK')}</Heading>
    <label htmlFor="active-district">{text('Operating district', 'Einsatzbezirk')}</label>
    <select id="active-district" value={getActiveDistrictId(state.city)} disabled={paused || blocked || pursuit.travelBlocked}
      aria-describedby="district-action-scope" onChange={event => onChoose(event.target.value)}>
      {TERRITORY_CATALOG.map(district => <option key={district.id} value={district.id}
        disabled={!state.city.ownedTerritoryIds.includes(district.id)}>{text(district.name)}{!state.city.ownedTerritoryIds.includes(district.id) ? text(' · Take control first', ' · Erst übernehmen') : ''}</option>)}
    </select>
    <dl className="district-heat-readings">{TERRITORY_CATALOG.map(district => {
      const owned = state.city.ownedTerritoryIds.includes(district.id);
      const heat = getDistrictHeat(state.city, district.id).heat;
      return <div key={district.id}><dt>{text(district.name)}</dt><dd>{owned
        ? text(`${heat} Heat · ${heatTierLabel(getHeatTier(heat).label, locale)}`)
        : text('Not controlled', 'Nicht kontrolliert')}</dd></div>;
    })}</dl>
    <p id="district-action-scope">{text(
      'Manual deliveries, Lay Low and City Events use this district. Dispatcher: Waterfront. Both districts cool in the background.',
      'Manuelle Lieferungen, Untertauchen und Stadtevents gelten hier. Dispatcher: Waterfront. Beide Bezirke kühlen im Hintergrund ab.')}</p>
    {pursuit.travelBlocked && <p>{text('MANHUNT roadblocks: cool below the threshold before travelling.',
      'Großfahndung: Erst unter die Heat-Schwelle abkühlen, dann den Bezirk wechseln.')}</p>}
    {blocked && <p>{text('Resolve the City Event before travelling. The paperwork knows where you live.',
      'Vor dem Wechsel das Stadtevent klären. Der Papierkram kennt deine Adresse.')}</p>}
    {onDecoy && <ManhuntPanel nested={nested} state={state} paused={paused} onDecoy={onDecoy} />}
  </section>;
}
