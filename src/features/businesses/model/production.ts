import { findBusiness } from '../config/business-config';
import type { BusinessState } from './business';
import type { Money } from '../../economy';

/** Derived inputs for simulation; corruption must not create or silently lose income. */
export function getOwnedProductionRates(state: BusinessState): readonly Money[] {
  if (!Array.isArray(state.ownedIds)) throw new RangeError('Invalid authoritative business ownership');
  const seen = new Set<string>();
  const rates: Money[] = [];
  for (const id of state.ownedIds) {
    const business = findBusiness(id);
    if (!business || seen.has(id)) {
      throw new RangeError('Unknown or duplicate authoritative owned business ID');
    }
    seen.add(id);
    rates.push(business.baseProductionCentsPerSecond);
  }
  return rates;
}
