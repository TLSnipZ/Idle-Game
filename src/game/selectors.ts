import { findBusiness, ownsBusiness, getBusinessLevel, getUpgradeCost, getLevelProduction, MAX_BUSINESS_LEVEL } from '../features/businesses';
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

export function selectBusinessProgress(state: GameState, id: unknown) {
  const business = findBusiness(id);
  if (!business) return null;
  const level = getBusinessLevel(state.businesses, business.id);
  if (level === null) return null;
  const upgradeCost = getUpgradeCost(business, level);
  return { level, production: getLevelProduction(business, level), upgradeCost,
    nextProduction: level < MAX_BUSINESS_LEVEL ? getLevelProduction(business, level + 1) : null,
    canUpgrade: upgradeCost !== null && canAfford(state.economy, upgradeCost) };
}
