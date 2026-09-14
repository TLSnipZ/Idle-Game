import { describe, expect, it } from 'vitest';
import { KAIRO_SENDA as S, NAMERA_LILT as L, STARTER_VEHICLE as K, VEHICLE_CATALOG } from '../features/vehicles';
import type { VehicleId } from '../features/vehicles';
import { MARA_KNOX, RICO_VALE } from '../features/crew';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { moneyFromMinorUnits } from '../features/economy';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { purchaseVehicle } from './purchase-vehicle';
import { setActiveVehicle } from './set-active-vehicle';
import { evaluateBusinessProduction, evaluateJobReward, collectModifiers } from './effective-stats';
import { evaluateIntervalMs } from './modifiers';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { selectDispatcher } from './automation-selectors';
import { performStarterJob } from './perform-starter-job';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { rebirthState } from './test-fixtures/rebirth-state';
import { migrateToCurrentSave, serializeSave, parseSave } from './save-schema';
import { encodeSaveText, validateSaveCode } from './save-code';
import { rational } from '../shared/rational';

function owned(id: VehicleId): GameState {
  return { ...createInitialGameState(), garage: { ownedVehicleIds: VEHICLE_CATALOG.map(v => v.id), activeVehicleId: id } };
}
describe('Tier-1 purchases and permanent selection', () => {
  it.each([[S, 2500, 7, '4000000'], [L, 3600, 8, '5500000']] as const)(
    '%s buys at its exact gates and price without a previous car', (vehicle, xp, level, price) => {
      const initial = createInitialGameState();
      const state = { ...initial, progression: { xp }, economy: { cash: moneyFromMinorUnits(price) },
        businesses: { ...initial.businesses, owned: { 'business:dockside-detail': { level } } } };
      expect(purchaseVehicle({ ...state, progression: { xp: xp - 1 } }, vehicle.id))
        .toMatchObject({ ok: false, error: 'prerequisite-not-met', state: { economy: state.economy } });
      expect(purchaseVehicle({ ...state, businesses: { ...state.businesses, owned: { 'business:dockside-detail': { level: level - 1 } } } }, vehicle.id).ok).toBe(false);
      expect(purchaseVehicle({ ...state, economy: { cash: moneyFromMinorUnits((BigInt(price) - 1n).toString()) } }, vehicle.id))
        .toMatchObject({ ok: false, error: 'insufficient-funds' });
      const bought = purchaseVehicle(state, vehicle.id);
      expect(bought).toMatchObject({ ok: true, state: { economy: { cash: '0' },
        garage: { ownedVehicleIds: [vehicle.id], activeVehicleId: vehicle.id } } });
      expect(purchaseVehicle(bought.state, vehicle.id)).toMatchObject({ ok: false, error: 'already-owned', state: bought.state });
    });
  it('later purchases retain selection and only the active effect is collected', () => {
    let state = rebirthState();
    for (const car of [S, L]) { const result = purchaseVehicle(state, car.id); expect(result.ok).toBe(true); state = result.state; }
    expect(state.garage).toEqual({ ownedVehicleIds: [K.id, S.id, L.id], activeVehicleId: K.id });
    for (const car of [K, S, L]) {
      const selected = setActiveVehicle(state, car.id).state;
      expect(collectModifiers(selected).filter(m => m.sourceId.startsWith('vehicle:'))).toEqual([car.modifier]);
      expect(selected.businesses).toBe(state.businesses);
    }
  });
});
describe('Manual reward context', () => {
  it('Senda affects manual cash only; UI and real Dispatcher payouts agree', () => {
    const state = { ...owned(S.id), automation: { ...createInitialGameState().automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
    expect(evaluateJobReward(state)).toMatchObject({ reward: '2800' });
    expect(performStarterJob(state)).toMatchObject({ moneyEarned: '2800', xpEarned: 10, state: { city: { heat: 1 } } });
    expect(evaluateJobReward(state, 'dispatcher')).toMatchObject({ reward: '2500' });
    expect(selectDispatcher(state).reward).toBe('2500');
    expect(simulateGameElapsed(state, 30000)).toMatchObject({ automation: { completedJobs: 3, income: '7500', xpEarned: 15 } });
    expect(evaluateBusinessProduction(state, 'business:dockside-detail', 1)).toMatchObject({ effective: rational(75n) });
  });
  it.each([0, 60, 80])('preserves flat-before-percent flooring, Rico, territory, skills and Heat %s', heat => {
    const initial = owned(S.id);
    const state = { ...initial, city: { ...initial.city, heat, ownedTerritoryIds: ['territory:waterfront', 'territory:neon-mile'] as const },
      upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) },
      crew: { recruitedIds: [RICO_VALE.id], assignments: { operations: RICO_VALE.id, logistics: null } },
      permanentProgression: { ...initial.permanentProgression, skills: { 'skill:fast-talker': 1 } } };
    const manual = evaluateJobReward(state), dispatcher = evaluateJobReward(state, 'dispatcher');
    const without = evaluateJobReward(setActiveVehicle(state, L.id).state);
    if (!manual.ok || !dispatcher.ok || !without.ok) throw Error('reward');
    const n = BigInt(without.effective.numerator) * 112n, d = BigInt(without.effective.denominator) * 100n;
    expect(manual.reward).toBe((n / d).toString());
    expect(dispatcher).toEqual(without);
    expect(getHeatDecayIntervalMs(state)).toBe(60000);
  });
});
describe('Lilt interval utility', () => {
  it.each([false, true])('subtracts 3s after crew choice, Mara=%s', mara => {
    const initial = owned(L.id);
    const state = { ...initial, city: { ...initial.city, heat: 10 },
      crew: mara ? { recruitedIds: [MARA_KNOX.id], assignments: { operations: MARA_KNOX.id, logistics: null } } : initial.crew };
    const interval = mara ? 42000 : 57000;
    expect(getHeatDecayIntervalMs(state)).toBe(interval);
    const before = simulateGameElapsed(state, interval - 1).state;
    expect(before.city).toMatchObject({ heat: 10, heatDecayElapsedMs: interval - 1 });
    expect(simulateGameElapsed(before, 1).state.city).toMatchObject({ heat: 9, heatDecayElapsedMs: 0 });
    // Peak-Heat statistics observe each batch's final state; compare the cooling slice only.
    expect(simulateGameElapsed(state, interval).state.city).toEqual(simulateGameElapsed(before, 1).state.city);
    expect(evaluateJobReward(state)).toMatchObject({ reward: '2500' });
  });
  it('switching preserves a due remainder and grants no tick; zero Heat never banks time', () => {
    const initial = owned(K.id);
    const state = { ...initial, city: { ...initial.city, heat: 10, heatDecayElapsedMs: 59000 } };
    const selected = setActiveVehicle(state, L.id).state;
    expect(selected.city).toBe(state.city);
    expect(simulateGameElapsed(selected, 0).state).toBe(selected);
    expect(simulateGameElapsed(selected, 1).state.city).toMatchObject({ heat: 9, heatDecayElapsedMs: 2001 });
    expect(simulateGameElapsed(owned(L.id), 600000).state.city).toMatchObject({ heat: 0, heatDecayElapsedMs: 0 });
  });
  it('retains gain-before-decay and outer Dispatcher reward batching', () => {
    const initial = owned(L.id), state = { ...initial, city: { ...initial.city, heat: 60 },
      automation: { ...initial.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
    const result = simulateGameElapsed(state, 570000);
    expect(result).toMatchObject({ ok: true, automation: { completedJobs: 57, income: '128250' }, state: { city: { heat: 61, heatDecayElapsedMs: 0 } } });
  });
  it('bounds duration reductions and rejects malformed shared effects', () => {
    expect(evaluateIntervalMs(60000, 1000, [{ ...L.modifier, operation: 'reduce-interval', reductionMs: 90000 }])).toBe(1000);
    expect(() => evaluateIntervalMs(60000, 1000, [{ ...L.modifier, operation: 'reduce-interval', reductionMs: -1 }])).toThrow(RangeError);
    expect(() => evaluateIntervalMs(60000, 1000, [L.modifier, L.modifier])).toThrow(RangeError);
  });
});
describe('Save v19 identity boundary', () => {
  it.each([false, true])('v18 owner=%s retains exact state and timestamp without grants', owner => {
    const state = owner ? rebirthState() : createInitialGameState();
    const input = { format: 'crime-empire-save', version: 18, savedAt: 123, state }, before = structuredClone(input);
    const result = migrateToCurrentSave(input);
    expect(result).toEqual({ ok: true, envelope: { ...input, version: 24 } });
    expect(input).toEqual(before);
    expect(validateSaveCode(encodeSaveText(JSON.stringify(input)))).toEqual(result);
  });
  it.each([S.id, L.id])('rejects injected %s in historical v16, v17 and v18', id => {
    const state = owned(id);
    for (const version of [16, 17, 18]) {
      const { activeVehicleId: _active, ...garage } = state.garage;
      const { businessAutoUpgradeTargetId: _target, ...automation } = state.automation;
      const input = { format: 'crime-empire-save', version, savedAt: 123, state: { ...state,
        garage: version < 18 ? garage : state.garage, automation: version < 17 ? automation : state.automation } };
      expect(migrateToCurrentSave(input)).toEqual({ ok: false, error: 'invalid-state' });
    }
  });
  it.each(VEHICLE_CATALOG.map(v => v.id))('current selection %s round-trips in local save and CE1', id => {
    const state = owned(id), encoded = serializeSave(state, 123);
    if (!encoded.ok) throw Error(encoded.error);
    expect(parseSave(encoded.serialized)).toMatchObject({ ok: true, envelope: { version: 24, savedAt: 123, state } });
    expect(validateSaveCode(encodeSaveText(encoded.serialized))).toEqual(parseSave(encoded.serialized));
  });
});
