import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { simulateElapsed } from './simulate-elapsed';
import { purchaseBusiness } from './purchase-business';
import { performStarterJob } from './perform-starter-job';
import { STARTER_BUSINESS, getOwnedProductionInputs } from '../features/businesses';
import { earnCash, isMoney, MAX_MONEY_DIGITS } from '../features/economy';

function owned(): GameState {
  const state = createInitialGameState();
  const funding = earnCash(state.economy, STARTER_BUSINESS.purchaseCost);
  if (!funding.ok) throw new Error('Invalid fixture funding');
  const result = purchaseBusiness({ ...state, economy: funding.state }, STARTER_BUSINESS.id);
  if (!result.ok) throw new Error('Invalid fixture purchase');
  return result.state;
}

function simulate(state: GameState, ms: number): GameState {
  const result = simulateElapsed(state, ms);
  expect(result.ok).toBe(true);
  return result.state;
}

function freeze(state: GameState): GameState {
  Object.freeze(state.economy);
  Object.freeze(state.businesses.owned);
  Object.freeze(state.businesses);
  return Object.freeze(state);
}

describe('elapsed production simulation', () => {
  it('starts without fractional accrual and derives only owned rates', () => {
    const state = createInitialGameState();
    expect(state.businesses.productionRemainderMilliCents).toBe(0);
    expect(getOwnedProductionInputs(state.businesses)).toEqual([]);
    expect(getOwnedProductionInputs(owned().businesses)).toEqual([{ businessId: STARTER_BUSINESS.id, base: STARTER_BUSINESS.baseProductionCentsPerSecond }]);
    expect(isMoney(STARTER_BUSINESS.baseProductionCentsPerSecond)).toBe(true);
    expect(STARTER_BUSINESS.baseProductionCentsPerSecond).toBe('75');
  });

  it('produces no money before ownership, including large elapsed time', () => {
    const state = freeze(createInitialGameState());
    expect(simulate(state, Number.MAX_SAFE_INTEGER)).toBe(state);
  });

  it('zero elapsed is an identity no-op even with a fractional remainder', () => {
    const state = freeze(simulate(owned(), 1));
    expect(simulate(state, 0)).toBe(state);
    expect(simulate(state, -0)).toBe(state);
  });

  it.each([-1, -1000, NaN, Infinity, -Infinity, 0.5, 1.1,
    Number.MAX_SAFE_INTEGER + 1, '1000', null, undefined, 1000n, {}, []])(
    'rejects invalid elapsed %s without changing any state', value => {
      const state = freeze(owned());
      const result = simulateElapsed(state, value);
      expect(result).toEqual({ ok: false, state, error: 'invalid-elapsed' });
      expect(result.state).toBe(state);
    },
  );

  it('produces exact full seconds and pays back the purchase in 200 seconds', () => {
    expect(simulate(owned(), 1000).economy.cash).toBe('75');
    expect(simulate(owned(), 200000).economy.cash).toBe(STARTER_BUSINESS.purchaseCost);
  });

  it('carries sub-cent earnings until they become whole cents', () => {
    let state = simulate(owned(), 1);
    expect(state.economy.cash).toBe('0');
    expect(state.businesses.productionRemainderMilliCents).toBe(75);
    state = simulate(state, 12);
    expect(state.economy.cash).toBe('0');
    expect(state.businesses.productionRemainderMilliCents).toBe(975);
    state = simulate(state, 1);
    expect(state.economy.cash).toBe('1');
    expect(state.businesses.productionRemainderMilliCents).toBe(50);
  });

  it.each([[100, 900], [500, 500], Array.from({ length: 10 }, () => 100),
    Array.from({ length: 1000 }, () => 1), [1, 12, 127, 3, 857]])(
    'matches one full second for the partition %s', (...intervals: number[]) => {
      const state = owned();
      const split = intervals.reduce(simulate, state);
      expect(split).toEqual(simulate(state, 1000));
    },
  );

  it('arbitrary split intervals preserve both cash and remainder', () => {
    const state = simulate(owned(), 7);
    const intervals = [17, 299, 1, 1234567, 4567, 8];
    expect(intervals.reduce(simulate, state))
      .toEqual(simulate(state, intervals.reduce((sum, ms) => sum + ms, 0)));
  });

  it('many sequential calls retain every fractional unit', () => {
    const state = owned();
    let result = state;
    for (let i = 0; i < 333; i++) result = simulate(result, 7);
    expect(result).toEqual(simulate(state, 2331));
    expect(result.economy.cash).toBe('174');
    expect(result.businesses.productionRemainderMilliCents).toBe(825);
  });

  it('is deterministic and does not mutate deep-frozen input', () => {
    const state = freeze(owned());
    const before = JSON.stringify(state);
    expect(simulateElapsed(state, 123)).toEqual(simulateElapsed(state, 123));
    const result = simulate(state, 123);
    expect(result).not.toBe(state);
    expect(result.businesses.owned).toBe(state.businesses.owned);
    expect(JSON.stringify(state)).toBe(before);
    const decoded: unknown = JSON.parse(JSON.stringify(result));
    expect(decoded).toEqual(result);
  });

  it('preserves fractional production through active earning', () => {
    const state = simulate(owned(), 1);
    const earned = performStarterJob(state);
    expect(earned.ok).toBe(true);
    expect(earned.state.businesses).toBe(state.businesses);
    expect(simulate(earned.state, 999).economy.cash).toBe('2575');
  });

  it('never credits time before acquisition retroactively', () => {
    const state = simulate(createInitialGameState(), 200000);
    const funded = earnCash(state.economy, STARTER_BUSINESS.purchaseCost);
    const bought = purchaseBusiness({ ...state, economy: funded.state }, STARTER_BUSINESS.id);
    expect(bought.ok).toBe(true);
    expect(simulate(bought.state, 1000).economy.cash).toBe('75');
  });

  it('credits large balances without losing cents', () => {
    const state = owned();
    const funded = earnCash(state.economy, '9007199254740993');
    expect(simulate({ ...state, economy: funded.state }, 1000).economy.cash).toBe('9007199254741068');
  });

  it('rolls back both cash and remainder when the credit would overflow', () => {
    const state = owned();
    const funded = earnCash(state.economy, '9'.repeat(MAX_MONEY_DIGITS));
    const full = freeze({ ...state, economy: funded.state,
      businesses: { ...state.businesses, productionRemainderMilliCents: 975 } });
    const before = JSON.stringify(full);
    const result = simulateElapsed(full, 1);
    expect(result).toEqual({ ok: false, state: full, error: 'overflow' });
    expect(result.state).toBe(full);
    expect(JSON.stringify(full)).toBe(before);
  });

  it('handles the maximum exact elapsed value without per-tick iteration', () => {
    const result = simulate(owned(), Number.MAX_SAFE_INTEGER);
    expect(result.economy.cash).toBe('675539944105574');
    expect(result.businesses.productionRemainderMilliCents).toBe(325);
  });

  it.each([-1, 1000, 0.1, NaN, Infinity])('fails loudly on corrupt remainder %s without mutation', value => {
    const initial = owned();
    const state = freeze({ ...initial, businesses: { ...initial.businesses, productionRemainderMilliCents: value } });
    expect(() => simulateElapsed(state, 1)).toThrow(RangeError);
    expect(() => simulateElapsed(state, 0)).toThrow(RangeError);
    expect(state.businesses.productionRemainderMilliCents).toBe(value);
  });

  it('rejects unknown IDs and invalid levels before applying any income', () => {
    for (const entries of [{ 'business:missing': { level: 1 } }, { [STARTER_BUSINESS.id]: { level: 0 } }]) {
      const state = owned();
      // Simulate corrupted external data without lying to TypeScript about its validity.
      Object.defineProperty(state.businesses, 'owned', { value: entries });
      freeze(state);
      const before = JSON.stringify(state);
      expect(() => simulateElapsed(state, 1000)).toThrow(RangeError);
      expect(JSON.stringify(state)).toBe(before);
    }
  });

  it('rejects malformed cash, ownership records and missing remainder even at zero elapsed', () => {
    for (const field of ['cash', 'owned', 'productionRemainderMilliCents']) {
      const state = owned();
      Object.defineProperty(field === 'cash' ? state.economy : state.businesses, field, { value: undefined });
      freeze(state);
      expect(() => simulateElapsed(state, 0)).toThrow(RangeError);
    }
  });
});
