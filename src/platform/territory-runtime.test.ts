import { createInitialStatistics } from '../features/statistics';
import { unlockEligibleAchievements } from '../game/achievements';
import { describe, expect, it } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { territoryState } from '../game/test-fixtures/territory-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { ROOT, FAST, LEARN, NEVER } from '../game/test-fixtures/skill-state';
import { acquireTerritory } from '../game/acquire-territory';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { performStarterJob } from '../game/perform-starter-job';
import { createInitialGameState } from '../game/game-state';
import { NEON_MILE as N, WATERFRONT as W } from '../features/territories';
import { parseSave, serializeSave } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';

describe('territory runtime and persistence boundaries', () => {
  it('reconciles completed Dispatcher jobs at old reward, then saves acquisition, then uses new reward', () => {
    const initial = territoryState(), f = rebirthRuntime(initial);
    f.at(25000); f.wall(26000); f.game.execute(s => acquireTerritory(s, N.id));
    const reconciled = onlineElapsed(initial, 25000); if (!reconciled.ok) throw Error('fixture');
    expect(reconciled.automation.income).toBe('5000');
    const acquired = acquireTerritory(reconciled.state, N.id).state;
    expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(acquired).state);
    expect(f.game.getSnapshot().automationEvent?.income).toBe('5000');
    expect(acquired.automation.starterJobElapsedMs).toBe(5000);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 26000, state: unlockEligibleAchievements(acquired).state } });
    f.at(30000); f.wall(31000); f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(acquired, 5000).state);
    expect(f.game.getSnapshot().automationEvent).toMatchObject({ completedJobs: 1, income: '2750' });
    const current = f.game.getSnapshot().result.state; f.game.execute(performStarterJob);
    expect(f.game.getSnapshot().result.state).toEqual(performStarterJob(current).state); f.game.stop();
  });
  it('drops only sub-ms runtime duration at acquisition and keeps earned progress', () => {
    const initial = territoryState(), f = rebirthRuntime(initial);
    f.at(.4); f.game.execute(s => acquireTerritory(s, N.id)); const acquired = f.game.getSnapshot().result.state;
    f.at(1); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(acquired);
    f.at(1.5); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(acquired, 1).state); f.game.stop();
  });
  it('failed acquisition preserves the reconciled state and durable save, and the scheduler remains usable', () => {
    const initial = territoryState(false, 11), f = rebirthRuntime(initial), raw = f.raw();
    f.at(25000); f.game.execute(s => acquireTerritory(s, N.id));
    expect(f.game.getSnapshot().result).toMatchObject({ ok: false, error: 'requirements-not-met' });
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(initial, 25000).state);
    expect(f.raw()).toBe(raw); f.at(30000); f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(initial, 30000).state); f.game.stop();
  });
  it('command save, export, autosave, reload and Strict Mode-style restart retain ownership', () => {
    const f = rebirthRuntime(territoryState()); f.game.execute(s => acquireTerritory(s, N.id));
    const writes = f.events.filter(e => e.type === 'write').length;
    f.at(250); f.tick(); expect(f.events.filter(e => e.type === 'write')).toHaveLength(writes);
    f.at(5000); f.wall(6000); f.autosave();
    const state = f.game.getSnapshot().result.state, exported = f.game.exportCode(); if (!exported.ok) throw Error('fixture');
    expect(validateSaveCode(exported.code)).toMatchObject({ ok: true, envelope: { version: 17, state } });
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state } });
    f.game.stop(); f.game.start(); f.game.start(); expect(f.timers()).toBe(2); f.game.stop();
    const reload = f.make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(state);
    expect(reload.getSnapshot().offline?.incomeEarned).toBe('0'); reload.stop(); expect(f.timers()).toBe(0);
  });
  it('ordinary save failure reports error with valid acquisition live and prior durable save intact', () => {
    const f = rebirthRuntime(territoryState()), raw = f.raw(); f.fail();
    f.game.execute(s => acquireTerritory(s, N.id));
    expect(f.game.getSnapshot().result).toMatchObject({ ok: true, state: { city: { heat: 10, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] } } });
    expect(f.game.getSnapshot().persistence).toEqual({ kind: 'error', error: 'storage-write' });
    expect(f.raw()).toBe(raw); f.game.stop();
  });
  it('import preserves grandfathered ownership without historical rewards or acquisition feedback', () => {
    const base = createInitialGameState();
    const candidate = { ...base, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] },
      permanentProgression: { statistics: createInitialStatistics(2), unlockedAchievementIds: [], empirePoints: 4, rebirthCount: 2, skills: { [FAST]: 1 } } };
    const exported = exportSaveCode(candidate, 0); if (!exported.ok) throw Error('fixture');
    const f = rebirthRuntime(territoryState()); f.at(90000); f.wall(100000);
    expect(f.game.importCode(exported.code)).toEqual({ ok: true });
    expect(f.game.getSnapshot().result.state).toEqual(candidate);
    expect(f.game.getSnapshot().automationEvent).toBeUndefined(); expect(f.game.getSnapshot().offline).toBeNull();
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 100000, state: candidate } });
    f.game.stop(); const reload = f.make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(unlockEligibleAchievements(candidate).state); reload.stop();
  });
  it('failed imported replacement leaves current city and durable save intact', () => {
    const f = rebirthRuntime(territoryState()), raw = f.raw(), state = f.game.getSnapshot().result.state;
    const code = exportSaveCode(territoryState(true), 0); if (!code.ok) throw Error('fixture'); f.fail();
    expect(f.game.importCode(code.code)).toMatchObject({ ok: false, error: 'persistence-failure' });
    expect(f.raw()).toBe(raw); expect(f.game.getSnapshot().result.state).toBe(state); f.game.stop();
  });
  it.each([false, true])('Rebirth resets city only after durable success (failed write=%s)', failed => {
    const state = { ...rebirthState(), city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] },
      permanentProgression: { statistics: createInitialStatistics(1), unlockedAchievementIds: [], empirePoints: 3, rebirthCount: 1, skills: { [ROOT]: 1, [FAST]: 1 } } };
    const f = rebirthRuntime(state), raw = f.raw(); if (failed) f.fail();
    f.at(3000); f.wall(4000); const result = f.game.rebirth(); expect(result.ok).toBe(!failed);
    if (failed) {
      expect(f.raw()).toBe(raw); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(state, 3000).state);
      expect(f.events.some(e => e.state.city.ownedTerritoryIds.length === 1)).toBe(false);
    } else {
      const reset = f.game.getSnapshot().result.state;
      expect(reset.city).toEqual(createInitialGameState().city);
      const relevant = f.events.filter(e => e.state.city.ownedTerritoryIds.length === 1);
      expect(relevant.map(e => e.type)).toEqual(['write', 'publish']);
      expect(reset.garage).toEqual(state.garage); expect(reset.permanentProgression.skills).toEqual(state.permanentProgression.skills);
      expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 4000, state: reset } });
      f.game.stop(); const reload = f.make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(reset); reload.stop();
    }
    f.game.stop();
  });
  it.each([0, 1, 2])('offline consumption is shared, durable and one-time with Never Sleeps rank %i', rank => {
    const base = territoryState(true);
    const state = { ...base, permanentProgression: { ...base.permanentProgression,
      skills: { [LEARN]: 1, ...(rank ? { [NEVER]: rank } : {}) } } };
    const encoded = serializeSave(state, 1000); if (!encoded.ok) throw Error('fixture'); let raw = encoded.serialized;
    const now = 1000 + 14 * 3600000, cap = (8 + rank * 2) * 3600000;
    const events: string[] = [];
    const make = () => createPersistentGame(view => { if (view.persistence.kind === 'loaded') events.push('publish'); },
      createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; events.push('write'); } }), () => now),
      { random: { next: () => 0.99 }, now: () => 0, schedule: () => () => {} }, () => () => {});
    const game = make(); game.start(); const expected = simulateGameElapsed(state, cap).state;
    expect(events.slice(0, 2)).toEqual(['write', 'publish']); expect(game.getSnapshot().result.state).toEqual(expected);
    expect(game.getSnapshot().offline).toMatchObject({ capMs: cap, rewardedElapsedMs: cap });
    game.stop(); const reload = make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(expected);
    expect(reload.getSnapshot().offline).toMatchObject({ incomeEarned: '0', xpEarned: 0 }); reload.stop();
  });
  it('failed offline write preserves city/save and pauses before starting schedulers', () => {
    const state = territoryState(true), encoded = serializeSave(state, 1000); if (!encoded.ok) throw Error('fixture');
    let timers = 0; const raw = encoded.serialized;
    const game = createPersistentGame(() => {}, createLocalSave(() => ({ getItem: () => raw, setItem: () => { throw Error('quota'); } }), () => 31000),
      { random: { next: () => 0.99 }, now: () => 0, schedule: () => { timers++; return () => {}; } }, () => { timers++; return () => {}; });
    game.start(); expect(timers).toBe(0); expect(game.getSnapshot().result.state).toEqual(state);
    expect(game.getSnapshot().persistence).toMatchObject({ kind: 'offline-error', error: 'storage-write' });
    expect(raw).toBe(encoded.serialized); game.stop();
  });
  it('future timestamp rebases without territory income, jobs or XP', () => {
    const state = territoryState(true), encoded = serializeSave(state, 10000); if (!encoded.ok) throw Error('fixture'); let raw = encoded.serialized;
    const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => 500);
    expect(save.bootstrap()).toMatchObject({ kind: 'loaded', state: unlockEligibleAchievements(state).state, offline: { clockAnomaly: true, rewardedElapsedMs: 0, incomeEarned: '0', xpEarned: 0 } });
    expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { savedAt: 500, state: unlockEligibleAchievements(state).state } });
  });
});
