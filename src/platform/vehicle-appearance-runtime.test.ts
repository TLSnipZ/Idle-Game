import { describe, expect, it } from 'vitest';
import { STARTER_VEHICLE as K, NAMERA_LILT as L } from '../features/vehicles';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
const look = 'appearance:kxr-coastal';
function fixture() { const s = rebirthState(); return { ...s, garage: { ownedVehicleIds: [K.id, L.id], activeVehicleId: K.id } }; }
describe('durable appearance commands', () => {
  it.each(['quota', 'conflict'])('preserves the live and saved look on %s failure', kind => {
    const f = rebirthRuntime(fixture());
    if (kind === 'quota') f.fail(); else f.replaceRaw('other-session');
    const before = f.game.getSnapshot().result.state, raw = f.raw();
    expect(f.game.configureAppearance(K.id, look)).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(before);
    expect(f.raw()).toBe(raw);
    expect(f.events.every(event => event.type === 'publish' && event.state === before)).toBe(true);
    f.game.stop();
  });
  it('rejects invalid and repeated choices before clock or storage IO', () => {
    const f = rebirthRuntime(fixture()), reads = f.clockReads(), raw = f.raw();
    f.game.configureAppearance(K.id, null); f.game.configureAppearance(L.id, look);
    f.game.configureAppearance('fake', look);
    expect(f.clockReads()).toBe(reads); expect(f.raw()).toBe(raw); expect(f.events).toHaveLength(0);
    f.game.stop();
  });
  it('writes before publishing, reloads each finish, imports CE1 and clears on New Game', () => {
    const f = rebirthRuntime(fixture());
    expect(f.game.configureAppearance(K.id, look)?.ok).toBe(true);
    f.game.configureAppearance(L.id, 'appearance:lilt-ivory');
    const looks = f.game.getSnapshot().result.state.garage.appearances;
    const write = f.events.findIndex(e => e.type === 'write' && e.state.garage.appearances?.[K.id] === look);
    const publish = f.events.findIndex(e => e.type === 'publish' && e.state.garage.appearances?.[K.id] === look);
    expect(write).toBeGreaterThanOrEqual(0); expect(publish).toBeGreaterThan(write);
    const code = f.game.exportCode(); if (!code.ok) throw Error(code.error);
    f.game.stop(); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.garage.appearances).toEqual(looks);
    expect(reload.resetProgress('RESET').ok).toBe(true);
    expect(reload.getSnapshot().result.state.garage.appearances).toBeUndefined();
    expect(reload.importCode(code.code).ok).toBe(true);
    expect(reload.getSnapshot().result.state.garage.appearances).toEqual(looks);
    reload.stop();
  });
});
