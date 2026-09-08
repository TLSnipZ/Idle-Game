import { describe, expect, it } from 'vitest';
import { STARTER_BUSINESS as business, MAX_BUSINESS_LEVEL, getLevelProduction, getUpgradeCost } from '../features/businesses';
import { moneyFromMinorUnits, multiplyMoney } from '../features/economy';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { upgradeBusiness } from './upgrade-business';
import { purchaseBusiness } from './purchase-business';
import { simulateElapsed } from './simulate-elapsed';
import { selectBusinessProgress } from './selectors';

function owned(level = 1, cash = '999999999999999999999', remainder = 975): GameState {
  return { economy: { cash: moneyFromMinorUnits(cash) }, businesses: { owned: { [business.id]: { level } }, productionRemainderMilliCents: remainder } };
}
describe('exact business progression', () => {
  it('purchases level 1 for unchanged cost', () => {
    const state = { ...createInitialGameState(), economy: { cash: moneyFromMinorUnits('15000') } };
    const result = purchaseBusiness(state, business.id);
    expect(result.ok).toBe(true);
    expect(result.state.businesses.owned[business.id]?.level).toBe(1);
    expect(result.state.economy.cash).toBe('0');
    expect(purchaseBusiness(result.state, business.id)).toMatchObject({ ok: false, error: 'already-owned' });
  });
  it.each([[1, '15000'], [2, '60000'], [3, '135000'], [10, '1500000'], [99, '147015000']])('exact cost at %s', (level, cost) => {
    expect(getUpgradeCost(business, Number(level))).toBe(cost);
  });
  it('cost increases strictly through all purchasable levels; none beyond maximum', () => {
    let previous = 0n;
    for (let level = 1; level < MAX_BUSINESS_LEVEL; level++) {
      const cost = getUpgradeCost(business, level); if (cost === null) throw Error('cost');
      expect(BigInt(cost) > previous).toBe(true); previous = BigInt(cost);
    }
    expect(getUpgradeCost(business, MAX_BUSINESS_LEVEL)).toBeNull();
    const maximum = owned(MAX_BUSINESS_LEVEL);
    expect(upgradeBusiness(maximum, business.id)).toEqual({ ok: false, state: maximum, error: 'max-level-reached' });
  });
  it('repeated upgrades increment exactly once and preserve fractions and original state', () => {
    const original = owned(); let state = original;
    Object.freeze(original.businesses.owned[business.id]); Object.freeze(original.businesses.owned);
    for (let level = 2; level <= MAX_BUSINESS_LEVEL; level++) {
      const result = upgradeBusiness(state, business.id); expect(result.ok).toBe(true); state = result.state;
      expect(state.businesses.owned[business.id]?.level).toBe(level);
      expect(state.businesses.productionRemainderMilliCents).toBe(975);
    }
    expect(original.businesses.owned[business.id]?.level).toBe(1);
  });
  it.each([0, -1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 101])('rejects corrupt level %s atomically', level => {
    const state = owned(level);
    expect(upgradeBusiness(state, business.id)).toEqual({ ok: false, state, error: 'invalid-level' });
  });
  it('rejects unknown/unowned and insufficient funds with original state identity', () => {
    const initial = createInitialGameState();
    expect(upgradeBusiness(initial, 'business:missing')).toEqual({ ok: false, state: initial, error: 'unknown-business' });
    expect(upgradeBusiness(initial, business.id)).toEqual({ ok: false, state: initial, error: 'not-owned' });
    const poor = owned(1, '14999'); const result = upgradeBusiness(poor, business.id);
    expect(result).toEqual({ ok: false, state: poor, error: 'insufficient-funds' }); expect(result.state).toBe(poor);
  });
  it('spends exactly above Number precision and exposes derived selectors', () => {
    const result = upgradeBusiness(owned(1, '9007199254740993'), business.id);
    expect(result.state.economy.cash).toBe('9007199254725993');
    expect(selectBusinessProgress(result.state, business.id)).toMatchObject({ level: 2, production: '150', nextProduction: '225', upgradeCost: '60000', canUpgrade: true });
  });
  it.each([[1, '75'], [2, '150'], [7, '525'], [100, '7500']])('production is linear at level %s', (level, rate) => {
    expect(getLevelProduction(business, Number(level))).toBe(rate);
    const state = owned(Number(level), '0', 0);
    expect(simulateElapsed(state, 1000).state.economy.cash).toBe(rate);
    let split = state; for (let i = 0; i < 10; i++) split = simulateElapsed(split, 100).state;
    expect(split).toEqual(simulateElapsed(state, 1000).state);
  });
  it('uses unchanged Money overflow policy for integer scaling', () => {
    expect(multiplyMoney(moneyFromMinorUnits('9'.repeat(100)), 100)).toEqual({ ok: false, error: 'overflow' });
  });
});
