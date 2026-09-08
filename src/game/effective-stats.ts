import { collectTerritoryModifiers } from '../features/territories';
import { collectSkillModifiers } from '../features/skills';
import { findVehicle } from '../features/vehicles';
import { findUpgrade } from '../features/upgrades';
import { findBusiness, getLevelProduction, getOwnedProductionInputs } from '../features/businesses';
import { STARTER_JOB } from '../features/economy';
import { evaluateStat, wholeStatValue } from './modifiers';
import type { Modifier } from './modifiers';
import type { GameState } from './game-state';

/** The only source collector. Future implemented sources append here. */
export function collectModifiers(state: GameState): readonly Modifier[] {
  if (!Array.isArray(state.upgrades.purchasedIds)) throw new RangeError('Invalid authoritative upgrade ownership');
  const seen = new Set<string>();
  const upgrades = state.upgrades.purchasedIds.map(id => {
    const upgrade = findUpgrade(id);
    if (!upgrade || seen.has(id)) throw new RangeError('Invalid authoritative upgrade ownership');
    seen.add(id);
    return upgrade.modifier;
  });
  if (!Array.isArray(state.garage.ownedVehicleIds)) throw new RangeError('Invalid authoritative vehicle ownership');
  const vehicles = state.garage.ownedVehicleIds.map(id => {
    const vehicle = findVehicle(id);
    if (!vehicle || seen.has(id)) throw new RangeError('Invalid authoritative vehicle ownership');
    seen.add(id);
    return vehicle.modifier;
  });
  return [...upgrades, ...vehicles, ...collectTerritoryModifiers(state.city), ...collectSkillModifiers(state.permanentProgression.skills)];
}
export function evaluateBusinessProduction(state: GameState, id: string, level: number) {
  const business = findBusiness(id);
  if (!business) throw new RangeError('Unknown business');
  return evaluateStat(getLevelProduction(business, level), { stat: 'business-production', businessId: id }, collectModifiers(state));
}
export function effectiveProductionRates(state: GameState) {
  const modifiers = collectModifiers(state);
  const rates = [];
  for (const input of getOwnedProductionInputs(state.businesses)) {
    const evaluated = evaluateStat(input.base, { stat: 'business-production', businessId: input.businessId }, modifiers);
    if (!evaluated.ok) return evaluated;
    rates.push(evaluated.effective);
  }
  return { ok: true as const, rates };
}
export function evaluateJobReward(state: GameState) {
  const evaluated = evaluateStat(STARTER_JOB.reward, { stat: 'job-reward' }, collectModifiers(state));
  return evaluated.ok ? { ok: true as const, reward: wholeStatValue(evaluated.effective), base: evaluated.base, applied: evaluated.applied } : evaluated;
}
