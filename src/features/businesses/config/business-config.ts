import { moneyFromMinorUnits } from '../../economy';
import type { BusinessDefinition } from '../model/business';

export const STARTER_BUSINESS: BusinessDefinition = Object.freeze({
  id: 'business:dockside-detail',
  name: 'Dockside Detail',
  subtitle: 'Auto Detailing',
  description: 'A compact waterfront garage with room for a wash bay and a fresh start.',
  purchaseCost: moneyFromMinorUnits('15000'),
  requirements: Object.freeze([]),
  baseUpgradeCost: moneyFromMinorUnits('15000'),
  baseProductionCentsPerSecond: moneyFromMinorUnits('75'),
});

/** Stable progression order; ownership is stored separately in the sparse run map. */
export const BUSINESS_CATALOG: readonly BusinessDefinition[] = Object.freeze([
  STARTER_BUSINESS,
  Object.freeze<BusinessDefinition>({
    id: 'business:neon-laundry', name: 'Neon Laundry', subtitle: 'Cash Front',
    description: 'A low-profile cash front built for steady income.',
    purchaseCost: moneyFromMinorUnits('3500000'),
    requirements: Object.freeze([{ type: 'player-level', minimumLevel: 5 },
      { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 7 }]),
    baseProductionCentsPerSecond: moneyFromMinorUnits('500'), baseUpgradeCost: moneyFromMinorUnits('100000'),
  }),
  Object.freeze<BusinessDefinition>({
    id: 'business:afterdark-customs', name: 'Afterdark Customs', subtitle: 'Performance Workshop',
    description: "A performance workshop serving Solara's street scene.",
    purchaseCost: moneyFromMinorUnits('12500000'),
    requirements: Object.freeze([{ type: 'player-level', minimumLevel: 10 },
      { type: 'business-level', businessId: 'business:neon-laundry', minimumLevel: 10 }]),
    baseProductionCentsPerSecond: moneyFromMinorUnits('1500'), baseUpgradeCost: moneyFromMinorUnits('400000'),
  }),
  Object.freeze<BusinessDefinition>({
    id: 'business:solara-nights', name: 'Solara Nights', subtitle: 'Nightclub',
    description: 'A premium Neon Mile nightclub with serious earning power.',
    purchaseCost: moneyFromMinorUnits('40000000'),
    requirements: Object.freeze([{ type: 'player-level', minimumLevel: 16 },
      { type: 'business-level', businessId: 'business:afterdark-customs', minimumLevel: 8 },
      { type: 'territory-owned', territoryId: 'territory:neon-mile' }]),
    baseProductionCentsPerSecond: moneyFromMinorUnits('4000'), baseUpgradeCost: moneyFromMinorUnits('1200000'),
  }),
]);
export function findBusiness(id: unknown): BusinessDefinition | undefined {
  return BUSINESS_CATALOG.find(business => business.id === id);
}
