import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { WATERFRONT as W, NEON_MILE as N, getActiveDistrictId, getDistrictHeat, switchCityDistrict, coolDistricts } from '../features/territories';
import { setActiveDistrict } from './set-active-district';
import { performStarterJob, performRiskyDelivery, performDiscreetDelivery } from './perform-starter-job';
import { evaluateJobReward } from './effective-stats';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline } from './offline-progress';
import { layLow } from './lay-low';
import { moneyFromMinorUnits } from '../features/economy';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { resolveEventChoice } from './resolve-event-choice';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { readyManualJobFixture } from './test-fixtures/manual-job-ready';
import { autoUpgraderState } from './test-fixtures/auto-upgrader-state';

function owned(heat = 80, remainder = 0): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('100000') },
    city: { ...s.city, ownedTerritoryIds: [W.id, N.id], heat, heatDecayElapsedMs: remainder } };
}
function away(heat = 80, remainder = 0) {
  const s = owned(heat, remainder);
  return { ...s, city: switchCityDistrict(s.city, N.id) };
}
describe('District Heat ownership and travel', () => {
  it('swaps exact Heat and remainders without money, XP or lifetime changes', () => {
    const state = owned(79, 23456), before = JSON.stringify(state);
    const selected = setActiveDistrict(state, N.id);
    expect(selected.ok).toBe(true);
    expect(selected.state.city).toMatchObject({ heat: 0, heatDecayElapsedMs: 0,
      districts: { activeId: N.id, parked: { heat: 79, heatDecayElapsedMs: 23456 } } });
    expect(setActiveDistrict(selected.state, N.id).state).toBe(selected.state);
    const back = setActiveDistrict(selected.state, W.id);
    expect(getDistrictHeat(back.state.city, W.id)).toMatchObject({ heat: 79, heatDecayElapsedMs: 23456 });
    expect(getDistrictHeat(back.state.city, N.id)).toEqual({ heat: 0, heatDecayElapsedMs: 0 });
    expect(back.state.economy).toBe(state.economy);
    expect(back.state.permanentProgression).toBe(state.permanentProgression);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('rejects unowned, unknown and event-locked destinations without mutation', () => {
    const s = createInitialGameState();
    expect(setActiveDistrict(s, N.id)).toEqual({ ok: false, state: s, error: 'district-not-owned' });
    expect(setActiveDistrict(s, 'district:fake')).toEqual({ ok: false, state: s, error: 'unknown-territory' });
    const base = owned(), pending: GameState = { ...base, events: { pendingEventId: 'event:hot-tip', opportunityElapsedMs: 0 } };
    expect(setActiveDistrict(pending, N.id)).toEqual({ ok: false, state: pending, error: 'district-event-pending' });
    expect(setActiveDistrict(pending, W.id).state).toBe(pending);
  });
  it('local actions use the selected district and preserve parked Heat', () => {
    const s = away();
    expect(performRiskyDelivery(s)).toMatchObject({ ok: true, moneyEarned: '4125' });
    const risky = performRiskyDelivery(s).state;
    expect(risky.city.heat).toBe(5);
    expect(getDistrictHeat(risky.city, W.id).heat).toBe(80);
    expect(performDiscreetDelivery(risky)).toMatchObject({ ok: false, error: 'manual-job-not-ready' });
    const quiet = performDiscreetDelivery(readyManualJobFixture(risky)).state;
    expect(quiet.city.heat).toBe(3);
    const low = layLow(quiet).state;
    expect(low.city.heat).toBe(0); expect(getDistrictHeat(low.city, W.id).heat).toBe(80);
    expect(performStarterJob(s)).toMatchObject({ ok: true, moneyEarned: '2750' });
    expect(evaluateJobReward(s, 'dispatcher')).toMatchObject({ ok: true, reward: '2062' });
  });
  it('event effects stay local, and successful resolution reopens travel', () => {
    const s = away();
    const pending: GameState = { ...s, events: { pendingEventId: 'event:hot-tip', opportunityElapsedMs: 0 } };
    const result = resolveEventChoice(pending, 'event:hot-tip', 'choice:take-tip');
    expect(result.ok).toBe(true); expect(result.state.city.heat).toBe(5);
    expect(getDistrictHeat(result.state.city, W.id).heat).toBe(80);
    expect(setActiveDistrict(result.state, W.id).ok).toBe(true);
  });
});
describe('District Heat elapsed integration', () => {
  it.each([60000, 57000, 45000, 42000])('cools both districts with the same %i ms modifier interval', interval => {
    const s = away(80, 1000);
    const city = { ...s.city, heat: 20, heatDecayElapsedMs: 2000 };
    const next = coolDistricts(city, interval, interval);
    expect(next).toMatchObject({ heat: 19, heatDecayElapsedMs: 2000 });
    expect(getDistrictHeat(next, W.id)).toEqual({ heat: 79, heatDecayElapsedMs: 1000 });
    expect(coolDistricts(city, 0, interval)).toBe(city);
    expect(coolDistricts(coolDistricts(city, 1234, interval), interval - 1234, interval)).toEqual(next);
  });
  it('the Dispatcher earns and gains Heat at Waterfront even while away', () => {
    const s = away(), state = { ...s, automation: { ...s.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
    const result = simulateGameElapsed(state, 50000);
    expect(result).toMatchObject({ ok: true, automation: { income: '10310', completedJobs: 5 } });
    expect(result.state.city.heat).toBe(0);
    expect(getDistrictHeat(result.state.city, W.id)).toEqual({ heat: 81, heatDecayElapsedMs: 50000 });
    expect(result.state.permanentProgression.statistics.peakHeat).toBe(81);
    expect(result.state.permanentProgression.unlockedAchievementIds).toContain('achievement:running-hot');
  });
  it('online and capped offline use identical two-district cooling and dispatcher batches', () => {
    const s = away(80, 12345), state = { ...s, city: { ...s.city, heat: 50, heatDecayElapsedMs: 23456 },
      automation: { ...s.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
    for (const ms of [59999, 60000, 90000, 8 * 3600000]) {
      expect(reconcileOffline(state, 1000, 1000 + ms).state).toEqual(simulateGameElapsed(state, ms).state);
    }
    expect(reconcileOffline(state, 1000, 1000 + 9 * 3600000).state).toEqual(simulateGameElapsed(state, 8 * 3600000).state);
  });
  it('enabled Auto-Upgrader uses the same district cooling and Waterfront dispatcher basis', () => {
    const base = autoUpgraderState(), s = away();
    const state = { ...base, city: { ...s.city, heat: 20 },
      automation: { ...base.automation, unlockedIds: [...base.automation.unlockedIds, DELIVERY_DISPATCHER.id] } };
    const result = simulateGameElapsed(state, 60000);
    expect(result.ok).toBe(true);
    expect(result.state.city.heat).toBe(19);
    expect(getDistrictHeat(result.state.city, W.id).heat).toBe(80);
  });
  it('Rebirth returns to Waterfront and clears both districts', () => {
    const base = rebirthState(), s = away();
    const result = performRebirth({ ...base, city: { ...s.city, heat: 30 } });
    expect(result.ok).toBe(true);
    expect(result.state.city).toEqual(createInitialGameState().city);
    expect(getActiveDistrictId(result.state.city)).toBe(W.id);
    expect(getDistrictHeat(result.state.city, N.id).heat).toBe(0);
  });
});
