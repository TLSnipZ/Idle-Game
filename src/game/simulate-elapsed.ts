import { getOwnedProductionRates } from '../features/businesses';
import { accrueProduction, earnCash, isElapsedMs, readCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type SimulationResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: 'invalid-elapsed' | EconomyError };

/** Applies one explicit interval atomically. No scheduling or wall-clock policy lives here. */
export function simulateElapsed(state: GameState, elapsedMs: unknown): SimulationResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, state, error: 'invalid-elapsed' };
  // Keep the existing policy: corrupt authoritative data is a programming error.
  readCash(state.economy);
  const rates = getOwnedProductionRates(state.businesses);
  const accrual = accrueProduction(rates, elapsedMs, state.businesses.productionRemainderMilliCents);
  if (!accrual.ok) return { ok: false, state, error: accrual.error };
  if (accrual.income === '0'
      && accrual.remainderMilliCents === state.businesses.productionRemainderMilliCents) {
    return { ok: true, state };
  }
  const credit = earnCash(state.economy, accrual.income);
  if (!credit.ok) return { ok: false, state, error: credit.error };
  return {
    ok: true,
    state: {
      ...state,
      economy: credit.state,
      businesses: {
        ...state.businesses,
        productionRemainderMilliCents: accrual.remainderMilliCents,
      },
    },
  };
}
