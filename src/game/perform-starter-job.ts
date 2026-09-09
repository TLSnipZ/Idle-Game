import { countStatistic, observePeakHeat } from './statistics';
import type { StatisticsError } from '../features/statistics';
import { gainHeat, MANUAL_JOB_HEAT } from '../features/heat';
import type { Money } from '../features/economy';
import { awardXp } from './xp-reward';
import type { XpError } from '../features/progression';
import { evaluateJobReward } from './effective-stats';
import { earnCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type StarterJobResult =
  | { readonly ok: true; readonly state: GameState; readonly moneyEarned: Money; readonly xpEarned: number }
  | { readonly ok: false; readonly state: GameState; readonly error: StatisticsError | XpError | EconomyError };

export function performStarterJob(state: GameState): StarterJobResult {
  const reward = evaluateJobReward(state);
  if (!reward.ok) return { ok: false, state, error: reward.error };
  const result = earnCash(state.economy, reward.reward);
  if (!result.ok) return { ok: false, state, error: result.error };
  const xp = awardXp(state, 'manualJob');
  if (!xp.ok) return { ok: false, state, error: xp.error };
  const counted = countStatistic(state, { ...state, city: gainHeat(state.city, MANUAL_JOB_HEAT), progression: xp.state, economy: result.state }, 'manualJobsCompleted');
  if (!counted.ok) return counted;
  return { ok: true, moneyEarned: reward.reward, xpEarned: xp.state.xp - state.progression.xp, state: observePeakHeat(counted.state) };
}
