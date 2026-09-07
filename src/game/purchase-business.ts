import { prepareBusinessOwnership } from '../features/businesses';
import type { BusinessOwnershipError } from '../features/businesses';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type PurchaseBusinessError = BusinessOwnershipError | EconomyError;
export type PurchaseBusinessResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: PurchaseBusinessError };

export function purchaseBusiness(state: GameState, businessId: unknown): PurchaseBusinessResult {
  const ownership = prepareBusinessOwnership(state.businesses, businessId);
  if (!ownership.ok) return { ok: false, state, error: ownership.error };
  const payment = spendCash(state.economy, ownership.business.purchaseCost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return {
    ok: true,
    state: { ...state, economy: payment.state, businesses: ownership.state },
  };
}
