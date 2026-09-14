import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { KAIRO_SENDA as S, NAMERA_LILT as L, STARTER_VEHICLE as K, activeTuning } from '../features/vehicles';
import { purchaseTuning, selectTuning } from './vehicle-tuning';
import { evaluateJobReward, evaluateBusinessProduction, evaluateRiskyJobReward, evaluateDiscreetJobReward } from './effective-stats';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { evaluateDecoyCost } from './heat-support';
import { setActiveVehicle } from './set-active-vehicle';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { parseSave, serializeSave, migrateToCurrentSave, SAVE_FORMAT, validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
const E = 'tuning:senda-express-ecu', F = 'tuning:senda-fleet-gearing';
const Q = 'tuning:lilt-quiet-running', D = 'tuning:lilt-decoy-kit';
function base(): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level: 1 } } },
    garage: { ownedVehicleIds: [K.id, S.id, L.id], activeVehicleId: S.id } };
}
function buy(s: GameState, id: string) { const r = purchaseTuning(s, id); if (!r.ok) throw Error(r.error); return r.state; }
function fit(s: GameState, car: string, id: string | null) { const r = selectTuning(s, car, id); if (!r.ok) throw Error(r.error); return r.state; }
function activate(s: GameState, car: string) { const r = setActiveVehicle(s, car); if (!r.ok) throw Error(r.error); return r.state; }

describe('model-specific permanent builds', () => {
  it.each([[E, S.id, '98200000'], [F, S.id, '98600000'], [Q, L.id, '98000000'], [D, L.id, '98800000']])('charges exactly once for %s', (id, car, cash) => {
    const s = base(), result = buy(s, id!);
    expect(result.economy.cash).toBe(cash);
    expect(result.garage.builds).toEqual({ [car!]: { purchasedIds: [id], selectedId: id } });
    expect(result.garage.activeVehicleId).toBe(S.id);
    expect(result.city).toBe(s.city); expect(result.progression).toBe(s.progression);
    expect(result.permanentProgression).toBe(s.permanentProgression);
    expect(purchaseTuning(result, id).ok).toBe(false);
    expect(s.garage.builds).toBeUndefined();
  });
  it('requires ownership and rejects cross-model fitting, unknown identities and unpaid parts', () => {
    const s = buy(base(), E);
    expect(purchaseTuning(createInitialGameState(), Q)).toMatchObject({ ok: false, error: 'vehicle-not-owned' });
    expect(purchaseTuning({ ...base(), economy: { cash: moneyFromMinorUnits('1799999') } }, E)).toMatchObject({ ok: false, error: 'insufficient-funds' });
    for (const [car, part] of [[L.id, E], [S.id, Q], ['fake', E], [S.id, 'fake']])
      expect(selectTuning(s, car, part)).toMatchObject({ ok: false, state: s, error: 'unknown-upgrade' });
    expect(selectTuning(s, S.id, F)).toMatchObject({ ok: false, error: 'tuning-not-owned' });
  });
  it('stacks Senda manual bonuses exactly without affecting Dispatcher or production', () => {
    const s = buy(base(), E);
    expect(evaluateJobReward(s)).toMatchObject({ reward: '3024' });
    expect(evaluateRiskyJobReward(s)).toMatchObject({ reward: '4536' });
    expect(evaluateDiscreetJobReward(s)).toMatchObject({ reward: '1512' });
    expect(evaluateJobReward(s, 'dispatcher')).toMatchObject({ reward: '2500' });
    expect(evaluateBusinessProduction(s, 'business:dockside-detail', 1)).toMatchObject({ effective: { numerator: '75', denominator: '1' } });
  });
  it('swaps Senda to a production hybrid while preserving all model builds', () => {
    const s = buy(buy(buy(base(), E), F), Q);
    expect(evaluateJobReward(s)).toMatchObject({ reward: '2800' });
    expect(evaluateBusinessProduction(s, 'business:dockside-detail', 1)).toMatchObject({ effective: { numerator: '78', denominator: '1' } });
    const stock = fit(s, S.id, null);
    expect(stock.economy).toBe(s.economy);
    expect(stock.garage.builds?.[S.id]?.purchasedIds).toEqual([E, F]);
    expect(stock.garage.builds?.[L.id]).toBe(s.garage.builds?.[L.id]);
    expect(fit(stock, S.id, null)).toBe(stock);
    expect(evaluateJobReward(fit(stock, S.id, E))).toMatchObject({ reward: '3024' });
  });
  it('applies Lilt cooling only while active and fitted, stacking with Mara', () => {
    const inactive = buy(base(), Q);
    expect(getHeatDecayIntervalMs(inactive)).toBe(60000);
    const active = activate(inactive, L.id);
    expect(getHeatDecayIntervalMs(active)).toBe(54000);
    const mara: GameState = { ...active, crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: 'crew:mara-knox', logistics: null } } };
    expect(getHeatDecayIntervalMs(mara)).toBe(39000);
    expect(getHeatDecayIntervalMs(fit(mara, L.id, null))).toBe(42000);
    expect(getHeatDecayIntervalMs(buy(mara, D))).toBe(42000);
  });
  it('applies the decoy kit once through scoped pricing and retains stock Lilt support', () => {
    const s = activate(buy(base(), D), L.id);
    expect(evaluateDecoyCost(s).cost).toBe('101250');
    expect(evaluateDecoyCost(s).applied.filter(m => m.sourceId === D)).toHaveLength(1);
    const supported: GameState = { ...s,
      businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level: 10 } } },
      crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: 'crew:mara-knox', logistics: null } } };
    expect(evaluateDecoyCost(supported).cost).toBe('72900');
    expect(evaluateDecoyCost(fit(supported, L.id, null)).cost).toBe('81000');
    expect(evaluateDecoyCost(activate(supported, S.id)).cost).toBe('90000');
    expect(evaluateJobReward(s)).toMatchObject({ reward: '2500' });
    expect(evaluateBusinessProduction(s, 'business:dockside-detail', 1)).toMatchObject({ effective: { numerator: '75', denominator: '1' } });
  });
  it('keeps all purchases and selected setups across Rebirth', () => {
    const initial = rebirthState();
    const s = [E, F, Q, D].reduce(buy, { ...initial, garage: base().garage });
    const r = performRebirth(s); if (!r.ok) throw Error('fixture');
    expect(r.state.garage).toEqual(s.garage);
    expect(activeTuning(r.state.garage)?.id).toBe(F);
  });
  it('migrates v21 KX-R builds without grants and keeps the timestamp', () => {
    const s = buy(base(), 'tuning:kxr-courier-ecu');
    const r = migrateToCurrentSave({ format: SAVE_FORMAT, version: 21, savedAt: 1234, state: s });
    expect(r).toMatchObject({ ok: true, envelope: { version: 24, savedAt: 1234, state: s } });
    if (!r.ok) throw Error('fixture');
    expect(r.envelope.state.garage.builds?.[K.id]?.purchasedIds).not.toBe(s.garage.builds?.[K.id]?.purchasedIds);
    expect(r.envelope.state.garage.builds?.[S.id]).toBeUndefined();
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 21, savedAt: 1234, state: buy(s, E) }).ok).toBe(false);
  });
  it('round-trips every new build through v22 and CE1 and rejects incompatible saved parts', () => {
    const s = [E, F, Q, D].reduce(buy, base()), encoded = serializeSave(s, 1234);
    if (!encoded.ok) throw Error('fixture');
    expect(parseSave(encoded.serialized)).toMatchObject({ ok: true, envelope: { version: 24, state: s } });
    const code = exportSaveCode(s, 1234); if (!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: s } });
    expect(validateSaveState({ ...s, garage: { ...s.garage, builds: { [S.id]: { purchasedIds: [Q], selectedId: Q } } } })).toBeNull();
  });
});
