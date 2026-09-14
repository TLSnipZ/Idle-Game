import { assertGarageState, findAppearance, findVehicle } from '../features/vehicles';
import type { GameState } from './game-state';

export function selectVehicleAppearance(state: GameState, vehicleId: unknown, appearanceId: unknown) {
  assertGarageState(state.garage);
  const vehicle = findVehicle(vehicleId), appearance = findAppearance(appearanceId);
  if (!vehicle || (appearanceId !== null && (!appearance || appearance.vehicleId !== vehicle.id)))
    return { ok: false as const, state, error: 'unknown-appearance' as const };
  if (!state.garage.ownedVehicleIds.includes(vehicle.id))
    return { ok: false as const, state, error: 'vehicle-not-owned' as const };
  if ((state.garage.appearances?.[vehicle.id] ?? null) === appearanceId) return { ok: true as const, state };
  const appearances = { ...state.garage.appearances };
  if (appearance) appearances[vehicle.id] = appearance.id;
  else delete appearances[vehicle.id];
  return { ok: true as const, state: { ...state, garage: { ...state.garage, appearances } } };
}

export type AppearanceResult = ReturnType<typeof selectVehicleAppearance>;
