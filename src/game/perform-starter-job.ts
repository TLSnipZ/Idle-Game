import { earnCash, STARTER_JOB } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type StarterJobResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError };

export function performStarterJob(state: GameState): StarterJobResult {
  const result = earnCash(state.economy, STARTER_JOB.reward);
  if (!result.ok) return { ok: false, state, error: result.error };
  return { ok: true, state: { ...state, economy: result.state } };
}
