import { gainHeat, dispatcherHeatGain, requireHeatState } from '../features/heat';
import { evaluateXpReward } from './xp-reward';
import { addXp } from '../features/progression';
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

export type DispatcherPlan = { readonly ok: true; readonly automation: AutomationSummary; readonly progress: number }
  | Extract<AutomationSimulationResult, { ok: false }>;
/** Pure prefix plan: cumulative XP is floored once for the outer batch. */
export function planDispatcher(state: GameState, elapsedMs: unknown): DispatcherPlan {
  if (!isElapsedMs(elapsedMs)) return { ok: false, state, error: 'invalid-elapsed' };
  if (!isAutomationState(state.automation)) throw new RangeError('Invalid authoritative automation');
  requireHeatState(state.city);
  const empty = { completedJobs: 0, income: moneyFromMinorUnits('0'), xpEarned: 0 };
  if (!state.automation.unlockedIds.includes(DELIVERY_DISPATCHER.id)) return { ok: true, automation: empty, progress: 0 };
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
  const xp = evaluateXpReward(state, 'dispatcherJob', completedJobs);
  if (!xp.ok) return { ok: false, state, error: xp.error };
  return { ok: true, progress, automation: { completedJobs, income, xpEarned: xp.reward } };
}

/** Batch identical jobs at the starting reward, then gain Heat; cooling belongs to simulateGameElapsed. */
export function simulateAutomation(state: GameState, elapsedMs: unknown): AutomationSimulationResult {
  const plan = planDispatcher(state, elapsedMs);
  if (!plan.ok) return plan;
  const { completedJobs, income, xpEarned } = plan.automation;
  const xp = addXp(state.progression, xpEarned);
  if (!xp.ok) return { ok: false, state, error: xp.error };
  const credit = earnCash(state.economy, income);
  if (!credit.ok) return { ok: false, state, error: credit.error };
  return { ok: true, automation: plan.automation,
    state: completedJobs === 0 && plan.progress === state.automation.starterJobElapsedMs ? state
      : { ...state, city: gainHeat(state.city, dispatcherHeatGain(completedJobs)), progression: xp.state, economy: credit.state,
        automation: { ...state.automation, starterJobElapsedMs: plan.progress } } };
}
