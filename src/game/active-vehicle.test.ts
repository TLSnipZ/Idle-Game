import { describe, expect, it, vi } from 'vitest';
import { VEHICLE_CATALOG, STARTER_VEHICLE as V } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { createInitialGameState } from './game-state';
import { setActiveVehicle } from './set-active-vehicle';
import { purchaseVehicle } from './purchase-vehicle';
import { collectModifiers, evaluateBusinessProduction } from './effective-stats';
import { selectActiveVehicle, selectVehicle } from './vehicle-selectors';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { rational } from '../shared/rational';

// Synthetic catalog entry exists only in this test module. Production still ships KX-R only.
vi.mock('../features/vehicles', async importOriginal => {
  const actual = await importOriginal<typeof import('../features/vehicles')>();
  const extra = { ...actual.STARTER_VEHICLE, id: 'vehicle:test-active' as const, name: 'Test active',
    modifier: { ...actual.STARTER_VEHICLE.modifier, id: 'modifier:test-active', sourceId: 'vehicle:test-active', bonusBasisPoints: 2000 } };
  const catalog = [...actual.VEHICLE_CATALOG, extra];
  return { ...actual, VEHICLE_CATALOG: catalog, findVehicle: (id: unknown) => catalog.find(v => v.id === id) };
});
const SECOND = 'vehicle:test-active' as const;
function ready() {
  const s = rebirthState();
  return { ...s, economy: { cash: moneyFromMinorUnits('100000000') },
    garage: { ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id },
    permanentProgression: { ...s.permanentProgression, skills: {} }, upgrades: { purchasedIds: [] } };
}
describe('active vehicle domain', () => {
  it('starts empty and the first purchase activates without a second transaction', () => {
    expect(createInitialGameState().garage).toEqual({ ownedVehicleIds: [], activeVehicleId: null });
    const s = { ...ready(), garage: createInitialGameState().garage };
    const result = purchaseVehicle(s, V.id);
    expect(result.ok).toBe(true);
    expect(result.state.garage).toEqual({ ownedVehicleIds: [V.id], activeVehicleId: V.id });
    expect(result.state.economy.cash).toBe('97500000');
    expect(purchaseVehicle(result.state, SECOND).state.garage).toEqual({ ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id });
  });
  it.each([null, undefined, 7, '', 'vehicle:unknown'])('rejects invalid selection %s with the original state', id => {
    const s = ready();
    expect(setActiveVehicle(s, id)).toEqual({ ok: false, state: s, error: 'unknown-vehicle' });
    expect(setActiveVehicle(s, id).state).toBe(s);
  });
  it('rejects known unowned vehicles and never supports clearing an occupied garage', () => {
    const s = createInitialGameState();
    expect(setActiveVehicle(s, V.id)).toEqual({ ok: false, state: s, error: 'vehicle-not-owned' });
    expect(setActiveVehicle(ready(), null).ok).toBe(false);
  });
  it('is immutable, free and prospective; only selection changes', () => {
    const s = ready(), before = structuredClone(s);
    Object.freeze(s.garage.ownedVehicleIds); Object.freeze(s.garage); Object.freeze(s);
    const result = setActiveVehicle(s, SECOND);
    expect(result.ok).toBe(true);
    expect(result.state.garage.ownedVehicleIds).toBe(s.garage.ownedVehicleIds);
    expect({ ...result.state, garage: s.garage }).toEqual(s);
    expect(result.state.garage.activeVehicleId).toBe(SECOND);
    expect(s).toEqual(before);
    expect(setActiveVehicle(result.state, SECOND).state).toBe(result.state);
    expect(setActiveVehicle(result.state, V.id).state).toEqual(s);
  });
  it('collects exactly one active bonus, never all owned vehicle bonuses', () => {
    const s = ready();
    expect(collectModifiers(s).filter(m => m.sourceId.startsWith('vehicle:'))).toEqual([V.modifier]);
    expect(evaluateBusinessProduction(s, B.id, 4)).toMatchObject({ ok: true, effective: rational(330n) });
    const changed = setActiveVehicle(s, SECOND).state;
    expect(collectModifiers(changed).filter(m => m.sourceId.startsWith('vehicle:'))).toEqual([VEHICLE_CATALOG[1]?.modifier]);
    expect(evaluateBusinessProduction(changed, B.id, 4)).toMatchObject({ ok: true, effective: rational(360n) });
    expect(selectActiveVehicle(changed)?.id).toBe(SECOND);
    expect(selectVehicle(changed, V.id)).toMatchObject({ owned: true, active: false, canPurchase: false });
    expect(selectVehicle(changed, SECOND)).toMatchObject({ owned: true, active: true });
  });
  it('fails loudly on corrupt active ownership instead of granting free bonuses', () => {
    for (const garage of [
      { ownedVehicleIds: [V.id], activeVehicleId: null },
      { ownedVehicleIds: [], activeVehicleId: V.id },
      { ownedVehicleIds: [V.id], activeVehicleId: SECOND },
    ]) expect(() => collectModifiers({ ...ready(), garage })).toThrow(RangeError);
  });
  it('Rebirth keeps both ownership and selection; lowered acquisition gates do not revoke them', () => {
    const result = performRebirth(setActiveVehicle(ready(), SECOND).state);
    expect(result.ok).toBe(true);
    expect(result.state.garage).toEqual({ ownedVehicleIds: [V.id, SECOND], activeVehicleId: SECOND });
    expect(result.state.progression.xp).toBe(0);
    expect(setActiveVehicle(result.state, V.id).ok).toBe(true);
    expect(evaluateBusinessProduction(result.state, B.id, 1)).toMatchObject({ ok: true, effective: rational(90n) });
  });
});
