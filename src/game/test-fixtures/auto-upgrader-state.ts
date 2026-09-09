import { createInitialGameState } from '../game-state';
import type { GameState } from '../game-state';
import { BUSINESS_AUTO_UPGRADER as A } from '../../features/automation';
import { STARTER_BUSINESS as B } from '../../features/businesses';
import { NEON_MILE } from '../../features/territories';
import { moneyFromMinorUnits } from '../../features/economy';
import { getXpThresholdForLevel } from '../../features/progression';
export function autoUpgraderState(level = 25, cash = '100000000'): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits(cash) }, progression: { xp: getXpThresholdForLevel(20) },
    businesses: { ...s.businesses, owned: { [B.id]: { level } } },
    city: { ...s.city, ownedTerritoryIds: [...s.city.ownedTerritoryIds, NEON_MILE.id] },
    automation: { ...s.automation, unlockedIds: [A.id], enabledIds: [A.id] } };
}
