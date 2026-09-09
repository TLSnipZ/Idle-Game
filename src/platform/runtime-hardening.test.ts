import { describe, expect, it, vi } from 'vitest';
import { createGameRuntime } from './game-runtime';
import { createPersistentGame, AUTOSAVE_CADENCE_MS } from './persistent-game';
import { createLocalSave } from './local-save';
import { runtimeLoad } from '../game/test-fixtures/runtime-load';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { parseSave, serializeSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import * as online from '../game/simulate-online-elapsed';
import { setAutomationEnabled } from '../game/set-automation-enabled';
import { BUSINESS_AUTO_UPGRADER } from '../features/automation';

describe('Phase 9D clock and durable transaction boundaries', () => {
  it('sub-ms reconciliation accumulates time without simulation, publication or RNG', () => {
    const spy = vi.spyOn(online, 'simulateOnlineElapsed'), random = { next: vi.fn(() => 0) }, publish = vi.fn();
    let now = 0;
    const runtime = createGameRuntime(runtimeLoad(), publish, { now: () => now, random, schedule: () => () => {} });
    try {
      runtime.start();
      for (const time of [0, 0.25, 0.5, 0.75]) { now = time; expect(runtime.reconcile()).toBe(true); }
      expect(spy).not.toHaveBeenCalled(); expect(publish).not.toHaveBeenCalled(); expect(random.next).not.toHaveBeenCalled();
      now = 1; runtime.reconcile(); expect(spy).toHaveBeenCalledTimes(1); expect(spy.mock.calls[0]?.[1]).toBe(1);
      const state = runtime.getSnapshot().result.state;
      runtime.reconcile(); expect(runtime.getSnapshot().result.state).toBe(state); expect(spy).toHaveBeenCalledTimes(1);
    } finally { runtime.stop(); spy.mockRestore(); }
  });
  it('work-limit failure suspends once and never writes or retries a partial long candidate', () => {
    const random = { next: vi.fn(() => 0) }, f = rebirthRuntime(autoUpgraderState(25, '0'), random);
    const before = f.game.getSnapshot().result.state, raw = f.raw();
    f.at(Number.MAX_SAFE_INTEGER); f.tick();
    expect(f.game.getSnapshot().runtimeError).toBe('simulation-limit');
    expect(f.game.getSnapshot().result.state).toBe(before);
    f.tick(); f.autosave(); f.game.execute(s => setAutomationEnabled(s, BUSINESS_AUTO_UPGRADER.id, false));
    expect(f.raw()).toBe(raw); expect(f.events.filter(e => e.type === 'write')).toHaveLength(0);
    expect(random.next).not.toHaveBeenCalled(); f.game.stop();
  });
  it.each([false, true])('12h offline candidate has one attempted write before publication; storage failure=%s', fail => {
    const state = runtimeLoad(), encoded = serializeSave(state, 1000);
    if (!encoded.ok) throw Error(encoded.error);
    let raw = encoded.serialized;
    const trace: string[] = [], random = { next: vi.fn(() => 0) };
    const saves = () => createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => {
      trace.push('write'); if (fail) throw Error('quota'); raw = value;
    } }), () => 43201000);
    const game = createPersistentGame(() => trace.push('publish'), saves(),
      { now: () => 0, random, schedule: () => () => {} }, () => () => {});
    game.start();
    expect(trace[0]).toBe('write'); expect(trace.filter(value => value === 'write')).toHaveLength(1);
    expect(random.next).not.toHaveBeenCalled();
    if (fail) {
      expect(raw).toBe(encoded.serialized); expect(game.getSnapshot().result.state).toEqual(state);
      expect(game.getSnapshot().persistence.kind).toBe('offline-error');
    } else {
      const candidate = game.getSnapshot().result.state;
      expect(candidate.economy.cash).toBe('6792454'); expect(candidate.progression.xp).toBe(60427);
      expect(candidate.permanentProgression.statistics.businessLevelsPurchased).toBe(21);
      expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { savedAt: 43201000, state: candidate } });
      expect(saves().bootstrap()).toMatchObject({ kind: 'loaded', state: candidate, offline: { incomeEarned: '0', xpEarned: 0 } });
    }
    game.stop();
  });
  it('250ms refresh does not write; existing five-second autosave and meaningful toggle still write once', () => {
    expect(AUTOSAVE_CADENCE_MS).toBe(5000);
    const f = rebirthRuntime(runtimeLoad());
    for (let time = 250; time <= 5000; time += 250) { f.at(time); f.tick(); }
    expect(f.events.filter(e => e.type === 'write')).toHaveLength(0);
    f.wall(6000); f.autosave(); expect(f.events.filter(e => e.type === 'write')).toHaveLength(1);
    f.game.execute(s => setAutomationEnabled(s, BUSINESS_AUTO_UPGRADER.id, false));
    expect(f.events.filter(e => e.type === 'write')).toHaveLength(2);
    f.game.stop();
  });
  it.each(['import', 'rebirth'] as const)('%s storage failure preserves authoritative state and durable save', action => {
    const f = rebirthRuntime(runtimeLoad()), before = f.game.getSnapshot().result.state, raw = f.raw(); f.fail();
    const code = exportSaveCode(autoUpgraderState(), 1); if (!code.ok) throw Error(code.error);
    expect(action === 'import' ? f.game.importCode(code.code) : f.game.rebirth()).toMatchObject({ ok: false, error: 'persistence-failure' });
    expect(f.game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw); f.game.stop();
  });
});
