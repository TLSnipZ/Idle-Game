import { describe, expect, it } from 'vitest';
import { formatCash, formatPrice, formatReward, formatRate, formatInteger, formatPercent, formatCompactNumber } from './number-format';
import { moneyFromMinorUnits } from '../features/economy';
import { rational } from '../shared/rational';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { selectBusinessProgress } from '../game/selectors';
import { STARTER_BUSINESS } from '../features/businesses';
import { simulateElapsed } from '../game/simulate-elapsed';
const money = moneyFromMinorUnits;
describe('POST 1C display-only numeric policy', () => {
  it.each([[494046n,100n,'$49.40/sec'],[5154783n,1000n,'$51.55/sec'],[8625n,100n,'$0.86/sec'],[75n,1n,'$0.75/sec']])('rounds rational cents only at display (%s/%s)', (n,d,expected) => {
    expect(formatRate(rational(n,d))).toBe(expected);
  });
  it.each([['500000','$5,000'],['5000000','$50,000'],['9375000','$93,750'],['123456789012345678','$1,234,567,890,123,456.78']])('keeps exact full prices %s', (value,expected) => {
    expect(formatPrice(money(value))).toBe(expected);
  });
  it.each([['0','$0.00'],['123','$1.23'],['123456','$1,234.56'],['123456789012345678','$1,234,567,890,123,456.78']])('keeps exact balance and reward cents %s', (value,expected) => {
    expect(formatCash(money(value))).toBe(expected); expect(formatReward(money(value))).toBe(expected);
  });
  it.each([[500,'+5%'],[1000,'+10%'],[1500,'+15%'],[-1000,'-10%'],[-2500,'-25%']])('formats signed percentage %i', (value,expected) => {
    expect(formatPercent(value)).toBe(expected);
  });
  it('formats integer resources without decimals and with deterministic separators', () => {
    expect([0,4,12,62,1250,25000].map(formatInteger)).toEqual(['0','4','12','62','1,250','25,000']);
  });
  it('reserves conservative compact notation for optional summaries', () => {
    expect([999999,1000000,1200000,3280000000,1200000000000].map(formatCompactNumber)).toEqual(['999,999','1.00M','1.20M','3.28B','1.20T']);
    expect(formatCompactNumber(1000000000000000n)).toBe('1,000,000,000,000,000');
    expect(formatCompactNumber(-1200000)).toBe('-1.20M');
    expect(formatPrice(money('120000000'))).toBe('$1,200,000');
  });
  it('leaves authoritative rates, both remainders and subsequent simulation untouched', () => {
    const initial = autoUpgraderState(15);
    const state = { ...initial, businesses: { ...initial.businesses, productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n,3n) } };
    const snapshot = structuredClone(state);
    const progress = selectBusinessProgress(state, STARTER_BUSINESS.id);
    if (!progress) throw Error('fixture');
    const rate = structuredClone(progress.production);
    const expected = simulateElapsed(state, 12345);
    expect(formatRate(progress.production)).toMatch(/^\$[\d,]+\.\d{2}\/sec$/);
    expect(progress.production).toEqual(rate); expect(state).toEqual(snapshot);
    expect(simulateElapsed(state,12345)).toEqual(expected);
  });
});
