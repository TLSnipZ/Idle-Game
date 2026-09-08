import { getHeatTier, requireHeatState, MAX_HEAT, HEAT_DECAY_INTERVAL_MS, LAY_LOW_COST, LAY_LOW_REDUCTION } from '../features/heat';
import { canAfford } from '../features/economy';
import type { GameState } from './game-state';
export function selectHeat(state: GameState) {
  requireHeatState(state.city);
  const { heat, heatDecayElapsedMs } = state.city;
  const tier = getHeatTier(heat);
  const affordable = canAfford(state.economy, LAY_LOW_COST);
  return { heat, heatDecayElapsedMs, tier, maximum: MAX_HEAT, percentage: heat * 100 / MAX_HEAT,
    untilDecayMs: heat === 0 ? null : HEAT_DECAY_INTERVAL_MS - heatDecayElapsedMs,
    cost: LAY_LOW_COST, reduction: LAY_LOW_REDUCTION, affordable, canLayLow: heat > 0 && affordable };
}
