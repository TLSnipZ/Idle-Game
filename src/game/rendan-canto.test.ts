import { expect, it, vi } from 'vitest';
import * as vehicles from '../features/vehicles';
import { TOSEKI_RENDAN as R, SEVRIN_CANTO_CLUB as C, NAMERA_SEREIN as N, STARTER_VEHICLE as K } from '../features/vehicles';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { createInitialGameState } from './game-state';
import { purchaseVehicle } from './purchase-vehicle';
import { activeVehicleEffectChanged, setActiveVehicle } from './set-active-vehicle';
import { collectModifiers, evaluateJobReward, evaluateRiskyJobReward, evaluateDiscreetJobReward, evaluateBusinessProduction } from './effective-stats';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { SAVE_FORMAT, migrateToCurrentSave, serializeSave, parseSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { selectVehicleAppearance } from './vehicle-appearance';

const cases = [{ car: R, player: 12, level: 3, price: '11500000', manual: '2950', dispatcher: '2950' },
  { car: C, player: 14, level: 5, price: '16500000', manual: '2500', dispatcher: '2800' }];
function eligible(player: number, level: number, price: string) {
  const s = createInitialGameState();
  return { ...s, progression: { xp: getXpThresholdForLevel(player) }, economy: { cash: moneyFromMinorUnits(price) },
    businesses: { ...s.businesses, owned: { 'business:afterdark-customs': { level } } } };
}
for (const sample of cases) {
  const { car, player, level, price, manual, dispatcher } = sample;
  it(`${car.name}: exact independent acquisition, duplicate and each missing gate`, () => {
    const s = eligible(player, level, price);
    const bought = purchaseVehicle(s, car.id);
    expect(bought).toMatchObject({ ok: true, state: { economy: { cash: '0' }, garage: { ownedVehicleIds: [car.id], activeVehicleId: car.id } } });
    expect(purchaseVehicle(bought.state, car.id)).toMatchObject({ ok: false, error: 'already-owned', state: bought.state });
    for (const failed of [{ ...s, progression: { xp: s.progression.xp - 1 } },
      { ...s, businesses: { ...s.businesses, owned: {} } },
      { ...s, businesses: { ...s.businesses, owned: { 'business:afterdark-customs': { level: level - 1 } } } }]) {
      expect(purchaseVehicle(failed, car.id)).toMatchObject({ ok: false, error: 'prerequisite-not-met', state: failed });
    }
    const poor = { ...s, economy: { cash: moneyFromMinorUnits((BigInt(price) - 1n).toString()) } };
    expect(purchaseVehicle(poor, car.id)).toMatchObject({ ok: false, error: 'insufficient-funds', state: poor });
  });
  it(`${car.name}: active-only effects, scoped payouts and actual Dispatcher batching`, () => {
    const s = createInitialGameState();
    const state = { ...s, garage: { ownedVehicleIds: [R.id, C.id, N.id], activeVehicleId: car.id },
      automation: { ...s.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
    expect(collectModifiers(state).filter(m => m.sourceId.startsWith('vehicle:'))).toEqual(car.modifiers);
    expect(evaluateJobReward(state)).toMatchObject({ reward: manual });
    expect(evaluateJobReward(state, 'dispatcher')).toMatchObject({ reward: dispatcher });
    expect(evaluateRiskyJobReward(state)).toMatchObject({ reward: car === R ? '4425' : '3750' });
    expect(evaluateDiscreetJobReward(state)).toMatchObject({ reward: car === R ? '1475' : '1250' });
    expect(simulateGameElapsed(state, 30000)).toMatchObject({ automation: { completedJobs: 3, income: (BigInt(dispatcher) * 3n).toString(), xpEarned: 15 } });
    expect(evaluateBusinessProduction(state, 'business:dockside-detail', 1)).toMatchObject({ effective: car === C
      ? { numerator: '177', denominator: '2' } : { numerator: '75', denominator: '1' } });
    const stacked = { ...state, upgrades: { purchasedIds: ['upgrade:street-connections' as const, 'upgrade:commercial-pressure-washer' as const] } };
    expect(evaluateJobReward(stacked)).toMatchObject({ reward: car === R ? '3540' : '3000' });
    expect(evaluateJobReward(stacked, 'dispatcher')).toMatchObject({ reward: car === R ? '3540' : '3360' });
    expect(evaluateBusinessProduction(stacked, 'business:dockside-detail', 1)).toMatchObject({ effective: car === C
      ? { numerator: '885', denominator: '8' } : { numerator: '375', denominator: '4' } });
    expect(evaluateJobReward(setActiveVehicle(state, N.id).state)).toMatchObject({ reward: '3150' });
  });
  it(`${car.name}: retains active car, tuning and paint; round-trips CE1 without foreign customization`, () => {
    const s = eligible(player, level, price);
    const garage = { ownedVehicleIds: [K.id], activeVehicleId: K.id,
      builds: { [K.id]: { purchasedIds: ['tuning:kxr-fleet-gearing' as const], selectedId: 'tuning:kxr-fleet-gearing' as const } },
      appearances: { [K.id]: 'appearance:kxr-coastal' as const } };
    const bought = purchaseVehicle({ ...s, garage }, car.id);
    expect(bought.ok).toBe(true);
    expect(bought.state.garage).toEqual({ ...garage, ownedVehicleIds: [K.id, car.id] });
    const selected = setActiveVehicle(bought.state, car.id).state;
    expect(collectModifiers(selected).filter(m => m.sourceId.startsWith('vehicle:') || m.sourceId.startsWith('tuning:'))).toEqual(car.modifiers);
    const saved = serializeSave(selected, 4567); if (!saved.ok) throw Error(saved.error);
    expect(parseSave(saved.serialized)).toMatchObject({ ok: true, envelope: { version: 27, savedAt: 4567, state: selected } });
    const code = exportSaveCode(selected, 4567); if (!code.ok) throw Error(code.error);
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: selected } });
    expect(selectVehicleAppearance(selected, car.id, 'appearance:kxr-coastal').ok).toBe(false);
    for (const extra of [{ activeVehicleId: 'vehicle:unknown' }, { appearances: { [car.id]: 'appearance:kxr-coastal' } },
      { builds: { [car.id]: garage.builds[K.id] } }]) {
      expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 27, savedAt: 0, state: { ...selected, garage: { ...selected.garage, ...extra } } }).ok).toBe(false);
    }
  });
  it.each([19, 20, 21, 22, 23, 24])(`${car.name}: rejects future-car injection into v%i`, version => {
    const state = { ...createInitialGameState(), garage: { ownedVehicleIds: [car.id], activeVehicleId: car.id } };
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version, savedAt: 1234, state })).toEqual({ ok: false, error: 'invalid-state' });
  });
}
it('v24 migration retains Serein, all existing builds/finishes and fractions without grants', () => {
  const s = createInitialGameState();
  const state = { ...s, garage: { ownedVehicleIds: [K.id, N.id], activeVehicleId: N.id,
    builds: { [K.id]: { purchasedIds: ['tuning:kxr-courier-ecu' as const], selectedId: 'tuning:kxr-courier-ecu' as const } },
    appearances: { [K.id]: 'appearance:kxr-coastal' as const } },
    businesses: { ...s.businesses, productionRemainderMilliCents: 987, productionRemainderSubMilliCents: { numerator: '1', denominator: '3' } } };
  expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 24, savedAt: 9876, state }))
    .toEqual({ ok: true, envelope: { format: SAVE_FORMAT, version: 27, savedAt: 9876, state } });
});
it('plural effect comparison detects second-effect changes but ignores source identity/order', () => {
  const previous = { ...createInitialGameState(), garage: { ownedVehicleIds: [R.id, C.id], activeVehicleId: R.id } };
  const next = { ...previous, garage: { ...previous.garage, activeVehicleId: C.id } };
  const lookup = vi.spyOn(vehicles, 'findVehicle');
  try {
    lookup.mockImplementation(id => id === R.id ? { ...R, modifiers: C.modifiers.slice().reverse() } : id === C.id ? C : undefined);
    expect(activeVehicleEffectChanged(previous, next)).toBe(false);
    lookup.mockImplementation(id => id === R.id ? { ...R, modifiers: C.modifiers.slice(0, 1) } : id === C.id ? C : undefined);
    expect(activeVehicleEffectChanged(previous, next)).toBe(true);
  } finally { lookup.mockRestore(); }
});
