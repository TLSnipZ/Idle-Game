import { describe, expect, it } from 'vitest';
import { APPEARANCE_CATALOG, VEHICLE_CATALOG, STARTER_VEHICLE as K, KAIRO_SENDA as S, NAMERA_LILT as L, isVehicleAppearances } from '../features/vehicles';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { selectVehicleAppearance } from './vehicle-appearance';
import { purchaseTuning } from './vehicle-tuning';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { migrateToCurrentSave, SAVE_FORMAT, serializeSave, parseSave, validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { evaluateJobReward, evaluateBusinessProduction } from './effective-stats';
import { evaluateDecoyCost } from './heat-support';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
function state(): GameState {
  const s = rebirthState();
  return { ...s, garage: { ownedVehicleIds: [K, S, L].map(car => car.id), activeVehicleId: K.id } };
}
function paint(s: GameState, car: string, look: string | null) {
  const r = selectVehicleAppearance(s, car, look); if (!r.ok) throw Error(r.error); return r.state;
}
describe('permanent vehicle appearance', () => {
  it.each(APPEARANCE_CATALOG)('$id changes only its owned car appearance for free', look => {
    const before = { ...state(), garage: { ...state().garage, ownedVehicleIds: VEHICLE_CATALOG.map(car => car.id) } }, after = paint(before, look.vehicleId, look.id);
    expect(after).toEqual({ ...before, garage: { ...before.garage, appearances: { [look.vehicleId]: look.id } } });
    expect(after.economy).toBe(before.economy);
    expect(after.permanentProgression).toBe(before.permanentProgression);
    expect(before.garage.appearances).toBeUndefined();
    expect(paint(after, look.vehicleId, look.id)).toBe(after);
  });
  it('rejects unowned, unknown and cross-model choices without changing state', () => {
    const s = state();
    expect(selectVehicleAppearance(createInitialGameState(), K.id, 'appearance:kxr-coastal'))
      .toMatchObject({ ok: false, error: 'vehicle-not-owned' });
    for (const [car, look] of [[K.id, 'appearance:lilt-ivory'], ['fake', null], [S.id, 'fake'], [K.id, undefined]]) {
      expect(selectVehicleAppearance(s, car, look)).toMatchObject({ ok: false, state: s, error: 'unknown-appearance' });
    }
  });
  it('restores only the selected car factory finish and keeps performance builds', () => {
    const bought = purchaseTuning(state(), 'tuning:kxr-courier-ecu'); if (!bought.ok) throw Error(bought.error);
    const s = paint(paint(bought.state, K.id, 'appearance:kxr-coastal'), L.id, 'appearance:lilt-ivory');
    const restored = paint(s, K.id, null);
    expect(restored.garage.appearances).toEqual({ [L.id]: 'appearance:lilt-ivory' });
    expect(restored.garage.builds).toBe(s.garage.builds);
    expect(paint(restored, K.id, null)).toBe(restored);
  });
  it('does not change production, job rewards, cooling or decoy cost for any active car', () => {
    for (const car of VEHICLE_CATALOG) for (const look of APPEARANCE_CATALOG.filter(item => item.vehicleId === car.id)) {
      const s = { ...state(), garage: { ...state().garage, ownedVehicleIds: VEHICLE_CATALOG.map(item => item.id), activeVehicleId: car.id } }, after = paint(s, car.id, look.id);
      expect(evaluateJobReward(after)).toEqual(evaluateJobReward(s));
      expect(evaluateBusinessProduction(after, 'business:dockside-detail', 25)).toEqual(evaluateBusinessProduction(s, 'business:dockside-detail', 25));
      expect(getHeatDecayIntervalMs(after)).toBe(getHeatDecayIntervalMs(s));
      expect(evaluateDecoyCost(after)).toEqual(evaluateDecoyCost(s));
    }
  });
  it('migrates v22 with all model builds, exact cash and timestamp, without selecting cosmetics', () => {
    const bought = purchaseTuning(state(), 'tuning:lilt-quiet-running'); if (!bought.ok) throw Error(bought.error);
    const r = migrateToCurrentSave({ format: SAVE_FORMAT, version: 22, savedAt: 4321, state: bought.state });
    expect(r).toEqual({ ok: true, envelope: { format: SAVE_FORMAT, version: 27, savedAt: 4321, state: bought.state } });
    if (!r.ok) throw Error(r.error);
    expect(r.envelope.state.garage).not.toBe(bought.state.garage);
    expect(r.envelope.state.garage.appearances).toBeUndefined();
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 22, savedAt: 4321,
      state: paint(bought.state, K.id, 'appearance:kxr-coastal') })).toMatchObject({ ok: false, error: 'invalid-state' });
  });
  it('round-trips every saved finish in v23 and CE1 and retains them through Rebirth', () => {
    const s = paint(paint(paint(state(), K.id, 'appearance:kxr-coastal'), S.id, 'appearance:senda-amethyst'), L.id, 'appearance:lilt-lagoon');
    const saved = serializeSave(s, 1234); if (!saved.ok) throw Error(saved.error);
    expect(parseSave(saved.serialized)).toMatchObject({ ok: true, envelope: { version: 27, state: s } });
    const code = exportSaveCode(s, 1234); if (!code.ok) throw Error(code.error);
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: s } });
    const r = performRebirth(s); if (!r.ok) throw Error(r.error);
    expect(r.state.garage).toEqual(s.garage);
    const clone = validateSaveState(s);
    expect(clone?.garage.appearances).toEqual(s.garage.appearances);
    expect(clone?.garage.appearances).not.toBe(s.garage.appearances);
  });
  it.each([null, [], { fake: 'appearance:kxr-coastal' }, { [K.id]: 'appearance:lilt-ivory' },
    { [K.id]: null }, { [K.id]: undefined }, { [K.id]: 'unknown' }])('rejects malformed appearance maps %j', appearances => {
    expect(validateSaveState({ ...state(), garage: { ...state().garage, appearances } })).toBeNull();
  });
  it('rejects unowned maps, symbols and accessors without invoking them', () => {
    expect(isVehicleAppearances({ [K.id]: 'appearance:kxr-coastal' }, [])).toBe(false);
    expect(isVehicleAppearances({ [Symbol('hidden')]: 'appearance:kxr-coastal' }, [K.id])).toBe(false);
    const value = Object.defineProperty({}, K.id, { get() { throw Error('must not run'); }, enumerable: true });
    expect(isVehicleAppearances(value, [K.id])).toBe(false);
  });
});
