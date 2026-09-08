import { getOfflineCapMs } from './offline-cap';
export { OFFLINE_CAP_MS } from './offline-cap';
import { getLevelIncrease } from '../features/progression';
import type { LevelIncrease } from '../features/progression';
import { subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { GameState } from './game-state';
import { isSaveTimestamp } from './save-schema';
import { simulateGameElapsed } from './simulate-game-elapsed';
import type { AutomationSummary } from './simulate-automation';
import type { GameSimulationResult } from './simulate-game-elapsed';


export interface OfflineProgress {
  readonly actualElapsedMs: number;
  readonly capMs: number;
  readonly rewardedElapsedMs: number;
  readonly capped: boolean;
  readonly incomeEarned: Money;
  readonly clockAnomaly: boolean;
  readonly xpEarned: number;
  readonly levelIncrease: LevelIncrease | null;
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
  const capMs = getOfflineCapMs(state);
  const rewardedElapsedMs = Math.min(actualElapsedMs, capMs);
  const result = simulateGameElapsed(state, rewardedElapsedMs);
  if (!result.ok) return result;
  const income = subtractMoney(result.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  return { ok: true, state: result.state, progress: {
    actualElapsedMs, rewardedElapsedMs, capMs, capped: actualElapsedMs >= capMs,
    incomeEarned: income.value, clockAnomaly,
    xpEarned: result.state.progression.xp - state.progression.xp,
    levelIncrease: getLevelIncrease(state.progression.xp, result.state.progression.xp),
    ...(state.automation.unlockedIds.length > 0 ? { businessIncome: result.businessIncome, automation: result.automation } : {}),
  } };
}
