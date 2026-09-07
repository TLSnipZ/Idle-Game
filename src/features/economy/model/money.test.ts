import { describe, expect, it } from 'vitest';
import { addMoney, compareMoney, subtractMoney, moneyFromMinorUnits, moneyToDecimal, MAX_MONEY_DIGITS } from './money';

const money = moneyFromMinorUnits;

describe('exact bounded integer cents', () => {
  it('preserves cents beyond the JavaScript safe integer boundary', () => {
    const large = money('9007199254740992');
    expect(addMoney(large, money('1'))).toEqual({ ok: true, value: '9007199254740993' });
    expect(subtractMoney(money('9007199254740993'), large)).toEqual({ ok: true, value: '1' });
    expect(compareMoney(large, money('9007199254740993'))).toBe(-1);
    expect(compareMoney(large, large)).toBe(0);
    expect(compareMoney(large, money('9007199254740991'))).toBe(1);
  });

  it('supports the maximum and exact arithmetic across a large carry', () => {
    const max = money('9'.repeat(MAX_MONEY_DIGITS));
    expect(subtractMoney(max, max)).toEqual({ ok: true, value: '0' });
    expect(addMoney(money('9'.repeat(MAX_MONEY_DIGITS - 1)), money('1')))
      .toEqual({ ok: true, value: '1' + '0'.repeat(MAX_MONEY_DIGITS - 1) });
    expect(addMoney(max, money('1'))).toEqual({ ok: false, error: 'overflow' });
  });

  it('cannot subtract into negative money', () => {
    expect(subtractMoney(money('0'), money('1'))).toEqual({ ok: false, error: 'insufficient-funds' });
  });

  it('rejects fractional cents rather than rounding implicitly', () => {
    expect(() => money('1.1')).toThrow(RangeError);
    expect(() => money(0.1 + 0.2)).toThrow(RangeError);
    expect(() => money('1'.repeat(MAX_MONEY_DIGITS + 1))).toThrow(RangeError);
  });

  it.each([['0', '0.00'], ['1', '0.01'], ['10', '0.10'], ['100', '1.00'],
    ['9007199254740993', '90071992547409.93']])('renders %s exactly as %s', (input, expected) => {
    expect(moneyToDecimal(money(input))).toBe(expected);
  });
});
