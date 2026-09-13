import { findVehicle, VEHICLE_CATALOG } from '../features/vehicles';
import { canAfford } from '../features/economy';
import { evaluateRequirements } from './requirements';
import type { GameState } from './game-state';

export function selectActiveVehicle(state: GameState) {
  const id = state.garage.activeVehicleId;
  return id !== null && state.garage.ownedVehicleIds.includes(id) ? findVehicle(id) ?? null : null;
}
export function selectGarage(state: GameState) {
  return { ownedVehicleCount: state.garage.ownedVehicleIds.length, totalConfiguredVehicles: VEHICLE_CATALOG.length, activeVehicle: selectActiveVehicle(state) };
}
export function selectVehicle(state: GameState, id: unknown) {
  const definition = findVehicle(id);
  if (!definition) return null;
  const owned = state.garage.ownedVehicleIds.includes(definition.id);
  const requirements = evaluateRequirements(state, definition.requirements);
  const affordable = canAfford(state.economy, definition.purchaseCost);
  return { definition, owned, active: owned && state.garage.activeVehicleId === definition.id, requirements, eligible: requirements.met, affordable,
    canPurchase: !owned && requirements.met && affordable };
}
