import { afterEach, describe, expect, it, vi } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { purchaseBusiness } from '../game/purchase-business';
import { upgradeBusiness } from '../game/upgrade-business';
import { setBusinessAutoUpgraderTarget } from '../game/set-auto-upgrader-target';
import { setAutomationEnabled } from '../game/set-automation-enabled';
import { purchaseAutomation } from '../game/purchase-automation';
import { createInitialGameState } from '../game/game-state';
import { parseSave } from '../game/save-schema';
import { reconcileOffline } from '../game/offline-progress';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER } from '../features/automation';
import { rational } from '../shared/rational';
import * as production from '../game/simulate-elapsed';
const L: `business:${string}` = 'business:neon-laundry';
function ready() {
  const s = autoUpgraderState();
  return { ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned, [L]: { level: 1 } } } };
}
afterEach(() => vi.restoreAllMocks());
describe('durable portfolio boundaries', () => {
  it('acquisition reconciles old production, preserves both fractions and writes before ownership publishes', () => {
    const s = autoUpgraderState(), input = { ...s, automation: createInitialGameState().automation,
      businesses: { ...s.businesses, productionRemainderMilliCents: 913, productionRemainderSubMilliCents: rational(1n, 3n) } };
    const f = rebirthRuntime(input); f.at(1000); f.wall(2000);
    const result = f.game.execute(state => purchaseBusiness(state, L)); expect(result?.ok).toBe(true);
    expect(result?.state.economy.cash).toBe(String(BigInt(input.economy.cash) + 1875n - 3500000n));
    expect(result?.state.businesses.productionRemainderMilliCents).toBe(913);
    expect(result?.state.businesses.productionRemainderSubMilliCents).toEqual(rational(1n, 3n));
    const acquisition = f.events.filter(e => e.state.businesses.owned[L]); expect(acquisition.map(e => e.type)).toEqual(['write', 'publish']);
    f.at(2000); f.tick(); expect(f.game.getSnapshot().result.state.economy.cash).toBe(String(BigInt(result!.state.economy.cash) + 2375n)); f.game.stop();
  });
  it('manual upgrade uses old-level production first and the new rate only afterward', () => {
    const s = ready(), f = rebirthRuntime({ ...s, automation: createInitialGameState().automation });
    f.at(1000); const result = f.game.execute(state => upgradeBusiness(state, L)); expect(result?.ok).toBe(true);
    expect(result?.state.economy.cash).toBe(String(BigInt(s.economy.cash) + 2375n - 100000n));
    f.at(2000); f.tick(); expect(f.game.getSnapshot().result.state.economy.cash).toBe(String(BigInt(result!.state.economy.cash) + 2875n)); f.game.stop();
  });
  it('target switch first processes elapsed old-target attempts then preserves the remaining cadence', () => {
    const s = ready(), f = rebirthRuntime({ ...s, automation: { ...s.automation, businessAutoUpgradeElapsedMs: 20000 } });
    f.at(15000); const changed = f.game.execute(state => setBusinessAutoUpgraderTarget(state, L)); expect(changed?.ok).toBe(true);
    expect(changed?.state.businesses.owned['business:dockside-detail']?.level).toBe(26);
    expect(changed?.state.businesses.owned[L]?.level).toBe(1);
    expect(changed?.state.automation.businessAutoUpgradeElapsedMs).toBe(5000);
    f.at(40000); f.tick(); expect(f.game.getSnapshot().result.state.businesses.owned[L]?.level).toBe(2);
    expect(f.game.getSnapshot().result.state.businesses.owned['business:dockside-detail']?.level).toBe(26); f.game.stop();
  });
  it.each(['acquire', 'upgrade', 'target', 'toggle', 'automation'] as const)('%s save failure publishes no transaction changes', action => {
    const s = ready(), input = action === 'automation' ? { ...s, automation: createInitialGameState().automation } : s;
    const f = rebirthRuntime(input), before = f.game.getSnapshot().result.state, raw = f.raw(); f.fail();
    const r = f.game.execute(state => action === 'acquire' ? purchaseBusiness(state, 'business:afterdark-customs')
      : action === 'upgrade' ? upgradeBusiness(state, L) : action === 'target' ? setBusinessAutoUpgraderTarget(state, L)
      : action === 'toggle' ? setAutomationEnabled(state, A.id, false) : purchaseAutomation(state, A.id));
    expect(r).toBeUndefined(); expect(f.game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw);
    expect(f.events.every(e => e.state === before)).toBe(true); f.game.stop();
  });
  it.each([false, true])('automatic upgrade write failure=%s preserves publication ordering', fails => {
    const f = rebirthRuntime(ready()), before = f.game.getSnapshot().result.state, raw = f.raw(); if (fails) f.fail();
    f.at(30000); f.wall(31000); f.tick();
    if (fails) {
      expect(f.game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw);
      expect(f.game.getSnapshot().runtimeError).toBe('persistence-failure');
    } else {
      expect(f.events.map(e => e.type)).toEqual(['write', 'publish']);
      expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: f.game.getSnapshot().result.state } });
    }
    f.game.stop();
  });
  it('actual 12h four-Business/Dispatcher chronology fits 4096 and still makes only one outer Event attempt online', () => {
    const s = ready(), input = { ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned,
      'business:afterdark-customs': { level: 5 }, 'business:solara-nights': { level: 5 } } },
      permanentProgression: { ...s.permanentProgression, skills: { 'skill:never-sleeps': 2 } },
      automation: { ...s.automation, businessAutoUpgradeTargetId: L,
        unlockedIds: [A.id, DELIVERY_DISPATCHER.id], starterJobElapsedMs: 7000 } };
    const calls = vi.spyOn(production, 'simulateElapsed'); const offline = reconcileOffline(input, 0, 43200000);
    expect(offline.ok).toBe(true); expect(calls.mock.calls.length).toBeGreaterThan(1); expect(calls.mock.calls.length).toBeLessThanOrEqual(1441);
    const random = { next: vi.fn(() => .99) }, f = rebirthRuntime(input, random); random.next.mockClear();
    f.at(600000); f.tick(); expect(random.next).toHaveBeenCalledTimes(1); f.game.stop();
  });
});
