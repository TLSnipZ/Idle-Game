import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { WATERFRONT as W, NEON_MILE as N, getActiveDistrictId, getDistrictHeat } from '../features/territories';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { DELIVERY_DISPATCHER } from '../features/automation';

function fixture() {
  const s = createInitialGameState();
  return rebirthRuntime({ ...s, city: { ...s.city, ownedTerritoryIds: [W.id, N.id], heat: 79, heatDecayElapsedMs: 0 },
    automation: { ...s.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } });
}
describe('durable district selection', () => {
  it('reconciles old Waterfront income, then writes before publishing the new district', () => {
    const f = fixture(); f.at(10000);
    expect(f.game.selectActiveDistrict(N.id)?.ok).toBe(true);
    const state = f.game.getSnapshot().result.state;
    expect(state.economy.cash).toBe('2475');
    expect(getDistrictHeat(state.city, W.id).heat).toBe(79);
    const write = f.events.findIndex(e => e.type === 'write' && getActiveDistrictId(e.state.city) === N.id);
    const publish = f.events.findIndex(e => e.type === 'publish' && getActiveDistrictId(e.state.city) === N.id);
    expect(write).toBeGreaterThanOrEqual(0); expect(publish).toBeGreaterThan(write);
    const reads = f.clockReads(), eventCount = f.events.length;
    f.game.selectActiveDistrict(N.id);
    expect(f.clockReads()).toBe(reads); expect(f.events).toHaveLength(eventCount);
    f.game.stop(); const reload = f.make(); reload.start();
    expect(getActiveDistrictId(reload.getSnapshot().result.state.city)).toBe(N.id); reload.stop();
  });
  it('storage failure preserves location and both Heat values', () => {
    const f = fixture(), raw = f.raw(); f.fail();
    expect(f.game.selectActiveDistrict(N.id)).toBeUndefined();
    expect(getActiveDistrictId(f.game.getSnapshot().result.state.city)).toBe(W.id);
    expect(f.game.getSnapshot().result.state.city.heat).toBe(79);
    expect(f.game.getSnapshot().persistence.kind).toBe('error');
    expect(f.raw()).toBe(raw); f.game.stop();
  });
  it('a conflicting save blocks travel without overwriting it', () => {
    const f = fixture(); f.replaceRaw('other-tab');
    expect(f.game.selectActiveDistrict(N.id)).toBeUndefined();
    expect(getActiveDistrictId(f.game.getSnapshot().result.state.city)).toBe(W.id);
    expect(f.raw()).toBe('other-tab'); f.game.stop();
  });
});
