import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { Requirement } from '../../../game/requirement';
import type { VehicleDefinition } from '../model/vehicle';

/** Canonical identity; presentation assets remain outside gameplay state. */
export const STARTER_VEHICLE: VehicleDefinition = Object.freeze({
  id: 'vehicle:kairo-kx-r', name: 'Kairo KX-R', manufacturer: 'Kairo', model: 'KX-R', category: 'Business starter',
  description: 'A lightweight street-performance hatch. Your first tuner, built for a growing business empire.',
  purchaseCost: moneyFromMinorUnits('2500000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 5 },
    { type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 5 },
  ]),
  modifier: Object.freeze({
    id: 'modifier:kairo-kx-r-production', sourceId: 'vehicle:kairo-kx-r',
    target: Object.freeze({ stat: 'business-production', businessId: null }),
    operation: 'multiply-basis-points', bonusBasisPoints: 1000,
  }),
});
/** Explicit presentation order, independent of modifier evaluation order. */
export const VEHICLE_CATALOG: readonly VehicleDefinition[] = Object.freeze([STARTER_VEHICLE]);
export function findVehicle(id: unknown): VehicleDefinition | undefined {
  return VEHICLE_CATALOG.find(vehicle => vehicle.id === id);
}
