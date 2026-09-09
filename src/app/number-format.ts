import type { Money } from '../features/economy';
import { moneyFromMinorUnits } from '../features/economy';
import { formatCash } from '../features/economy/ui';
import { rational, requireRational } from '../shared/rational';
import type { Rational } from '../shared/rational';

// All inputs are cents (including rational rates). Display only, never economy math.
export { formatCash };
export function formatPrice(value: Money): string {
  return formatCash(value).replace(/\.00$/, '');
}
export function formatReward(value: Money): string { return formatCash(value); }
export function formatInteger(value: number | bigint): string {
  return BigInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function formatRate(value: Rational | Money): string {
  const fraction = typeof value === 'string' ? rational(BigInt(moneyFromMinorUnits(value))) : requireRational(value);
  const numerator = BigInt(fraction.numerator), denominator = BigInt(fraction.denominator);
  const cents = (numerator * 2n + denominator) / (denominator * 2n);
  return `${formatCash(moneyFromMinorUnits(cents.toString()))}/sec`;
}
// Optional summary format; decision-critical prices and balances stay exact.
// Beyond the supported T range, retain full digits rather than inventing suffixes.
export function formatCompactNumber(value: number | bigint): string {
  const signed = BigInt(value), amount = signed < 0n ? -signed : signed;
  if (amount < 1_000_000n || amount >= 1_000_000_000_000_000n) return formatInteger(signed);
  const [scale, suffix] = amount >= 1_000_000_000_000n ? [1_000_000_000_000n, 'T'] as const
    : amount >= 1_000_000_000n ? [1_000_000_000n, 'B'] as const : [1_000_000n, 'M'] as const;
  const units = (amount * 100n + scale / 2n) / scale;
  return `${signed < 0n ? '-' : ''}${units / 100n}.${String(units % 100n).padStart(2, '0')}${suffix}`;
}
export function formatPercent(basisPoints: number): string {
  const signed = BigInt(basisPoints), units = signed < 0n ? -signed : signed;
  const decimals = (units % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return `${signed < 0n ? '-' : '+'}${units / 100n}${decimals ? `.${decimals}` : ''}%`;
}
