import { describe, expect, it, vi } from 'vitest';
import { createPersistentGame, RESET_CONFIRMATION_TEXT } from './persistent-game';
import { createLocalSave, SAVE_STORAGE_KEY } from './local-save';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { resetProgressState } from '../game/test-fixtures/reset-progress-state';
import { parseSave, serializeSave, CURRENT_SAVE_VERSION } from '../game/save-schema';
import { validateSaveCode } from '../game/save-code';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { simulateOnlineElapsed } from '../game/simulate-online-elapsed';
import { STARTER_BUSINESS } from '../features/businesses';

function fixture(state = resetProgressState(), source?: string | null) {
  const encoded = serializeSave(state, 1000);
  if (!encoded.ok) throw Error('Invalid test state');
  const storage = new Map<string, string>([['other-site-preference', 'keep-me']]);
  if (source !== null) storage.set(SAVE_STORAGE_KEY, source ?? encoded.serialized);
  let now = 0, wall = 1000, failed = false, clockThrows = false, timers = 0;
  const ticks: (() => void)[] = [], autosaves: (() => void)[] = [];
  const events: { type: 'write' | 'publish'; state: GameState }[] = [];
  const random = { next: vi.fn(() => 0.99) };
  const make = () => createPersistentGame(view => events.push({ type: 'publish', state: view.result.state }),
    createLocalSave(() => ({ getItem: key => storage.get(key) ?? null, setItem: (key, value) => {
      if (failed) throw Error('quota');
      const result = parseSave(value); if (!result.ok) throw Error('Invalid write');
      storage.set(key, value); events.push({ type: 'write', state: result.envelope.state });
    } }), () => wall),
    { random, now: () => { if (clockThrows) throw Error('clock'); return now; }, schedule: callback => {
      ticks.push(callback); timers++; return () => { timers--; };
    } }, callback => { autosaves.push(callback); timers++; return () => { timers--; }; });
  const game = make(); game.start(); events.length = 0;
  return { game, make, random, events, storage, ticks, autosaves, timers: () => timers,
    at: (value: number) => { now = value; }, wall: (value: number) => { wall = value; },
    fail: (value = true) => { failed = value; }, throwClock: () => { clockThrows = true; },
    raw: () => storage.get(SAVE_STORAGE_KEY),
    tick: () => ticks.at(-1)?.(), autosave: () => autosaves.at(-1)?.() };
}

describe('durable full New Game reset', () => {
  it.each(['', 'reset', ' RESET', 'RESET ', 'REBIRTH'])('rejects unconfirmed token %j without any effects', text => {
    const f = fixture(), before = f.game.getSnapshot(), raw = f.raw();
    expect(f.game.resetProgress(text)).toEqual({ ok: false, error: 'confirmation-required' });
    expect(f.game.getSnapshot()).toBe(before); expect(f.raw()).toBe(raw);
    expect(f.events).toEqual([]); expect(f.random.next).not.toHaveBeenCalled(); f.game.stop();
  });
  it('replaces every run and permanent slice with the canonical factory without rewards or extra keys', () => {
    const f = fixture(), before = f.game.getSnapshot().result.state, preserved = JSON.stringify(before);
    expect(f.game.resetProgress(RESET_CONFIRMATION_TEXT)).toEqual({ ok: true });
    const after = f.game.getSnapshot().result.state;
    expect(after).toEqual(createInitialGameState()); expect(JSON.stringify(before)).toBe(preserved);
    expect(after).not.toBe(before);
    expect(f.storage.get('other-site-preference')).toBe('keep-me');
    expect([...f.storage.keys()]).toEqual(['other-site-preference', SAVE_STORAGE_KEY]); f.game.stop();
  });
  it('writes before publication without simulating the discarded interval or consuming RNG', () => {
    const f = fixture(); f.at(600000.75); f.wall(601000);
    expect(f.game.resetProgress('RESET')).toEqual({ ok: true });
    expect(f.events.map(event => event.type)).toEqual(['write', 'publish']);
    expect(f.events.every(event => JSON.stringify(event.state) === JSON.stringify(createInitialGameState()))).toBe(true);
    expect(f.random.next).not.toHaveBeenCalled();
    expect(f.game.getSnapshot()).toMatchObject({ offline: null, runtimeError: null, persistence: { kind: 'saved' } });
    for (const field of ['achievementEvent', 'levelEvent', 'cityEvent', 'automationEvent'])
      expect(Object.hasOwn(f.game.getSnapshot(), field)).toBe(false);
    expect(parseSave(f.raw() ?? '')).toMatchObject({ ok: true, envelope: { version: 17, savedAt: 601000 } });
    f.game.stop();
  });
  it('preserves current v17 and CE1 after the reset', () => {
    const f = fixture(); f.game.resetProgress('RESET');
    expect(CURRENT_SAVE_VERSION).toBe(17);
    const result = f.game.exportCode(); if (!result.ok) throw Error('Export failed');
    expect(result.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(result.code)).toMatchObject({ ok: true,
      envelope: { version: 17, state: createInitialGameState() } }); f.game.stop();
  });
  it('starts new clocks and exact fractions without carrying old production or automation forward', () => {
    const f = fixture(); f.at(10000.75); f.wall(11000); f.game.resetProgress('RESET');
    f.at(10001); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(createInitialGameState());
    for (let i = 0; i < 6; i++) f.game.execute(performStarterJob);
    f.game.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    const rebuilt = f.game.getSnapshot().result.state;
    expect(rebuilt.businesses.owned[STARTER_BUSINESS.id]?.level).toBe(1);
    f.at(11001); f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(simulateOnlineElapsed(rebuilt, 1000, { next: () => 0.99 }).state);
    expect(f.game.getSnapshot().result.state.automation.unlockedIds).toEqual([]); f.game.stop();
  });
  it('quota failure leaves the old run, old save, summaries and timers intact, then permits explicit retry', () => {
    const f = fixture(), before = f.game.getSnapshot(), raw = f.raw();
    f.at(30000); f.fail();
    expect(f.game.resetProgress('RESET')).toMatchObject({ ok: false, error: 'persistence-failure', detail: 'storage-write' });
    expect(f.game.getSnapshot().result.state).toBe(before.result.state);
    expect(f.game.getSnapshot().offline).toBe(before.offline); expect(f.raw()).toBe(raw);
    expect(f.events.every(event => event.type === 'publish' && event.state === before.result.state)).toBe(true);
    expect(f.timers()).toBe(2); expect(f.autosaves).toHaveLength(1);
    f.fail(false); expect(f.game.resetProgress('RESET')).toEqual({ ok: true });
    expect(f.game.getSnapshot().result.state).toEqual(createInitialGameState()); f.game.stop();
  });
  it('does not overwrite another tab and prevents subsequent autosave from resurrecting this run', () => {
    const f = fixture(), before = f.game.getSnapshot().result.state;
    f.storage.set(SAVE_STORAGE_KEY, 'another-tab-save');
    expect(f.game.resetProgress('RESET')).toMatchObject({ ok: false, error: 'persistence-failure', detail: 'storage-conflict' });
    expect(f.game.getSnapshot().result.state).toBe(before);
    expect(f.game.getSnapshot().persistence.kind).toBe('blocked');
    f.autosave(); expect(f.raw()).toBe('another-tab-save'); f.game.stop();
  });
  it.each(['{broken', JSON.stringify({ version: 999, savedAt: 1000, state: {} })])('does not override corrupt/newer initial storage %j', raw => {
    const f = fixture(resetProgressState(), raw);
    expect(f.game.resetProgress('RESET')).toMatchObject({ ok: false, error: 'persistence-failure' });
    expect(f.raw()).toBe(raw); expect(f.events).toEqual([]); f.game.stop();
  });
  it.each([NaN, -1])('invalid wall timestamp %s cannot reset or write', timestamp => {
    const f = fixture(), before = f.game.getSnapshot().result.state, raw = f.raw(); f.wall(timestamp);
    expect(f.game.resetProgress('RESET')).toMatchObject({ ok: false, error: 'persistence-failure' });
    expect(f.game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw); f.game.stop();
  });
  it.each(['stopped', 'backward', 'nonfinite', 'throwing'] as const)('unavailable runtime (%s) cannot reset or write', failure => {
    const f = fixture(), before = f.game.getSnapshot(), raw = f.raw();
    if (failure === 'stopped') f.game.stop();
    if (failure === 'backward') f.at(-1);
    if (failure === 'nonfinite') f.at(NaN);
    if (failure === 'throwing') f.throwClock();
    expect(f.game.resetProgress('RESET')).toEqual({ ok: false, error: 'runtime-unavailable' });
    expect(f.game.getSnapshot()).toBe(before); expect(f.raw()).toBe(raw);
    expect(f.events).toEqual([]); f.game.stop();
  });
  it('cannot run before start or after terminal runtime suspension', () => {
    const game = createPersistentGame(() => {});
    expect(game.resetProgress('RESET')).toEqual({ ok: false, error: 'runtime-unavailable' });
    const f = fixture(); f.at(NaN); f.tick(); const raw = f.raw();
    expect(f.game.resetProgress('RESET')).toEqual({ ok: false, error: 'runtime-unavailable' });
    expect(f.raw()).toBe(raw); f.game.stop();
  });
  it('invalidates old autosave callbacks and keeps exactly one runtime and autosave schedule', () => {
    const f = fixture(), previousAutosave = f.autosaves[0];
    expect(f.timers()).toBe(2); f.game.resetProgress('RESET'); f.events.length = 0;
    f.at(5000); previousAutosave?.(); expect(f.events).toEqual([]);
    f.autosave(); expect(f.events.some(event => event.type === 'write')).toBe(true);
    expect(f.timers()).toBe(2); expect(f.ticks).toHaveLength(1);
    f.game.stop(); expect(f.timers()).toBe(0);
  });
  it('reloads only the new run and never credits pre-reset absence', () => {
    const f = fixture(); f.at(10000); f.wall(11000); f.game.resetProgress('RESET'); f.game.stop();
    f.wall(61000); const reloaded = f.make(); reloaded.start();
    expect(reloaded.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(reloaded.getSnapshot().offline).toMatchObject({ rewardedElapsedMs: 50000, incomeEarned: '0', xpEarned: 0 });
    reloaded.stop();
  });
  it('allows a separately exported pre-reset backup to restore the full old empire without historical income', () => {
    const f = fixture(), backup = f.game.exportCode(); if (!backup.ok) throw Error('Export');
    const oldState = f.game.getSnapshot().result.state;
    f.game.resetProgress('RESET'); f.wall(9000000); f.at(8000000);
    expect(f.game.importCode(backup.code)).toEqual({ ok: true });
    expect(f.game.getSnapshot().result.state).toEqual(oldState);
    expect(f.game.getSnapshot().offline).toBeNull(); expect(f.random.next).not.toHaveBeenCalled(); f.game.stop();
  });
  it('can reset an empty new profile without touching unrelated storage', () => {
    const f = fixture(createInitialGameState(), null);
    expect(f.game.resetProgress('RESET')).toEqual({ ok: true });
    expect(f.game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(f.storage.get('other-site-preference')).toBe('keep-me'); f.game.stop();
  });
});
