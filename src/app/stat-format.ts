import { formatCash } from '../features/economy/ui';
import { moneyFromMinorUnits } from '../features/economy';
import type { Money } from '../features/economy';
import { rational, requireRational } from '../shared/rational';
import type { Rational } from '../shared/rational';
/** Up to four dollar decimals; approximation is labelled, never used for simulation. */
export function formatProduction(value: Rational | Money): string {
  const fraction = typeof value === 'string' ? rational(BigInt(moneyFromMinorUnits(value))) : requireRational(value);
  const n = BigInt(fraction.numerator) * 100n; const d = BigInt(fraction.denominator);
  const units = n / d;
  const cents = moneyFromMinorUnits((units / 100n).toString());
  const extra = (units % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return `${n % d === 0n ? '' : '≈'}${formatCash(cents)}${extra}`;
}
export function formatBonus(basisPoints: number): string {
  const units = BigInt(basisPoints);
  const decimals = (units % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return `+${units / 100n}${decimals ? `.${decimals}` : ''}%`;
}
