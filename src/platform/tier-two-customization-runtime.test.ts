import { describe, expect, it } from 'vitest';
import type { GameState } from '../game/game-state';
import { createInitialGameState } from '../game/game-state';
import { VEHICLE_CATALOG } from '../features/vehicles';
import { moneyFromMinorUnits } from '../features/economy';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { parseSave } from '../game/save-schema';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
const C = 'vehicle:sevrin-canto-club', R = 'vehicle:toseki-rendan';
const F = 'tuning:canto-fleet-gearing', D = 'tuning:rendan-dispatch-gearing';
function state(): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level: 1 } } },
    garage: { ownedVehicleIds: VEHICLE_CATALOG.map(car => car.id), activeVehicleId: C } };
}
describe('Tier-2 durable customization', () => {
  it.each(['quota', 'conflict'])('preserves Cash, build and paint on %s failure', kind => {
    const f = rebirthRuntime(state());
    f.game.configureTuning(C, F, true);
    const before = f.game.getSnapshot().result.state;
    if (kind === 'quota') f.fail(); else f.replaceRaw('another session');
    const raw = f.raw();
    f.game.configureTuning(R, D, true);
    f.game.configureTuning(C, null, false);
    f.game.configureAppearance(C, 'appearance:canto-burgundy');
    expect(f.game.getSnapshot().result.state).toEqual(before);
    expect(f.raw()).toBe(raw); f.game.stop();
  });
  it('reconciles old production before fitting and writes before publishing the new setup', () => {
    const f = rebirthRuntime(state()); f.at(10000);
    expect(f.game.configureTuning(C, F, true)?.ok).toBe(true);
    const after = f.game.getSnapshot().result.state;
    expect(after.economy.cash).toBe('96000885');
    const write = f.events.findIndex(e => e.type === 'write' && e.state.garage.builds?.[C]?.selectedId === F);
    expect(write).toBeGreaterThanOrEqual(0);
    expect(f.events.findIndex(e => e.type === 'publish' && e.state.garage.builds?.[C]?.selectedId === F)).toBeGreaterThan(write);
    f.at(20000); f.tick();
    expect(f.game.getSnapshot().result.state.economy.cash).toBe('96001814');
    f.game.stop();
  });
  it('reloads independently fitted cars and finishes, credits offline once and clears them only on reset', () => {
    const f = rebirthRuntime(state());
    f.game.configureTuning(C, F, true); f.game.configureTuning(R, D, true);
    f.game.configureAppearance(C, 'appearance:canto-slate');
    f.game.configureAppearance(R, 'appearance:rendan-ice');
    const before = f.game.getSnapshot().result.state;
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { version: 27, state: before } });
    f.game.stop(); f.wall(11000);
    const reload = f.make(); reload.start();
    const expected = simulateGameElapsed(before, 10000); if (!expected.ok) throw Error(expected.error);
    expect(reload.getSnapshot().result.state.economy).toEqual(expected.state.economy);
    expect(reload.getSnapshot().result.state.garage).toEqual(before.garage);
    const credited = reload.getSnapshot().result.state.economy;
    reload.stop(); const again = f.make(); again.start();
    expect(again.getSnapshot().result.state.economy).toEqual(credited);
    expect(again.resetProgress('RESET').ok).toBe(true);
    expect(again.getSnapshot().result.state.garage).toEqual({ ownedVehicleIds: [], activeVehicleId: null });
    again.stop();
  });
});
