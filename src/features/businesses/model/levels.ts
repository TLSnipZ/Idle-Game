import { multiplyMoney } from '../../economy';
import type { Money } from '../../economy';
import type { BusinessDefinition, BusinessState, BusinessId } from './business';

export const MAX_BUSINESS_LEVEL = 100;
export function isBusinessLevel(level: unknown): level is number {
  return typeof level === 'number' && Number.isSafeInteger(level) && level >= 1 && level <= MAX_BUSINESS_LEVEL;
}
export function getBusinessLevel(state: BusinessState, id: BusinessId): number | null {
  if (!Object.hasOwn(state.owned, id)) return null;
  const level = state.owned[id]?.level;
  if (!isBusinessLevel(level)) throw new RangeError('Invalid authoritative business level');
  return level;
}
function scaled(amount: Money, factor: number): Money {
  const result = multiplyMoney(amount, factor);
  if (!result.ok) throw new RangeError('Configured progression exceeds money range');
  return result.value;
}
export function getLevelProduction(business: BusinessDefinition, level: number): Money {
  if (!isBusinessLevel(level)) throw new RangeError('Invalid business level');
  return scaled(business.baseProductionCentsPerSecond, level);
}
export function getUpgradeCost(business: BusinessDefinition, level: number): Money | null {
  if (!isBusinessLevel(level)) throw new RangeError('Invalid business level');
  return level === MAX_BUSINESS_LEVEL ? null : scaled(business.baseUpgradeCost, level * level);
}
