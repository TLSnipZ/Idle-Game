import type { GameState } from '../game/game-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { serializeSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import { simulateElapsed } from '../game/simulate-elapsed';
import { createLocalSave } from './local-save';
import { createPersistentGame, AUTOSAVE_CADENCE_MS } from './persistent-game';
import { performStarterJob } from '../game/perform-starter-job';

const owned = { ...createInitialGameState(), businesses: { owned: { [STARTER_BUSINESS.id]: { level: 1 } }, productionRemainderMilliCents: 975 } };
function fixture(state: GameState = owned, savedAt = 1000, current = 2000) {
  const encoded = serializeSave(state, savedAt); if (!encoded.ok) throw Error('fixture');
  let raw = encoded.serialized;
  let wall = current;
  let monotonic = 0;
  const storage = { getItem: vi.fn(() => raw), setItem: vi.fn((_key: string, value: string) => { raw = value; }) };
  const events: string[] = [];
  const publish = vi.fn(() => { events.push('publish'); });
  const interval = (callback: () => void, ms: number) => { const id = setInterval(callback, ms); return () => clearInterval(id); };
  const make = () => createPersistentGame(publish, createLocalSave(() => storage, () => wall), {
    now: () => monotonic,
    schedule: callback => { events.push('start'); return interval(callback, 250); },
  }, callback => interval(callback, AUTOSAVE_CADENCE_MS));
  return { storage, make, publish, events, raw: () => raw, original: raw,
    wall: (value: number) => { wall = value; },
    advance: (ms: number) => { wall += ms; monotonic += ms; vi.advanceTimersByTime(ms); } };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('offline bootstrap transaction', () => {
  it('writes before publication or live scheduling, using one captured wall timestamp', () => {
    const f = fixture();
    const write = f.storage.setItem.getMockImplementation();
    f.storage.setItem.mockImplementation((key, value) => { f.events.push('write'); write?.(key, value); f.wall(9999); });
    const game = f.make(); game.start();
    expect(f.events).toEqual(['write', 'publish', 'start']);
    expect(JSON.parse(f.raw()).savedAt).toBe(2000);
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(owned, 1000).state);
    expect(game.getSnapshot().offline?.incomeEarned).toBe('75');
  });
  it('consumes the interval once across repeated start, Strict Mode restart and immediate reload', () => {
    const f = fixture(); const game = f.make(); game.start();
    const rewarded = game.getSnapshot().result.state;
    game.start(); game.stop(); game.start();
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(game.getSnapshot().result.state).toBe(rewarded);
    game.stop(); const reloaded = f.make(); reloaded.start();
    expect(reloaded.getSnapshot().result.state).toEqual(rewarded);
    expect(reloaded.getSnapshot().offline?.rewardedElapsedMs).toBe(0);
    expect(vi.getTimerCount()).toBe(2);
  });
  it('autosave adds only active runtime elapsed after bootstrap', () => {
    const f = fixture(); const game = f.make(); game.start();
    f.advance(AUTOSAVE_CADENCE_MS);
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(owned, 1000 + AUTOSAVE_CADENCE_MS).state);
    expect(JSON.parse(f.raw()).savedAt).toBe(2000 + AUTOSAVE_CADENCE_MS);
    expect(f.storage.setItem).toHaveBeenCalledTimes(2);
  });
  it('failed write preserves the old save and pauses original state without retrying or autosaving', () => {
    const f = fixture(); f.storage.setItem.mockImplementation(() => { throw Error('quota'); });
    const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(owned);
    expect(game.getSnapshot().offline).toBeNull();
    expect(game.getSnapshot().persistence).toEqual({ kind: 'offline-error', error: 'storage-write' });
    expect(f.raw()).toBe(f.original);
    expect(vi.getTimerCount()).toBe(0);
    game.start(); game.stop(); game.start(); game.execute(performStarterJob); f.advance(10000);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(game.getSnapshot().result.state).toEqual(owned);
  });
  it('overflow never writes or publishes the candidate', () => {
    const maximum = { ...owned, economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } };
    const f = fixture(maximum); const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(maximum);
    expect(game.getSnapshot().persistence).toEqual({ kind: 'offline-error', error: 'overflow' });
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.raw()).toBe(f.original); expect(vi.getTimerCount()).toBe(0);
  });
  it.each([NaN, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])('invalid wall clock pauses without data loss %#', wall => {
    const f = fixture(owned, 1000, wall); const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(owned);
    expect(game.getSnapshot().persistence).toEqual({ kind: 'offline-error', error: 'invalid-timestamp' });
    expect(f.raw()).toBe(f.original); expect(vi.getTimerCount()).toBe(0);
  });
  it('future timestamp safely rebases and the next reload progresses normally', () => {
    const f = fixture(owned, 9000, 1000); const game = f.make(); game.start();
    expect(game.getSnapshot().offline?.clockAnomaly).toBe(true);
    expect(game.getSnapshot().result.state).toEqual(owned);
    expect(JSON.parse(f.raw()).savedAt).toBe(1000);
    game.stop(); f.wall(2000); const next = f.make(); next.start();
    expect(next.getSnapshot().result.state).toEqual(simulateElapsed(owned, 1000).state);
  });
  it('no-business bootstrap still consumes/rebases elapsed with zero income', () => {
    const initial = createInitialGameState(); const f = fixture(initial); const game = f.make(); game.start();
    expect(game.getSnapshot().offline?.incomeEarned).toBe('0');
    expect(JSON.parse(f.raw())).toMatchObject({ savedAt: 2000, state: initial });
  });
  it('historical import earns nothing; reload begins at its newly written local timestamp', () => {
    const f = fixture(createInitialGameState()); const game = f.make(); game.start();
    const code = exportSaveCode(owned, 0); if (!code.ok) throw Error('fixture');
    expect(game.importCode(code.code).ok).toBe(true);
    expect(game.getSnapshot().result.state).toEqual(owned);
    expect(game.getSnapshot().offline).toBeNull();
    expect(JSON.parse(f.raw()).savedAt).toBe(2000);
    game.stop(); f.wall(3000); const next = f.make(); next.start();
    expect(next.getSnapshot().result.state).toEqual(simulateElapsed(owned, 1000).state);
  });
  it('dismisses runtime-only reward metadata without changing save or cash', () => {
    const f = fixture(); const game = f.make(); game.start(); const state = game.getSnapshot().result.state; const raw = f.raw();
    game.dismissOffline(); expect(game.getSnapshot().offline).toBeNull();
    expect(game.getSnapshot().result.state).toBe(state); expect(f.raw()).toBe(raw);
  });
});

it('clock access failure preserves the save without starting timers', () => {
  const f = fixture();
  const adapter = createLocalSave(() => f.storage, () => { throw Error('clock'); });
  expect(adapter.bootstrap()).toMatchObject({ kind: 'offline-error', state: owned, error: 'clock-unavailable' });
  expect(f.storage.setItem).not.toHaveBeenCalled(); expect(f.raw()).toBe(f.original);
});

it('a conflicting stored value is preserved instead of publishing the offline candidate', () => {
  const f = fixture();
  f.storage.getItem.mockReturnValueOnce(f.original).mockReturnValue('external-save');
  const game = f.make(); game.start();
  expect(game.getSnapshot().persistence).toEqual({ kind: 'offline-error', error: 'storage-conflict' });
  expect(game.getSnapshot().result.state).toEqual(owned);
  expect(f.storage.setItem).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});

it('offline catch-up uses saved higher levels and unchanged eight-hour cap', () => {
  const higher = { ...owned, businesses: { ...owned.businesses, owned: { [STARTER_BUSINESS.id]: { level: 7 } } } };
  const f = fixture(higher, 0, Number.MAX_SAFE_INTEGER); const game = f.make(); game.start();
  expect(game.getSnapshot().result.state).toEqual(simulateElapsed(higher, 8 * 60 * 60 * 1000).state);
  expect(game.getSnapshot().offline?.capped).toBe(true);
  game.stop(); const again = f.make(); again.start();
  expect(again.getSnapshot().offline?.incomeEarned).toBe('0');
});
