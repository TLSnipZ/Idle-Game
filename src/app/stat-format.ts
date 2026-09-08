import type { Modifier } from '../game/modifiers';
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
  const signed = BigInt(basisPoints);
  const units = signed < 0n ? -signed : signed;
  const decimals = (units % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return `${signed < 0n ? '-' : '+'}${units / 100n}${decimals ? `.${decimals}` : ''}%`;
}

export function formatModifier(modifier: Modifier): string {
  return modifier.operation === 'add-flat' ? `+${formatCash(modifier.amount)}` : formatBonus(modifier.bonusBasisPoints);
}
