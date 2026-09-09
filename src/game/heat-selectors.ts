import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { getHeatTier, requireHeatState, MAX_HEAT, LAY_LOW_COST, LAY_LOW_REDUCTION } from '../features/heat';
import { canAfford } from '../features/economy';
import type { GameState } from './game-state';
export function selectHeat(state: GameState) {
  requireHeatState(state.city);
  const { heat, heatDecayElapsedMs } = state.city;
  const decayIntervalMs = getHeatDecayIntervalMs(state);
  const tier = getHeatTier(heat);
  const affordable = canAfford(state.economy, LAY_LOW_COST);
  return { decayIntervalMs, heat, heatDecayElapsedMs, tier, maximum: MAX_HEAT, percentage: heat * 100 / MAX_HEAT,
    untilDecayMs: heat === 0 ? null : Math.max(0, decayIntervalMs - heatDecayElapsedMs),
    cost: LAY_LOW_COST, reduction: LAY_LOW_REDUCTION, affordable, canLayLow: heat > 0 && affordable };
}
