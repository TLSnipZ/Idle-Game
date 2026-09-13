import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_VEHICLE as K, KAIRO_SENDA as S, TUNING_CATALOG, activeTuning, isVehicleBuilds } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { purchaseTuning, selectTuning } from './vehicle-tuning';
import { collectModifiers, evaluateBusinessProduction, evaluateJobReward } from './effective-stats';
import { setActiveVehicle, activeVehicleEffectChanged } from './set-active-vehicle';
import { purchaseVehicle } from './purchase-vehicle';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { parseSave, serializeSave, migrateToCurrentSave, SAVE_FORMAT, validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
const F = TUNING_CATALOG[0]!, C = TUNING_CATALOG[1]!;
function state(): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('5000000') },
    businesses: { ...s.businesses, owned: { [B.id]: { level: 1 } } },
    garage: { ownedVehicleIds: [K.id, S.id], activeVehicleId: K.id } };
}
function buy(s: GameState, id = F.id) {
  const r = purchaseTuning(s, id); if (!r.ok) throw Error(r.error); return r.state;
}
describe('KX-R permanent tuning', () => {
  it('charges exactly once, fits the purchase and preserves unrelated progression', () => {
    const s = state(), tuned = buy(s);
    expect(tuned.economy.cash).toBe('3500000'); expect(activeTuning(tuned.garage)?.id).toBe(F.id);
    expect(tuned.progression).toBe(s.progression); expect(tuned.city).toBe(s.city);
    expect(tuned.permanentProgression).toBe(s.permanentProgression);
    expect(s.garage.builds).toBeUndefined();
    expect(purchaseTuning(tuned, F.id)).toMatchObject({ ok: false, error: 'already-purchased', state: tuned });
  });
  it('validates identity, ownership and affordability without spending', () => {
    expect(purchaseTuning(state(), 'wrong')).toMatchObject({ ok: false, error: 'unknown-upgrade' });
    expect(purchaseTuning(createInitialGameState(), F.id)).toMatchObject({ ok: false, error: 'vehicle-not-owned' });
    const poor = { ...state(), economy: { cash: moneyFromMinorUnits('1499999') } };
    expect(purchaseTuning(poor, F.id)).toMatchObject({ ok: false, error: 'insufficient-funds', state: poor });
    expect(selectTuning(state(), C.id)).toMatchObject({ ok: false, error: 'tuning-not-owned' });
  });
  it('uses exact active-only effects and keeps manual tuning out of Dispatcher rewards', () => {
    const fleet = buy(state()), courier = buy(fleet, C.id);
    expect(evaluateBusinessProduction(fleet, B.id, 1)).toMatchObject({ effective: { numerator: '693', denominator: '8' } });
    expect(evaluateJobReward(courier)).toMatchObject({ reward: '2700' });
    expect(evaluateJobReward(courier, 'dispatcher')).toMatchObject({ reward: '2500' });
    expect(collectModifiers(courier).filter(m => m.sourceId.startsWith('tuning:'))).toHaveLength(1);
    const inactive = setActiveVehicle(courier, S.id); if (!inactive.ok) throw Error('fixture');
    expect(activeTuning(inactive.state.garage)).toBeUndefined();
    expect(evaluateJobReward(inactive.state)).toMatchObject({ reward: '2800' });
    expect(inactive.state.garage.builds).toBe(courier.garage.builds);
  });
  it('free stock/owned swaps keep purchased parts and detect active rate changes', () => {
    const tuned = buy(state()), stock = selectTuning(tuned, null); if (!stock.ok) throw Error('fixture');
    expect(stock.state.economy).toBe(tuned.economy);
    expect(stock.state.garage.builds?.[K.id]?.purchasedIds).toEqual([F.id]);
    expect(activeVehicleEffectChanged(tuned, stock.state)).toBe(true);
    expect(selectTuning(stock.state, null)).toEqual({ ok: true, state: stock.state });
    const inactive = { ...stock.state, garage: { ...stock.state.garage, activeVehicleId: S.id } };
    const fit = selectTuning(inactive, F.id); if (!fit.ok) throw Error('fixture');
    expect(activeVehicleEffectChanged(inactive, fit.state)).toBe(false);
  });
  it('keeps builds through another car purchase and Rebirth', () => {
    const tuned = buy(rebirthState());
    const acquired = purchaseVehicle(tuned, S.id); if (!acquired.ok) throw Error('fixture');
    expect(acquired.state.garage.builds).toEqual(tuned.garage.builds);
    const reborn = performRebirth(tuned); if (!reborn.ok) throw Error('fixture');
    expect(reborn.state.garage).toEqual(tuned.garage);
    expect(createInitialGameState().garage.builds).toBeUndefined();
  });
  it('migrates v20 stock unchanged and round-trips tuned v21 through CE1', () => {
    const s = state();
    const old = migrateToCurrentSave({ format: SAVE_FORMAT, version: 20, savedAt: 1234, state: s });
    expect(old).toMatchObject({ ok: true, envelope: { version: 21, savedAt: 1234, state: s } });
    const tuned = buy(s), encoded = serializeSave(tuned, 1234); if (!encoded.ok) throw Error('fixture');
    expect(parseSave(encoded.serialized)).toMatchObject({ ok: true, envelope: { version: 21, state: tuned } });
    const code = exportSaveCode(tuned, 1234); if (!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: tuned } });
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 20, savedAt: 1234, state: tuned }).ok).toBe(false);
  });
  it.each([
    { purchasedIds: [F.id, F.id], selectedId: F.id },
    { purchasedIds: ['tuning:fake'], selectedId: null },
    { purchasedIds: [F.id], selectedId: C.id },
    { purchasedIds: [], selectedId: null },
    { purchasedIds: [F.id], selectedId: F.id, bonus: 999 },
  ])('rejects corrupt or forged builds %#', build => {
    const s = state();
    expect(isVehicleBuilds({ [K.id]: build }, s.garage.ownedVehicleIds)).toBe(false);
    expect(validateSaveState({ ...s, garage: { ...s.garage, builds: { [K.id]: build } } })).toBeNull();
  });
  it('rejects unowned and incompatible vehicle builds', () => {
    const build = { purchasedIds: [F.id], selectedId: F.id };
    expect(isVehicleBuilds({ [K.id]: build }, [])).toBe(false);
    expect(isVehicleBuilds({ [S.id]: build }, [S.id])).toBe(false);
  });
});
