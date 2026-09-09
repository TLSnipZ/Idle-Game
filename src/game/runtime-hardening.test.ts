import * as vehicles from '../features/vehicles';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { runtimeLoad } from './test-fixtures/runtime-load';
import { autoUpgraderState } from './test-fixtures/auto-upgrader-state';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { simulateOnlineElapsed } from './simulate-online-elapsed';
import { MAX_AUTO_UPGRADE_SEGMENTS } from './simulate-auto-upgrader';
import * as production from './simulate-elapsed';
import * as dispatch from './simulate-automation';
import { moneyFromMinorUnits } from '../features/economy';
import { decayHeat } from '../features/heat';
import { BUSINESS_AUTO_UPGRADER as A } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { reconcileOffline } from './offline-progress';

function simulate(state: GameState, ms: number) {
  const result = simulateGameElapsed(state, ms);
  if (!result.ok) throw Error(result.error);
  return result;
}
function freeze(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}
afterEach(() => vi.restoreAllMocks());

describe('Phase 9D bounded runtime and frozen pre-9D outputs', () => {
  it('zero elapsed bypasses production/Dispatcher evaluation and all historical observation', () => {
    const state = runtimeLoad(), before = structuredClone(state), random = { next: vi.fn(() => 0) };
    freeze(state);
    const business = vi.spyOn(production, 'simulateElapsed'), dispatcher = vi.spyOn(dispatch, 'planDispatcher');
    const result = simulateOnlineElapsed(state, 0, random);
    expect(result).toEqual({ ok: true, state, businessIncome: '0', automation: { completedJobs: 0, income: '0', xpEarned: 0 } });
    expect(result.state).toBe(state); expect(state).toEqual(before);
    expect(business).not.toHaveBeenCalled(); expect(dispatcher).not.toHaveBeenCalled(); expect(random.next).not.toHaveBeenCalled();
  });
  it.each([-1, NaN, Infinity, 0.5])('rejects invalid elapsed %s without RNG or mutation', ms => {
    const state = runtimeLoad(), random = { next: vi.fn(() => 0) }; freeze(state);
    expect(simulateOnlineElapsed(state, ms, random)).toEqual({ ok: false, state, error: 'invalid-elapsed' });
    expect(random.next).not.toHaveBeenCalled();
  });
  it.each([1, 1000, 60000, 3600000, 28800000, 36000000, 43200000])('light/normal workloads terminate at %i ms', ms => {
    const light = createInitialGameState(); expect(simulate(light, ms).state).toBe(light);
    const state = runtimeLoad(), normal = { ...state, automation: { ...state.automation, enabledIds: [] } };
    freeze(normal);
    const result = simulate(normal, ms);
    expect(result.automation.completedJobs).toBe(Math.floor((7000 + ms) / 10000));
    expect(result.state.automation.businessAutoUpgradeElapsedMs).toBe(20000);
    expect(result).toEqual(simulate(normal, ms));
  });
  it.each([
    { start: 25, cash: '0', level: 46, finalCash: '6792454', xp: 60427, levels: 21,
      income: '387283054', spent: '397425000', milli: 997, numerator: '5', denominator: '24' },
    { start: 95, cash: '1000000000', level: 100, finalCash: '1380373120', xp: 59995, levels: 5,
      income: '1069263720', spent: '705825000', milli: 43, numerator: '133', denominator: '192' },
  ])('12h exact pre-9D baseline from Dockside $start, including funding/max collapse', expected => {
    // Recorded from f3a8631. Keep its historical +15% vehicle solely for this oracle;
    // current KX-R +10% and chronology are covered by current production tests.
    const vehicle = vehicles.STARTER_VEHICLE;
    if (vehicle.modifier.operation !== 'multiply-basis-points') throw Error('fixture');
    vi.spyOn(vehicles, 'findVehicle').mockImplementation(id => id === vehicle.id
      ? { ...vehicle, modifier: { ...vehicle.modifier, operation: 'multiply-basis-points', bonusBasisPoints: 1500 } } : undefined);
    const state = runtimeLoad(expected.start, expected.cash); freeze(state);
    const calls = vi.spyOn(production, 'simulateElapsed');
    const result = simulate(state, 43200000);
    expect(result).toEqual({ ok: true,
      state: { ...state, economy: { cash: expected.finalCash }, progression: { xp: expected.xp },
        city: { ...state.city, heat: 0, heatDecayElapsedMs: 0 },
        businesses: { owned: { [B.id]: { level: expected.level } }, productionRemainderMilliCents: expected.milli,
          productionRemainderSubMilliCents: { numerator: expected.numerator, denominator: expected.denominator } },
        permanentProgression: { ...state.permanentProgression,
          statistics: { ...state.permanentProgression.statistics, automatedJobsCompleted: 4320, businessLevelsPurchased: expected.levels },
          unlockedAchievementIds: ['achievement:first-steps', 'achievement:dockside-operator', 'achievement:neon-takeover', 'achievement:crew-chief'] } },
      automation: { completedJobs: 4320, income: '16934400', xpEarned: 23760 }, businessIncome: expected.income,
      autoUpgrader: { levelsPurchased: expected.levels, spent: expected.spent } });
    expect(calls.mock.calls.length).toBeLessThanOrEqual(1441);
    expect(reconcileOffline(state, 1000, 43201000).state).toEqual(result.state);
  });
  it('max level collapses maximum-safe elapsed into one production segment', () => {
    const state = autoUpgraderState(100), calls = vi.spyOn(production, 'simulateElapsed');
    const result = simulate(state, Number.MAX_SAFE_INTEGER);
    expect(calls).toHaveBeenCalledTimes(1);
    expect(result.autoUpgrader).toEqual({ levelsPurchased: 0, spent: '0' });
    expect(result.state.progression).toEqual(state.progression);
    expect(result.state.permanentProgression.statistics).toEqual(state.permanentProgression.statistics);
    expect(result.state.automation).toEqual({ ...state.automation,
      businessAutoUpgradeElapsedMs: Number(BigInt(Number.MAX_SAFE_INTEGER) % 30000n) });
  });
  it('unusually large unaffordable direct input fails at a fixed work budget, without publishing partial purchases', () => {
    const state = autoUpgraderState(25, '0'), before = structuredClone(state), random = { next: vi.fn(() => 0) };
    const calls = vi.spyOn(production, 'simulateElapsed');
    expect(simulateOnlineElapsed(state, Number.MAX_SAFE_INTEGER, random)).toEqual({ ok: false, state, error: 'simulation-limit' });
    expect(calls).toHaveBeenCalledTimes(MAX_AUTO_UPGRADE_SEGMENTS);
    expect(state).toEqual(before); expect(random.next).not.toHaveBeenCalled();
  });
  it.each(['unowned', 'disabled'] as const)('%s uses one production segment for maximum-safe elapsed', mode => {
    const s = autoUpgraderState(), state = { ...s, automation: { ...s.automation, enabledIds: [],
      unlockedIds: mode === 'unowned' ? [] : [A.id], businessAutoUpgradeElapsedMs: mode === 'unowned' ? 0 : 20000 } };
    const calls = vi.spyOn(production, 'simulateElapsed'), result = simulate(state, Number.MAX_SAFE_INTEGER);
    expect(calls).toHaveBeenCalledTimes(1); expect(result.autoUpgrader).toBeUndefined();
    expect(result.state.automation).toEqual(state.automation);
  });
  it('Dispatcher XP/Heat floor belongs to the outer batch despite internal purchase boundaries', () => {
    const s = runtimeLoad(), state = { ...s, city: { ...s.city, heat: 55, heatDecayElapsedMs: 0 } };
    const result = simulate(state, 103000), disabled = simulate({ ...state, automation: { ...state.automation, enabledIds: [] } }, 103000);
    expect(result.automation).toEqual({ completedJobs: 11, income: '47916', xpEarned: 60 });
    expect(result.automation).toEqual(disabled.automation);
    expect(result.state.city).toEqual({ ...state.city, heat: 55, heatDecayElapsedMs: 13000 });
    expect(result.state.permanentProgression.statistics.automatedJobsCompleted).toBe(11);
  });
  it.each([
    { elapsed: 1, pending: false, roll: 0, calls: 0 },
    { elapsed: 2100000, pending: false, roll: 0.99, calls: 1 },
    { elapsed: 2100000, pending: false, roll: 0, calls: 2 },
    { elapsed: 2100000, pending: true, roll: 0, calls: 0 },
  ])('outer Event contract $calls RNG calls (pending=$pending)', ({ elapsed, pending, roll, calls }) => {
    const s = runtimeLoad(), state: GameState = { ...s, events: { opportunityElapsedMs: 123,
      pendingEventId: pending ? 'event:shakedown' : null } };
    const random = { next: vi.fn(() => roll) }, result = simulateOnlineElapsed(state, elapsed, random);
    expect(result.ok).toBe(true); expect(random.next).toHaveBeenCalledTimes(calls);
    expect(result.state.events.opportunityElapsedMs).toBe(pending ? 123 : (elapsed + 123) % 600000);
    if (pending) expect(result.state.events).toEqual(state.events);
    expect(result.state.economy).toEqual(simulate(state, elapsed).state.economy);
  });
  it('no eligible event consumes zero draws, preserving the shipped contract', () => {
    const random = { next: vi.fn(() => 0) };
    expect(simulateOnlineElapsed(createInitialGameState(), 2100000, random).state.events)
      .toEqual({ pendingEventId: null, opportunityElapsedMs: 300000 });
    expect(random.next).not.toHaveBeenCalled();
  });
  it.each([45000, 60000])('Heat uses exact mathematical decay at %i ms, including inherited remainder', interval => {
    expect(decayHeat({ heat: 79, heatDecayElapsedMs: 50000 }, 3600000, interval))
      .toEqual(interval === 45000 ? { heat: 0, heatDecayElapsedMs: 0 } : { heat: 19, heatDecayElapsedMs: 50000 });
    expect(decayHeat({ heat: 0, heatDecayElapsedMs: 0 }, Number.MAX_SAFE_INTEGER, interval)).toEqual({ heat: 0, heatDecayElapsedMs: 0 });
    expect(decayHeat({ heat: 2, heatDecayElapsedMs: 59999 }, 1, interval))
      .toEqual({ heat: 1, heatDecayElapsedMs: interval === 45000 ? 15000 : 0 });
  });
  it('fractional production is exactly associative without intentional Dispatcher/Event batch boundaries', () => {
    const state = runtimeLoad(); freeze(state);
    const first = production.simulateElapsed(state, 1234567);
    expect(production.simulateElapsed(first.state, 43210987)).toEqual(production.simulateElapsed(state, 44445554));
  });
  it.each(['cash', 'xp', 'statistics'] as const)('%s overflow preserves the entire frozen outer input', kind => {
    const s = runtimeLoad(), state = { ...s,
      ...(kind === 'cash' ? { economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } } : {}),
      ...(kind === 'xp' ? { progression: { xp: Number.MAX_SAFE_INTEGER - 1 } } : {}),
      ...(kind === 'statistics' ? { permanentProgression: { ...s.permanentProgression,
        statistics: { ...s.permanentProgression.statistics, automatedJobsCompleted: Number.MAX_SAFE_INTEGER } } } : {}) };
    freeze(state); const result = simulateGameElapsed(state, 43200000);
    expect(result).toEqual({ ok: false, state, error: kind === 'cash' ? 'overflow' : kind === 'xp' ? 'xp-overflow' : 'statistics-overflow' });
    expect(result.state).toBe(state);
  });
});
