import { selectDiscreetDelivery } from './discreet-delivery';
import { selectRiskyDelivery } from './risky-delivery';
import { countStatistic, observePeakHeat } from './statistics';
import type { StatisticsError } from '../features/statistics';
import { reduceHeat, gainHeat, MANUAL_JOB_HEAT } from '../features/heat';
import type { Money } from '../features/economy';
import { awardXp } from './xp-reward';
import type { XpError } from '../features/progression';
import { evaluateJobReward } from './effective-stats';
import { earnCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import { consumeManualJobReadiness, isManualJobReady, manualJobRemainingMs } from './manual-job-readiness';
import type { GameState } from './game-state';

export type StarterJobResult =
  | { readonly ok: true; readonly state: GameState; readonly moneyEarned: Money; readonly xpEarned: number }
  | { readonly ok: false; readonly state: GameState; readonly error: StatisticsError | XpError | EconomyError }
  | { readonly ok: false; readonly state: GameState; readonly error: 'manual-job-not-ready'; readonly remainingMs: number };

function readinessFailure(state: GameState): Extract<StarterJobResult, { readonly error: 'manual-job-not-ready' }> | null {
  return isManualJobReady(state.manualJobs) ? null
    : { ok: false, state, error: 'manual-job-not-ready', remainingMs: manualJobRemainingMs(state.manualJobs) };
}

export function performStarterJob(state: GameState): StarterJobResult {
  const blocked = readinessFailure(state);
  return blocked ?? completeDelivery(state, evaluateJobReward(state), MANUAL_JOB_HEAT);
}

export type RiskyDeliveryResult = StarterJobResult
  | { readonly ok: false; readonly state: GameState; readonly error: 'too-hot' };

export function performRiskyDelivery(state: GameState): RiskyDeliveryResult {
  const view = selectRiskyDelivery(state);
  if (view.tooHot) return { ok: false, state, error: 'too-hot' };
  const blocked = readinessFailure(state);
  if (blocked) return blocked;
  return completeDelivery(state, view.reward, view.heatGain);
}

export type DiscreetDeliveryResult = StarterJobResult
  | { readonly ok: false; readonly state: GameState; readonly error: 'already-cold' };

export function performDiscreetDelivery(state: GameState): DiscreetDeliveryResult {
  const view = selectDiscreetDelivery(state);
  if (view.reduction === 0) return { ok: false, state, error: 'already-cold' };
  const blocked = readinessFailure(state);
  if (blocked) return blocked;
  return completeDelivery(state, view.reward, -view.reduction, false);
}

function completeDelivery(state: GameState, reward: ReturnType<typeof evaluateJobReward>, heatGain: number, earnsXp = true): StarterJobResult {
  if (!reward.ok) return { ok: false, state, error: reward.error };
  const result = earnCash(state.economy, reward.reward);
  if (!result.ok) return { ok: false, state, error: result.error };
  const xp = earnsXp ? awardXp(state, 'manualJob') : { ok: true as const, state: state.progression };
  if (!xp.ok) return { ok: false, state, error: xp.error };
  const candidate = { ...state, manualJobs: consumeManualJobReadiness(state.manualJobs), city: heatGain < 0 ? reduceHeat(state.city, -heatGain) : gainHeat(state.city, heatGain), progression: xp.state, economy: result.state };
  const counted = countStatistic(state, candidate, 'manualJobsCompleted');
  if (!counted.ok) return counted;
  return { ok: true, moneyEarned: reward.reward, xpEarned: xp.state.xp - state.progression.xp, state: observePeakHeat(counted.state) };
}
