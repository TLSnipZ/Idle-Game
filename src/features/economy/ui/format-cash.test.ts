import { expect, it } from 'vitest';
import { formatCash } from './format-cash';
import { moneyFromMinorUnits } from '../model/money';

it('formats cash without floating point conversion or losing cents', () => {
  expect(formatCash(moneyFromMinorUnits('0'))).toBe('$0.00');
  expect(formatCash(moneyFromMinorUnits('123456'))).toBe('$1,234.56');
  expect(formatCash(moneyFromMinorUnits('9007199254740993'))).toBe('$90,071,992,547,409.93');
});
