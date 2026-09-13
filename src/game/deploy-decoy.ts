import { DECOY_COST, getManhunt, DECOY_HEAT_REDUCTION, reduceHeat } from '../features/heat';
import { spendCash, canAfford } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';
import { validateSaveState } from './save-schema';

export type DecoyResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'no-manhunt' };
export function selectDecoy(state: GameState) {
  const pursuit = getManhunt(state.city.heat);
  const affordable = canAfford(state.economy, DECOY_COST);
  return { ...pursuit, cost: DECOY_COST, reduction: DECOY_HEAT_REDUCTION,
    affordable, available: pursuit.active && affordable };
}
export function deployDecoy(state: GameState): DecoyResult {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative decoy state');
  if (!getManhunt(state.city.heat).active) return { ok: false, state, error: 'no-manhunt' };
  const payment = spendCash(state.economy, DECOY_COST);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state,
    city: reduceHeat(state.city, DECOY_HEAT_REDUCTION) } };
}
