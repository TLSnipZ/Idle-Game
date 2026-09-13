import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { WATERFRONT as W, NEON_MILE as N } from '../features/territories';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
function fixture(heat = 80) {
  const s = createInitialGameState();
  return rebirthRuntime({ ...s, economy: { cash: moneyFromMinorUnits('125000') },
    city: { ...s.city, ownedTerritoryIds: [W.id, N.id], heat } });
}
describe('MANHUNT durable commands', () => {
  it('writes decoy payment and cooling before publication, and reload retains both', () => {
    const f = fixture();
    expect(f.game.deployManhuntDecoy()?.ok).toBe(true);
    const write = f.events.findIndex(e => e.type === 'write' && e.state.city.heat === 50);
    const publish = f.events.findIndex(e => e.type === 'publish' && e.state.city.heat === 50);
    expect(write).toBeGreaterThanOrEqual(0); expect(publish).toBeGreaterThan(write);
    expect(f.game.getSnapshot().result.state.economy.cash).toBe('0');
    const writes = f.events.filter(e => e.type === 'write').length;
    expect(f.game.deployManhuntDecoy()).toMatchObject({ ok: false, error: 'no-manhunt' });
    expect(f.events.filter(e => e.type === 'write')).toHaveLength(writes);
    f.game.stop(); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state).toMatchObject({ economy: { cash: '0' }, city: { heat: 50 } });
    reload.stop();
  });
  it.each(['quota', 'conflict'])('failed %s write cannot spend or clear MANHUNT', kind => {
    const f = fixture(), state = f.game.getSnapshot().result.state;
    if (kind === 'quota') f.fail(); else f.replaceRaw('other-tab');
    const raw = f.raw();
    expect(f.game.deployManhuntDecoy()).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(state);
    expect(f.raw()).toBe(raw);
    expect(f.events.some(e => e.type === 'publish' && e.state.city.heat === 50)).toBe(false);
    f.game.stop();
  });
  it('reconciles cooling before charging: a pursuit ending between ticks costs nothing', () => {
    const f = fixture(); f.at(60000);
    expect(f.game.deployManhuntDecoy()).toMatchObject({ ok: false, error: 'no-manhunt' });
    expect(f.game.getSnapshot().result.state).toMatchObject({ city: { heat: 79 }, economy: { cash: '125000' } });
    f.game.stop();
  });
  it('reconciles a stale roadblock before travel and still refuses an active one', () => {
    const f = fixture();
    expect(f.game.selectActiveDistrict(N.id)).toMatchObject({ ok: false, error: 'district-manhunt' });
    f.at(60000);
    expect(f.game.selectActiveDistrict(N.id)?.ok).toBe(true);
    expect(f.game.getSnapshot().result.state.city).toMatchObject({ heat: 0, districts: { activeId: N.id, parked: { heat: 79 } } });
    f.game.stop();
  });
  it('stopped sessions cannot deploy or spend', () => {
    const f = fixture(); f.game.stop(); const raw = f.raw(), reads = f.clockReads();
    expect(f.game.deployManhuntDecoy()).toBeUndefined();
    expect(f.raw()).toBe(raw); expect(f.clockReads()).toBe(reads);
  });
});
