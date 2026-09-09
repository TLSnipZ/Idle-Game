import { describe, expect, it } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { crewState } from '../game/test-fixtures/crew-state';
import { performStarterJob } from '../game/perform-starter-job';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { resolveEventChoice } from '../game/resolve-event-choice';
import { acquireTerritory } from '../game/acquire-territory';
import { recruitCrewMember } from '../game/crew-commands';
import { upgradeBusiness } from '../game/upgrade-business';
import { parseSave, serializeSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { fakeRandom } from '../game/test-fixtures/event-state';
const stats = (s: GameState) => s.permanentProgression.statistics;
function active(): GameState {
  const s = rebirthState();
  return { ...s, city: { ...s.city, heat: 59, heatDecayElapsedMs: 0 },
    automation: { unlockedIds: [D.id], starterJobElapsedMs: 9000 },
    events: { pendingEventId: 'event:hot-tip', opportunityElapsedMs: 200000 } };
}
describe('statistics at runtime and durable boundaries', () => {
  it('reconciles old Dispatcher work then counts one manual job and publishes achievements together', () => {
    const s = active(), f = rebirthRuntime(s, fakeRandom()); f.at(41000); f.wall(42000);
    f.game.execute(performStarterJob);
    const current = f.game.getSnapshot().result.state;
    expect(stats(current)).toEqual({ ...stats(s), automatedJobsCompleted: 5, manualJobsCompleted: 1, peakHeat: 61 });
    expect(current.permanentProgression.unlockedAchievementIds).toContain('achievement:running-hot');
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: current } });
    const actionWrites = f.events.filter(e => e.type === 'write'); expect(actionWrites).toHaveLength(1);
    expect(actionWrites[0]?.state).toEqual(current); f.game.stop();
  });
  it('failed direct command keeps legitimate pre-command reconciliation but no command statistics', () => {
    const s = active(), initial = { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...stats(s), manualJobsCompleted: Number.MAX_SAFE_INTEGER } } };
    const f = rebirthRuntime(initial); f.at(1000); const raw = f.raw(); f.game.execute(performStarterJob);
    const r = f.game.getSnapshot().result; expect(r).toMatchObject({ ok: false, error: 'statistics-overflow' });
    expect(r.state).toEqual(simulateGameElapsed(initial, 1000).state); expect(stats(r.state).automatedJobsCompleted).toBe(1);
    expect(stats(r.state).manualJobsCompleted).toBe(Number.MAX_SAFE_INTEGER); expect(f.raw()).toBe(raw); f.game.stop();
  });
  it('automated counter overflow suspends the whole elapsed reconciliation without partial publication', () => {
    const s = active(), initial = { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...stats(s), automatedJobsCompleted: Number.MAX_SAFE_INTEGER } } };
    const f = rebirthRuntime(initial), before = f.game.getSnapshot().result.state, raw = f.raw(); f.at(1000); f.tick();
    expect(f.game.getSnapshot().runtimeError).toBe('statistics-overflow'); expect(f.game.getSnapshot().result.state).toBe(before);
    expect(f.raw()).toBe(raw); f.game.stop();
  });
  it.each([
    { name: 'business upgrade', key: 'businessLevelsPurchased', command: (s: GameState) => upgradeBusiness(s, 'business:dockside-detail') },
    { name: 'territory acquisition', key: 'territoriesAcquired', command: (s: GameState) => acquireTerritory(s, 'territory:neon-mile') },
    { name: 'recruitment', key: 'crewMembersRecruited', command: (s: GameState) => recruitCrewMember(s, 'crew:rico-vale') },
    { name: 'event PASS', key: 'eventsResolved', command: (s: GameState) => resolveEventChoice(s, 'event:warehouse-opportunity', 'choice:pass') },
  ] as const)('$name saves its counter in the same meaningful command', ({ key, command }) => {
    const s = { ...rebirthState(), events: { pendingEventId: 'event:warehouse-opportunity' as const, opportunityElapsedMs: 123456 } };
    const f = rebirthRuntime(s); f.game.execute(command); expect(f.game.getSnapshot().result.ok).toBe(true);
    const after = f.game.getSnapshot().result.state; expect(stats(after)[key]).toBe(1);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: after } }); f.game.stop();
    const reload = f.make(); reload.start(); expect(stats(reload.getSnapshot().result.state)).toEqual(stats(after)); reload.stop();
  });
  it.each([0, 1, 2])('offline rank %i uses shared duration, no manual/event counts, and one-time durable publication', rank => {
    const b = active(), s = { ...b, crew: crewState({ operations: 'crew:mara-knox', logistics: 'crew:jax-mercer' }).crew,
      permanentProgression: { ...b.permanentProgression, skills: rank ? { 'skill:never-sleeps': rank } : {} } };
    const initial = serializeSave(s, 1000); if (!initial.ok) throw Error('fixture'); let raw = initial.serialized;
    const cap = (8 + 2 * rank) * 3600000, now = 1000 + cap + 3600000, rng = fakeRandom();
    const expected = simulateGameElapsed(s, cap).state;
    const trace: string[] = [];
    const saves = () => createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => {
      const parsed = parseSave(value); expect(parsed).toMatchObject({ ok: true, envelope: { state: expected, savedAt: now } });
      trace.push('write'); raw = value;
    } }), () => now);
    const game = createPersistentGame(view => { trace.push('publish'); expect(view.result.state).toEqual(expected); }, saves(), { now: () => 0, random: rng, schedule: () => () => {} }, () => () => {});
    game.start(); expect(trace[0]).toBe('write'); expect(stats(game.getSnapshot().result.state)).toEqual({ ...stats(s), automatedJobsCompleted: cap / 10000, peakHeat: 0 });
    expect(game.getSnapshot().offline?.rewardedElapsedMs).toBe(cap); expect(game.getSnapshot().offline?.capped).toBe(true);
    expect(game.getSnapshot().result.state.events).toEqual(s.events); expect(rng.calls()).toBe(0); game.stop();
    const second = saves().bootstrap(); expect(second).toMatchObject({ kind: 'loaded', state: expected, offline: { incomeEarned: '0', xpEarned: 0 } });
  });
  it('short legitimate offline interval records final Heat and achievements before writing', () => {
    const s = active(), initial = serializeSave(s, 1000); if (!initial.ok) throw Error('fixture'); let raw = initial.serialized;
    const saves = createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => {
      expect(parseSave(value)).toMatchObject({ ok: true, envelope: { state: { permanentProgression: {
        statistics: { automatedJobsCompleted: 5, peakHeat: 60 }, unlockedAchievementIds: expect.arrayContaining(['achievement:running-hot']),
      } } } }); raw = value;
    } }), () => 42000);
    const loaded = saves.bootstrap(); expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') throw Error('fixture'); expect(stats(loaded.state).peakHeat).toBe(60);
  });
  it.each(['overflow', 'storage'] as const)('offline %s failure preserves complete old save and state', failure => {
    const base = active(), s = failure === 'overflow' ? { ...base, permanentProgression: { ...base.permanentProgression, statistics: { ...stats(base), automatedJobsCompleted: Number.MAX_SAFE_INTEGER } } } : base;
    const initial = serializeSave(s, 1000); if (!initial.ok) throw Error('fixture'); const raw = initial.serialized; let writes = 0;
    const saves = createLocalSave(() => ({ getItem: () => raw, setItem: () => { writes++; throw Error('quota'); } }), () => 42000);
    const r = saves.bootstrap(); expect(r).toMatchObject({ kind: 'offline-error', state: s });
    expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { state: s, savedAt: 1000 } });
    expect(writes).toBe(failure === 'overflow' ? 0 : 1);
  });
  it('Rebirth captures final runtime counts and keeps history only after a durable reset', () => {
    const f = rebirthRuntime(active()); f.at(41000); f.wall(42000); expect(f.game.rebirth().ok).toBe(true);
    const after = f.game.getSnapshot().result.state;
    expect(stats(after)).toEqual({ ...stats(active()), automatedJobsCompleted: 5, peakHeat: 60, rebirthsCompleted: 1 });
    expect(after.city).toEqual(createInitialGameState().city); expect(after.permanentProgression.rebirthCount).toBe(1);
    const write = f.events.findIndex(e => e.type === 'write');
    const reset = f.events.findIndex(e => e.type === 'publish' && e.state.permanentProgression.rebirthCount === 1);
    expect(write).toBeGreaterThanOrEqual(0); expect(reset).toBeGreaterThan(write); f.game.stop();
  });
  it.each(['rebirthsCompleted', 'rebirthCount', 'storage'] as const)('Rebirth %s failure cannot publish reset/reward/history', failure => {
    const b = active(), s = failure === 'rebirthsCompleted' ? { ...b, permanentProgression: { ...b.permanentProgression, statistics: { ...stats(b), rebirthsCompleted: Number.MAX_SAFE_INTEGER } } }
      : failure === 'rebirthCount' ? { ...b, permanentProgression: { ...b.permanentProgression, rebirthCount: Number.MAX_SAFE_INTEGER } } : b;
    const f = rebirthRuntime(s), before = f.game.getSnapshot().result.state, raw = f.raw(); if (failure === 'storage') f.fail();
    expect(f.game.rebirth().ok).toBe(false); expect(f.game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw); f.game.stop();
  });
  it('historical import preserves all eight exact values without inferring peak; future play continues', () => {
    const b = active(), imported = { ...b, city: { ...b.city, heat: 90 }, permanentProgression: { ...b.permanentProgression, statistics: {
      manualJobsCompleted: 17, automatedJobsCompleted: 28, businessLevelsPurchased: 39, territoriesAcquired: 4,
      crewMembersRecruited: 15, eventsResolved: 26, rebirthsCompleted: 7, peakHeat: 0 } } };
    const code = exportSaveCode(imported, 1); if (!code.ok) throw Error('fixture'); const rng = fakeRandom(), f = rebirthRuntime(createInitialGameState(), rng);
    f.at(123000); f.wall(100000000); expect(f.game.importCode(code.code).ok).toBe(true);
    expect(f.game.getSnapshot().result.state).toEqual(imported); expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: imported, savedAt: 100000000 } });
    expect(rng.calls()).toBe(0); f.at(124000); f.tick();
    expect(stats(f.game.getSnapshot().result.state)).toEqual({ ...stats(imported), automatedJobsCompleted: 29, peakHeat: 90 });
    f.game.stop();
  });
});
