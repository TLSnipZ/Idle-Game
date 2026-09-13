import { assertGarageState, findVehicle } from '../features/vehicles';
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
  if (previous.garage.activeVehicleId === next.garage.activeVehicleId) return false;
  const before = findVehicle(previous.garage.activeVehicleId)?.modifier;
  const after = findVehicle(next.garage.activeVehicleId)?.modifier;
  if (!before || !after) return before !== after;
  if (before.target.stat !== after.target.stat
    || (before.target.stat === 'business-production' && after.target.stat === 'business-production'
      && before.target.businessId !== after.target.businessId)) return true;
  if (before.target.stat === 'job-reward' && after.target.stat === 'job-reward'
    && before.target.context !== after.target.context) return true;
  if (before.operation === 'reduce-interval')
    return after.operation !== 'reduce-interval' || before.reductionMs !== after.reductionMs;
  return before.operation === 'add-flat'
    ? after.operation !== 'add-flat' || before.amount !== after.amount
    : after.operation !== 'multiply-basis-points' || before.bonusBasisPoints !== after.bonusBasisPoints;
}
