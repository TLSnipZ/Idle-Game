import { findBusiness, isBusinessLevel, MAX_BUSINESS_LEVEL, getUpgradeCost } from '../features/businesses';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';
export type UpgradeBusinessResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'unknown-business' | 'not-owned' | 'max-level-reached' | 'invalid-level' };

export function upgradeBusiness(state: GameState, id: unknown): UpgradeBusinessResult {
  const business = findBusiness(id);
  if (!business) return { ok: false, state, error: 'unknown-business' };
  if (!Object.hasOwn(state.businesses.owned, business.id)) return { ok: false, state, error: 'not-owned' };
  const level = state.businesses.owned[business.id]?.level;
  if (!isBusinessLevel(level)) return { ok: false, state, error: 'invalid-level' };
  if (level === MAX_BUSINESS_LEVEL) return { ok: false, state, error: 'max-level-reached' };
  const cost = getUpgradeCost(business, level);
  if (cost === null) return { ok: false, state, error: 'max-level-reached' };
  const payment = spendCash(state.economy, cost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state, businesses: {
    ...state.businesses, owned: { ...state.businesses.owned, [business.id]: { level: level + 1 } },
  } } };
}
