import { CITY_NAME, TERRITORY_CATALOG } from '../features/territories';
import type { TerritoryId } from '../features/territories';
import type { GameState } from '../game/game-state';
import { selectCity } from '../game/territory-selectors';
import { formatCash } from '../features/economy/ui';
import { territoryPresentation } from './territory-presentation';
import { RequirementList } from './RequirementList';

export function City({ state, paused, onAcquire }: {
  readonly state: GameState; readonly paused: boolean; readonly onAcquire: (id: TerritoryId) => void;
}) {
  const city = selectCity(state);
  return <section className="city" aria-labelledby="city-heading">
    <div className="panel-heading"><h2 id="city-heading">{CITY_NAME}</h2>
      <span>Territories controlled: {city.ownedTerritoryCount} / {city.totalConfiguredTerritories}</span></div>
    <p>Build influence block by block.</p>
    <div className="territory-catalog">{TERRITORY_CATALOG.map(territory => {
      const view = territoryPresentation(state, territory.id);
      if (!view) return null;
      const heading = `${territory.id}-heading`, requirements = `${territory.id}-requirements`;
      return <article key={territory.id} className={`panel territory-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading}>
        <p className="eyebrow">{territory.starting ? 'The starting foothold' : 'The nightlife strip'}</p>
        <div className="panel-heading"><h3 id={heading}>{territory.name}</h3>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.status}</span></div>
        <p>{territory.description}</p><p className="territory-effect">{view.effect}</p>
        {view.owned ? <p>{view.availability}</p> : <>
          <p>Price: <strong>{formatCash(territory.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          <p>{view.availability}</p>
          <button className="action-button purchase-button" disabled={paused || !view.canAcquire}
            aria-label={`Take control of ${territory.name}`} aria-describedby={requirements}
            onClick={() => onAcquire(territory.id)}>{paused ? 'Session paused' : 'Take control'}</button>
        </>}
      </article>;
    })}</div>
  </section>;
}
