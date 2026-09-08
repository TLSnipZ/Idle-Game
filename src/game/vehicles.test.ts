import { describe, expect, it } from 'vitest';
import { STARTER_VEHICLE as V, VEHICLE_CATALOG, findVehicle } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { isMoney, moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import type { GameState } from './game-state';
import { createInitialGameState } from './game-state';
import { purchaseVehicle } from './purchase-vehicle';
import { selectGarage, selectVehicle } from './vehicle-selectors';
import { evaluateRequirements, newlyEligibleContent } from './requirements';
import { collectModifiers, evaluateBusinessProduction, evaluateJobReward } from './effective-stats';
import { evaluateStat } from './modifiers';
import { simulateElapsed } from './simulate-elapsed';
import { rational } from '../shared/rational';

function eligible() {
  const state = createInitialGameState();
  return { ...state, progression: { xp: 3600 }, economy: { cash: moneyFromMinorUnits('5000000') },
    businesses: { ...state.businesses, owned: { [B.id]: { level: 10 } },
      productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n,3n) } };
}
describe('vehicle acquisition', () => {
  it('configures exactly one stable collectible with canonical price, scope and gates', () => {
    expect(VEHICLE_CATALOG).toEqual([V]); expect(V.id).toBe('vehicle:starter-sport-sedan');
    expect(findVehicle(V.id)).toBe(V); expect(findVehicle('Vortex S9')).toBeUndefined();
    expect(V.purchaseCost).toBe('5000000'); expect(isMoney(V.purchaseCost)).toBe(true);
    expect(V.modifier).toMatchObject({ sourceId: V.id, target: { stat: 'business-production', businessId: null },
      operation: 'multiply-basis-points', bonusBasisPoints: 1500 });
    expect(V.requirements).toEqual([{ type:'player-level',minimumLevel:7 },
      { type:'business-owned',businessId:B.id }, { type:'business-level',businessId:B.id,minimumLevel:10 }]);
    expect(evaluateRequirements(eligible(),V.requirements).met).toBe(true);
  });
  it('purchases once atomically, retains all progression/fractions and stores identity only', () => {
    const state=eligible(); const before=JSON.stringify(state);
    Object.freeze(state.garage.ownedVehicleIds); Object.freeze(state.garage); Object.freeze(state);
    const result=purchaseVehicle(state,V.id); expect(result.ok).toBe(true);
    expect(result.state.economy.cash).toBe('0'); expect(result.state.garage).toEqual({ownedVehicleIds:[V.id]});
    expect(result.state.progression).toBe(state.progression); expect(result.state.businesses).toBe(state.businesses);
    expect(result.state.automation).toBe(state.automation); expect(JSON.stringify(state)).toBe(before);
    expect(result).toEqual(purchaseVehicle(state,V.id));
    expect(JSON.stringify(result.state)).not.toMatch(/Vortex|artwork|\.png|category|modifier:/);
    expect(purchaseVehicle(result.state,V.id)).toEqual({ok:false,state:result.state,error:'already-owned'});
  });
  it.each([null, 'vehicle:unknown', 42])('rejects unknown identity %# without mutation', id => {
    const state=eligible(); const result=purchaseVehicle(state,id);
    expect(result).toEqual({ok:false,state,error:'unknown-vehicle'}); expect(result.state).toBe(state);
  });
  it.each(['player','ownership','business-level'] as const)('rejects unmet %s gate with structured details before spending', gate => {
    const initial=eligible(); const state=gate==='player' ? {...initial,progression:{xp:3599}} :
      {...initial,businesses:{...initial.businesses,owned:gate==='ownership'?{}:{[B.id]:{level:9}}}};
    const result=purchaseVehicle(state,V.id);
    expect(result.state).toBe(state); expect(result).toMatchObject({ok:false,error:'prerequisite-not-met',requirements:{met:false}});
    if (result.ok || result.error!=='prerequisite-not-met') throw Error('expected gate failure');
    expect(result.requirements.requirements.some(detail=>!detail.met)).toBe(true);
  });
  it('distinguishes insufficient funds and keeps the full state', () => {
    const state={...eligible(),economy:{cash:moneyFromMinorUnits('4999999')}};
    expect(purchaseVehicle(state,V.id)).toEqual({ok:false,state,error:'insufficient-funds'});
    expect(purchaseVehicle(state,V.id).state).toBe(state);
    expect(selectVehicle(state,V.id)).toMatchObject({eligible:true,affordable:false,canPurchase:false});
  });
  it('spends exactly beyond Number precision and derives counts/eligibility', () => {
    const state={...eligible(),economy:{cash:moneyFromMinorUnits('900719925474099312345')}};
    expect(selectGarage(state)).toEqual({ownedVehicleCount:0,totalConfiguredVehicles:1});
    expect(selectVehicle(state,V.id)).toMatchObject({eligible:true,affordable:true,canPurchase:true});
    const purchased=purchaseVehicle(state,V.id).state;
    expect(purchased.economy.cash).toBe('900719925474094312345');
    expect(selectGarage(purchased)).toEqual({ownedVehicleCount:1,totalConfiguredVehicles:1});
    expect(selectVehicle(purchased,V.id)?.canPurchase).toBe(false); expect(selectVehicle(state,'unknown')).toBeNull();
  });
  it('announces newly eligible vehicle at the exact level 7 boundary', () => {
    const after=eligible(); const before={...after,progression:{xp:3599}};
    expect(newlyEligibleContent(before,after)).toEqual([V.name]);
    expect(newlyEligibleContent(before,purchaseVehicle(after,V.id).state)).toEqual([]);
  });
});
describe('shared vehicle modifiers', () => {
  it('has no effect when unowned and +15% globally when owned, never on jobs', () => {
    const state=eligible(); const owned={...state,garage:{ownedVehicleIds:[V.id]}};
    expect(evaluateBusinessProduction(state,B.id,4)).toMatchObject({ok:true,effective:rational(300n)});
    expect(evaluateBusinessProduction(owned,B.id,4)).toMatchObject({ok:true,effective:rational(345n)});
    expect(evaluateStat(moneyFromMinorUnits('100'),{stat:'business-production',businessId:'business:synthetic'},collectModifiers(owned)))
      .toMatchObject({ok:true,effective:rational(115n)});
    expect(evaluateJobReward(owned)).toMatchObject({ok:true,reward:'2500'});
  });
  it('stacks the canonical all-bonus rate exactly in stable modifier order', () => {
    const state={...eligible(),garage:{ownedVehicleIds:[V.id]},upgrades:{purchasedIds:UPGRADE_CATALOG.map(u=>u.id)}};
    const evaluated=evaluateBusinessProduction(state,B.id,4);
    expect(evaluated).toMatchObject({ok:true,effective:rational(11385n,16n)}); // $7.115625/s
    expect(evaluated).toEqual(evaluateBusinessProduction({...state,upgrades:{purchasedIds:[...state.upgrades.purchasedIds].reverse()}},B.id,4));
    if (!evaluated.ok) throw Error('evaluation');
    expect(evaluated.applied.map(m=>m.id)).toEqual(evaluated.applied.map(m=>m.id).sort());
    expect(evaluated.applied.some(m=>m.sourceId===V.id)).toBe(true);
    expect(evaluateJobReward(state)).toMatchObject({ok:true,reward:'3600'});
  });
  it('preserves both earned fractions with arbitrary split intervals and serializable state', () => {
    const initial=eligible(); const state={...initial,garage:{ownedVehicleIds:[V.id]},
      businesses:{...initial.businesses,owned:{[B.id]:{level:4}}},upgrades:{purchasedIds:UPGRADE_CATALOG.map(u=>u.id)}};
    let split: GameState=state;
    for (const ms of [1,2,7,91,100,999,3456]) split=simulateElapsed(split,ms).state;
    expect(split).toEqual(simulateElapsed(state,4656).state);
    expect(JSON.parse(JSON.stringify(split))).toEqual(split);
    expect(simulateElapsed(state,1).state.businesses.productionRemainderSubMilliCents).not.toEqual(rational(0n));
  });
  it('rolls back money overflow with vehicle bonuses and rejects corrupt owned IDs', () => {
    const state={...eligible(),garage:{ownedVehicleIds:[V.id]},economy:{cash:moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS))}};
    expect(simulateElapsed(state,1000)).toEqual({ok:false,state,error:'overflow'});
    expect(simulateElapsed(state,1000).state).toBe(state);
    expect(()=>collectModifiers({...state,garage:{ownedVehicleIds:[V.id,V.id]}})).toThrow(RangeError);
    expect(()=>collectModifiers({...state,garage:{ownedVehicleIds:['vehicle:missing']}})).toThrow(RangeError);
  });
});
