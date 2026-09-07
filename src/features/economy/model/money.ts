/** Canonical nonnegative integer cents. The brand exists only at compile time. */
export type Money = string & { readonly __money: unique symbol };

export const MAX_MONEY_DIGITS = 100;

export type MoneyResult =
  | { readonly ok: true; readonly value: Money }
  | { readonly ok: false; readonly error: 'overflow' | 'insufficient-funds' };

export function isMoney(value: unknown): value is Money {
  return typeof value === 'string'
    && value.length <= MAX_MONEY_DIGITS
    && value === value.trim()
    && /^(0|[1-9][0-9]*)$/.test(value);
}

/** For trusted config/code. Invalid programmer-supplied literals fail loudly. */
export function moneyFromMinorUnits(value: unknown): Money {
  if (!isMoney(value)) throw new RangeError('Expected canonical nonnegative integer cents within the money limit.');
  return value;
}

function integer(value: Money): bigint {
  // Revalidate at runtime: TypeScript brands do not validate external data.
  return BigInt(moneyFromMinorUnits(value));
}

export function compareMoney(left: Money, right: Money): -1 | 0 | 1 {
  const a = integer(left);
  const b = integer(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addMoney(left: Money, right: Money): MoneyResult {
  const value = (integer(left) + integer(right)).toString();
  if (value.length > MAX_MONEY_DIGITS) return { ok: false, error: 'overflow' };
  return { ok: true, value: moneyFromMinorUnits(value) };
}

export function subtractMoney(left: Money, right: Money): MoneyResult {
  const value = integer(left) - integer(right);
  if (value < 0n) return { ok: false, error: 'insufficient-funds' };
  return { ok: true, value: moneyFromMinorUnits(value.toString()) };
}

/** Exact decimal display boundary; no conversion to floating point. */
export function moneyToDecimal(value: Money): string {
  const digits = moneyFromMinorUnits(value).padStart(3, '0');
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}
