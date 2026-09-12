import { HeatPanel } from './HeatPanel';
import { CITY_NAME, TERRITORY_CATALOG } from '../features/territories';
import type { TerritoryId } from '../features/territories';
import type { GameState } from '../game/game-state';
import { selectCity } from '../game/territory-selectors';
import { formatPrice } from './number-format';
import { territoryPresentation } from './territory-presentation';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function City({ state, paused, onAcquire, onLayLow }: {
  readonly onLayLow: () => void; readonly state: GameState; readonly paused: boolean; readonly onAcquire: (id: TerritoryId) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const city = selectCity(state);
  return <section className="city" aria-labelledby="city-heading">
    <div className="panel-heading"><h2 id="city-heading">{CITY_NAME}</h2>
      <span>{text('Territories controlled:', 'Kontrollierte Bezirke:')} {city.ownedTerritoryCount} / {city.totalConfiguredTerritories}</span></div>
    <p>{text('Build influence block by block. The city calls it zoning. You call it growth.', 'Bau deinen Einfluss Block für Block aus. Die Stadt nennt es Stadtplanung. Du nennst es Wachstum.')}</p>
    <div className="district-pressure-layout"><div className="district-zone"><h3>{text('Districts', 'Bezirke')}</h3>
    <div className="territory-catalog">{TERRITORY_CATALOG.map(territory => {
      const view = territoryPresentation(state, territory.id, locale);
      if (!view) return null;
      const heading = `${territory.id}-heading`, requirements = `${territory.id}-requirements`;
      const description = localizedContent(locale, territory.id, 'description', territory.description);
      return <article key={territory.id} className={`panel territory-card ${view.owned ? 'is-owned' : ''}`} aria-labelledby={heading}>
        <p className="eyebrow">{territory.starting ? text('Starting district', 'Startbezirk') : text('Nightlife district', 'Nightlife-Bezirk')}</p>
        <div className="panel-heading"><h4 id={heading}>{territory.name}</h4>
          <span className={`ownership-badge ${view.owned ? 'is-owned' : ''}`}>{view.status}</span></div>
        <div className="territory-story"><p>{description}</p></div><p className="territory-effect">{view.effect}</p>
        {view.owned ? <p>{view.availability}</p> : <>
          <p className="acquisition-warning">{text(`Acquisition generates +${territory.acquisitionHeat} Heat.`, `Übernahme erzeugt +${territory.acquisitionHeat} Heat. Die Nachbarschaft wird’s merken.`)}</p>
          <p>{text('Price:', 'Preis:')} <strong>{formatPrice(territory.purchaseCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirements} />
          <div className="card-action-area">
          <button className="action-button purchase-button" disabled={paused || !view.canAcquire}
            aria-label={text(`Take control of ${territory.name}`, `${territory.name} übernehmen`)} aria-describedby={requirements}
            onClick={() => onAcquire(territory.id)}>{paused ? text('Session paused', 'Session pausiert') : text('Take control', 'Kontrolle übernehmen')}</button>
          {view.availability && <p className="purchase-note">{view.availability}</p>}
          </div>
        </>}
      </article>;
    })}</div></div>
    <HeatPanel state={state} paused={paused} onLayLow={onLayLow} />
    </div>
  </section>;
}
