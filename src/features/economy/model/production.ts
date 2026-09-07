import { isMoney, moneyFromMinorUnits } from './money';
import type { Money } from './money';

// Integer cents/second × integer milliseconds yields thousandths of a cent.
export const MILLICENTS_PER_CENT = 1000;

export function isElapsedMs(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export type ProductionAccrualResult =
  | { readonly ok: true; readonly income: Money; readonly remainderMilliCents: number }
  | { readonly ok: false; readonly error: 'invalid-elapsed' | 'overflow' };

/** Rates are whole cents per second. All BigInt values remain local to this helper. */
export function accrueProduction(
  ratesCentsPerSecond: readonly Money[],
  elapsedMs: unknown,
  remainderMilliCents: number,
): ProductionAccrualResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, error: 'invalid-elapsed' };
  if (!Number.isSafeInteger(remainderMilliCents)
      || remainderMilliCents < 0 || remainderMilliCents >= MILLICENTS_PER_CENT) {
    throw new RangeError('Invalid authoritative production remainder');
  }
  let rate = 0n;
  for (const value of ratesCentsPerSecond) {
    rate += BigInt(moneyFromMinorUnits(value));
  }
  const divisor = BigInt(MILLICENTS_PER_CENT);
  const accrued = rate * BigInt(elapsedMs) + BigInt(remainderMilliCents);
  const income = (accrued / divisor).toString();
  if (!isMoney(income)) return { ok: false, error: 'overflow' };
  return {
    ok: true,
    income,
    // Modulo guarantees 0..999, exactly representable as a JSON number.
    remainderMilliCents: Number(accrued % divisor),
  };
}
