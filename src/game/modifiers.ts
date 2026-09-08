import { isMoney, moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import type { Money } from '../features/economy';
import { multiplyRational, rational, requireRational, RationalOverflow } from '../shared/rational';
import type { Rational } from '../shared/rational';

export type StatTarget = { readonly stat: 'business-production'; readonly businessId: string | null }
  | { readonly stat: 'job-reward' };
export interface Modifier {
  readonly id: string;
  readonly sourceId: string;
  readonly target: StatTarget;
  readonly operation: 'multiply-basis-points';
  /** Positive percentage delta: 2500 means +25%, 10000 means +100%. */
  readonly bonusBasisPoints: number;
}
export type StatEvaluation = { readonly ok: true; readonly base: Money; readonly effective: Rational; readonly applied: readonly Modifier[] }
  | { readonly ok: false; readonly error: 'overflow' };
export const MAX_MODIFIERS = 64;
const BASIS_POINTS_PER_UNIT = 10_000n;
const MAX_BONUS_BASIS_POINTS = 1_000_000;

/** Stable ID order; eligible percentage factors compound exactly, without rounding. */
export function evaluateStat(base: Money, target: StatTarget, modifiers: readonly Modifier[]): StatEvaluation {
  moneyFromMinorUnits(base);
  if (modifiers.length > MAX_MODIFIERS) throw new RangeError('Too many modifiers');
  const ids = new Set<string>();
  for (const m of modifiers) {
    if (!m.id || !m.sourceId || ids.has(m.id) || m.operation !== 'multiply-basis-points'
        || !Number.isSafeInteger(m.bonusBasisPoints) || m.bonusBasisPoints < 0 || m.bonusBasisPoints > MAX_BONUS_BASIS_POINTS) throw new RangeError('Invalid modifier');
    ids.add(m.id);
  }
  const applied = modifiers.filter(m => m.target.stat === target.stat
    && (m.target.stat !== 'business-production' || (target.stat === 'business-production'
      && (m.target.businessId === null || m.target.businessId === target.businessId))))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  try {
    let effective = rational(BigInt(base));
    for (const modifier of applied) effective = multiplyRational(effective, rational(BASIS_POINTS_PER_UNIT + BigInt(modifier.bonusBasisPoints), BASIS_POINTS_PER_UNIT));
    // Rates may contain fractions, but their magnitude has the same bound as Money.
    const maximum = BigInt('9'.repeat(MAX_MONEY_DIGITS));
    if (BigInt(effective.numerator) > maximum * BigInt(effective.denominator)) return { ok: false, error: 'overflow' };
    return { ok: true, base, effective, applied };
  } catch (error) {
    if (error instanceof RationalOverflow) return { ok: false, error: 'overflow' };
    throw error;
  }
}
/** Discrete rewards floor once at payout; continuous production retains every fraction. */
export function wholeStatValue(value: Rational): Money {
  requireRational(value);
  const whole = (BigInt(value.numerator) / BigInt(value.denominator)).toString();
  if (!isMoney(whole)) throw new RangeError('Stat exceeds money range');
  return whole;
}
