import { evaluateRequirements } from './requirements';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { canAfford } from '../features/economy';
import { evaluateJobReward } from './effective-stats';
import type { GameState } from './game-state';

export function selectDispatcher(state: GameState) {
  const unlocked = state.automation.unlockedIds.includes(DELIVERY_DISPATCHER.id);
  const requirements = evaluateRequirements(state, DELIVERY_DISPATCHER.requirements);
  const eligible = requirements.met;
  const reward = evaluateJobReward(state);
  return { definition: DELIVERY_DISPATCHER, unlocked, eligible, requirements,
    canPurchase: !unlocked && eligible && canAfford(state.economy, DELIVERY_DISPATCHER.purchaseCost),
    reward: reward.ok ? reward.reward : null, intervalMs: DELIVERY_DISPATCHER.intervalMs,
    progressMs: state.automation.starterJobElapsedMs,
    remainingMs: DELIVERY_DISPATCHER.intervalMs - state.automation.starterJobElapsedMs };
}
