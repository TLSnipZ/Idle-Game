import { describe, expect, it } from 'vitest';
import { evaluateStat, wholeStatValue } from './modifiers';
import type { Modifier, StatTarget } from './modifiers';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { rational, isRational, MAX_RATIONAL_DIGITS } from '../shared/rational';
const target: StatTarget = { stat: 'business-production', businessId: 'business:test' };
function modifier(id: string, bonusBasisPoints = 2500, scope: StatTarget = target): Modifier {
  return { id, sourceId: `source:${id}`, operation: 'multiply-basis-points', target: scope, bonusBasisPoints };
}
describe('central exact stat evaluation', () => {
  it('keeps the base unchanged without eligible modifiers', () => {
    const result = evaluateStat(moneyFromMinorUnits('75'), target, []);
    expect(result).toEqual({ ok: true, base: '75', effective: rational(75n), applied: [] });
  });
  it('applies +25% without rounding fractional cents per second', () => {
    const result = evaluateStat(moneyFromMinorUnits('75'), target, [modifier('washer')]);
    expect(result.ok && result.effective).toEqual(rational(375n, 4n));
  });
  it('sorts stable IDs and compounds multiple factors independently of input order', () => {
    const a = modifier('a'); const b = modifier('b', 3333);
    const input = Object.freeze([b, a]);
    const result = evaluateStat(moneyFromMinorUnits('75'), target, input);
    expect(result).toEqual(evaluateStat(moneyFromMinorUnits('75'), target, [a, b]));
    expect(result.ok && result.applied.map(m => m.id)).toEqual(['a', 'b']);
    expect(result.ok && result.effective).toEqual(rational(999975n, 8000n));
    expect(input).toEqual([b, a]);
  });
  it('filters business scope and stat; global business scope never modifies a job', () => {
    const global = modifier('global', 2500, { stat: 'business-production', businessId: null });
    const other = modifier('other', 9000, { stat: 'business-production', businessId: 'business:other' });
    const job = modifier('job', 1000, { stat: 'job-reward' });
    const result = evaluateStat(moneyFromMinorUnits('100'), target, [global, other, job]);
    expect(result.ok && result.effective).toEqual(rational(125n));
    const reward = evaluateStat(moneyFromMinorUnits('2500'), { stat: 'job-reward' }, [global, other, job]);
    expect(reward.ok && reward.effective).toEqual(rational(2750n));
  });
  it('floors discrete job payouts once, after all factors', () => {
    const result = evaluateStat(moneyFromMinorUnits('1'), { stat: 'job-reward' }, [modifier('a', 5000, { stat: 'job-reward' }), modifier('b', 5000, { stat: 'job-reward' })]);
    if (!result.ok) throw Error('fixture');
    expect(wholeStatValue(result.effective)).toBe('2');
    expect(result.effective).toEqual(rational(9n, 4n));
  });
  it('reports magnitude overflow without mutating inputs', () => {
    const base = moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS));
    expect(evaluateStat(base, target, [modifier('a')])).toEqual({ ok: false, error: 'overflow' });
  });
  it('keeps repeated small percentage factors exact', () => {
    const result = evaluateStat(moneyFromMinorUnits('75'), target, Array.from({ length: 20 }, (_, i) => modifier(`m:${i}`, 1)));
    expect(result.ok && result.effective).toEqual(rational(75n * 10001n ** 20n, 10000n ** 20n));
  });
  it('rejects duplicate IDs to avoid double application', () => {
    expect(() => evaluateStat(moneyFromMinorUnits('75'), target, [modifier('a'), modifier('a')])).toThrow(RangeError);
  });
  it.each([-10001, 0.5, NaN, Infinity, 1_000_001])('rejects invalid basis points %#', value => {
    expect(() => evaluateStat(moneyFromMinorUnits('75'), target, [modifier('a', value)])).toThrow(RangeError);
  });
  it('bounds modifier work and rational representation', () => {
    expect(() => evaluateStat(moneyFromMinorUnits('1'), target, Array.from({ length: 65 }, (_, i) => modifier(String(i))))).toThrow(RangeError);
    expect(isRational({ numerator: '1', denominator: '1'.repeat(MAX_RATIONAL_DIGITS + 1) })).toBe(false);
    expect(() => rational(10n ** BigInt(MAX_RATIONAL_DIGITS))).toThrow(RangeError);
  });
});
