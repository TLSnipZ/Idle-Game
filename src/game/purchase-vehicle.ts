import { findVehicle } from '../features/vehicles';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import { evaluateRequirements } from './requirements';
import type { RequirementResult } from './requirement';
import type { GameState } from './game-state';

export type PurchaseVehicleResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'unknown-vehicle' | 'already-owned' }
  | { readonly ok: false; readonly state: GameState; readonly error: 'prerequisite-not-met'; readonly requirements: RequirementResult };
export function purchaseVehicle(state: GameState, id: unknown): PurchaseVehicleResult {
  const vehicle = findVehicle(id);
  if (!vehicle) return { ok: false, state, error: 'unknown-vehicle' };
  if (state.garage.ownedVehicleIds.includes(vehicle.id)) return { ok: false, state, error: 'already-owned' };
  const requirements = evaluateRequirements(state, vehicle.requirements);
  if (!requirements.met) return { ok: false, state, error: 'prerequisite-not-met', requirements };
  const payment = spendCash(state.economy, vehicle.purchaseCost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state,
    garage: { ownedVehicleIds: [...state.garage.ownedVehicleIds, vehicle.id] } } };
}
