import { describe, expect, it } from 'vitest';
import { PRESSURE_WASHER } from '../features/upgrades';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { createInitialGameState } from './game-state';
import { purchaseUpgrade } from './purchase-upgrade';
import { simulateElapsed } from './simulate-elapsed';
import { evaluateJobReward, evaluateBusinessProduction } from './effective-stats';
import { performStarterJob } from './perform-starter-job';
import { upgradeBusiness } from './upgrade-business';
import { rational } from '../shared/rational';
const id = STARTER_BUSINESS.id;
function owned(level = 1, cash = '250000') {
  const initial = createInitialGameState();
  return { ...initial, economy: { cash: moneyFromMinorUnits(cash) }, businesses: { ...initial.businesses, owned: { [id]: { level } } } };
}
describe('pressure washer purchase and shared production', () => {
  it('spends exactly $2500 and acquires equipment atomically on frozen state', () => {
    const state = owned(); Object.freeze(state); Object.freeze(state.upgrades); Object.freeze(state.upgrades.purchasedIds);
    const result = purchaseUpgrade(state, PRESSURE_WASHER.id);
    expect(result.ok).toBe(true); expect(result.state.economy.cash).toBe('0');
    expect(result.state.upgrades.purchasedIds).toEqual([PRESSURE_WASHER.id]);
    expect(state.economy.cash).toBe('250000'); expect(state.upgrades.purchasedIds).toEqual([]);
    expect(purchaseUpgrade(state, PRESSURE_WASHER.id)).toEqual(result);
  });
  it.each(['unknown-upgrade', 'prerequisite-not-met', 'insufficient-funds', 'already-purchased'])('preserves original state on %s', error => {
    const state = error === 'prerequisite-not-met' ? createInitialGameState()
      : error === 'already-purchased' ? purchaseUpgrade(owned(), PRESSURE_WASHER.id).state : owned(1, '249999');
    const result = purchaseUpgrade(state, error === 'unknown-upgrade' ? 'upgrade:missing' : PRESSURE_WASHER.id);
    expect(result).toEqual({ ok: false, state, error }); expect(result.state).toBe(state);
  });
  it('deducts exact cents above Number precision', () => {
    const result = purchaseUpgrade(owned(1, '9007199254740993'), PRESSURE_WASHER.id);
    expect(result.state.economy.cash).toBe('9007199254490993');
  });
  it.each([1, 4, 7, 100])('evaluates scaled production centrally at level %s', level => {
    const state = owned(level, '250000');
    const before = evaluateBusinessProduction(state, id, level);
    expect(before.ok && before.effective).toEqual(rational(75n * BigInt(level)));
    const after = purchaseUpgrade(state, PRESSURE_WASHER.id).state;
    const rate = evaluateBusinessProduction(after, id, level);
    expect(rate.ok && rate.effective).toEqual(rational(375n * BigInt(level), 4n));
    expect(simulateElapsed(after, 4000).state.economy.cash).toBe(String(375 * level));
  });
  it('retains sub-milli-cents and has no loss over 3001 one-ms steps', () => {
    const start = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    const first = simulateElapsed(start, 1).state;
    expect(first.businesses.productionRemainderMilliCents).toBe(93);
    expect(first.businesses.productionRemainderSubMilliCents).toEqual(rational(3n, 4n));
    let split = start;
    for (let i = 0; i < 3001; i++) split = simulateElapsed(split, 1).state;
    expect(split).toEqual(simulateElapsed(start, 3001).state);
    expect(split.economy.cash).toBe('281');
    expect(split.businesses.productionRemainderMilliCents).toBe(343);
    expect(split.businesses.productionRemainderSubMilliCents).toEqual(rational(3n, 4n));
  });
  it('preserves both fractional parts through purchase and level change', () => {
    const initial = owned(1, '1000000');
    const fraction = { ...initial, businesses: { ...initial.businesses, productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n, 3n) } };
    const bought = purchaseUpgrade(fraction, PRESSURE_WASHER.id).state;
    const upgraded = upgradeBusiness(bought, id).state;
    expect(upgraded.businesses.productionRemainderMilliCents).toBe(975);
    expect(upgraded.businesses.productionRemainderSubMilliCents).toEqual(rational(1n, 3n));
    expect(simulateElapsed(upgraded, 1).state.businesses).toMatchObject({ productionRemainderMilliCents: 162, productionRemainderSubMilliCents: rational(5n, 6n) });
  });
  it('fails overflowing simulation atomically, retaining both fractional parts', () => {
    const bought = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    const state = { ...bought, economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } };
    expect(simulateElapsed(state, 1000)).toEqual({ ok: false, state, error: 'overflow' });
  });
  it('routes the unchanged $25 job through the central evaluator with scoped equipment', () => {
    const state = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    expect(evaluateJobReward(state)).toEqual({ ok: true, reward: '2500' });
    expect(performStarterJob(state).state.economy.cash).toBe('2500');
    expect(performStarterJob(createInitialGameState()).state.economy.cash).toBe('2500');
  });
});
