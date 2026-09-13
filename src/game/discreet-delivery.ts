import { requireHeatState, DISCREET_DELIVERY_HEAT_REDUCTION } from '../features/heat';
import { evaluateDiscreetJobReward } from './effective-stats';
import type { GameState } from './game-state';

export function selectDiscreetDelivery(state: GameState) {
  requireHeatState(state.city);
  const reward = evaluateDiscreetJobReward(state);
  const reduction = Math.min(state.city.heat, DISCREET_DELIVERY_HEAT_REDUCTION);
  return { reward, reduction, resultingHeat: state.city.heat - reduction,
    canRun: reduction > 0 && reward.ok };
}
