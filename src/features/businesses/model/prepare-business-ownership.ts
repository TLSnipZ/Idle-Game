import { findBusiness } from '../config/business-config';
import { ownsBusiness } from './business';
import type { BusinessDefinition, BusinessState } from './business';

export type BusinessOwnershipError = 'unknown-business' | 'already-owned';
export type BusinessOwnershipResult =
  | { readonly ok: true; readonly state: BusinessState; readonly business: BusinessDefinition }
  | { readonly ok: false; readonly state: BusinessState; readonly error: BusinessOwnershipError };

/** A candidate slice only. The game coordinator must also secure payment. */
export function prepareBusinessOwnership(state: BusinessState, id: unknown): BusinessOwnershipResult {
  const business = findBusiness(id);
  if (!business) return { ok: false, state, error: 'unknown-business' };
  if (ownsBusiness(state, business.id)) return { ok: false, state, error: 'already-owned' };
  return {
    ok: true,
    business,
    state: { ...state, owned: { ...state.owned, [business.id]: { level: 1 } } },
  };
}
