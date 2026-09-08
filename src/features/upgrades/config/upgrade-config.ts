import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { UpgradeDefinition } from '../model/upgrade';
export const PRESSURE_WASHER: UpgradeDefinition = Object.freeze({
  id: 'upgrade:commercial-pressure-washer',
  name: 'Commercial Pressure Washer',
  description: 'Professional wash equipment keeps the Dockside bays moving.',
  purchaseCost: moneyFromMinorUnits('250000'),
  requiredBusiness: STARTER_BUSINESS.id,
  modifier: Object.freeze({
    id: 'modifier:commercial-pressure-washer-production',
    sourceId: 'upgrade:commercial-pressure-washer',
    target: Object.freeze({ stat: 'business-production', businessId: STARTER_BUSINESS.id }),
    operation: 'multiply-basis-points', bonusBasisPoints: 2500,
  }),
});
export function findUpgrade(id: unknown): UpgradeDefinition | undefined {
  return id === PRESSURE_WASHER.id ? PRESSURE_WASHER : undefined;
}
