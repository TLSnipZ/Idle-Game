import { describe, expect, it } from 'vitest';
import { VEHICLE_CATALOG, TUNING_CATALOG, APPEARANCE_CATALOG } from '../features/vehicles';
import { moneyFromMinorUnits } from '../features/economy';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { purchaseTuning, selectTuning } from './vehicle-tuning';
import { selectVehicleAppearance } from './vehicle-appearance';
import { evaluateJobReward, evaluateBusinessProduction } from './effective-stats';
import { migrateToCurrentSave, SAVE_FORMAT } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
const cars = ['vehicle:namera-serein', 'vehicle:toseki-rendan', 'vehicle:sevrin-canto-club'] as const;
const parts = TUNING_CATALOG.filter(part => cars.some(id => id === part.vehicleId));
const looks = APPEARANCE_CATALOG.filter(look => cars.some(id => id === look.vehicleId));
function state(): GameState {
  const initial = createInitialGameState();
  return { ...initial, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...initial.businesses, owned: { 'business:dockside-detail': { level: 1 } } },
    garage: { ownedVehicleIds: VEHICLE_CATALOG.map(car => car.id), activeVehicleId: 'vehicle:kairo-kx-r',
      builds: { 'vehicle:kairo-kx-r': { purchasedIds: ['tuning:kxr-fleet-gearing'], selectedId: 'tuning:kxr-fleet-gearing' } },
      appearances: { 'vehicle:kairo-kx-r': 'appearance:kxr-coastal' } } };
}
function buy(s: GameState, id: string) { const r = purchaseTuning(s, id); if (!r.ok) throw Error(r.error); return r.state; }
function paint(s: GameState, car: string, look: string) { const r = selectVehicleAppearance(s, car, look); if (!r.ok) throw Error(r.error); return r.state; }

describe('Tier-2 customization and its historical boundary', () => {
  it.each(parts)('$id requires ownership and exact funds, charges once and keeps selection', part => {
    const before = state(), after = buy(before, part.id);
    expect(BigInt(before.economy.cash) - BigInt(after.economy.cash)).toBe(BigInt(part.cost));
    expect(after.garage.activeVehicleId).toBe(before.garage.activeVehicleId);
    expect(after.garage.builds?.['vehicle:kairo-kx-r']).toEqual(before.garage.builds?.['vehicle:kairo-kx-r']);
    expect(after.garage.appearances).toEqual(before.garage.appearances);
    expect(after.progression).toBe(before.progression);
    expect(purchaseTuning(after, part.id)).toMatchObject({ ok: false, error: 'already-purchased', state: after });
    expect(purchaseTuning(createInitialGameState(), part.id)).toMatchObject({ ok: false, error: 'vehicle-not-owned' });
    expect(purchaseTuning({ ...before, economy: { cash: moneyFromMinorUnits((BigInt(part.cost) - 1n).toString()) } }, part.id))
      .toMatchObject({ ok: false, error: 'insufficient-funds' });
    expect(purchaseTuning({ ...before, economy: { cash: part.cost } }, part.id)).toMatchObject({ ok: true, state: { economy: { cash: '0' } } });
    expect(evaluateJobReward(after)).toEqual(evaluateJobReward(before));
    expect(evaluateBusinessProduction(after, 'business:dockside-detail', 1)).toEqual(evaluateBusinessProduction(before, 'business:dockside-detail', 1));
    expect(selectTuning(after, 'vehicle:kairo-kx-r', part.id)).toMatchObject({ ok: false, error: 'unknown-upgrade' });
  });
  it.each([
    ['tuning:serein-nightshift-ecu', '3402', '2500', '75', '1'],
    ['tuning:serein-workshop-gearing', '3150', '2500', '315', '4'],
    ['tuning:rendan-dispatch-gearing', '2950', '3304', '75', '1'],
    ['tuning:rendan-express-ecu', '3127', '2950', '75', '1'],
    ['tuning:canto-fleet-gearing', '2500', '2800', '3717', '40'],
    ['tuning:canto-dispatch-ecu', '2500', '3024', '177', '2'],
  ])('%s has exact scoped rewards and production', (id, manual, dispatcher, numerator, denominator) => {
    const part = parts.find(item => item.id === id); if (!part) throw Error('fixture');
    const before = state(), active = { ...before, garage: { ...before.garage, activeVehicleId: part.vehicleId } };
    const after = buy(active, id!);
    expect(evaluateJobReward(after)).toMatchObject({ reward: manual });
    expect(evaluateJobReward(after, 'dispatcher')).toMatchObject({ reward: dispatcher });
    expect(evaluateBusinessProduction(after, 'business:dockside-detail', 1)).toMatchObject({ effective: { numerator, denominator } });
    const all = parts.filter(item => item.vehicleId === part.vehicleId).reduce<GameState>((s, item) => buy(s, item.id), active);
    const fitted = selectTuning(all, part.vehicleId, part.id); if (!fitted.ok) throw Error(fitted.error);
    expect(evaluateJobReward(fitted.state)).toEqual(evaluateJobReward(after));
    expect(evaluateJobReward(fitted.state, 'dispatcher')).toEqual(evaluateJobReward(after, 'dispatcher'));
    const stock = selectTuning(fitted.state, part.vehicleId, null); if (!stock.ok) throw Error(stock.error);
    expect(stock.state.economy).toBe(fitted.state.economy);
    expect(stock.state.garage.builds?.[part.vehicleId]?.purchasedIds).toHaveLength(2);
    expect(evaluateJobReward(stock.state)).toEqual(evaluateJobReward(active));
    expect(evaluateBusinessProduction(stock.state, 'business:dockside-detail', 1)).toEqual(evaluateBusinessProduction(active, 'business:dockside-detail', 1));
  });
  it('migrates v25 without grants or changes to any progress and independently copies builds', () => {
    const before = state();
    const r = migrateToCurrentSave({ format: SAVE_FORMAT, version: 25, savedAt: 987654, state: before });
    expect(r).toEqual({ ok: true, envelope: { format: SAVE_FORMAT, version: 26, savedAt: 987654, state: before } });
    if (!r.ok) throw Error(r.error);
    expect(r.envelope.state.garage.builds).not.toBe(before.garage.builds);
    for (const car of cars) expect(r.envelope.state.garage.builds?.[car]).toBeUndefined();
  });
  it.each(parts)('rejects injected $id in historical v25', part => {
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 25, savedAt: 1, state: buy(state(), part.id) }))
      .toMatchObject({ ok: false, error: 'invalid-state' });
  });
  it.each(looks)('rejects injected $id in historical v25', look => {
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: 25, savedAt: 1, state: paint(state(), look.vehicleId, look.id) }))
      .toMatchObject({ ok: false, error: 'invalid-state' });
  });
  it('round-trips all six builds and looks through CE1 and keeps them across Rebirth', () => {
    const built = parts.reduce((s, p) => buy(s, p.id), state());
    const painted = looks.reduce((s, look) => paint(s, look.vehicleId, look.id), built);
    const code = exportSaveCode(painted, 1234); if (!code.ok) throw Error(code.error);
    expect(code.code).toMatch(/^CE1-/);
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { version: 26, savedAt: 1234, state: painted } });
    const rebirth = performRebirth({ ...rebirthState(), garage: painted.garage });
    if (!rebirth.ok) throw Error(rebirth.error);
    expect(rebirth.state.garage).toEqual(painted.garage);
  });
});
