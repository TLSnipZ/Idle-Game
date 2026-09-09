import { autoUpgraderState } from './auto-upgrader-state';
import { crewState } from './crew-state';
import { DELIVERY_DISPATCHER } from '../../features/automation';
import { UPGRADE_CATALOG } from '../../features/upgrades';
import { STARTER_VEHICLE } from '../../features/vehicles';
import { rational } from '../../shared/rational';
import type { GameState } from '../game-state';

/** Fixed high-load input, including grandfathered skill ranks and exact fractions. */
export function runtimeLoad(level = 25, cash = '0'): GameState {
  const state = autoUpgraderState(level, cash);
  return { ...state,
    crew: crewState({ operations: 'crew:mara-knox', logistics: 'crew:jax-mercer' }).crew,
    upgrades: { purchasedIds: UPGRADE_CATALOG.map(upgrade => upgrade.id) },
    garage: { ownedVehicleIds: [STARTER_VEHICLE.id] },
    city: { ...state.city, heat: 79, heatDecayElapsedMs: 50000 },
    businesses: { ...state.businesses, productionRemainderMilliCents: 975,
      productionRemainderSubMilliCents: rational(1n, 3n) },
    automation: { ...state.automation, unlockedIds: [...state.automation.unlockedIds, DELIVERY_DISPATCHER.id],
      starterJobElapsedMs: 7000, businessAutoUpgradeElapsedMs: 20000 },
    permanentProgression: { ...state.permanentProgression,
      skills: { 'skill:streetwise-investment': 2, 'skill:learn-the-streets': 1,
        'skill:fast-talker': 1, 'skill:silent-partner': 1, 'skill:never-sleeps': 2 } },
  };
}
