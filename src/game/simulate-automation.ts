import { addXp, XP_REWARDS } from '../features/progression';
import type { XpError } from '../features/progression';
import { DELIVERY_DISPATCHER, isAutomationState } from '../features/automation';
import { earnCash, isElapsedMs, moneyFromMinorUnits, multiplyMoney } from '../features/economy';
import type { Money } from '../features/economy';
import { evaluateJobReward } from './effective-stats';
import type { GameState } from './game-state';
import type { SimulationResult } from './simulate-elapsed';

export interface AutomationSummary {
  readonly completedJobs: number;
  readonly income: Money;
  readonly xpEarned: number;
}
export type AutomationSimulationResult = { readonly ok: false; readonly state: GameState; readonly error: XpError | Extract<SimulationResult, { ok: false }>['error'] }
  | { readonly ok: true; readonly state: GameState; readonly automation: AutomationSummary };

/** Batch identical jobs at the current reward; no per-cycle loop or clock. */
export function simulateAutomation(state: GameState, elapsedMs: unknown): AutomationSimulationResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, state, error: 'invalid-elapsed' };
  if (!isAutomationState(state.automation)) throw new RangeError('Invalid authoritative automation');
  const empty = { completedJobs: 0, income: moneyFromMinorUnits('0'), xpEarned: 0 };
  if (state.automation.unlockedIds.length === 0) return { ok: true, state, automation: empty };
  // The sum may exceed Number precision; only bounded quotient/remainder become Numbers.
  const total = BigInt(state.automation.starterJobElapsedMs) + BigInt(elapsedMs);
  const interval = BigInt(DELIVERY_DISPATCHER.intervalMs);
  const completedJobs = Number(total / interval);
  const progress = Number(total % interval);
  let income = empty.income;
  if (completedJobs > 0) {
    const reward = evaluateJobReward(state);
    if (!reward.ok) return { ok: false, state, error: reward.error };
    const batch = multiplyMoney(reward.reward, completedJobs);
    if (!batch.ok) return { ok: false, state, error: batch.error };
    income = batch.value;
  }
  const xp = addXp(state.progression, XP_REWARDS.dispatcherJob, completedJobs);
  if (!xp.ok) return { ok: false, state, error: xp.error };
  const credit = earnCash(state.economy, income);
  if (!credit.ok) return { ok: false, state, error: credit.error };
  return { ok: true, automation: { completedJobs, income, xpEarned: xp.state.xp - state.progression.xp },
    state: completedJobs === 0 && progress === state.automation.starterJobElapsedMs ? state
      : { ...state, progression: xp.state, economy: credit.state, automation: { ...state.automation, starterJobElapsedMs: progress } } };
}
