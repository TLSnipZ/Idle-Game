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
export const KAIRO_SENDA: VehicleDefinition = Object.freeze({
  id: 'vehicle:kairo-senda', name: 'Kairo Senda', manufacturer: 'Kairo', model: 'Senda', category: 'Hands-on earner',
  description: 'A playful rear-drive coupe with a very personal delivery service. The tips are better when the boss drives.',
  purchaseCost: moneyFromMinorUnits('4000000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 6 },
    { type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 7 },
  ]),
  modifier: Object.freeze({
    id: 'modifier:kairo-senda-manual-cash', sourceId: 'vehicle:kairo-senda',
    target: Object.freeze({ stat: 'job-reward', context: 'manual' }),
    operation: 'multiply-basis-points', bonusBasisPoints: 1200,
  }),
});
export const NAMERA_LILT: VehicleDefinition = Object.freeze({
  id: 'vehicle:namera-lilt', name: 'Namera Lilt', manufacturer: 'Namera', model: 'Lilt', category: 'Low-profile runabout',
  description: 'A light two-seat coastal roadster. Open roof, quiet exits, absolutely no room for witnesses.',
  purchaseCost: moneyFromMinorUnits('5500000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 7 },
    { type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 8 },
  ]),
  modifier: Object.freeze({
    id: 'modifier:namera-lilt-cooling', sourceId: 'vehicle:namera-lilt',
    target: Object.freeze({ stat: 'heat-decay-interval' }),
    operation: 'reduce-interval', reductionMs: 3000,
  }),
});
export const NAMERA_SEREIN: VehicleDefinition = Object.freeze({
  id: 'vehicle:namera-serein', name: 'Namera Serein', manufacturer: 'Namera', model: 'Serein', category: 'Workshop-era street coupe',
  description: 'A low-slung street coupe. The delivery is express. The explanation to your accountant is not.',
  purchaseCost: moneyFromMinorUnits('8000000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 10 },
    { type: 'business-owned', businessId: 'business:afterdark-customs' },
    { type: 'business-level', businessId: 'business:afterdark-customs', minimumLevel: 1 },
  ]),
  modifier: Object.freeze({
    id: 'modifier:namera-serein-manual-cash', sourceId: 'vehicle:namera-serein',
    target: Object.freeze({ stat: 'job-reward', context: 'manual' }),
    operation: 'multiply-basis-points', bonusBasisPoints: 2600,
  }),
});
/** Explicit presentation order, independent of modifier evaluation order. */
export const VEHICLE_CATALOG: readonly VehicleDefinition[] = Object.freeze([STARTER_VEHICLE, KAIRO_SENDA, NAMERA_LILT, NAMERA_SEREIN]);
export function findVehicle(id: unknown): VehicleDefinition | undefined {
  return VEHICLE_CATALOG.find(vehicle => vehicle.id === id);
}
