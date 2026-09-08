import { findTerritory, requireCityState, TERRITORY_CATALOG } from '../features/territories';
import { canAfford } from '../features/economy';
import { evaluateRequirements } from './requirements';
import type { GameState } from './game-state';

export function selectCity(state: GameState) {
  requireCityState(state.city);
  return { ownedTerritoryCount: state.city.ownedTerritoryIds.length, totalConfiguredTerritories: TERRITORY_CATALOG.length };
}
export function selectTerritory(state: GameState, id: unknown) {
  const definition = findTerritory(id);
  if (!definition) return null;
  requireCityState(state.city);
  const owned = state.city.ownedTerritoryIds.includes(definition.id);
  const requirements = evaluateRequirements(state, definition.requirements);
  const affordable = canAfford(state.economy, definition.purchaseCost);
  return { definition, owned, requirements, affordable, eligible: requirements.met,
    canAcquire: !owned && requirements.met && affordable };
}
