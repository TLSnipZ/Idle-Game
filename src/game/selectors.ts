import { evaluateBusinessProduction } from './effective-stats';
import { findUpgrade } from '../features/upgrades';
import { findBusiness, ownsBusiness, getBusinessLevel, getUpgradeCost, MAX_BUSINESS_LEVEL } from '../features/businesses';
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
  const current = evaluateBusinessProduction(state, business.id, level);
  const next = level < MAX_BUSINESS_LEVEL ? evaluateBusinessProduction(state, business.id, level + 1) : null;
  if (!current.ok || (next && !next.ok)) throw new RangeError('Configured production exceeds range');
  return { level, production: current.effective, baseProduction: current.base, modifiers: current.applied, upgradeCost,
    nextProduction: next?.effective ?? null,
    canUpgrade: upgradeCost !== null && canAfford(state.economy, upgradeCost) };
}

export function selectUpgrade(state: GameState, id: unknown) {
  const definition = findUpgrade(id);
  if (!definition) return null;
  const purchased = state.upgrades.purchasedIds.includes(definition.id);
  const eligible = selectOwnsBusiness(state, definition.requiredBusiness);
  return { definition, purchased, eligible,
    requirement: findBusiness(definition.requiredBusiness)?.name,
    canPurchase: !purchased && eligible && canAfford(state.economy, definition.purchaseCost) };
}
