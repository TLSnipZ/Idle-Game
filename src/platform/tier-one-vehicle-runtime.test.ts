import { expect, it } from 'vitest';
import { KAIRO_SENDA as S, NAMERA_LILT as L, STARTER_VEHICLE as K, VEHICLE_CATALOG } from '../features/vehicles';
import type { VehicleId } from '../features/vehicles';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { setActiveVehicle } from '../game/set-active-vehicle';
import { getHeatDecayIntervalMs } from '../game/heat-decay-interval';
import { parseSave } from '../game/save-schema';
import { validateSaveCode, exportSaveCode } from '../game/save-code';
import { unlockEligibleAchievements } from '../game/achievements';
import { createInitialGameState } from '../game/game-state';
function state(id: VehicleId = K.id) {
  const initial = rebirthState();
  return { ...initial, city: { ...initial.city, heat: 50, heatDecayElapsedMs: 56000 },
    garage: { ownedVehicleIds: VEHICLE_CATALOG.map(v => v.id), activeVehicleId: id } };
}
it.each([S.id, L.id])('real %s reconciles old effects, saves before publication and applies future effects', id => {
  const f = rebirthRuntime(state()), before = f.game.getSnapshot().result.state;
  f.at(1000); const result = f.game.selectActiveVehicle(id);
  const expected = setActiveVehicle(onlineElapsed(before, 1000).state, id).state;
  expect(result).toMatchObject({ ok: true, state: expected });
  expect(f.events.filter(e => e.state.garage.activeVehicleId === id).map(e => e.type)).toEqual(['write', 'publish']);
  expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: expected } });
  f.at(2000); f.tick();
  expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(expected, 1000).state);
  f.game.stop();
});
it.each(['quota', 'conflict'] as const)('%s never publishes Lilt or consumes its cooling on failed switch', failure => {
  const f = rebirthRuntime(state()), before = f.game.getSnapshot().result.state;
  if (failure === 'quota') f.fail(); else f.replaceRaw(f.raw() + ' ');
  const raw = f.raw(); f.at(1000);
  expect(f.game.selectActiveVehicle(L.id)).toBeUndefined();
  expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(before, 1000).state);
  expect(f.raw()).toBe(raw); expect(f.events.some(e => e.state.garage.activeVehicleId === L.id)).toBe(false);
  f.game.stop();
});
it.each([S.id, L.id])('%s saved effects govern offline credit once, reload and CE1', id => {
  const f = rebirthRuntime(state(id)); f.game.stop(); f.wall(58000);
  const loaded = f.make(); loaded.start();
  const expected = simulateGameElapsed(state(id), 57000).state;
  expect(loaded.getSnapshot().result.state).toEqual(expected);
  const code = loaded.exportCode(); if (!code.ok) throw Error(code.error);
  expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: expected } });
  loaded.stop(); const again = f.make(); again.start();
  expect(again.getSnapshot().result.state).toEqual(expected); again.stop();
});
it.each([S.id, L.id])('%s survives Rebirth below purchase gates; New Game clears all vehicles', id => {
  const f = rebirthRuntime(state(id));
  expect(f.game.rebirth().ok).toBe(true);
  const reborn = f.game.getSnapshot().result.state;
  expect(reborn.garage).toEqual(state(id).garage);
  expect(getHeatDecayIntervalMs(reborn)).toBe(id === L.id ? 57000 : 60000);
  expect(f.game.resetProgress('RESET')).toEqual({ ok: true });
  expect(f.game.getSnapshot().result.state).toEqual(createInitialGameState()); f.game.stop();
});
it('imports all three vehicles without historical earnings and retains selection after reload', () => {
  const f = rebirthRuntime(), incoming = unlockEligibleAchievements(state(L.id)).state, code = exportSaveCode(incoming, 1);
  if (!code.ok) throw Error(code.error); f.wall(1000000);
  expect(f.game.importCode(code.code).ok).toBe(true);
  expect(f.game.getSnapshot().result.state).toEqual(incoming); f.game.stop();
  const again = f.make(); again.start(); expect(again.getSnapshot().result.state).toEqual(incoming); again.stop();
});
