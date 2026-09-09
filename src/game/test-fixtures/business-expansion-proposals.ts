/** POST 3A analysis-only proposed catalog. Never imported by application/runtime. */
import type { BusinessDefinition } from '../../features/businesses';
import { moneyFromMinorUnits } from '../../features/economy';

export const BUSINESS_PROPOSALS: readonly BusinessDefinition[] = [
  { id: 'business:neon-laundry', name: 'Neon Laundry', description: 'Cash Front',
    purchaseCost: moneyFromMinorUnits('3500000'), baseProductionCentsPerSecond: moneyFromMinorUnits('500'),
    baseUpgradeCost: moneyFromMinorUnits('100000'), requirements: [
      { type: 'player-level', minimumLevel: 5 },
      { type: 'business-level', businessId: 'business:dockside-detail', minimumLevel: 7 },
    ] },
  { id: 'business:afterdark-customs', name: 'Afterdark Customs', description: 'Performance Workshop',
    purchaseCost: moneyFromMinorUnits('12500000'), baseProductionCentsPerSecond: moneyFromMinorUnits('1500'),
    baseUpgradeCost: moneyFromMinorUnits('400000'), requirements: [
      { type: 'player-level', minimumLevel: 10 },
      { type: 'business-level', businessId: 'business:dockside-detail', minimumLevel: 12 },
    ] },
  { id: 'business:solara-nights', name: 'Solara Nights', description: 'Nightclub',
    purchaseCost: moneyFromMinorUnits('40000000'), baseProductionCentsPerSecond: moneyFromMinorUnits('4000'),
    baseUpgradeCost: moneyFromMinorUnits('1200000'), requirements: [
      { type: 'player-level', minimumLevel: 16 },
      { type: 'territory-owned', territoryId: 'territory:neon-mile' },
    ] },
];
