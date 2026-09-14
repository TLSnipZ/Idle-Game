import '../game/test-fixtures/active-vehicle-catalog';
import { describe, expect, it, vi } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import type { GameState } from '../game/game-state';
import { createInitialGameState } from '../game/game-state';
import { setActiveVehicle } from '../game/set-active-vehicle';
import * as vehicles from '../features/vehicles';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { parseSave } from '../game/save-schema';
import { exportSaveCode, validateSaveCode, encodeSaveText } from '../game/save-code';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';
const SECOND = 'vehicle:test-coupe';
function both(): GameState {
  return { ...rebirthState(), garage: { ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id } };
}
describe('durable active vehicle selection', () => {
  it('reconciles with the old car, saves before publishing selection and uses the new rate afterward', () => {
    const f = rebirthRuntime(both()), initial = f.game.getSnapshot().result.state;
    f.at(1000); f.wall(2000);
    const result = f.game.selectActiveVehicle(SECOND);
    const expected = setActiveVehicle(onlineElapsed(initial, 1000).state, SECOND).state;
    expect(result?.ok).toBe(true); expect(f.game.getSnapshot().result.state).toEqual(expected);
    const selectedEvents = f.events.filter(event => event.state.garage.activeVehicleId === SECOND);
    expect(selectedEvents.map(event => event.type)).toEqual(['write', 'publish']);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: expected } });
    f.at(2000); f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(expected, 1000).state);
    f.game.stop();
  });
  it('same selection does not read clocks, roll RNG, write, publish, grant achievements or consume elapsed time', () => {
    const random = { next: vi.fn(() => .99) }, f = rebirthRuntime(both(), random);
    const before = f.game.getSnapshot(), raw = f.raw(), reads = f.clockReads();
    f.at(500000);
    expect(f.game.selectActiveVehicle(V.id)).toEqual({ ok: true, state: before.result.state });
    expect(f.game.getSnapshot()).toBe(before); expect(f.clockReads()).toBe(reads);
    expect(f.raw()).toBe(raw); expect(f.events).toEqual([]); expect(random.next).not.toHaveBeenCalled();
    f.game.stop();
    expect(f.game.selectActiveVehicle(V.id)).toBeUndefined(); expect(f.clockReads()).toBe(reads);
  });
  it('invalid and unowned requests do not reconcile or publish', () => {
    const f = rebirthRuntime(rebirthState()), reads = f.clockReads(), state = f.game.getSnapshot().result.state;
    expect(f.game.selectActiveVehicle(SECOND)).toEqual({ ok: false, state, error: 'vehicle-not-owned' });
    expect(f.game.selectActiveVehicle(null)).toEqual({ ok: false, state, error: 'unknown-vehicle' });
    expect(f.clockReads()).toBe(reads); expect(f.events).toEqual([]); f.game.stop();
  });
  it.each(['quota', 'conflict'] as const)('%s preserves old selection and durable data after old-effect reconciliation', failure => {
    const f = rebirthRuntime(both()), before = f.game.getSnapshot().result.state;
    if (failure === 'quota') f.fail(); else f.replaceRaw(f.raw() + ' ');
    const saved = f.raw(); f.at(1000);
    expect(f.game.selectActiveVehicle(SECOND)).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(before, 1000).state);
    expect(f.game.getSnapshot().result.state.garage.activeVehicleId).toBe(V.id);
    expect(f.raw()).toBe(saved);
    expect(f.events.some(e => e.state.garage.activeVehicleId === SECOND)).toBe(false);
    expect(f.game.getSnapshot().persistence.kind).toBe(failure === 'quota' ? 'error' : 'blocked');
    f.game.stop();
  });
  it('successful selection drops only runtime sub-ms and keeps earned production fractions', () => {
    const f = rebirthRuntime(both()), before = f.game.getSnapshot().result.state;
    f.at(10.75); f.game.selectActiveVehicle(SECOND);
    const switched = f.game.getSnapshot().result.state;
    expect(switched.businesses).toEqual(onlineElapsed(before, 10).state.businesses);
    f.at(11); f.tick(); expect(f.game.getSnapshot().result.state).toBe(switched);
    f.at(11.75); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(switched, 1).state);
    f.game.stop();
  });
  it('v17 bootstrap migrates before one-time offline credit and retains the original 10% bonus', () => {
    const state = rebirthState(), { activeVehicleId: _active, ...garage } = state.garage;
    let raw = JSON.stringify({ format: 'crime-empire-save', version: 17, savedAt: 1000, state: { ...state, garage } });
    const saves = createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }), () => 26000);
    const loaded = saves.bootstrap(), expected = simulateGameElapsed(state, 25000).state;
    expect(loaded).toMatchObject({ kind: 'loaded', state: expected });
    expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { version: 25, savedAt: 26000, state: expected } });
    expect(saves.bootstrap()).toMatchObject({ kind: 'loaded', state: expected, offline: { incomeEarned: '0' } });
  });
  it('offline credit uses the saved car before a later switch; reload and CE1 retain selection', () => {
    const f = rebirthRuntime(both()); f.game.stop(); f.wall(26000);
    const loaded = f.make(); loaded.start();
    const credited = loaded.getSnapshot().result.state;
    expect(credited).toEqual(simulateGameElapsed(both(), 25000).state);
    expect(loaded.selectActiveVehicle(SECOND)?.ok).toBe(true);
    const selected = loaded.getSnapshot().result.state;
    expect(selected.economy).toEqual(credited.economy);
    const code = loaded.exportCode(); if (!code.ok) throw Error(code.error);
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: selected } });
    loaded.stop(); const again = f.make(); again.start();
    expect(again.getSnapshot().result.state).toEqual(selected); again.stop();
  });
  it('Rebirth preserves selection; explicit New Game clears it', () => {
    const f = rebirthRuntime(setActiveVehicle(both(), SECOND).state);
    expect(f.game.rebirth().ok).toBe(true);
    expect(f.game.getSnapshot().result.state.garage.activeVehicleId).toBe(SECOND);
    expect(f.game.resetProgress('RESET')).toEqual({ ok: true });
    expect(f.game.getSnapshot().result.state).toEqual(createInitialGameState()); f.game.stop();
  });
  it.each(['valid', 'invalid', 'quota'] as const)('CE1 import %s is atomic and never credits the historical timestamp', mode => {
    const f = rebirthRuntime(both()), before = f.game.getSnapshot().result.state, raw = f.raw();
    const incoming = setActiveVehicle(both(), SECOND).state;
    const exported = exportSaveCode(incoming, 1); if (!exported.ok) throw Error(exported.error);
    const code = mode === 'invalid' ? encodeSaveText(JSON.stringify({ format: 'crime-empire-save', version: 23,
      savedAt: 1, state: { ...incoming, garage: { ...incoming.garage, activeVehicleId: 'vehicle:unknown' } } })) : exported.code;
    if (mode === 'quota') f.fail(); f.wall(1000000);
    expect(f.game.importCode(code).ok).toBe(mode === 'valid');
    expect(f.game.getSnapshot().result.state).toEqual(mode === 'valid' ? incoming : before);
    if (mode !== 'valid') expect(f.raw()).toBe(raw);
    f.game.stop();
  });
  it('blocked and failed-offline sessions reject selection without touching clocks', () => {
    for (const raw of ['broken', JSON.stringify({ format: 'crime-empire-save', version: 23, savedAt: 0, state: both() })]) {
      const now = vi.fn(() => 0), game = createPersistentGame(() => {},
        createLocalSave(() => ({ getItem: () => raw, setItem: () => { throw Error('write'); } }), () => 1000),
        { now, schedule: () => () => {} }, () => () => {});
      game.start(); const reads = now.mock.calls.length;
      expect(game.selectActiveVehicle(V.id)).toBeUndefined(); expect(now).toHaveBeenCalledTimes(reads); game.stop();
    }
  });
});

it('a different car with the same effect preserves fractional runtime time', () => {
  const lookup = vehicles.findVehicle;
  const spy = vi.spyOn(vehicles, 'findVehicle').mockImplementation(id => {
    const vehicle = lookup(id);
    return vehicle?.id === SECOND ? { ...vehicle, modifiers: V.modifiers } : vehicle;
  });
  try {
    const f = rebirthRuntime(both());
    f.at(10.75); expect(f.game.selectActiveVehicle(SECOND)?.ok).toBe(true);
    const selected = f.game.getSnapshot().result.state;
    f.at(11); f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(selected, 1).state);
    f.game.stop();
  } finally { spy.mockRestore(); }
});
