import { isMoney, moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import type { Money } from '../features/economy';
import { addRational, multiplyRational, rational, requireRational, RationalOverflow } from '../shared/rational';
import type { Rational } from '../shared/rational';

export type StatTarget = { readonly stat: 'business-production'; readonly businessId: string | null }
  | { readonly stat: 'job-reward'; readonly context?: 'manual' | 'dispatcher' } | { readonly stat: 'heat-response-cost' } | { readonly stat: 'xp-reward' } | { readonly stat: 'heat-decay-interval' };
interface ModifierIdentity {
  readonly id: string;
  readonly sourceId: string;
  readonly target: StatTarget;
}
export type Modifier = ModifierIdentity & ({ readonly operation: 'add-flat'; readonly amount: Money } | {
  readonly operation: 'multiply-basis-points';
  /** Signed percentage delta (-10000 through 1000000): 2500 means +25%, 10000 means +100%. */
  readonly bonusBasisPoints: number;
} | { readonly operation: 'reduce-interval'; readonly reductionMs: number });
export type StatEvaluation<T extends Money | bigint = Money> = { readonly ok: true; readonly base: T; readonly effective: Rational; readonly applied: readonly Modifier[] }
  | { readonly ok: false; readonly error: 'overflow' };
export const MAX_MODIFIERS = 64;
const BASIS_POINTS_PER_UNIT = 10_000n;
const MAX_BONUS_BASIS_POINTS = 1_000_000;

function validateModifiers(modifiers: readonly Modifier[]): void {
  if (modifiers.length > MAX_MODIFIERS) throw new RangeError('Too many modifiers');
  const ids = new Set<string>();
  for (const m of modifiers) {
    if (m.operation === 'reduce-interval') {
      if (!m.id || !m.sourceId || ids.has(m.id) || m.target.stat !== 'heat-decay-interval'
        || !Number.isSafeInteger(m.reductionMs) || m.reductionMs < 0) throw new RangeError('Invalid interval modifier');
      ids.add(m.id); continue;
    }
    if (m.target.stat === 'heat-decay-interval') throw new RangeError('Invalid interval operation');
    if (!m.id || !m.sourceId || ids.has(m.id) || (m.operation === 'add-flat' ? !isMoney(m.amount) : m.operation !== 'multiply-basis-points'
        || !Number.isSafeInteger(m.bonusBasisPoints) || m.bonusBasisPoints < -10_000 || m.bonusBasisPoints > MAX_BONUS_BASIS_POINTS)) throw new RangeError('Invalid modifier');
    ids.add(m.id);
  }
}

/** Flat additions before percentage factors; stable IDs within each group, no rounding. */
export function evaluateStat<T extends Money | bigint>(base: T, target: StatTarget, modifiers: readonly Modifier[]): StatEvaluation<T> {
  if (typeof base === 'bigint') {
    if (target.stat !== 'xp-reward' || base < 0n) throw new RangeError('Invalid integer stat base');
  } else {
    if (target.stat === 'xp-reward') throw new RangeError('XP must not use Money');
    moneyFromMinorUnits(base);
  }
  validateModifiers(modifiers);
  const applied = modifiers.filter(m => m.operation !== 'reduce-interval' && m.target.stat === target.stat
    && (m.target.stat !== 'job-reward' || (target.stat === 'job-reward'
      && (m.target.context === undefined || m.target.context === target.context)))
    && (m.target.stat !== 'business-production' || (target.stat === 'business-production'
      && (m.target.businessId === null || m.target.businessId === target.businessId))))
    .sort((a, b) => a.operation !== b.operation ? (a.operation === 'add-flat' ? -1 : 1)
      : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  try {
    let effective = rational(BigInt(base));
    for (const modifier of applied) {
      if (modifier.operation === 'reduce-interval') throw new RangeError('Interval effect is not an economic stat');
      effective = modifier.operation === 'add-flat'
        ? addRational(effective, rational(BigInt(modifier.amount)))
        : multiplyRational(effective, rational(BASIS_POINTS_PER_UNIT + BigInt(modifier.bonusBasisPoints), BASIS_POINTS_PER_UNIT));
    }
    // Economic rates use the Money magnitude bound. XP adds its safe-integer
    // bound after final flooring in xp-reward; both share this exact rational path.
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

/** Shared integer duration effects. Reductions never rescale an earned remainder. */
export function evaluateIntervalMs(baseMs: number, minimumMs: number, modifiers: readonly Modifier[]): number {
  if (!Number.isSafeInteger(baseMs) || !Number.isSafeInteger(minimumMs) || minimumMs < 1 || baseMs < minimumMs)
    throw new RangeError('Invalid interval bounds');
  validateModifiers(modifiers);
  let remaining = BigInt(baseMs);
  for (const modifier of modifiers) if (modifier.operation === 'reduce-interval') remaining -= BigInt(modifier.reductionMs);
  return Number(remaining < BigInt(minimumMs) ? BigInt(minimumMs) : remaining);
}
