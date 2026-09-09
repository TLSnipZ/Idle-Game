import { createInitialGameState } from '../game-state';
import type { GameState } from '../game-state';
import { getXpThresholdForLevel } from '../../features/progression';
import { STARTER_BUSINESS as B } from '../../features/businesses';
import { STARTER_VEHICLE as V } from '../../features/vehicles';
import { DELIVERY_DISPATCHER as D } from '../../features/automation';
import { UPGRADE_CATALOG } from '../../features/upgrades';
import { moneyFromMinorUnits } from '../../features/economy';
import { rational } from '../../shared/rational';
/** Rich temporary run exercises every reset slice and every retained slice. */
export function rebirthState(playerLevel = 20, businessLevel = 25): GameState {
  const state = createInitialGameState();
  return { ...state, economy: { cash: moneyFromMinorUnits('900719925474099312345') },
    progression: { xp: getXpThresholdForLevel(playerLevel) },
    businesses: { ...state.businesses, owned: { [B.id]: { level: businessLevel } },
      productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n, 3n) },
    garage: { ownedVehicleIds: [V.id] }, upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) },
    automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 7000 } };
}
