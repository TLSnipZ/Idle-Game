import { NEON_MILE_ACQUISITION_HEAT } from '../../heat';
import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { TerritoryDefinition } from '../model/territory';

export const CITY_NAME = 'SOLARA CITY';
export const WATERFRONT: TerritoryDefinition = {
  id: 'territory:waterfront', name: 'Waterfront', starting: true, acquisitionHeat: 0,
  description: 'Docks, garages and service roads. Your first foothold in Solara City.',
  purchaseCost: moneyFromMinorUnits('0'), requirements: [], modifiers: [],
};
export const NEON_MILE: TerritoryDefinition = {
  id: 'territory:neon-mile', name: 'Neon Mile', starting: false, acquisitionHeat: NEON_MILE_ACQUISITION_HEAT,
  description: 'Nightclubs, glowing signs and late-night traffic. Make the strip part of your operation.',
  purchaseCost: moneyFromMinorUnits('5000000'),
  requirements: [
    { type: 'player-level', minimumLevel: 12 },
    { type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 15 },
  ],
  modifiers: [{ id: 'modifier:territory-neon-mile-job-reward', sourceId: 'territory:neon-mile',
    target: { stat: 'job-reward' }, operation: 'multiply-basis-points', bonusBasisPoints: 1000 }],
};
/** Explicit presentation order; modifier evaluation sorts independently by stable ID. */
export const TERRITORY_CATALOG: readonly TerritoryDefinition[] = Object.freeze([WATERFRONT, NEON_MILE]);
for (const territory of TERRITORY_CATALOG) {
  territory.requirements.forEach(Object.freeze);
  territory.modifiers.forEach(modifier => { Object.freeze(modifier.target); Object.freeze(modifier); });
  Object.freeze(territory.requirements); Object.freeze(territory.modifiers); Object.freeze(territory);
}
export function findTerritory(id: unknown): TerritoryDefinition | undefined {
  return TERRITORY_CATALOG.find(territory => territory.id === id);
}
