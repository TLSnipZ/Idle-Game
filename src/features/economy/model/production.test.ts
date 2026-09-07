import { describe, expect, it } from 'vitest';
import { accrueProduction } from './production';
import { MAX_MONEY_DIGITS, moneyFromMinorUnits } from './money';

const money = moneyFromMinorUnits;

describe('exact production accrual math', () => {
  it('pools multiple rate inputs before extracting whole cents, independent of ordering', () => {
    const rates = [money('3'), money('7')];
    expect(accrueProduction(rates, 100, 0)).toEqual({ ok: true, income: '1', remainderMilliCents: 0 });
    expect(accrueProduction([...rates].reverse(), 100, 0)).toEqual(accrueProduction(rates, 100, 0));
  });

  it('preserves earned fractional cash with no current production', () => {
    expect(accrueProduction([], 100000, 900)).toEqual({ ok: true, income: '0', remainderMilliCents: 900 });
    expect(accrueProduction([money('0')], 100000, 900)).toEqual(accrueProduction([], 100000, 900));
  });

  it('returns overflow when the production income itself exceeds Money range', () => {
    const rate = money('9'.repeat(MAX_MONEY_DIGITS));
    expect(accrueProduction([rate], 2000, 0)).toEqual({ ok: false, error: 'overflow' });
    expect(accrueProduction([rate], 1000, 0)).toEqual({ ok: true, income: rate, remainderMilliCents: 0 });
  });

  it('sums rates exactly even beyond the Money range before calculating bounded income', () => {
    const rate = money('9'.repeat(MAX_MONEY_DIGITS));
    expect(accrueProduction([rate, rate], 1, 0)).toEqual({
      ok: true, income: '1' + '9'.repeat(MAX_MONEY_DIGITS - 3), remainderMilliCents: 998,
    });
  });

  it('rejects invalid elapsed independently at the arithmetic boundary', () => {
    expect(accrueProduction([money('75')], 0.5, 0)).toEqual({ ok: false, error: 'invalid-elapsed' });
  });

  it('fails loudly for invalid configured rate without changing input', () => {
    const rates = [money('75')];
    Object.defineProperty(rates, '0', { value: '1.5' });
    Object.freeze(rates);
    expect(() => accrueProduction(rates, 1000, 0)).toThrow(RangeError);
    expect(rates[0]).toBe('1.5');
  });
});
