import { describe, expect, it } from 'vitest';
import { TUNING_CATALOG, VEHICLE_CATALOG } from '../features/vehicles';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { moneyFromMinorUnits } from '../features/economy';
import { NEON_MILE, WATERFRONT, switchCityDistrict } from '../features/territories';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { selectTuningInsight } from './tuning-insight';
import { purchaseTuning } from './vehicle-tuning';
import { evaluateJobReward, effectiveProductionRates } from './effective-stats';
import { evaluateDecoyCost } from './heat-support';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { addRational, ZERO_RATIONAL } from '../shared/rational';

function fixture(): GameState {
  const initial = createInitialGameState();
  return { ...initial, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...initial.businesses, owned: { 'business:dockside-detail': { level: 10 } } },
    garage: { ownedVehicleIds: VEHICLE_CATALOG.map(car => car.id), activeVehicleId: 'vehicle:kairo-kx-r' },
  };
}
function buy(state: GameState, id: string) {
  const result = purchaseTuning(state, id);
  if (!result.ok) throw Error(result.error);
  return result.state;
}
describe('Workshop purchase insight', () => {
  it.each(TUNING_CATALOG)('$id predicts a real replacement without mutating progress or buying parts', part => {
    const alternative = TUNING_CATALOG.find(p => p.vehicleId === part.vehicleId && p.id !== part.id)!;
    const state = buy(fixture(), alternative.id), original = JSON.stringify(state);
    const insight = selectTuningInsight(state, part.id)!;
    const real = buy({ ...state, garage: { ...state.garage, activeVehicleId: part.vehicleId } }, part.id);
    const production = effectiveProductionRates(real);
    if (!production.ok) throw Error('fixture overflow');
    const manual = evaluateJobReward(real), dispatcher = evaluateJobReward(real, 'dispatcher');
    if (!manual.ok || !dispatcher.ok) throw Error('fixture overflow');
    expect(insight.after).toEqual({
      production: production.rates.reduce(addRational, ZERO_RATIONAL),
      manual: manual.reward,
      dispatcher: dispatcher.reward,
      coolingMs: getHeatDecayIntervalMs(real), decoy: evaluateDecoyCost(real).cost,
    });
    expect(JSON.stringify(state)).toBe(original);
    expect(insight.requiresActivation).toBe(part.vehicleId !== state.garage.activeVehicleId);
    const fitted = selectTuningInsight(real, part.id)!;
    expect(fitted.before).toEqual(fitted.after);
  });
  it('shows production lost when replacing gearing with a manual ECU, including fractional production', () => {
    const state = buy(fixture(), 'tuning:serein-workshop-gearing');
    const insight = selectTuningInsight(state, 'tuning:serein-nightshift-ecu')!;
    expect(insight.before).toMatchObject({ production: { numerator: '1575', denominator: '2' }, manual: '3150' });
    expect(insight.after).toMatchObject({ production: { numerator: '750', denominator: '1' }, manual: '3402' });
  });
  it('includes local Business support and assigned Crew when trading cooling for cheaper decoys', () => {
    const state = buy({ ...fixture(), crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: 'crew:mara-knox', logistics: null } } }, 'tuning:lilt-quiet-running');
    const insight = selectTuningInsight(state, 'tuning:lilt-decoy-kit')!;
    expect(insight.before).toMatchObject({ coolingMs: 39000, decoy: '81000' });
    expect(insight.after).toMatchObject({ coolingMs: 42000, decoy: '72900' });
  });
  it('keeps manual district Heat separate from Waterfront Dispatcher Heat', () => {
    const state = fixture();
    const city = switchCityDistrict({ ...state.city, ownedTerritoryIds: [WATERFRONT.id, NEON_MILE.id] }, NEON_MILE.id);
    const insight = selectTuningInsight({ ...state, city: { ...city, heat: 70 } }, 'tuning:rendan-dispatch-gearing')!;
    expect(BigInt(insight.after.manual)).toBeLessThan(2950n);
    expect(insight.after.dispatcher).toBe('3634'); // Cold Waterfront plus owned Neon's +10% Cash.
  });
  it('works with zero Cash and no Businesses, distinguishes unowned Dispatcher, and does not activate anything', () => {
    const state = { ...createInitialGameState(), garage: fixture().garage };
    expect(selectTuningInsight(state, 'tuning:canto-fleet-gearing')).toMatchObject({ dispatcherOwned: false, after: { production: ZERO_RATIONAL } });
    expect(selectTuningInsight({ ...state, automation: { ...state.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } }, 'tuning:canto-fleet-gearing'))
      .toMatchObject({ dispatcherOwned: true });
    expect(state.garage.activeVehicleId).toBe('vehicle:kairo-kx-r');
    expect(state.economy.cash).toBe('0');
  });
  it('omits unavailable comparisons for unknown parts and unowned cars', () => {
    expect(selectTuningInsight(fixture(), 'unknown')).toBeNull();
    expect(selectTuningInsight(createInitialGameState(), 'tuning:serein-nightshift-ecu')).toBeNull();
  });
});
