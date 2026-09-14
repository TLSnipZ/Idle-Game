import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_VEHICLE as K, KAIRO_SENDA as S, TUNING_CATALOG } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { purchaseTuning } from '../game/vehicle-tuning';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
const F = TUNING_CATALOG[0]!, C = TUNING_CATALOG[1]!;
function state() {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('5000000') },
    businesses: { ...s.businesses, owned: { [B.id]: { level: 1 } } },
    garage: { ownedVehicleIds: [K.id, S.id], activeVehicleId: K.id } };
}
describe('durable tuning transactions', () => {
  it('saves payment and fitted build before publication; reload retains both', () => {
    const f = rebirthRuntime(state());
    expect(f.game.configureTuning(K.id, F.id, true)?.ok).toBe(true);
    const write = f.events.findIndex(e => e.type === 'write' && e.state.garage.builds?.[K.id]);
    const publish = f.events.findIndex(e => e.type === 'publish' && e.state.garage.builds?.[K.id]);
    expect(write).toBeGreaterThanOrEqual(0); expect(publish).toBeGreaterThan(write);
    const expected = f.game.getSnapshot().result.state;
    expect(expected.economy.cash).toBe('3500000');
    f.game.stop(); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.garage).toEqual(expected.garage);
    reload.stop();
  });
  it.each(['quota', 'conflict'])('failed %s storage cannot buy or fit a build', kind => {
    const f = rebirthRuntime(state()), before = f.game.getSnapshot().result.state;
    if (kind === 'quota') f.fail(); else f.replaceRaw('other-session');
    const raw = f.raw();
    expect(f.game.configureTuning(K.id, F.id, true)).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(before); expect(f.raw()).toBe(raw);
    expect(f.events.some(e => e.state.garage.builds)).toBe(false);
    f.game.stop();
  });
  it('same setup, invalid IDs and stopped sessions perform no IO', () => {
    const f = rebirthRuntime(state());
    f.game.configureTuning(K.id, F.id, true);
    const raw = f.raw(), reads = f.clockReads(), events = f.events.length;
    expect(f.game.configureTuning(K.id, F.id, false)?.ok).toBe(true);
    expect(f.game.configureTuning(K.id, 'fake', false)?.ok).toBe(false);
    expect(f.game.configureTuning(K.id, C.id, false)?.ok).toBe(false);
    expect(f.game.configureTuning(K.id, F.id, true)?.ok).toBe(false);
    expect(f.clockReads()).toBe(reads); expect(f.events).toHaveLength(events); expect(f.raw()).toBe(raw);
    f.game.stop(); expect(f.game.configureTuning(K.id, null, false)).toBeUndefined();
  });
  it('reconciles old production before installing a new bonus', () => {
    const f = rebirthRuntime(state()); f.at(1000);
    f.game.configureTuning(K.id, F.id, true);
    expect(f.game.getSnapshot().result.state.economy.cash).toBe('3500082');
    expect(f.game.getSnapshot().result.state.businesses.productionRemainderMilliCents).toBe(500);
    f.at(2000); f.tick();
    expect(f.game.getSnapshot().result.state.economy.cash).toBe('3500169');
    f.game.stop();
  });
  it('failed free reconfiguration retains the fitted setup', () => {
    const f = rebirthRuntime(state()); f.game.configureTuning(K.id, F.id, true); f.fail();
    expect(f.game.configureTuning(K.id, null, false)).toBeUndefined();
    expect(f.game.getSnapshot().result.state.garage.builds?.[K.id]?.selectedId).toBe(F.id);
    f.game.stop();
  });
  it('offline catch-up uses the saved fitted bonus once and never the post-return selection', () => {
    const bought = purchaseTuning(state(), F.id); if (!bought.ok) throw Error('fixture');
    const f = rebirthRuntime(bought.state); f.game.stop(); f.wall(2000);
    const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.economy.cash).toBe('3500086');
    expect(reload.getSnapshot().result.state.businesses.productionRemainderMilliCents).toBe(625);
    reload.configureTuning(K.id, null, false);
    expect(reload.getSnapshot().result.state.economy.cash).toBe('3500086');
    reload.stop(); const again = f.make(); again.start();
    expect(again.getSnapshot().result.state.economy.cash).toBe('3500086'); again.stop();
  });
  it('Rebirth retains the build and full reset clears it', () => {
    const bought = purchaseTuning(rebirthState(), F.id); if (!bought.ok) throw Error('fixture');
    const f = rebirthRuntime(bought.state);
    expect(f.game.rebirth().ok).toBe(true);
    expect(f.game.getSnapshot().result.state.garage.builds).toEqual(bought.state.garage.builds);
    f.game.stop(); f.wall(2000); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.garage.builds).toEqual(bought.state.garage.builds);
    expect(reload.resetProgress('RESET').ok).toBe(true);
    expect(reload.getSnapshot().result.state.garage.builds).toBeUndefined(); reload.stop();
  });
});
