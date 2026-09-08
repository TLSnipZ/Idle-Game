import { subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { GameState } from './game-state';
import { isSaveTimestamp } from './save-schema';
import { simulateElapsed } from './simulate-elapsed';
import type { SimulationResult } from './simulate-elapsed';

export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export interface OfflineProgress {
  readonly actualElapsedMs: number;
  readonly rewardedElapsedMs: number;
  readonly capped: boolean;
  readonly incomeEarned: Money;
  readonly clockAnomaly: boolean;
}
export type OfflineError = 'invalid-timestamp' | Extract<SimulationResult, { ok: false }>['error'];
export type OfflineResult = { readonly ok: true; readonly state: GameState; readonly progress: OfflineProgress }
  | { readonly ok: false; readonly state: GameState; readonly error: OfflineError };

/** Policy around the sole simulation path. All clocks are explicit inputs. */
export function reconcileOffline(state: GameState, savedAt: unknown, now: unknown): OfflineResult {
  if (!isSaveTimestamp(savedAt) || !isSaveTimestamp(now)) return { ok: false, state, error: 'invalid-timestamp' };
  const clockAnomaly = now < savedAt;
  // Both endpoints are nonnegative safe integers: the ordered difference is safe.
  const actualElapsedMs = clockAnomaly ? 0 : now - savedAt;
  const rewardedElapsedMs = Math.min(actualElapsedMs, OFFLINE_CAP_MS);
  const result = simulateElapsed(state, rewardedElapsedMs);
  if (!result.ok) return result;
  const income = subtractMoney(result.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  return { ok: true, state: result.state, progress: {
    actualElapsedMs, rewardedElapsedMs, capped: actualElapsedMs >= OFFLINE_CAP_MS,
    incomeEarned: income.value, clockAnomaly,
  } };
}
