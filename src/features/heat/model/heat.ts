import { isElapsedMs } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import { MAX_HEAT, HEAT_DECAY_INTERVAL_MS, HEAT_TIERS, HEAT_MODIFIER_ID, HEAT_SOURCE_ID, DISPATCHER_JOBS_PER_HEAT } from '../config/heat-config';

export interface HeatState { readonly heat: number; readonly heatDecayElapsedMs: number }
export type HeatTier = typeof HEAT_TIERS[number];
export function isHeat(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_HEAT;
}
export function isHeatProgress(heat: unknown, elapsed: unknown): boolean {
  return isHeat(heat) && isElapsedMs(elapsed) && elapsed < HEAT_DECAY_INTERVAL_MS && (heat !== 0 || elapsed === 0);
}
export function requireHeatState(state: HeatState): void {
  if (!isHeatProgress(state.heat, state.heatDecayElapsedMs)) throw new RangeError('Invalid authoritative Heat');
}
export function getHeatTier(heat: number): HeatTier {
  if (!isHeat(heat)) throw new RangeError('Invalid Heat');
  let tier: HeatTier = HEAT_TIERS[0];
  for (const candidate of HEAT_TIERS) if (heat >= candidate.minimum) tier = candidate;
  return tier;
}
export function gainHeat<T extends HeatState>(state: T, amount: number): T {
  requireHeatState(state);
  if (!isElapsedMs(amount)) throw new RangeError('Invalid Heat gain');
  const heat = state.heat + Math.min(MAX_HEAT - state.heat, amount);
  return heat === state.heat ? state : { ...state, heat };
}
export function reduceHeat<T extends HeatState>(state: T, amount: number): T {
  requireHeatState(state);
  if (!isElapsedMs(amount)) throw new RangeError('Invalid Heat reduction');
  const heat = state.heat - Math.min(state.heat, amount);
  return heat === state.heat ? state : { ...state, heat, heatDecayElapsedMs: heat === 0 ? 0 : state.heatDecayElapsedMs };
}
/** Intentionally no cross-batch counter. */
export function dispatcherHeatGain(completedJobs: number): number {
  if (!isElapsedMs(completedJobs)) throw new RangeError('Invalid job count');
  return Number(BigInt(completedJobs) / BigInt(DISPATCHER_JOBS_PER_HEAT));
}
/** Constant-time cooling, including huge safe elapsed inputs. Zero never banks time. */
export function decayHeat<T extends HeatState>(state: T, elapsedMs: number, intervalMs: number = HEAT_DECAY_INTERVAL_MS): T {
  requireHeatState(state);
  if (!isElapsedMs(elapsedMs)) throw new RangeError('Invalid Heat elapsed');
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1 || intervalMs > HEAT_DECAY_INTERVAL_MS) throw new RangeError('Invalid Heat decay interval');
  if (state.heat === 0 || elapsedMs === 0) return state;
  const total = BigInt(state.heatDecayElapsedMs) + BigInt(elapsedMs);
  const intervals = total / BigInt(intervalMs);
  const heat = intervals >= BigInt(state.heat) ? 0 : state.heat - Number(intervals);
  return { ...state, heat, heatDecayElapsedMs: heat === 0 ? 0 : Number(total % BigInt(intervalMs)) };
}
export function collectHeatModifiers(state: HeatState): readonly Modifier[] {
  requireHeatState(state);
  const tier = getHeatTier(state.heat);
  return tier.bonusBasisPoints === 0 ? [] : [{ id: HEAT_MODIFIER_ID, sourceId: HEAT_SOURCE_ID,
    target: { stat: 'job-reward' }, operation: 'multiply-basis-points', bonusBasisPoints: tier.bonusBasisPoints }];
}
