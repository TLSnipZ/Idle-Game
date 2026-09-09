import { observePeakHeat } from './statistics';
import { LAY_LOW_COST, LAY_LOW_REDUCTION, reduceHeat } from '../features/heat';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';
import { validateSaveState } from './save-schema';
export type LayLowResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'already-cold' };
export function layLow(state: GameState): LayLowResult {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative state for Lay Low');
  if (state.city.heat === 0) return { ok: false, state, error: 'already-cold' };
  const payment = spendCash(state.economy, LAY_LOW_COST);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: observePeakHeat({ ...state, economy: payment.state, city: reduceHeat(state.city, LAY_LOW_REDUCTION) }) };
}
