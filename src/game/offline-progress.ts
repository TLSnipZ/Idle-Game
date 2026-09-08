import { subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { GameState } from './game-state';
import { isSaveTimestamp } from './save-schema';
import { simulateGameElapsed } from './simulate-game-elapsed';
import type { AutomationSummary } from './simulate-automation';
import type { GameSimulationResult } from './simulate-game-elapsed';

export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export interface OfflineProgress {
  readonly actualElapsedMs: number;
  readonly rewardedElapsedMs: number;
  readonly capped: boolean;
  readonly incomeEarned: Money;
  readonly clockAnomaly: boolean;
  readonly businessIncome?: Money;
  readonly automation?: AutomationSummary;
}
export type OfflineError = 'invalid-timestamp' | Extract<GameSimulationResult, { ok: false }>['error'];
export type OfflineResult = { readonly ok: true; readonly state: GameState; readonly progress: OfflineProgress }
  | { readonly ok: false; readonly state: GameState; readonly error: OfflineError };

/** Policy around the sole simulation path. All clocks are explicit inputs. */
export function reconcileOffline(state: GameState, savedAt: unknown, now: unknown): OfflineResult {
  if (!isSaveTimestamp(savedAt) || !isSaveTimestamp(now)) return { ok: false, state, error: 'invalid-timestamp' };
  const clockAnomaly = now < savedAt;
  // Both endpoints are nonnegative safe integers: the ordered difference is safe.
  const actualElapsedMs = clockAnomaly ? 0 : now - savedAt;
  const rewardedElapsedMs = Math.min(actualElapsedMs, OFFLINE_CAP_MS);
  const result = simulateGameElapsed(state, rewardedElapsedMs);
  if (!result.ok) return result;
  const income = subtractMoney(result.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  return { ok: true, state: result.state, progress: {
    actualElapsedMs, rewardedElapsedMs, capped: actualElapsedMs >= OFFLINE_CAP_MS,
    incomeEarned: income.value, clockAnomaly,
    ...(state.automation.unlockedIds.length > 0 ? { businessIncome: result.businessIncome, automation: result.automation } : {}),
  } };
}
