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
