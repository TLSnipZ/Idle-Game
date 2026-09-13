import { HEAT_SUPPORT_RULES, DECOY_COST } from '../features/heat';
import { getBusinessLevel } from '../features/businesses';
import { activeCrewMembers } from '../features/crew';
import { assertGarageState } from '../features/vehicles';
import { getActiveDistrictId, requireCityState } from '../features/territories';
import { evaluateStat, wholeStatValue } from './modifiers';
import type { GameState } from './game-state';

/** This scoped collector is consumed only by decoy pricing, never passive simulation. */
export function selectHeatSupport(state: GameState) {
  requireCityState(state.city); assertGarageState(state.garage);
  const districtId = getActiveDistrictId(state.city);
  const crew = activeCrewMembers(state.crew);
  return HEAT_SUPPORT_RULES.map(rule => {
    const sourceId = rule.modifier.sourceId;
    const active = rule.kind === 'local-business'
      ? districtId === rule.districtId && (getBusinessLevel(state.businesses, sourceId) ?? 0) >= rule.minimumLevel
      : rule.kind === 'assigned-crew' ? crew.some(member => member.id === sourceId)
        : state.garage.activeVehicleId === sourceId;
    return { rule, active };
  });
}
export function evaluateDecoyCost(state: GameState) {
  const support = selectHeatSupport(state);
  const evaluated = evaluateStat(DECOY_COST, { stat: 'heat-response-cost' },
    support.filter(item => item.active).map(item => item.rule.modifier));
  if (!evaluated.ok) throw new RangeError('Configured decoy cost exceeds range');
  return { cost: wholeStatValue(evaluated.effective), baseCost: DECOY_COST,
    effective: evaluated.effective, applied: evaluated.applied, support };
}
