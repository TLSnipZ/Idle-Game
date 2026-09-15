import { describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { getManhunt, DECOY_COST } from '../features/heat';
import { deployDecoy, selectDecoy } from './deploy-decoy';
import { setActiveDistrict } from './set-active-district';
import { WATERFRONT as W, NEON_MILE as N, switchCityDistrict, getDistrictHeat } from '../features/territories';
import { moneyFromMinorUnits } from '../features/economy';
import { performStarterJob, performDiscreetDelivery } from './perform-starter-job';
import { layLow } from './lay-low';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline } from './offline-progress';
import { serializeSave, parseSave, CURRENT_SAVE_VERSION } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { readyManualJobFixture } from './test-fixtures/manual-job-ready';

function hunted(heat = 80, cash = '125000'): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits(cash) }, city: { ...s.city, heat,
    ownedTerritoryIds: [W.id, N.id], heatDecayElapsedMs: heat ? 12345 : 0 } };
}
describe('local MANHUNT rules', () => {
  it.each([0, 59, 60, 79, 80, 81, 99, 100])('derives pursuit and exact escape at %i Heat', heat => {
    const view = getManhunt(heat);
    expect(view.active).toBe(heat >= 80);
    expect(view.travelBlocked).toBe(heat >= 80);
    expect(view.heatToClear).toBe(heat >= 80 ? heat - 79 : 0);
    expect(view.heatAfterDecoy).toBe(heat >= 80 ? heat - 30 : heat);
  });
  it.each([-1, 101, NaN, Infinity, 80.5])('rejects invalid Heat %s', heat => {
    expect(() => getManhunt(heat)).toThrow(RangeError);
  });
  it.each([80, 90, 100])('spends exactly once and clears local pursuit from %i', heat => {
    const s = hunted(heat), before = JSON.stringify(s);
    const result = deployDecoy(s);
    expect(result.ok).toBe(true);
    expect(result.state.economy.cash).toBe('0');
    expect(result.state.city).toMatchObject({ heat: heat - 30, heatDecayElapsedMs: 12345 });
    expect(result.state.progression).toBe(s.progression);
    expect(result.state.permanentProgression).toBe(s.permanentProgression);
    expect(result.state.events).toBe(s.events);
    expect(getManhunt(result.state.city.heat).active).toBe(false);
    expect(setActiveDistrict(result.state, N.id).ok).toBe(true);
    expect(deployDecoy(result.state)).toMatchObject({ ok: false, error: 'no-manhunt' });
    expect(JSON.stringify(s)).toBe(before);
  });
  it('insufficient funds and absent pursuit are atomic failures', () => {
    const poor = hunted(80, '124999'), safe = hunted(79);
    expect(deployDecoy(poor)).toEqual({ ok: false, state: poor, error: 'insufficient-funds' });
    expect(deployDecoy(safe)).toEqual({ ok: false, state: safe, error: 'no-manhunt' });
    expect(selectDecoy(poor)).toMatchObject({ active: true, affordable: false, available: false, cost: DECOY_COST });
    expect(selectDecoy(hunted()).available).toBe(true);
    expect(() => deployDecoy({ ...safe, city: { ...safe.city, heat: 101 } })).toThrow(RangeError);
  });
  it('blocks only the current hunted district, preserves no-op and event gate', () => {
    const s = hunted();
    expect(setActiveDistrict(s, N.id)).toEqual({ ok: false, state: s, error: 'district-manhunt' });
    expect(setActiveDistrict(s, W.id)).toEqual({ ok: true, state: s });
    const away = { ...s, city: switchCityDistrict(s.city, N.id) };
    expect(setActiveDistrict(away, W.id).ok).toBe(true);
    expect(deployDecoy(away)).toMatchObject({ ok: false, error: 'no-manhunt' });
    const pending: GameState = { ...s, events: { pendingEventId: 'event:hot-tip', opportunityElapsedMs: 0 } };
    const escaped = deployDecoy(pending).state;
    expect(escaped.events).toBe(pending.events);
    expect(setActiveDistrict(escaped, N.id)).toMatchObject({ ok: false, error: 'district-event-pending' });
  });
  it('decoys never cool the other district or grant cash, XP, jobs or achievements', () => {
    const s = hunted(95), away = { ...s, city: { ...switchCityDistrict(s.city, N.id), heat: 100 } };
    const result = deployDecoy(away);
    expect(result.ok).toBe(true); expect(result.state.city.heat).toBe(70);
    expect(getDistrictHeat(result.state.city, W.id).heat).toBe(95);
    expect(result.state.permanentProgression).toEqual(s.permanentProgression);
  });
  it('has free exits and leaves manual earning available, including at the maximum', () => {
    const s = hunted(100, '0');
    expect(performStarterJob(s)).toMatchObject({ ok: true, moneyEarned: '2062' });
    let cooled = s;
    for (let i = 0; i < 11; i++) cooled = performDiscreetDelivery(readyManualJobFixture(cooled)).state;
    expect(cooled.city.heat).toBe(78); expect(setActiveDistrict(cooled, N.id).ok).toBe(true);
    expect(layLow(hunted()).state.city.heat).toBe(70);
    expect(simulateGameElapsed(hunted(), 60000).state.city.heat).toBe(79);
  });
  it('offline clears roadblocks with credited cooling without automatic spending', () => {
    const s = hunted(100);
    const result = reconcileOffline(s, 1000, 1000 + 21 * 60000);
    expect(result.state.city.heat).toBe(79);
    expect(result.state.economy).toEqual(s.economy);
    expect(setActiveDistrict(result.state, N.id).ok).toBe(true);
  });
  it('v20 and CE1 retain pursuit through existing district Heat without extra fields', () => {
    const s = hunted(100), saved = serializeSave(s, 1000), code = exportSaveCode(s, 1000);
    expect(CURRENT_SAVE_VERSION).toBe(27);
    if (!saved.ok || !code.ok) throw Error('fixture');
    const loaded = parseSave(saved.serialized);
    expect(validateSaveCode(code.code)).toEqual(loaded);
    expect(loaded).toMatchObject({ ok: true, envelope: { state: s, savedAt: 1000 } });
    expect(saved.serialized).not.toMatch(/manhunt|decoy|pursuit/i);
    const reborn = performRebirth({ ...rebirthState(), city: s.city });
    expect(reborn.ok).toBe(true); expect(getManhunt(reborn.state.city.heat).active).toBe(false);
  });
  it('domain commands do not use time or randomness', () => {
    const s = hunted(), clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock'); });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('rng'); });
    try { expect(deployDecoy(s).ok).toBe(true); expect(getManhunt(80).active).toBe(true); }
    finally { clock.mockRestore(); random.mockRestore(); }
  });
});
