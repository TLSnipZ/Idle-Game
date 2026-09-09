import { findBusiness, getBusinessLevel, getUpgradeCost, MAX_BUSINESS_LEVEL } from '../features/businesses';
import { evaluateRequirements } from './requirements';
import { BUSINESS_AUTO_UPGRADER, DELIVERY_DISPATCHER } from '../features/automation';
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

export function selectAutoUpgrader(state: GameState) {
  const definition = BUSINESS_AUTO_UPGRADER;
  const owned = state.automation.unlockedIds.includes(definition.id);
  const enabled = state.automation.enabledIds.includes(definition.id);
  const requirements = evaluateRequirements(state, definition.requirements);
  const affordable = canAfford(state.economy, definition.purchaseCost);
  const level = getBusinessLevel(state.businesses, definition.targetBusinessId);
  const target = findBusiness(definition.targetBusinessId);
  if (!target) throw new Error('Configured automation target is missing');
  const nextCost = level === null ? null : getUpgradeCost(target, level);
  return { definition, owned, enabled, requirements, affordable,
    canPurchase: !owned && requirements.met && affordable, canToggle: owned,
    progressMs: state.automation.businessAutoUpgradeElapsedMs,
    remainingMs: definition.intervalMs - state.automation.businessAutoUpgradeElapsedMs,
    level, nextCost, maxed: level === MAX_BUSINESS_LEVEL,
    canAffordNextUpgrade: nextCost !== null && canAfford(state.economy, nextCost) };
}
