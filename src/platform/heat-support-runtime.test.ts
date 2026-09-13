import type { GameState } from '../game/game-state';
import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { evaluateDecoyCost } from '../game/heat-support';
import { assignCrewMember, unassignCrewSlot } from '../game/crew-commands';
import { upgradeBusiness } from '../game/upgrade-business';
import { setActiveDistrict } from '../game/set-active-district';

function state(level = 10): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('100000000') },
    city: { ...s.city, heat: 100, ownedTerritoryIds: ['territory:waterfront', 'territory:neon-mile'] },
    businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level } } },
    crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: 'crew:mara-knox', logistics: null } },
    garage: { ownedVehicleIds: ['vehicle:kairo-kx-r', 'vehicle:namera-lilt'], activeVehicleId: 'vehicle:namera-lilt' } };
}
describe('support prices at durable runtime boundaries', () => {
  it('reads current active car and Crew at the click, with no ownership stacking', () => {
    const f = rebirthRuntime(state());
    expect(evaluateDecoyCost(f.game.getSnapshot().result.state).cost).toBe('81000');
    f.game.selectActiveVehicle('vehicle:kairo-kx-r');
    expect(evaluateDecoyCost(f.game.getSnapshot().result.state).cost).toBe('90000');
    f.game.execute(s => unassignCrewSlot(s, 'operations'));
    expect(evaluateDecoyCost(f.game.getSnapshot().result.state).cost).toBe('100000');
    f.game.execute(s => assignCrewMember(s, 'operations', 'crew:mara-knox'));
    const before = f.game.getSnapshot().result.state.economy.cash;
    expect(f.game.deployManhuntDecoy()?.ok).toBe(true);
    expect(BigInt(before) - BigInt(f.game.getSnapshot().result.state.economy.cash)).toBe(90000n);
    f.game.stop();
  });
  it('crossing Business Level 10 activates cover immediately without a new saved flag', () => {
    const f = rebirthRuntime(state(9));
    expect(evaluateDecoyCost(f.game.getSnapshot().result.state).cost).toBe('101250');
    expect(f.game.execute(s => upgradeBusiness(s, 'business:dockside-detail'))?.ok).toBe(true);
    expect(evaluateDecoyCost(f.game.getSnapshot().result.state).cost).toBe('81000');
    f.game.stop();
  });
  it('travel recalculates the local Business contribution', () => {
    const s = state(), f = rebirthRuntime({ ...s, city: { ...s.city, heat: 79 } });
    expect(f.game.execute(s => setActiveDistrict(s, 'territory:neon-mile'))?.ok).toBe(true);
    expect(evaluateDecoyCost(f.game.getSnapshot().result.state).cost).toBe('101250');
    f.game.stop();
  });
  it.each(['quota', 'conflict'])('a failed %s discounted payment preserves Cash and Heat', kind => {
    const f = rebirthRuntime(state()), before = f.game.getSnapshot().result.state;
    if (kind === 'quota') f.fail(); else f.replaceRaw('other-tab');
    const raw = f.raw();
    expect(f.game.deployManhuntDecoy()).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(before); expect(f.raw()).toBe(raw);
    f.game.stop();
  });
  it('commits the exact discounted price before publishing success and survives reload', () => {
    const f = rebirthRuntime(state()), before = f.game.getSnapshot().result.state.economy.cash;
    f.game.deployManhuntDecoy();
    const write = f.events.findIndex(e => e.type === 'write' && e.state.city.heat === 70);
    const publish = f.events.findIndex(e => e.type === 'publish' && e.state.city.heat === 70);
    expect(write).toBeGreaterThanOrEqual(0); expect(publish).toBeGreaterThan(write);
    expect(BigInt(before) - BigInt(f.game.getSnapshot().result.state.economy.cash)).toBe(81000n);
    f.game.stop(); const reload = f.make(); reload.start();
    expect(evaluateDecoyCost(reload.getSnapshot().result.state).cost).toBe('81000');
    expect(reload.getSnapshot().result.state.city.heat).toBe(70); reload.stop();
  });
});
