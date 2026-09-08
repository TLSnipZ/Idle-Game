import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { Requirement } from '../../../game/requirement';
import type { VehicleDefinition } from '../model/vehicle';

/** Identity is permanent; the provisional display name can change independently. */
export const STARTER_VEHICLE: VehicleDefinition = Object.freeze({
  id: 'vehicle:starter-sport-sedan', name: 'Vortex S9', category: 'Performance sedan',
  description: 'A turn-of-the-millennium performance collectible. A milestone for your growing empire.',
  purchaseCost: moneyFromMinorUnits('5000000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 7 },
    { type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 10 },
  ]),
  modifier: Object.freeze({
    id: 'modifier:starter-sport-sedan-production', sourceId: 'vehicle:starter-sport-sedan',
    target: Object.freeze({ stat: 'business-production', businessId: null }),
    operation: 'multiply-basis-points', bonusBasisPoints: 1500,
  }),
});
/** Explicit presentation order, independent of modifier evaluation order. */
export const VEHICLE_CATALOG: readonly VehicleDefinition[] = Object.freeze([STARTER_VEHICLE]);
export function findVehicle(id: unknown): VehicleDefinition | undefined {
  return VEHICLE_CATALOG.find(vehicle => vehicle.id === id);
}
