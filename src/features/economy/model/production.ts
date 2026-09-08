import { addRational, multiplyRational, rational, requireRational, ZERO_RATIONAL, RationalOverflow } from '../../../shared/rational';
import type { Rational } from '../../../shared/rational';
import { isMoney, moneyFromMinorUnits } from './money';
import type { Money } from './money';

// Integer cents/second × integer milliseconds yields thousandths of a cent.
export const MILLICENTS_PER_CENT = 1000;

export function isElapsedMs(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export type ProductionAccrualResult =
  | { readonly ok: true; readonly income: Money; readonly remainderMilliCents: number; readonly remainderSubMilliCents: Rational }
  | { readonly ok: false; readonly error: 'invalid-elapsed' | 'overflow' };

/** Rates are exact rational cents per second. All BigInt values remain local to this helper. */
export function accrueProduction(
  ratesCentsPerSecond: readonly (Money | Rational)[],
  elapsedMs: unknown,
  remainderMilliCents: number,
  remainderSubMilliCents: Rational = ZERO_RATIONAL,
): ProductionAccrualResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, error: 'invalid-elapsed' };
  if (!Number.isSafeInteger(remainderMilliCents)
      || remainderMilliCents < 0 || remainderMilliCents >= MILLICENTS_PER_CENT) {
    throw new RangeError('Invalid authoritative production remainder');
  }
  requireRational(remainderSubMilliCents);
  if (BigInt(remainderSubMilliCents.numerator) >= BigInt(remainderSubMilliCents.denominator)) throw new RangeError('Invalid sub-milli-cent remainder');
  try {
    let rate = ZERO_RATIONAL;
    for (const value of ratesCentsPerSecond) {
      rate = addRational(rate, typeof value === 'string' ? rational(BigInt(moneyFromMinorUnits(value))) : requireRational(value));
    }
    const accrued = addRational(multiplyRational(rate, rational(BigInt(elapsedMs))),
      addRational(rational(BigInt(remainderMilliCents)), remainderSubMilliCents));
    const n = BigInt(accrued.numerator); const d = BigInt(accrued.denominator);
    const income = (n / (d * BigInt(MILLICENTS_PER_CENT))).toString();
    if (!isMoney(income)) return { ok: false, error: 'overflow' };
    return { ok: true, income,
      remainderMilliCents: Number((n / d) % BigInt(MILLICENTS_PER_CENT)),
      remainderSubMilliCents: rational(n % d, d),
    };
  } catch (error) {
    if (error instanceof RationalOverflow) return { ok: false, error: 'overflow' };
    throw error;
  }
}
