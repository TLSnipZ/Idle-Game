import { createInitialAutomationState } from '../features/automation';
import type { AutomationState } from '../features/automation';
import type { UpgradeState } from '../features/upgrades';
import { createInitialBusinessState } from '../features/businesses';
import type { BusinessState } from '../features/businesses';
import { createInitialEconomyState } from '../features/economy';
import type { EconomyState } from '../features/economy';

export interface GameState {
  readonly automation: AutomationState;
  readonly upgrades: UpgradeState;
  readonly economy: EconomyState;
  readonly businesses: BusinessState;
}

export function createInitialGameState(): GameState {
  return { automation: createInitialAutomationState(), economy: createInitialEconomyState(), businesses: createInitialBusinessState(), upgrades: { purchasedIds: [] } };
}
