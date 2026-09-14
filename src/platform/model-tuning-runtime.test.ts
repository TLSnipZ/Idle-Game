import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { KAIRO_SENDA as S, NAMERA_LILT as L, STARTER_VEHICLE as K } from '../features/vehicles';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { purchaseTuning } from '../game/vehicle-tuning';
import { getHeatDecayIntervalMs } from '../game/heat-decay-interval';
const E = 'tuning:senda-express-ecu', Q = 'tuning:lilt-quiet-running', D = 'tuning:lilt-decoy-kit';
function state(): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('100000000') },
    city: { ...s.city, heat: 10 },
    garage: { ownedVehicleIds: [K.id, S.id, L.id], activeVehicleId: L.id } };
}
function buy(s: GameState, id: string) { const r = purchaseTuning(s, id); if (!r.ok) throw Error(r.error); return r.state; }
describe('model tuning persistence and chronology', () => {
  it.each(['quota', 'conflict'])('cannot buy or switch model builds when storage has a %s failure', kind => {
    const f = rebirthRuntime(buy(state(), E));
    if (kind === 'quota') f.fail(); else f.replaceRaw('other-session');
    const before = f.game.getSnapshot().result.state, raw = f.raw();
    expect(f.game.configureTuning(L.id, Q, true)).toBeUndefined();
    expect(f.game.configureTuning(S.id, null, false)).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(before);
    expect(f.raw()).toBe(raw);
    expect(f.events.every(event => event.type === 'publish' && event.state === before)).toBe(true);
    f.game.stop();
  });
  it('makes mismatched, unpurchased and repeated intents IO-free before reconciliation', () => {
    const f = rebirthRuntime(buy(state(), E));
    const reads = f.clockReads(), raw = f.raw();
    for (const [car, part, purchase] of [[S.id, Q, true], [L.id, E, false], [S.id, null, true], [L.id, Q, false], [S.id, E, false]] as const)
      f.game.configureTuning(car, part, purchase);
    expect(f.clockReads()).toBe(reads); expect(f.raw()).toBe(raw); expect(f.events).toHaveLength(0);
    f.game.stop();
  });
  it('reconciles the old Lilt interval before fitting and preserves earned cooling time', () => {
    const f = rebirthRuntime(state()); f.at(56000);
    expect(f.game.configureTuning(L.id, Q, true)?.ok).toBe(true);
    const fitted = f.game.getSnapshot().result.state;
    expect(fitted.city.heat).toBe(10); expect(fitted.city.heatDecayElapsedMs).toBe(56000);
    expect(getHeatDecayIntervalMs(fitted)).toBe(54000);
    const write = f.events.findIndex(e => e.type === 'write' && e.state.garage.builds?.[L.id]);
    const publish = f.events.findIndex(e => e.type === 'publish' && e.state.garage.builds?.[L.id]);
    expect(write).toBeGreaterThanOrEqual(0); expect(publish).toBeGreaterThan(write);
    f.at(57000); f.tick();
    expect(f.game.getSnapshot().result.state.city).toMatchObject({ heat: 9, heatDecayElapsedMs: 3000 });
    f.game.stop();
  });
  it('uses saved quiet-running tuning for offline cooling exactly once', () => {
    const f = rebirthRuntime(buy(state(), Q)); f.game.stop(); f.wall(109000);
    const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.city).toMatchObject({ heat: 8, heatDecayElapsedMs: 0 });
    reload.configureTuning(L.id, null, false);
    expect(reload.getSnapshot().result.state.city.heat).toBe(8);
    reload.stop(); const again = f.make(); again.start();
    expect(again.getSnapshot().result.state.city.heat).toBe(8);
    expect(again.getSnapshot().result.state.garage.builds?.[L.id]?.purchasedIds).toEqual([Q]);
    again.stop();
  });
  it('charges the tuned decoy price before publishing the Heat reduction', () => {
    const initial = buy(state(), D), f = rebirthRuntime({ ...initial, city: { ...initial.city, heat: 80 } });
    const before = f.game.getSnapshot().result.state.economy.cash;
    expect(f.game.deployManhuntDecoy()?.ok).toBe(true);
    const after = f.game.getSnapshot().result.state;
    expect(BigInt(before) - BigInt(after.economy.cash)).toBe(101250n);
    expect(after.city.heat).toBe(50);
    expect(f.events.findIndex(e => e.type === 'write' && e.state.city.heat === 50))
      .toBeLessThan(f.events.findIndex(e => e.type === 'publish' && e.state.city.heat === 50));
    f.game.stop();
  });
  it('reloads independent builds and clears every model on full New Game', () => {
    const f = rebirthRuntime(buy(buy(state(), E), Q));
    f.game.configureTuning(S.id, null, false); f.game.stop();
    const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.garage.builds).toEqual({
      [S.id]: { purchasedIds: [E], selectedId: null }, [L.id]: { purchasedIds: [Q], selectedId: Q },
    });
    expect(reload.resetProgress('RESET').ok).toBe(true);
    expect(reload.getSnapshot().result.state.garage.builds).toBeUndefined();
    reload.stop();
  });
});
