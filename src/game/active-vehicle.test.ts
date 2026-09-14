import './test-fixtures/active-vehicle-catalog';
import { describe, expect, it } from 'vitest';
import { STARTER_VEHICLE as V, findVehicle } from '../features/vehicles';
import type { GameState } from './game-state';
import { createInitialGameState } from './game-state';
import { purchaseVehicle } from './purchase-vehicle';
import { setActiveVehicle } from './set-active-vehicle';
import { collectModifiers, evaluateBusinessProduction } from './effective-stats';
import { selectGarage, selectVehicle } from './vehicle-selectors';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { rational } from '../shared/rational';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
const SECOND = 'vehicle:test-coupe';
function ready(): GameState {
  const fresh = createInitialGameState();
  return { ...fresh, economy: { cash: moneyFromMinorUnits('100000000') }, progression: { xp: 3600 },
    businesses: { ...fresh.businesses, owned: { [B.id]: { level: 10 } } } };
}
function both(): GameState { return purchaseVehicle(purchaseVehicle(ready(), V.id).state, SECOND).state; }
describe('Active Vehicle Foundation', () => {
  it('first purchase activates automatically; subsequent purchase keeps the selection', () => {
    const fresh = ready(), first = purchaseVehicle(fresh, V.id), second = purchaseVehicle(first.state, SECOND);
    expect(first.ok).toBe(true); expect(second.ok).toBe(true);
    expect(first.state.garage).toEqual({ ownedVehicleIds: [V.id], activeVehicleId: V.id });
    expect(second.state.garage).toEqual({ ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id });
    expect(fresh.garage).toEqual({ ownedVehicleIds: [], activeVehicleId: null });
    expect(purchaseVehicle(first.state, V.id)).toMatchObject({ ok: false, error: 'already-owned', state: first.state });
  });
  it('changes only the active ID, charges nothing and preserves earned fractions', () => {
    const state = both(), before = structuredClone(state);
    const switched = setActiveVehicle(state, SECOND);
    expect(switched.ok).toBe(true);
    expect({ ...switched.state, garage: state.garage }).toEqual(state);
    expect(switched.state.garage.ownedVehicleIds).toBe(state.garage.ownedVehicleIds);
    expect(switched.state.economy).toBe(state.economy);
    expect(state).toEqual(before);
    expect(selectGarage(switched.state).activeVehicle?.id).toBe(SECOND);
    expect(selectVehicle(switched.state, V.id)?.active).toBe(false);
    expect(selectVehicle(switched.state, SECOND)?.active).toBe(true);
  });
  it('collects exactly the active bonus without inactive stacking', () => {
    const state = both(), switched = setActiveVehicle(state, SECOND).state;
    expect(collectModifiers(state).filter(m => m.sourceId.startsWith('vehicle:'))).toEqual(V.modifiers);
    expect(collectModifiers(switched).filter(m => m.sourceId.startsWith('vehicle:'))).toEqual(findVehicle(SECOND)?.modifiers);
    expect(evaluateBusinessProduction(state, B.id, 4)).toMatchObject({ ok: true, effective: rational(330n) });
    expect(evaluateBusinessProduction(switched, B.id, 4)).toMatchObject({ ok: true, effective: rational(375n) });
  });
  it('same selection is an identity-preserving no-op; invalid and unowned IDs fail atomically', () => {
    const state = both();
    expect(setActiveVehicle(state, V.id)).toEqual({ ok: true, state });
    expect(setActiveVehicle(state, V.id).state).toBe(state);
    for (const id of [null, undefined, {}, 'vehicle:unknown', 'vehicle:starter-sport-sedan'])
      expect(setActiveVehicle(state, id)).toEqual({ ok: false, state, error: 'unknown-vehicle' });
    const unowned = ready();
    expect(setActiveVehicle(unowned, V.id)).toEqual({ ok: false, state: unowned, error: 'vehicle-not-owned' });
  });
  it('Rebirth retains the complete Garage; New Game has neither ownership nor selection', () => {
    const state = { ...rebirthState(), garage: setActiveVehicle(both(), SECOND).state.garage };
    const result = performRebirth(state);
    expect(result.ok).toBe(true); expect(result.state.garage).toBe(state.garage);
    expect(createInitialGameState().garage).toEqual({ ownedVehicleIds: [], activeVehicleId: null });
  });
  it('rejects corrupt authoritative selections instead of repairing them', () => {
    const state = both();
    for (const activeVehicleId of [null, 'vehicle:unknown' as const]) {
      const corrupt = { ...state, garage: { ...state.garage, activeVehicleId } };
      expect(() => collectModifiers(corrupt)).toThrow(RangeError);
      expect(() => setActiveVehicle(corrupt, V.id)).toThrow(RangeError);
    }
  });
});
