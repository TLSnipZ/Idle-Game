import { findBusiness, ownsBusiness } from '../features/businesses';
import { readCash, canAfford } from '../features/economy';
import type { Money } from '../features/economy';
import type { GameState } from './game-state';

export function selectCash(state: GameState): Money {
  return readCash(state.economy);
}

export function selectOwnsBusiness(state: GameState, businessId: unknown): boolean {
  const business = findBusiness(businessId);
  return business !== undefined && ownsBusiness(state.businesses, business.id);
}

export function selectCanPurchaseBusiness(state: GameState, businessId: unknown): boolean {
  const business = findBusiness(businessId);
  return business !== undefined
    && !ownsBusiness(state.businesses, business.id)
    && canAfford(state.economy, business.purchaseCost);
}
