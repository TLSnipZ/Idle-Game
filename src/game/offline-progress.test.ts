import { describe, expect, it } from 'vitest';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_BUSINESS } from '../features/businesses';
import { createInitialGameState } from './game-state';
import { OFFLINE_CAP_MS, reconcileOffline } from './offline-progress';
import { simulateElapsed } from './simulate-elapsed';

const state = { ...createInitialGameState(), businesses: { productionRemainderSubMilliCents: { numerator: '0', denominator: '1' }, owned: { [STARTER_BUSINESS.id]: { level: 1 } }, productionRemainderMilliCents: 975 } };
describe('offline policy uses deterministic simulation', () => {
  it.each([0, 1, 13, 1000, OFFLINE_CAP_MS - 1, OFFLINE_CAP_MS, OFFLINE_CAP_MS + 1, Number.MAX_SAFE_INTEGER])('matches shared simulation with capped duration %s', elapsed => {
    const result = reconcileOffline(state, 0, elapsed);
    if (!result.ok) throw Error('fixture');
    expect(result.state).toEqual(simulateElapsed(state, Math.min(elapsed, OFFLINE_CAP_MS)).state);
    expect(result.progress.actualElapsedMs).toBe(elapsed);
    expect(result.progress.rewardedElapsedMs).toBe(Math.min(elapsed, OFFLINE_CAP_MS));
    expect(result.progress.capped).toBe(elapsed >= OFFLINE_CAP_MS);
  });
  it('reports exact income including saved fractions without mutating original', () => {
    const before = structuredClone(state);
    const result = reconcileOffline(state, 100, 101);
    expect(result.ok && result.progress.incomeEarned).toBe('1');
    expect(result.ok && result.state.businesses.productionRemainderMilliCents).toBe(50);
    expect(state).toEqual(before);
  });
  it('recognizes no-business absence without inventing income', () => {
    const initial = createInitialGameState();
    const result = reconcileOffline(initial, 0, 1000);
    expect(result.ok && result.state).toBe(initial);
    expect(result.ok && result.progress).toMatchObject({ incomeEarned: '0', actualElapsedMs: 1000 });
  });
  it('future timestamps yield zero with an anomaly flag', () => {
    const result = reconcileOffline(state, Number.MAX_SAFE_INTEGER, 0);
    expect(result.ok && result.state).toBe(state);
    expect(result.ok && result.progress).toEqual({ actualElapsedMs: 0, rewardedElapsedMs: 0, capped: false, clockAnomaly: true, incomeEarned: '0' });
  });
  it.each([-1, .5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '1', null])('rejects invalid clock endpoint %#', invalid => {
    expect(reconcileOffline(state, 0, invalid)).toEqual({ ok: false, state, error: 'invalid-timestamp' });
    expect(reconcileOffline(state, invalid, 1)).toEqual({ ok: false, state, error: 'invalid-timestamp' });
  });
  it('preserves whole state on overflow', () => {
    const maximum = { ...state, economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } };
    expect(reconcileOffline(maximum, 0, 1000)).toEqual({ ok: false, state: maximum, error: 'overflow' });
  });
  it('retains partition equivalence across offline boundaries', () => {
    const first = reconcileOffline(state, 10, 133);
    if (!first.ok) throw Error('fixture');
    const second = reconcileOffline(first.state, 133, 1010);
    expect(second.ok && second.state).toEqual(simulateElapsed(state, 1000).state);
  });
});
