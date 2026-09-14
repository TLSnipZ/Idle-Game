import { assertGarageState, findTuning, findVehicle } from '../features/vehicles';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type TuningResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error:
    EconomyError | 'unknown-upgrade' | 'vehicle-not-owned' | 'already-purchased' | 'tuning-not-owned' };

export function purchaseTuning(state: GameState, id: unknown): TuningResult {
  assertGarageState(state.garage);
  const part = findTuning(id);
  if (!part) return { ok: false, state, error: 'unknown-upgrade' };
  if (!state.garage.ownedVehicleIds.includes(part.vehicleId)) return { ok: false, state, error: 'vehicle-not-owned' };
  const build = state.garage.builds?.[part.vehicleId];
  if (build?.purchasedIds.includes(part.id)) return { ok: false, state, error: 'already-purchased' };
  const payment = spendCash(state.economy, part.cost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state, garage: { ...state.garage,
    builds: { ...state.garage.builds, [part.vehicleId]: {
      purchasedIds: [...(build?.purchasedIds ?? []), part.id], selectedId: part.id,
    } },
  } } };
}

/** Every owned car has one setup slot. Stock never sells purchased parts. */
export function selectTuning(state: GameState, vehicleId: unknown, id: unknown): TuningResult {
  assertGarageState(state.garage);
  const part = findTuning(id);
  const vehicle = findVehicle(vehicleId);
  if (!vehicle || (id !== null && (!part || part.vehicleId !== vehicle.id))) return { ok: false, state, error: 'unknown-upgrade' };
  if (!state.garage.ownedVehicleIds.includes(vehicle.id)) return { ok: false, state, error: 'vehicle-not-owned' };
  const build = state.garage.builds?.[vehicle.id];
  if (part && !build?.purchasedIds.includes(part.id)) return { ok: false, state, error: 'tuning-not-owned' };
  const selectedId = part?.id ?? null;
  if (!build || build.selectedId === selectedId) return { ok: true, state };
  return { ok: true, state: { ...state, garage: { ...state.garage,
    builds: { ...state.garage.builds, [vehicle.id]: { ...build, selectedId } },
  } } };
}
