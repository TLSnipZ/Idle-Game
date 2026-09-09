import { HeatPanel } from './HeatPanel';
import { CITY_NAME, TERRITORY_CATALOG } from '../features/territories';
import type { TerritoryId } from '../features/territories';
import type { GameState } from '../game/game-state';
import { selectCity } from '../game/territory-selectors';
import { formatPrice } from './number-format';
import { territoryPresentation } from './territory-presentation';
import { RequirementList } from './RequirementList';

export function City({ state, paused, onAcquire, onLayLow }: {
  readonly onLayLow: () => void; readonly state: GameState; readonly paused: boolean; readonly onAcquire: (id: TerritoryId) => void;
}) {
  const city = selectCity(state);
  return <section className="city" aria-labelledby="city-heading">
    <div className="panel-heading"><h2 id="city-heading">{CITY_NAME}</h2>
      <span>Territories controlled: {city.ownedTerritoryCount} / {city.totalConfiguredTerritories}</span></div>
    <p>Build influence block by block.</p>
    <div className="district-pressure-layout"><div className="district-zone"><h3>Districts</h3>
    <div className="territory-catalog">{TERRITORY_CATALOG.map(territory => {
      const view = territoryPresentation(state, territory.id);
      if (!view) return null;
      const heading = `${territory.id}-heading`, requirements = `${territory.id}-requirements`;
      return <article key={territory.id} className={`panel territory-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading}>
        <p className="eyebrow">{territory.starting ? 'Starting district' : 'Nightlife district'}</p>
        <div className="panel-heading"><h4 id={heading}>{territory.name}</h4>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.status}</span></div>
        <div className="territory-story"><p>{territory.description}</p></div><p className="territory-effect">{view.effect}</p>
        {view.owned ? <p>{view.availability}</p> : <>
          <p className="acquisition-warning">Acquisition generates +{territory.acquisitionHeat} Heat.</p>
          <p>Price: <strong>{formatPrice(territory.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          {view.availability && <p>{view.availability}</p>}
          <button className="action-button purchase-button" disabled={paused || !view.canAcquire}
            aria-label={`Take control of ${territory.name}`} aria-describedby={requirements}
            onClick={() => onAcquire(territory.id)}>{paused ? 'Session paused' : 'Take control'}</button>
        </>}
      </article>;
    })}</div></div>
    <HeatPanel state={state} paused={paused} onLayLow={onLayLow} />
    </div>
  </section>;
}
