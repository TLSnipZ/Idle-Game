import { DELIVERY_DISPATCHER } from '../features/automation';
import { findTuning } from '../features/vehicles';
import { addRational, ZERO_RATIONAL } from '../shared/rational';
import { effectiveProductionRates, evaluateJobReward } from './effective-stats';
import type { GameState } from './game-state';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { evaluateDecoyCost } from './heat-support';

function snapshot(state: GameState) {
  const production = effectiveProductionRates(state);
  const manual = evaluateJobReward(state);
  const dispatcher = evaluateJobReward(state, 'dispatcher');
  if (!production.ok || !manual.ok || !dispatcher.ok) return null;
  return {
    production: production.rates.reduce(addRational, ZERO_RATIONAL),
    manual: manual.reward,
    dispatcher: dispatcher.reward,
    coolingMs: getHeatDecayIntervalMs(state),
    decoy: evaluateDecoyCost(state).cost,
  };
}

/** Read-only comparison: the workshop car is active in BOTH counterfactuals.
 * Candidate ownership exists only in this temporary state, never in a transition.
 * Reuse all real source collectors, including district Heat and scoped support.
 */
export function selectTuningInsight(state: GameState, id: unknown) {
  const part = findTuning(id);
  if (!part || !state.garage.ownedVehicleIds.includes(part.vehicleId)) return null;
  const build = state.garage.builds?.[part.vehicleId];
  const beforeState = { ...state, garage: { ...state.garage, activeVehicleId: part.vehicleId } };
  const purchasedIds = build?.purchasedIds ?? [];
  const afterState = { ...beforeState, garage: { ...beforeState.garage,
    builds: { ...state.garage.builds, [part.vehicleId]: {
      purchasedIds: purchasedIds.includes(part.id) ? purchasedIds : [...purchasedIds, part.id],
      selectedId: part.id,
    } },
  } };
  const before = snapshot(beforeState), after = snapshot(afterState);
  if (!before || !after) return null;
  return { before, after,
    requiresActivation: state.garage.activeVehicleId !== part.vehicleId,
    dispatcherOwned: state.automation.unlockedIds.includes(DELIVERY_DISPATCHER.id),
  };
}
