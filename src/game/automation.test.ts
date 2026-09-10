import { unlockEligibleAchievements } from './achievements';
import { describe, expect, it } from 'vitest';
import { DELIVERY_DISPATCHER as D, createInitialAutomationState, isAutomationState } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import { EXPRESS_TIPS, STREET_CONNECTIONS } from '../features/upgrades';
import { isMoney, moneyFromMinorUnits } from '../features/economy';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { purchaseAutomation } from './purchase-automation';
import { performStarterJob } from './perform-starter-job';
import { simulateAutomation } from './simulate-automation';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { simulateElapsed } from './simulate-elapsed';
import { reconcileOffline, OFFLINE_CAP_MS } from './offline-progress';
import { rational } from '../shared/rational';
function owned(): GameState {
  const state = createInitialGameState();
  return { ...state, progression: { xp: 400 }, economy: { cash: moneyFromMinorUnits('500000') },
    businesses: { ...state.businesses, owned: { [STARTER_BUSINESS.id]: { level: 4 } },
      productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n, 3n) } };
}
function unlocked(progress = 0): GameState {
  const state = purchaseAutomation(owned(), D.id).state;
  return { ...state, automation: { ...state.automation, starterJobElapsedMs: progress } };
}
describe('Delivery Dispatcher purchase', () => {
  it('pins the sole delegation identity, prerequisite, exact cost and interval', () => {
    expect(D).toMatchObject({ id: 'automation:delivery-dispatcher', name: 'Delivery Dispatcher', purchaseCost: '500000', intervalMs: 10000, requirements: [{ type: 'business-owned', businessId: STARTER_BUSINESS.id }, { type: 'player-level', minimumLevel: 3 }] });
    expect(isMoney(D.purchaseCost)).toBe(true);
    expect(createInitialAutomationState()).toEqual({ businessAutoUpgradeTargetId: 'business:dockside-detail', enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 });
  });
  it('spends exactly, starts at zero and retains original nested state immutably', () => {
    const state = owned(); Object.freeze(state); Object.freeze(state.automation); Object.freeze(state.automation.unlockedIds);
    const result = purchaseAutomation(state, D.id);
    expect(result).toMatchObject({ ok: true, state: { economy: { cash: '0' }, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const, enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 0 } } });
    expect(result.state.businesses).toBe(state.businesses); expect(result.state.upgrades).toBe(state.upgrades);
    expect(state.economy.cash).toBe('500000'); expect(state.automation.unlockedIds).toEqual([]);
  });
  it.each(['unknown-automation', 'already-unlocked', 'insufficient-funds', 'prerequisite-not-met'])('preserves full state on %s', error => {
    const state = error === 'already-unlocked' ? unlocked(1234) : error === 'prerequisite-not-met' ? createInitialGameState()
      : error === 'insufficient-funds' ? { ...owned(), economy: { cash: moneyFromMinorUnits('499999') } } : owned();
    const result = purchaseAutomation(state, error === 'unknown-automation' ? 'automation:missing' : D.id);
    expect(result).toMatchObject({ ok: false, state, error }); expect(result.state).toBe(state);
  });
});
describe('deterministic batch automation', () => {
  it.each([[0,0,0],[9999,0,9999],[10000,1,0],[10001,1,1],[25000,2,5000]])('simulates %i ms', (ms, jobs, progress) => {
    const state = unlocked(); const result = simulateAutomation(state, ms);
    expect(result).toMatchObject({ ok: true, automation: { completedJobs: jobs, income: String(jobs * 2500) }, state: { automation: { starterJobElapsedMs: progress }, economy: { cash: String(jobs * 2500) } } });
    if (ms === 0) expect(result.state).toBe(state);
    expect(state.automation.starterJobElapsedMs).toBe(0); expect(state.economy.cash).toBe('0');
  });
  it('locked automation ignores elapsed time completely', () => {
    const state = owned(); expect(simulateAutomation(state, Number.MAX_SAFE_INTEGER)).toMatchObject({ ok: true, state, automation: { completedJobs: 0, income: '0' } });
    expect(simulateGameElapsed(state, 25000).state).toEqual(unlockEligibleAchievements(simulateElapsed(state, 25000).state).state);
  });
  it('retains progress across arbitrary partitions and both business fractions', () => {
    const state = unlocked(5000);
    const parts = [9999, 1, 10001, 4999]; let split = state;
    for (const ms of parts) split = simulateGameElapsed(split, ms).state;
    expect(split).toEqual(simulateGameElapsed(state, 25000).state);
    expect(split.automation.starterJobElapsedMs).toBe(0);
    expect(split.businesses).toEqual(simulateElapsed(state, 25000).state.businesses);
  });
  it.each([[[], '2500'], [[STREET_CONNECTIONS.id], '3000'], [[EXPRESS_TIPS.id], '3000'], [[STREET_CONNECTIONS.id, EXPRESS_TIPS.id], '3600']] as const)('uses the manual central reward for modifier combination %#', (ids, reward) => {
    const state = { ...unlocked(), upgrades: { purchasedIds: [...ids] } };
    const manual = performStarterJob(state);
    expect(manual.state.economy.cash).toBe(reward); expect(manual.state.automation).toBe(state.automation);
    expect(simulateAutomation(state, 10000).state.economy).toEqual(manual.state.economy);
    expect(simulateAutomation(state, 30000).state.economy.cash).toBe(String(BigInt(reward) * 3n));
  });
  it('handles maximum safe elapsed plus progress with exact BigInt division', () => {
    const result = simulateAutomation(unlocked(9999), Number.MAX_SAFE_INTEGER);
    const total = BigInt(Number.MAX_SAFE_INTEGER) + 9999n;
    expect(result).toMatchObject({ ok: true, automation: { completedJobs: Number(total / 10000n) }, state: {
      economy: { cash: String(total / 10000n * 2500n) }, automation: { starterJobElapsedMs: Number(total % 10000n) } } });
  });
  it.each([-1, .1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1000', null])('rejects invalid elapsed %# atomically', ms => {
    const state = unlocked(); expect(simulateGameElapsed(state, ms)).toEqual({ ok: false, state, error: 'invalid-elapsed' });
  });
  it('rolls back business income and both fractions if automation would overflow', () => {
    const state = { ...unlocked(9999), economy: { cash: moneyFromMinorUnits(String(BigInt('9'.repeat(100)) - 1n)) } };
    expect(simulateElapsed(state, 1).ok).toBe(true);
    const result = simulateGameElapsed(state, 1);
    expect(result).toEqual({ ok: false, state, error: 'overflow' }); expect(result.state).toBe(state);
  });
  it('rejects corrupt authoritative progress even at zero time', () => {
    const state = unlocked();
    expect(() => simulateGameElapsed({ ...state, automation: { ...state.automation, starterJobElapsedMs: 10000 } }, 0)).toThrow(RangeError);
    expect(isAutomationState({ unlockedIds: new Array(1), starterJobElapsedMs: 0 })).toBe(false);
  });
  it('manual jobs preserve an in-progress cycle', () => {
    const state = unlocked(4321); expect(performStarterJob(state).state.automation).toBe(state.automation);
  });
});
describe('shared offline window', () => {
  it('combines saved five seconds and 25 seconds away into three $36 jobs', () => {
    const state = { ...unlocked(5000), upgrades: { purchasedIds: [STREET_CONNECTIONS.id, EXPRESS_TIPS.id] } };
    const result = reconcileOffline(state, 1000, 26000);
    expect(result).toMatchObject({ ok: true, progress: { automation: { completedJobs: 3, income: '10800' }, businessIncome: '7500', incomeEarned: '18300' }, state: { automation: { starterJobElapsedMs: 0 } } });
    expect(result.state).toEqual(simulateGameElapsed(state, 25000).state);
  });
  it.each([0, 1, OFFLINE_CAP_MS - 1, OFFLINE_CAP_MS, OFFLINE_CAP_MS + 1234, 12 * 3600000, Number.MAX_SAFE_INTEGER])('uses the same capped interval for both systems %#', elapsed => {
    const state = unlocked(5000); const result = reconcileOffline(state, 0, elapsed);
    expect(result.state).toEqual(unlockEligibleAchievements(simulateGameElapsed(state, Math.min(elapsed, OFFLINE_CAP_MS)).state).state);
    if (elapsed >= OFFLINE_CAP_MS) {
      expect(result.state.automation.starterJobElapsedMs).toBe(5000);
      expect(result.ok && result.progress.automation?.completedJobs).toBe(2880);
    }
  });
  it('future timestamps award no jobs or progress', () => {
    const state = unlocked(9999); const result = reconcileOffline(state, 2000, 1000);
    expect(result.state).toEqual(unlockEligibleAchievements(state).state); expect(result).toMatchObject({ ok: true, progress: { clockAnomaly: true, automation: { completedJobs: 0, income: '0' } } });
  });
});
