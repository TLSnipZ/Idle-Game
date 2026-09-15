import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import type { Requirement } from '../../../game/requirement';
import type { VehicleDefinition } from '../model/vehicle';

/** Canonical identity; presentation assets remain outside gameplay state. */
export const STARTER_VEHICLE: VehicleDefinition = Object.freeze({
  id: 'vehicle:kairo-kx-r', name: 'Kairo KX-R', manufacturer: 'Kairo', model: 'KX-R', category: 'Business starter',
  description: 'A lightweight street-performance hatch. Your first tuner, built for a growing business empire.',
  purchaseCost: moneyFromMinorUnits('2500000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 5 }, { type: 'business-owned', businessId: STARTER_BUSINESS.id }, { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 5 },
  ]),
  modifiers: Object.freeze<Modifier[]>([Object.freeze({ id: 'modifier:kairo-kx-r-production', sourceId: 'vehicle:kairo-kx-r', target: Object.freeze({ stat: 'business-production', businessId: null }), operation: 'multiply-basis-points', bonusBasisPoints: 1000 })]),
});
export const KAIRO_SENDA: VehicleDefinition = Object.freeze({
  id: 'vehicle:kairo-senda', name: 'Kairo Senda', manufacturer: 'Kairo', model: 'Senda', category: 'Hands-on earner', description: 'A playful rear-drive coupe with a very personal delivery service. The tips are better when the boss drives.', purchaseCost: moneyFromMinorUnits('4000000'),
  requirements: Object.freeze<Requirement[]>([{ type: 'player-level', minimumLevel: 6 }, { type: 'business-owned', businessId: STARTER_BUSINESS.id }, { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 7 }]),
  modifiers: Object.freeze<Modifier[]>([Object.freeze({ id: 'modifier:kairo-senda-manual-cash', sourceId: 'vehicle:kairo-senda', target: Object.freeze({ stat: 'job-reward', context: 'manual' }), operation: 'multiply-basis-points', bonusBasisPoints: 1200 })]),
});
export const NAMERA_LILT: VehicleDefinition = Object.freeze({
  id: 'vehicle:namera-lilt', name: 'Namera Lilt', manufacturer: 'Namera', model: 'Lilt', category: 'Low-profile runabout', description: 'A light two-seat coastal roadster. Open roof, quiet exits, absolutely no room for witnesses.', purchaseCost: moneyFromMinorUnits('5500000'),
  requirements: Object.freeze<Requirement[]>([{ type: 'player-level', minimumLevel: 7 }, { type: 'business-owned', businessId: STARTER_BUSINESS.id }, { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 8 }]),
  modifiers: Object.freeze<Modifier[]>([Object.freeze({ id: 'modifier:namera-lilt-cooling', sourceId: 'vehicle:namera-lilt', target: Object.freeze({ stat: 'heat-decay-interval' }), operation: 'reduce-interval', reductionMs: 3000 })]),
});
export const NAMERA_SEREIN: VehicleDefinition = Object.freeze({
  id: 'vehicle:namera-serein', name: 'Namera Serein', manufacturer: 'Namera', model: 'Serein', category: 'Workshop-era street coupe', description: 'A low-slung street coupe. The delivery is express. The explanation to your accountant is not.', purchaseCost: moneyFromMinorUnits('8000000'),
  requirements: Object.freeze<Requirement[]>([{ type: 'player-level', minimumLevel: 10 }, { type: 'business-owned', businessId: 'business:afterdark-customs' }, { type: 'business-level', businessId: 'business:afterdark-customs', minimumLevel: 1 }]),
  modifiers: Object.freeze<Modifier[]>([Object.freeze({ id: 'modifier:namera-serein-manual-cash', sourceId: 'vehicle:namera-serein', target: Object.freeze({ stat: 'job-reward', context: 'manual' }), operation: 'multiply-basis-points', bonusBasisPoints: 2600 })]),
});
export const TOSEKI_RENDAN: VehicleDefinition = Object.freeze({
  id: 'vehicle:toseki-rendan', name: 'Toseki Rendan', manufacturer: 'Toseki', model: 'Rendan', category: 'All-weather delivery operator', description: 'Four doors, one very organized delivery operation. The wing is not tax deductible. Probably.', purchaseCost: moneyFromMinorUnits('11500000'),
  requirements: Object.freeze<Requirement[]>([{ type: 'player-level', minimumLevel: 12 }, { type: 'business-owned', businessId: 'business:afterdark-customs' }, { type: 'business-level', businessId: 'business:afterdark-customs', minimumLevel: 3 }]),
  modifiers: Object.freeze<Modifier[]>([Object.freeze({ id: 'modifier:toseki-rendan-delivery-cash', sourceId: 'vehicle:toseki-rendan', target: Object.freeze({ stat: 'job-reward' }), operation: 'multiply-basis-points', bonusBasisPoints: 1800 })]),
});
export const SEVRIN_CANTO_CLUB: VehicleDefinition = Object.freeze({
  id: 'vehicle:sevrin-canto-club', name: 'Sevrin Canto Club', manufacturer: 'Sevrin', model: 'Canto Club', category: 'Executive logistics coupe', description: 'A discreet performance coupe for an empire that earns while you park. The invoices have excellent road manners.', purchaseCost: moneyFromMinorUnits('16500000'),
  requirements: Object.freeze<Requirement[]>([{ type: 'player-level', minimumLevel: 14 }, { type: 'business-owned', businessId: 'business:afterdark-customs' }, { type: 'business-level', businessId: 'business:afterdark-customs', minimumLevel: 5 }]),
  modifiers: Object.freeze<Modifier[]>([
    Object.freeze({ id: 'modifier:sevrin-canto-club-production', sourceId: 'vehicle:sevrin-canto-club', target: Object.freeze({ stat: 'business-production', businessId: null }), operation: 'multiply-basis-points', bonusBasisPoints: 1800 }),
    Object.freeze({ id: 'modifier:sevrin-canto-club-dispatcher-cash', sourceId: 'vehicle:sevrin-canto-club', target: Object.freeze({ stat: 'job-reward', context: 'dispatcher' }), operation: 'multiply-basis-points', bonusBasisPoints: 1200 }),
  ]),
});
export const TOSEKI_RAIZAN: VehicleDefinition = Object.freeze({
  id: 'vehicle:toseki-raizan', name: 'Toseki Raizan', manufacturer: 'Toseki', model: 'Raizan', category: 'Heat-response specialist',
  description: 'Rally-bred four-door insurance for deliveries that get a little too interesting. Fast money, cooler exits, zero questions.',
  purchaseCost: moneyFromMinorUnits('25000000'),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 18 },
    { type: 'territory-owned', territoryId: 'territory:neon-mile' },
    { type: 'business-owned', businessId: 'business:solara-nights' },
    { type: 'business-level', businessId: 'business:solara-nights', minimumLevel: 2 },
  ]),
  modifiers: Object.freeze<Modifier[]>([
    Object.freeze({ id: 'modifier:toseki-raizan-delivery-cash', sourceId: 'vehicle:toseki-raizan', target: Object.freeze({ stat: 'job-reward' }), operation: 'multiply-basis-points', bonusBasisPoints: 2400 }),
    Object.freeze({ id: 'modifier:toseki-raizan-heat-response-cost', sourceId: 'vehicle:toseki-raizan', target: Object.freeze({ stat: 'heat-response-cost' }), operation: 'multiply-basis-points', bonusBasisPoints: -1500 }),
  ]),
});
/** Explicit presentation order, independent of modifier evaluation order. */
export const VEHICLE_CATALOG: readonly VehicleDefinition[] = Object.freeze([STARTER_VEHICLE, KAIRO_SENDA, NAMERA_LILT, NAMERA_SEREIN, TOSEKI_RENDAN, SEVRIN_CANTO_CLUB, TOSEKI_RAIZAN]);
export function findVehicle(id: unknown): VehicleDefinition | undefined { return VEHICLE_CATALOG.find(vehicle => vehicle.id === id); }
