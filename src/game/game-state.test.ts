import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { performStarterJob } from './perform-starter-job';
import { selectCash } from './selectors';
import { STARTER_JOB, MAX_MONEY_DIGITS, moneyFromMinorUnits } from '../features/economy';

describe('game state and starter delivery', () => {
  it('creates only the implemented authoritative slices', () => {
    const state = createInitialGameState();
    expect(state).toEqual({ events: { opportunityElapsedMs: 0, pendingEventId: null }, crew: { recruitedIds: [], assignments: { operations: null, logistics: null } }, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: ['territory:waterfront'] }, permanentProgression: { statistics: createInitialStatistics(0), unlockedAchievementIds: [], skills: {}, empirePoints: 0, rebirthCount: 0 }, garage: { ownedVehicleIds: [] }, progression: { xp: 0 }, automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 }, upgrades: { purchasedIds: [] }, economy: { cash: '0' }, businesses: { productionRemainderSubMilliCents: { numerator: '0', denominator: '1' }, owned: {}, productionRemainderMilliCents: 0 } });
    expect(selectCash(state)).toBe('0');
    expect(createInitialGameState().economy).not.toBe(state.economy);
  });

  it('runs the configured action through immutable deterministic transitions', () => {
    const state = createInitialGameState();
    Object.freeze(state.economy);
    Object.freeze(state);
    const result = performStarterJob(state);
    expect(result.ok).toBe(true);
    expect(selectCash(result.state)).toBe(STARTER_JOB.reward);
    expect(result).toEqual(performStarterJob(state));
    expect(selectCash(state)).toBe('0');
    expect(result.state).not.toBe(state);
    expect(result.state.economy).not.toBe(state.economy);
    const next = performStarterJob(result.state);
    expect(next.ok).toBe(true);
    expect(selectCash(next.state)).toBe('5000');
  });

  it('preserves the entire game state when the reward would overflow', () => {
    const state = Object.freeze({ ...createInitialGameState(), economy: Object.freeze({ cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) }) });
    const result = performStarterJob(state);
    expect(result).toEqual({ ok: false, state, error: 'overflow' });
    expect(result.state).toBe(state);
  });

  it('serializes losslessly as plain JSON even for huge balances', () => {
    const state = { ...createInitialGameState(), economy: { cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) } };
    const parsed: unknown = JSON.parse(JSON.stringify(state));
    expect(parsed).toEqual(state);
    // This proves representability, not a save/load or validation implementation.
  });
});
