import { getBusinessLevel, getLevelProduction } from './levels';
import { findBusiness } from '../config/business-config';
import type { BusinessState } from './business';
import type { Money } from '../../economy';

/** Derived inputs for simulation; corruption must not create or silently lose income. */
export function getOwnedProductionInputs(state: BusinessState): readonly { businessId: string; base: Money }[] {
  if (typeof state.owned !== 'object' || state.owned === null || Array.isArray(state.owned)) throw new RangeError('Invalid authoritative business ownership');
  const rates: { businessId: string; base: Money }[] = [];
  for (const id of Object.keys(state.owned)) {
    const business = findBusiness(id);
    if (!business) {
      throw new RangeError('Unknown authoritative owned business ID');
    }
    const level = getBusinessLevel(state, business.id);
    if (level === null) throw new RangeError('Missing owned business level');
    rates.push({ businessId: business.id, base: getLevelProduction(business, level) });
  }
  return rates;
}
