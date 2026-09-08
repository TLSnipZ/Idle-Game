import { CURRENT_SAVE_VERSION } from '../game/save-schema';
import { upgradeBusiness } from '../game/upgrade-business';
import { moneyFromMinorUnits } from '../features/economy';
import { createSaveManagement } from '../app/save-management';
import { encodeSaveText, validateSaveCode } from '../game/save-code';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STARTER_BUSINESS } from '../features/businesses';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { simulateGameElapsed as simulateElapsed } from '../game/simulate-game-elapsed';
import { serializeSave } from '../game/save-schema';
import { createLocalSave } from './local-save';
import { AUTOSAVE_CADENCE_MS, createPersistentGame } from './persistent-game';
import { RUNTIME_CADENCE_MS } from './game-runtime';

function portable(state = owned()) { return encodeSaveText(encoded(state)); }
function owned() {
  let state = createInitialGameState();
  for (let i = 0; i < 6; i++) state = performStarterJob(state).state;
  return simulateElapsed(purchaseBusiness(state, STARTER_BUSINESS.id).state, 13).state;
}
function encoded(state = owned()) {
  const result = serializeSave(state, 1); if (!result.ok) throw Error('fixture');
  return result.serialized;
}
// Active-runtime tests clear the one bootstrap write; offline-bootstrap.test.ts
// verifies that transaction independently. Equal wall timestamps mean no catch-up here.
function fixture(initial: string | null = null) {
  let raw = initial;
  let now = 100;
  let wall = 1;
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
    game.start(); f.storage.setItem.mockClear();
    expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(game.getSnapshot().persistence.kind).toBe('ready');
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('restores exactly when no wall-clock interval elapsed', () => {
    const f = fixture(encoded()); const game = f.make();
    f.at(1_000_000); f.wall(1); game.start(); f.storage.setItem.mockClear();
    expect(game.getSnapshot().result.state).toEqual(owned());
    expect(game.getSnapshot().persistence.kind).toBe('loaded');
    f.advance(1000);
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(owned(), 1000).state);
  });
  it('autosaves at five seconds, not on each production callback', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.advance(AUTOSAVE_CADENCE_MS - 1);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(f.raw() ?? '').state).toEqual(simulateElapsed(owned(), AUTOSAVE_CADENCE_MS).state);
  });
  it('saves only the fully applied command after pre-command production', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.at(1100.4); game.execute(performStarterJob);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(f.raw() ?? '').state).toEqual(performStarterJob(simulateElapsed(owned(), 1000).state).state);
    expect(game.getSnapshot().persistence.kind).toBe('saved');
  });
  it('purchase saves both cash and ownership atomically; failure does not save', () => {
    const f = fixture(); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    for (let i = 0; i < 6; i++) game.execute(performStarterJob);
    f.at(5100.75); game.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    const persisted = JSON.parse(f.raw() ?? '').state;
    expect(persisted.economy.cash).toBe('0');
    expect(persisted.businesses.owned).toEqual({ [STARTER_BUSINESS.id]: { level: 1 } });
    expect(persisted.businesses.productionRemainderMilliCents).toBe(0);
    expect(f.storage.setItem).toHaveBeenCalledTimes(7);
    game.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    expect(f.storage.setItem).toHaveBeenCalledTimes(7);
  });
  it('valid reload restores saved state and starts a new fractional timing baseline', () => {
    const f = fixture(encoded()); const first = f.make(); first.start();
    f.at(100.75); first.execute(performStarterJob);
    const saved = first.getSnapshot().result.state;
    first.stop(); f.at(50_000); f.wall(1);
    const second = f.make(); second.start();
    expect(second.getSnapshot().result.state).toEqual(saved);
    f.at(50_000.5); second.execute(state => ({ ok: true, state }));
    expect(second.getSnapshot().result.state).toEqual(saved);
    expect(Object.keys(JSON.parse(f.raw() ?? ''))).toEqual(['format', 'version', 'savedAt', 'state']);
  });
  it.each(['{', JSON.stringify({ format: 'crime-empire-save', version: CURRENT_SAVE_VERSION + 1, savedAt: 1, state: owned() })])('protects corrupt/newer saves throughout a fresh playable session %#', raw => {
    const f = fixture(raw); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(game.getSnapshot().persistence.kind).toBe('blocked');
    game.execute(performStarterJob); f.advance(30_000);
    expect(game.getSnapshot().result.state.economy.cash).toBe('2500');
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.raw()).toBe(raw);
  });
  it('storage read failure blocks saving without blocking play', () => {
    const f = fixture(); f.storage.getItem.mockImplementation(() => { throw Error('denied'); });
    const game = f.make(); game.start(); f.storage.setItem.mockClear(); game.execute(performStarterJob);
    expect(game.getSnapshot().persistence).toEqual({ kind: 'blocked', error: 'storage-read' });
    expect(game.getSnapshot().result.state.economy.cash).toBe('2500');
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('failed writes preserve gameplay and retry on the next normal autosave', () => {
    const f = fixture(); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.storage.setItem.mockImplementationOnce(() => { throw Error('quota'); });
    game.execute(performStarterJob);
    expect(game.getSnapshot().result.state.economy.cash).toBe('2500');
    expect(game.getSnapshot().persistence.kind).toBe('error');
    expect(f.raw()).toBeNull();
    f.advance(AUTOSAVE_CADENCE_MS);
    expect(game.getSnapshot().persistence.kind).toBe('saved');
  });
  it('start/cleanup/start does not duplicate loops, reload state or perform teardown writes', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear(); game.start(); f.storage.setItem.mockClear();
    expect(vi.getTimerCount()).toBe(2);
    game.stop(); expect(vi.getTimerCount()).toBe(0);
    f.advance(10_000); game.start(); f.storage.setItem.mockClear();
    expect(vi.getTimerCount()).toBe(2);
    expect(f.storage.getItem).toHaveBeenCalledTimes(2);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    f.advance(AUTOSAVE_CADENCE_MS);
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    game.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('inactive commands cannot mutate or save', () => {
    const f = fixture(); const game = f.make(); game.start(); f.storage.setItem.mockClear(); game.stop();
    game.execute(performStarterJob);
    expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('runtime failure does not overwrite the last save', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.at(NaN); vi.advanceTimersByTime(AUTOSAVE_CADENCE_MS);
    expect(game.getSnapshot().runtimeError).toBe('invalid-clock');
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(f.raw()).toBe(encoded());
  });
});

describe('portable runtime transactions', () => {
  it('exports current reconciled state, not stale storage, with the injected export timestamp', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.at(1100.5); f.wall(777);
    const result = game.exportCode();
    if (!result.ok) throw Error('export');
    const decoded = validateSaveCode(result.code);
    expect(decoded.ok && decoded.envelope).toEqual({ format: 'crime-empire-save', version: CURRENT_SAVE_VERSION, savedAt: 777, state: simulateElapsed(owned(), 1000).state });
    expect(f.raw()).toBe(encoded());
    expect(f.storage.setItem).not.toHaveBeenCalled();
    const snapshot = game.getSnapshot().result.state;
    expect(game.exportCode()).toEqual(result);
    expect(game.getSnapshot().result.state).toBe(snapshot);
  });
  it('imports exact state, replaces savedAt with current time and discards old runtime fraction', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.at(100.9); game.exportCode();
    f.at(10_000); f.wall(999);
    const candidate = performStarterJob(owned()).state;
    expect(game.importCode(portable(candidate))).toEqual({ ok: true });
    expect(game.getSnapshot().result.state).toEqual(candidate);
    expect(JSON.parse(f.raw() ?? '')).toMatchObject({ savedAt: 999, state: candidate });
    f.at(10_000.2); game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(candidate);
    f.at(11_000); game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(candidate, 1000).state);
    expect(vi.getTimerCount()).toBe(2);
    f.advance(AUTOSAVE_CADENCE_MS);
    expect(f.storage.setItem).toHaveBeenCalledTimes(2);
  });
  it.each(['', 'CE2-bad', 'CE1-_w', encodeSaveText('{'), encodeSaveText('{}'), encodeSaveText(JSON.stringify({ format: 'crime-empire-save', version: CURRENT_SAVE_VERSION + 1, savedAt: 0, state: owned() }))])('failed validation preserves both state and save %#', code => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    const original = game.getSnapshot().result.state;
    f.at(1100);
    expect(game.importCode(code).ok).toBe(false);
    expect(game.getSnapshot().result.state).toBe(original);
    expect(f.raw()).toBe(encoded());
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(2);
    game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(original, 1000).state);
  });
  it('write failure leaves live state, prior valid save and clock bookkeeping intact', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    f.storage.setItem.mockImplementationOnce(() => { throw Error('quota'); });
    const original = game.getSnapshot().result.state;
    f.at(1100);
    expect(game.importCode(portable())).toEqual({ ok: false, error: 'persistence-failure', detail: 'storage-write' });
    expect(game.getSnapshot().result.state).toBe(original);
    expect(f.raw()).toBe(encoded());
    game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(original, 1000).state);
  });
  it('rejects invalid timing before writing and keeps runtime usable', () => {
    const f = fixture(encoded()); const game = f.make(); game.start(); f.storage.setItem.mockClear(); f.at(NaN);
    expect(game.importCode(portable())).toEqual({ ok: false, error: 'runtime-unavailable' });
    expect(f.storage.setItem).not.toHaveBeenCalled();
    expect(game.getSnapshot().runtimeError).toBeNull();
    f.at(1100); game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(owned(), 1000).state);
  });
  it('confirmed replacement can recover a corrupt stored save and starts one autosave loop', () => {
    const f = fixture('{'); const game = f.make(); game.start(); f.storage.setItem.mockClear();
    expect(vi.getTimerCount()).toBe(1);
    expect(game.importCode(portable()).ok).toBe(true);
    expect(game.getSnapshot().persistence.kind).toBe('saved');
    expect(vi.getTimerCount()).toBe(2);
    game.importCode(portable());
    expect(vi.getTimerCount()).toBe(2);
    game.stop(); expect(vi.getTimerCount()).toBe(0);
    game.start(); f.storage.setItem.mockClear(); expect(vi.getTimerCount()).toBe(2);
  });
  it('import cannot bypass unreadable storage or stopped runtime', () => {
    const f = fixture(); f.storage.getItem.mockImplementation(() => { throw Error('read'); });
    const game = f.make(); game.start(); f.storage.setItem.mockClear();
    expect(game.importCode(portable()).ok).toBe(false);
    expect(f.storage.setItem).not.toHaveBeenCalled();
    game.stop();
    expect(game.importCode(portable()).ok).toBe(false);
    expect(game.exportCode().ok).toBe(false);
  });
});

it('confirmed UI import publishes replacement cash immediately; cancel never reaches runtime', () => {
  const f = fixture(); const game = f.make(); game.start(); f.storage.setItem.mockClear();
  const controls = createSaveManagement(game, vi.fn());
  controls.edit(portable(performStarterJob(owned()).state)); controls.validate();
  expect(game.getSnapshot().result.state).toEqual(createInitialGameState());
  controls.cancel();
  expect(f.storage.setItem).not.toHaveBeenCalled();
  controls.validate(); controls.confirm();
  expect(game.getSnapshot().result.state).toEqual(performStarterJob(owned()).state);
  expect(f.publish).toHaveBeenLastCalledWith(game.getSnapshot());
});

describe('level command persistence and time boundaries', () => {
  function funded(level = 1) {
    const base = owned();
    return { ...base, economy: { cash: moneyFromMinorUnits('100000') }, businesses: {
      ...base.businesses, owned: { [STARTER_BUSINESS.id]: { level } },
    } };
  }
  it('reconciles old level first, saves the upgrade, and uses new level only after the boundary', () => {
    const initial = funded(); const f = fixture(encoded(initial)); const game = f.make(); game.start();
    f.at(10100.8); game.execute(state => upgradeBusiness(state, STARTER_BUSINESS.id));
    const upgraded = upgradeBusiness(simulateElapsed(initial, 10000).state, STARTER_BUSINESS.id).state;
    expect(game.getSnapshot().result.state).toEqual(upgraded);
    expect(upgraded.businesses.productionRemainderMilliCents).toBe(initial.businesses.productionRemainderMilliCents);
    expect(JSON.parse(f.raw() ?? '').state).toEqual(upgraded);
    f.at(10101.2); game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(upgraded);
    f.at(10101.8); game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(upgraded, 1).state);
  });
  it('failed upgrade retains accrued old-level income and does not change the rate', () => {
    const initial = owned(); const f = fixture(encoded(initial)); const game = f.make(); game.start();
    f.at(1100); game.execute(state => upgradeBusiness(state, STARTER_BUSINESS.id));
    expect(game.getSnapshot().result).toMatchObject({ ok: false, error: 'insufficient-funds' });
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(initial, 1000).state);
    f.at(2100); game.exportCode();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(initial, 2000).state);
  });
  it('levels survive autosave, reload, export and import with no historical import income', () => {
    const f = fixture(encoded(funded(7))); const game = f.make(); game.start();
    f.advance(AUTOSAVE_CADENCE_MS);
    const current = game.getSnapshot().result.state;
    const code = game.exportCode(); if (!code.ok) throw Error('fixture');
    game.stop(); const second = f.make(); second.start();
    expect(second.getSnapshot().result.state).toEqual(current);
    f.wall(9999999);
    expect(second.importCode(code.code).ok).toBe(true);
    expect(second.getSnapshot().result.state).toEqual(current);
    expect(JSON.parse(f.raw() ?? '').savedAt).toBe(9999999);
    second.stop(); const third = f.make(); third.start();
    expect(third.getSnapshot().result.state).toEqual(current);
  });
  it('migrates v1 local saves before offline simulation and consumes original timestamp once', () => {
    const legacy = { format: 'crime-empire-save', version: 1, savedAt: 1, state: {
      economy: { cash: '0' }, businesses: { ownedIds: [STARTER_BUSINESS.id], productionRemainderMilliCents: 975 },
    } };
    const f = fixture(JSON.stringify(legacy)); f.wall(1001);
    const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed({ ...owned(), city: createInitialGameState().city, progression: { xp: 0 } }, 1000).state);
    expect(JSON.parse(f.raw() ?? '')).toMatchObject({ version: CURRENT_SAVE_VERSION, savedAt: 1001 });
    game.stop(); const second = f.make(); second.start();
    expect(second.getSnapshot().offline?.incomeEarned).toBe('0');
    const historical = encodeSaveText(JSON.stringify(legacy));
    expect(second.importCode(historical).ok).toBe(true);
    expect(second.getSnapshot().result.state).toEqual({ ...owned(), city: createInitialGameState().city, progression: { xp: 0 } });
  });
});
