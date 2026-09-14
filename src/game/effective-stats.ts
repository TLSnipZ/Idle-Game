import { collectCrewModifiers } from '../features/crew';
import { DISCREET_DELIVERY_BONUS_BASIS_POINTS, getPolicePressure, collectHeatModifiers } from '../features/heat';
import { WATERFRONT, getDistrictHeat, collectTerritoryModifiers } from '../features/territories';
import { collectSkillModifiers } from '../features/skills';
import { activeTuning, assertGarageState, findVehicle } from '../features/vehicles';
import { findUpgrade } from '../features/upgrades';
import { findBusiness, getLevelProduction, getOwnedProductionInputs } from '../features/businesses';
import { STARTER_JOB, addMoney, compareMoney, moneyFromMinorUnits, multiplyMoney } from '../features/economy';
import type { Money } from '../features/economy';
import { evaluateStat, wholeStatValue } from './modifiers';
import type { Modifier } from './modifiers';
import type { GameState } from './game-state';

/** The only source collector. Future implemented sources append here. */
export function collectModifiers(state: GameState, context: 'manual' | 'dispatcher' = 'manual'): readonly Modifier[] {
  if (!Array.isArray(state.upgrades.purchasedIds)) throw new RangeError('Invalid authoritative upgrade ownership');
  const seen = new Set<string>();
  const upgrades = state.upgrades.purchasedIds.map(id => {
    const upgrade = findUpgrade(id);
    if (!upgrade || seen.has(id)) throw new RangeError('Invalid authoritative upgrade ownership');
    seen.add(id);
    return upgrade.modifier;
  });
  assertGarageState(state.garage);
  const activeVehicle = findVehicle(state.garage.activeVehicleId);
  const tuning = activeTuning(state.garage);
  const vehicles = [...(activeVehicle?.modifiers ?? []), ...(tuning ? [tuning.modifier] : [])];
  return [...collectCrewModifiers(state.crew), ...collectHeatModifiers(context === 'dispatcher' ? getDistrictHeat(state.city, WATERFRONT.id) : state.city), ...upgrades, ...vehicles, ...collectTerritoryModifiers(state.city), ...collectSkillModifiers(state.permanentProgression.skills)];
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

export function evaluateDeliveryRewardBase(state: GameState, context: 'manual' | 'dispatcher'):
  { readonly ok: true; readonly base: Money } | { readonly ok: false; readonly error: 'overflow' } {
  let production = moneyFromMinorUnits('0');
  for (const input of getOwnedProductionInputs(state.businesses)) {
    const sum = addMoney(production, input.base);
    if (!sum.ok) return { ok: false, error: 'overflow' };
    production = sum.value;
  }
  const scaled = multiplyMoney(production, context === 'manual' ? 8 : 1);
  if (!scaled.ok) return { ok: false, error: 'overflow' };
  return { ok: true, base: compareMoney(scaled.value, STARTER_JOB.reward) < 0 ? STARTER_JOB.reward : scaled.value };
}

export function evaluateJobReward(state: GameState, context: 'manual' | 'dispatcher' = 'manual') {
  return evaluateDeliveryReward(state, context, []);
}
export function evaluateRiskyJobReward(state: GameState) {
  return evaluateDeliveryReward(state, 'manual', [{
    id: 'modifier:risky-delivery', sourceId: 'heat:risky-delivery',
    target: { stat: 'job-reward', context: 'manual' },
    operation: 'multiply-basis-points', bonusBasisPoints: getPolicePressure(state.city.heat).riskyBonusBasisPoints,
  }]);
}
export function evaluateDiscreetJobReward(state: GameState) {
  return evaluateDeliveryReward(state, 'manual', [{
    id: 'modifier:discreet-delivery', sourceId: 'heat:discreet-delivery',
    target: { stat: 'job-reward', context: 'manual' },
    operation: 'multiply-basis-points', bonusBasisPoints: DISCREET_DELIVERY_BONUS_BASIS_POINTS,
  }]);
}
function evaluateDeliveryReward(state: GameState, context: 'manual' | 'dispatcher', extra: readonly Modifier[]) {
  const base = evaluateDeliveryRewardBase(state, context);
  if (!base.ok) return base;
  const evaluated = evaluateStat(base.base, { stat: 'job-reward', context }, [...collectModifiers(state, context), ...extra]);
  return evaluated.ok ? { ok: true as const, reward: wholeStatValue(evaluated.effective), effective: evaluated.effective, base: evaluated.base, applied: evaluated.applied } : evaluated;
}
