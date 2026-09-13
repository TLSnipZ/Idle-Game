import { getPolicePressure, MAX_HEAT, requireHeatState, RISKY_DELIVERY_HEAT, RISKY_DELIVERY_HEAT_LIMIT } from '../features/heat';
import { evaluateRiskyJobReward } from './effective-stats';
import type { GameState } from './game-state';

/** Recomputed at command time after reconciliation; no saved mode or cooldown. */
export function selectRiskyDelivery(state: GameState) {
  requireHeatState(state.city);
  const reward = evaluateRiskyJobReward(state);
  const tooHot = state.city.heat >= RISKY_DELIVERY_HEAT_LIMIT;
  return { bonusBasisPoints: getPolicePressure(state.city.heat).riskyBonusBasisPoints, reward, tooHot, canRun: !tooHot && reward.ok, heatGain: RISKY_DELIVERY_HEAT,
    heatLimit: RISKY_DELIVERY_HEAT_LIMIT, resultingHeat: Math.min(MAX_HEAT, state.city.heat + RISKY_DELIVERY_HEAT) };
}
