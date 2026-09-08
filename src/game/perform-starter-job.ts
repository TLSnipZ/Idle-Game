import { addXp, XP_REWARDS } from '../features/progression';
import type { XpError } from '../features/progression';
import { evaluateJobReward } from './effective-stats';
import { earnCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type StarterJobResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: XpError | EconomyError };

export function performStarterJob(state: GameState): StarterJobResult {
  const reward = evaluateJobReward(state);
  if (!reward.ok) return { ok: false, state, error: reward.error };
  const result = earnCash(state.economy, reward.reward);
  if (!result.ok) return { ok: false, state, error: result.error };
  const xp = addXp(state.progression, XP_REWARDS.manualJob);
  if (!xp.ok) return { ok: false, state, error: xp.error };
  return { ok: true, state: { ...state, progression: xp.state, economy: result.state } };
}
