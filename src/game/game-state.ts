import { createInitialCrewState } from '../features/crew';
import type { CrewState } from '../features/crew';
import { createInitialCityState } from '../features/territories';
import type { CityState } from '../features/territories';
import { createInitialPermanentProgression } from '../features/permanent-progression';
import type { PermanentProgressionState } from '../features/permanent-progression';
import type { GarageState } from '../features/vehicles';
import type { ProgressionState } from '../features/progression';
import { createInitialAutomationState } from '../features/automation';
import type { AutomationState } from '../features/automation';
import type { UpgradeState } from '../features/upgrades';
import { createInitialBusinessState } from '../features/businesses';
import type { BusinessState } from '../features/businesses';
import { createInitialEconomyState } from '../features/economy';
import type { EconomyState } from '../features/economy';

export interface GameState {
  readonly crew: CrewState;
  readonly city: CityState;
  readonly permanentProgression: PermanentProgressionState;
  readonly garage: GarageState;
  readonly progression: ProgressionState;
  readonly automation: AutomationState;
  readonly upgrades: UpgradeState;
  readonly economy: EconomyState;
  readonly businesses: BusinessState;
}

export function createInitialGameState(): GameState {
  return { crew: createInitialCrewState(), city: createInitialCityState(), permanentProgression: createInitialPermanentProgression(), garage: { ownedVehicleIds: [] }, progression: { xp: 0 }, automation: createInitialAutomationState(), economy: createInitialEconomyState(), businesses: createInitialBusinessState(), upgrades: { purchasedIds: [] } };
}
