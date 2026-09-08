import { moneyFromMinorUnits } from '../../economy';
import type { BusinessDefinition } from '../model/business';

export const STARTER_BUSINESS: BusinessDefinition = Object.freeze({
  id: 'business:dockside-detail',
  name: 'Dockside Detail',
  description: 'A compact waterfront garage with room for a wash bay and a fresh start.',
  purchaseCost: moneyFromMinorUnits('15000'),
  baseUpgradeCost: moneyFromMinorUnits('15000'),
  baseProductionCentsPerSecond: moneyFromMinorUnits('75'),
});

export function findBusiness(id: unknown): BusinessDefinition | undefined {
  return id === STARTER_BUSINESS.id ? STARTER_BUSINESS : undefined;
}
