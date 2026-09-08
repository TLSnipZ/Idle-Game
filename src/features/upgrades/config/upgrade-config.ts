import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { UpgradeDefinition } from '../model/upgrade';
export const PRESSURE_WASHER: UpgradeDefinition = Object.freeze({
  id: 'upgrade:commercial-pressure-washer',
  name: 'Commercial Pressure Washer',
  description: 'Professional wash equipment keeps the Dockside bays moving.',
  purchaseCost: moneyFromMinorUnits('250000'),
  requirement: Object.freeze({ kind: 'business', businessId: STARTER_BUSINESS.id }),
  modifier: Object.freeze({
    id: 'modifier:commercial-pressure-washer-production',
    sourceId: 'upgrade:commercial-pressure-washer',
    target: Object.freeze({ stat: 'business-production', businessId: STARTER_BUSINESS.id }),
    operation: 'multiply-basis-points', bonusBasisPoints: 2500,
  }),
});

export const DETAILING_LINE: UpgradeDefinition = Object.freeze({
  id: 'upgrade:industrial-detailing-line', name: 'Industrial Detailing Line',
  description: 'A dedicated finishing line increases the garage’s throughput.',
  purchaseCost: moneyFromMinorUnits('1000000'),
  requirement: Object.freeze({ kind: 'business', businessId: STARTER_BUSINESS.id }),
  modifier: Object.freeze({ id: 'modifier:industrial-detailing-line-production', sourceId: 'upgrade:industrial-detailing-line',
    target: Object.freeze({ stat: 'business-production', businessId: STARTER_BUSINESS.id }),
    operation: 'multiply-basis-points', bonusBasisPoints: 5000 }),
});
export const FLEET_LOGISTICS: UpgradeDefinition = Object.freeze({
  id: 'upgrade:fleet-logistics', name: 'Fleet Logistics',
  description: 'Coordinated supplies keep every business running efficiently.',
  purchaseCost: moneyFromMinorUnits('1500000'), requirement: Object.freeze({ kind: 'any-business' }),
  modifier: Object.freeze({ id: 'modifier:fleet-logistics-production', sourceId: 'upgrade:fleet-logistics',
    target: Object.freeze({ stat: 'business-production', businessId: null }),
    operation: 'multiply-basis-points', bonusBasisPoints: 1000 }),
});
export const STREET_CONNECTIONS: UpgradeDefinition = Object.freeze({
  id: 'upgrade:street-connections', name: 'Street Connections',
  description: 'Trusted contacts negotiate better pay for every delivery.',
  purchaseCost: moneyFromMinorUnits('75000'), requirement: Object.freeze({ kind: 'none' }),
  modifier: Object.freeze({ id: 'modifier:street-connections-reward', sourceId: 'upgrade:street-connections',
    target: Object.freeze({ stat: 'job-reward' }), operation: 'multiply-basis-points', bonusBasisPoints: 2000 }),
});
export const EXPRESS_TIPS: UpgradeDefinition = Object.freeze({
  id: 'upgrade:express-tips', name: 'Express Tips',
  description: 'A reliable service earns an extra tip on each delivery.',
  purchaseCost: moneyFromMinorUnits('40000'), requirement: Object.freeze({ kind: 'none' }),
  modifier: Object.freeze({ id: 'modifier:express-tips-reward', sourceId: 'upgrade:express-tips',
    target: Object.freeze({ stat: 'job-reward' }), operation: 'add-flat', amount: moneyFromMinorUnits('500') }),
});
/** Explicit presentation order; never used as evaluation order. */
export const UPGRADE_CATALOG: readonly UpgradeDefinition[] = Object.freeze([
  PRESSURE_WASHER, DETAILING_LINE, FLEET_LOGISTICS, STREET_CONNECTIONS, EXPRESS_TIPS,
]);
export function findUpgrade(id: unknown): UpgradeDefinition | undefined {
  return UPGRADE_CATALOG.find(upgrade => upgrade.id === id);
}
