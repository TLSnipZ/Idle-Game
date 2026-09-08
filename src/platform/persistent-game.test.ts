import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STARTER_BUSINESS } from '../features/businesses';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { simulateElapsed } from '../game/simulate-elapsed';
import { serializeSave } from '../game/save-schema';
import { createLocalSave } from './local-save';
import { AUTOSAVE_CADENCE_MS, createPersistentGame } from './persistent-game';
import { RUNTIME_CADENCE_MS } from './game-runtime';

function owned() {
  let state = createInitialGameState();
  for (let i = 0; i < 6; i++) state = performStarterJob(state).state;
  return simulateElapsed(purchaseBusiness(state, STARTER_BUSINESS.id).state, 13).state;
}
function encoded(state = owned()) {
  const result = serializeSave(state, 1); if (!result.ok) throw Error('fixture');
  return result.serialized;
}
function fixture(initial: string | null = null) {
  let raw = initial;
  let now = 100;
  let wall = 100_000;
  const storage = {
    getItem: vi.fn(() => raw),
    setItem: vi.fn((_key: string, value: string) => { raw = value; }),
  };
  const publish = vi.fn();
  const schedule = (callback: () => void, cadence: number) => {
    const id = setInterval(callback, cadence);
    return () => clearInterval(id);
  };
  const make = () => createPersistentGame(publish, createLocalSave(() => storage, () => wall), {
    now: () => now, schedule: callback => schedule(callback, RUNTIME_CADENCE_MS),
  }, callback => schedule(callback, AUTOSAVE_CADENCE_MS));
  return { storage, publish, make, raw: () => raw,
    at: (value: number) => { now = value; }, wall: (value: number) => { wall = value; },
    advance: (ms: number) => { now += ms; vi.advanceTimersByTime(ms); },
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('persistent runtime lifecycle', () => {
  it('construction has no side effects and no-save startup retains initial cash', () => {
    const f = fixture(); const game = f.make();
    expect(f.storage.getItem).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    game.start();
    expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(game.getSnapshot().persistence.kind).toBe('ready');
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('restores valid cash, ownership and remainder exactly without offline credit', () => {
    const f = fixture(encoded()); const game = f.make();
    f.at(1_000_000); f.wall(9_000_000); game.start();
    expect(game.getSnapshot().result.state).toEqual(owned());
    expect(game.getSnapshot().persistence.kind).toBe('loaded');
    f.advance(1000);
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(owned(), 1000).state);
  });
  it('autosaves at five seconds, not on each production callback', () => {
    const f = fixture(encoded()); const game = f.make(); game.start();
    f.advance(AUTOSAVE_CADENCE_MS - 1);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(f.raw() ?? '').state).toEqual(simulateElapsed(owned(), AUTOSAVE_CADENCE_MS).state);
  });
  it('saves only the fully applied command after pre-command production', () => {
    const f = fixture(encoded()); const game = f.make(); game.start();
    f.at(1100.4); game.execute(performStarterJob);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(f.raw() ?? '').state).toEqual(performStarterJob(simulateElapsed(owned(), 1000).state).state);
    expect(game.getSnapshot().persistence.kind).toBe('saved');
  });
  it('purchase saves both cash and ownership atomically; failure does not save', () => {
    const f = fixture(); const game = f.make(); game.start();
    for (let i = 0; i < 6; i++) game.execute(performStarterJob);
    f.at(5100.75); game.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    const persisted = JSON.parse(f.raw() ?? '').state;
    expect(persisted.economy.cash).toBe('0');
    expect(persisted.businesses.ownedIds).toEqual([STARTER_BUSINESS.id]);
    expect(persisted.businesses.productionRemainderMilliCents).toBe(0);
    expect(f.storage.setItem).toHaveBeenCalledTimes(7);
    game.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    expect(f.storage.setItem).toHaveBeenCalledTimes(7);
  });
  it('valid reload restores saved state and starts a new fractional timing baseline', () => {
    const f = fixture(encoded()); const first = f.make(); first.start();
    f.at(100.75); first.execute(performStarterJob);
    const saved = first.getSnapshot().result.state;
    first.stop(); f.at(50_000); f.wall(1_000_000);
    const second = f.make(); second.start();
    expect(second.getSnapshot().result.state).toEqual(saved);
    f.at(50_000.5); second.execute(state => ({ ok: true, state }));
    expect(second.getSnapshot().result.state).toEqual(saved);
    expect(Object.keys(JSON.parse(f.raw() ?? ''))).toEqual(['format', 'version', 'savedAt', 'state']);
  });
  it.each(['{', JSON.stringify({ format: 'crime-empire-save', version: 2, savedAt: 1, state: owned() })])('protects corrupt/newer saves throughout a fresh playable session %#', raw => {
    const f = fixture(raw); const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(game.getSnapshot().persistence.kind).toBe('blocked');
    game.execute(performStarterJob); f.advance(30_000);
    expect(game.getSnapshot().result.state.economy.cash).toBe('2500');
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.raw()).toBe(raw);
  });
  it('storage read failure blocks saving without blocking play', () => {
    const f = fixture(); f.storage.getItem.mockImplementation(() => { throw Error('denied'); });
    const game = f.make(); game.start(); game.execute(performStarterJob);
    expect(game.getSnapshot().persistence).toEqual({ kind: 'blocked', error: 'storage-read' });
    expect(game.getSnapshot().result.state.economy.cash).toBe('2500');
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('failed writes preserve gameplay and retry on the next normal autosave', () => {
    const f = fixture(); const game = f.make(); game.start();
    f.storage.setItem.mockImplementationOnce(() => { throw Error('quota'); });
    game.execute(performStarterJob);
    expect(game.getSnapshot().result.state.economy.cash).toBe('2500');
    expect(game.getSnapshot().persistence.kind).toBe('error');
    expect(f.raw()).toBeNull();
    f.advance(AUTOSAVE_CADENCE_MS);
    expect(game.getSnapshot().persistence.kind).toBe('saved');
  });
  it('start/cleanup/start does not duplicate loops, reload state or perform teardown writes', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); game.start();
    expect(vi.getTimerCount()).toBe(2);
    game.stop(); expect(vi.getTimerCount()).toBe(0);
    f.advance(10_000); game.start();
    expect(vi.getTimerCount()).toBe(2);
    expect(f.storage.getItem).toHaveBeenCalledTimes(1);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    f.advance(AUTOSAVE_CADENCE_MS);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    game.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('inactive commands cannot mutate or save', () => {
    const f = fixture(); const game = f.make(); game.start(); game.stop();
    game.execute(performStarterJob);
    expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('runtime failure does not overwrite the last save', () => {
    const f = fixture(encoded()); const game = f.make(); game.start();
    f.at(NaN); vi.advanceTimersByTime(AUTOSAVE_CADENCE_MS);
    expect(game.getSnapshot().runtimeError).toBe('invalid-clock');
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.raw()).toBe(encoded());
  });
});
