import { expect, test, vi } from 'vitest';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { unlockEligibleAchievements } from '../game/achievements';
import { setActiveVehicle } from '../game/set-active-vehicle';
import { serializeSave, parseSave } from '../game/save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from '../game/save-code';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';

vi.mock('../features/vehicles', async importOriginal => {
  const actual = await importOriginal<typeof import('../features/vehicles')>();
  const extra = { ...actual.STARTER_VEHICLE, id: 'vehicle:test-active' as const,
    modifier: { ...actual.STARTER_VEHICLE.modifier, id: 'modifier:test-active', sourceId: 'vehicle:test-active', bonusBasisPoints: 2000 } };
  const catalog = [...actual.VEHICLE_CATALOG, extra];
  return { ...actual, VEHICLE_CATALOG: catalog, findVehicle: (id: unknown) => catalog.find(v => v.id === id) };
});
const SECOND = 'vehicle:test-active' as const;
function ready() {
  const s = rebirthState();
  return unlockEligibleAchievements({ ...s, garage: { ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id } }).state;
}
function fixture(state: GameState = ready(), historical?: string, wallStart = 1000) {
  const encoded = serializeSave(state, 1000); if (!encoded.ok) throw Error('fixture');
  let raw = historical ?? encoded.serialized, now = 0, wall = wallStart, fail = false;
  let tick = () => {};
  const writes = vi.fn((_key: string, next: string) => { if (fail) throw Error('quota'); raw = next; });
  const clock = vi.fn(() => now), random = vi.fn(() => .99);
  const snapshots: GameState[] = [];
  const game = createPersistentGame(view => {
    snapshots.push(view.result.state);
    if (view.result.state.garage.activeVehicleId === SECOND && snapshots.at(-2)?.garage.activeVehicleId !== SECOND) {
      expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { state: view.result.state } });
    }
  }, createLocalSave(() => ({ getItem: () => raw, setItem: writes }), () => wall),
  { now: clock, random: { next: random }, schedule: cb => { tick = cb; return () => {}; } }, () => () => {});
  return { game, clock, random, writes, snapshots, raw: () => raw, fail: () => { fail = true; },
    corrupt: (value: string) => { raw = value; }, at: (value: number) => { now = value; wall = wallStart + Math.floor(value); }, tick: () => tick() };
}
test('switch reconciles old effects, durably saves selection, then uses the new effect only prospectively', () => {
  const input = ready(), f = fixture(input); f.game.start(); f.game.dismissOffline();
  f.at(10000); const result = f.game.activateVehicle(SECOND);
  expect(result?.ok).toBe(true);
  const expected = setActiveVehicle(onlineElapsed(input, 10000).state, SECOND).state;
  expect(f.game.getSnapshot().result.state).toEqual(expected);
  expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: expected } });
  f.at(15000); f.tick();
  expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(expected, 5000).state);
  f.game.stop();
});
test('same active car is a true no-op: no clock, RNG, save, notifications or achievement scan', () => {
  const f = fixture(); f.game.start();
  const previous = f.game.getSnapshot(), raw = f.raw(), writes = f.writes.mock.calls.length;
  f.clock.mockClear(); f.random.mockClear(); f.snapshots.length = 0;
  f.at(10000.75);
  for (let i = 0; i < 20; i++) expect(f.game.activateVehicle(V.id)).toEqual({ ok: true, state: previous.result.state });
  expect(f.game.getSnapshot()).toBe(previous); expect(f.raw()).toBe(raw);
  expect(f.writes).toHaveBeenCalledTimes(writes); expect(f.clock).not.toHaveBeenCalled(); expect(f.random).not.toHaveBeenCalled(); expect(f.snapshots).toEqual([]);
  f.tick(); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(previous.result.state, 10000).state); f.game.stop();
});
test('successful switch discards only runtime sub-ms, preserving authoritative earned fractions', () => {
  const input = ready(), f = fixture(input); f.game.start(); f.at(10.75); f.game.activateVehicle(SECOND);
  const changed = f.game.getSnapshot().result.state;
  expect(changed.businesses).toEqual(onlineElapsed(input, 10).state.businesses);
  f.at(11); f.tick(); expect(f.game.getSnapshot().result.state).toBe(changed);
  f.at(11.75); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(changed, 1).state); f.game.stop();
});
test.each(['quota', 'conflict'] as const)('%s failure keeps old selection and durable save, never publishes the candidate', failure => {
  const input = ready(), f = fixture(input); f.game.start();
  if (failure === 'quota') f.fail(); else f.corrupt(f.raw().replace('\"savedAt\":1000', '\"savedAt\":1001'));
  const raw = f.raw(); f.snapshots.length = 0; f.at(1000.75);
  expect(f.game.activateVehicle(SECOND)).toBeUndefined();
  const reconciled = onlineElapsed(input, 1000).state;
  expect(f.game.getSnapshot().result.state).toEqual(reconciled); expect(f.raw()).toBe(raw);
  expect(f.snapshots.every(s => s.garage.activeVehicleId === V.id)).toBe(true);
  expect(f.game.getSnapshot().persistence.kind).toBe(failure === 'quota' ? 'error' : 'blocked');
  f.at(1001); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(reconciled, 1).state); f.game.stop();
});
test('switch is unavailable before start, after stop and for a blocked save', () => {
  const f = fixture(); expect(f.game.activateVehicle(SECOND)).toBeUndefined(); f.game.start(); f.game.stop();
  expect(f.game.activateVehicle(SECOND)).toBeUndefined();
  const blocked = fixture(ready(), 'broken'); blocked.game.start();
  expect(blocked.game.activateVehicle(SECOND)).toBeUndefined(); expect(blocked.writes).not.toHaveBeenCalled(); blocked.game.stop();
});
test('invalid and unowned IDs neither spend nor switch', () => {
  const initial = ready(), f = fixture({ ...initial, garage: { ownedVehicleIds: [V.id], activeVehicleId: V.id } }); f.game.start();
  const raw = f.raw(), state = f.game.getSnapshot().result.state;
  expect(f.game.activateVehicle(SECOND)).toMatchObject({ ok: false, error: 'vehicle-not-owned' });
  expect(f.game.activateVehicle('vehicle:unknown')).toMatchObject({ ok: false, error: 'unknown-vehicle' });
  expect(f.raw()).toBe(raw); expect(f.game.getSnapshot().result.state).toBe(state); f.game.stop();
});
test('offline catch-up uses the saved selection before the return-time switch; reload never credits twice', () => {
  const input = ready(), f = fixture(input, undefined, 61000); f.game.start();
  const earned = unlockEligibleAchievements(simulateGameElapsed(input, 60000).state).state;
  expect(f.game.getSnapshot().result.state).toEqual(earned);
  expect(f.game.activateVehicle(SECOND)?.ok).toBe(true);
  const selected = setActiveVehicle(earned, SECOND).state; expect(f.game.getSnapshot().result.state).toEqual(selected);
  const raw = f.raw(); f.game.stop(); const reload = fixture(selected, raw, 61000); reload.game.start();
  expect(reload.game.getSnapshot().offline?.incomeEarned).toBe('0');
  expect(reload.game.getSnapshot().result.state).toEqual(selected); reload.game.stop();
});
test('v17 local owner migrates before offline earnings; CE1 import rebases and preserves selection without historical income', () => {
  const base = rebirthState(), { activeVehicleId: _active, ...garage } = base.garage;
  const old = JSON.stringify({ format: 'crime-empire-save', version: 17, savedAt: 1000, state: { ...base, garage } });
  const f = fixture(base, old, 11000); f.game.start();
  expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(simulateGameElapsed(base, 10000).state).state);
  expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { version: 18, state: { garage: { activeVehicleId: V.id } } } });
  expect(f.game.importCode(encodeSaveText(old))).toEqual({ ok: true });
  expect(f.game.getSnapshot().result.state).toEqual(base);
  expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 11000 } }); f.game.stop();
});
test('CE1, Rebirth and Reset keep their distinct selection semantics; failed import cannot replace it', () => {
  const f = fixture(); f.game.start(); expect(f.game.activateVehicle(SECOND)?.ok).toBe(true);
  const code = f.game.exportCode(); if (!code.ok) throw Error('export');
  expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: { garage: { activeVehicleId: SECOND } } } });
  expect(f.game.rebirth().ok).toBe(true); expect(f.game.getSnapshot().result.state.garage.activeVehicleId).toBe(SECOND);
  const old = f.game.getSnapshot().result.state, raw = f.raw(); const other = exportSaveCode(ready(), 1); if (!other.ok) throw Error('fixture');
  f.fail(); expect(f.game.importCode(other.code)).toMatchObject({ ok: false, error: 'persistence-failure' });
  expect(f.game.getSnapshot().result.state).toBe(old); expect(f.raw()).toBe(raw); f.game.stop();
  const reset = fixture(); reset.game.start(); expect(reset.game.resetProgress('RESET')).toEqual({ ok: true });
  expect(reset.game.getSnapshot().result.state.garage).toEqual(createInitialGameState().garage); reset.game.stop();
});
