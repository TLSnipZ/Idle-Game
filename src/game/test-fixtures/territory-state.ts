import { createInitialGameState } from '../game-state';
import type { GameState } from '../game-state';
import { moneyFromMinorUnits } from '../../features/economy';
import { STARTER_BUSINESS } from '../../features/businesses';
import { getXpThresholdForLevel } from '../../features/progression';
import { DELIVERY_DISPATCHER } from '../../features/automation';
import { WATERFRONT, NEON_MILE } from '../../features/territories';

export function territoryState(owned = false, playerLevel = 12, businessLevel = 15): GameState {
  const fresh = createInitialGameState();
  return { ...fresh, economy: { cash: moneyFromMinorUnits('10000000') },
    progression: { xp: getXpThresholdForLevel(playerLevel) },
    businesses: { ...fresh.businesses, owned: { [STARTER_BUSINESS.id]: { level: businessLevel } } },
    automation: { unlockedIds: [DELIVERY_DISPATCHER.id], starterJobElapsedMs: 0 },
    city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: owned ? [WATERFRONT.id, NEON_MILE.id] : [WATERFRONT.id] } };
}
