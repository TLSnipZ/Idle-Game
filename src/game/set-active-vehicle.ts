import { activeTuning, assertGarageState, findVehicle } from '../features/vehicles';
import type { Modifier } from './modifiers';
import type { GameState } from './game-state';

export type ActiveVehicleResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: 'unknown-vehicle' | 'vehicle-not-owned' };

/** Free, prospective selection. Payment and ownership remain purchaseVehicle's responsibility. */
export function setActiveVehicle(state: GameState, id: unknown): ActiveVehicleResult {
  assertGarageState(state.garage);
  const vehicle = findVehicle(id);
  if (!vehicle) return { ok: false, state, error: 'unknown-vehicle' };
  if (!state.garage.ownedVehicleIds.includes(vehicle.id))
    return { ok: false, state, error: 'vehicle-not-owned' };
  if (state.garage.activeVehicleId === vehicle.id) return { ok: true, state };
  return { ok: true, state: { ...state, garage: { ...state.garage, activeVehicleId: vehicle.id } } };
}

/** Modifier identity alone is not a rate change: equal bonuses keep fractional runtime time. */
export function activeVehicleEffectChanged(previous: GameState, next: GameState): boolean {
  if (activeTuning(previous.garage)?.id !== activeTuning(next.garage)?.id) return true;
  if (previous.garage.activeVehicleId === next.garage.activeVehicleId) return false;
  const before = (findVehicle(previous.garage.activeVehicleId)?.modifiers ?? []).map(effectKey).sort();
  const after = (findVehicle(next.garage.activeVehicleId)?.modifiers ?? []).map(effectKey).sort();
  return before.length !== after.length || before.some((key, index) => key !== after[index]);
}

/** Compare the complete effect multiset, independent of source IDs and ordering. */
function effectKey(modifier: Modifier): string {
  const target = modifier.target;
  const scope = target.stat === 'business-production' ? target.businessId
    : target.stat === 'job-reward' ? target.context ?? null : null;
  const value = modifier.operation === 'reduce-interval' ? modifier.reductionMs
    : modifier.operation === 'add-flat' ? modifier.amount : modifier.bonusBasisPoints;
  return JSON.stringify([target.stat, scope, modifier.operation, value]);
}
