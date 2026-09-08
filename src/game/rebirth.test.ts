import { describe, expect, it } from 'vitest';
import { performRebirth, selectRebirth, REBIRTH_POLICY } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { createInitialGameState } from './game-state';
import { MAX_PERMANENT_VALUE } from '../features/permanent-progression';
import { getPlayerLevel, getXpThresholdForLevel } from '../features/progression';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { STREET_CONNECTIONS as S, EXPRESS_TIPS as E, DETAILING_LINE as L, FLEET_LOGISTICS as F } from '../features/upgrades';
import { performStarterJob } from './perform-starter-job';
import { purchaseBusiness } from './purchase-business';
import { selectUpgrade } from './selectors';
import { selectDispatcher } from './automation-selectors';
import { evaluateBusinessProduction, evaluateJobReward } from './effective-stats';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline, OFFLINE_CAP_MS } from './offline-progress';
import { rational } from '../shared/rational';

describe('Rebirth eligibility and rewards', () => {
  it.each([[19,25,false],[20,24,false],[20,25,true],[37,48,true],[100,100,true]])('player %i, Dockside %i => eligible %s', (player,business,eligible) => {
    expect(selectRebirth(rebirthState(player,business)).eligible).toBe(eligible);
  });
  it('rejects a fresh state and absent Dockside with structured unmet requirements', () => {
    const state=createInitialGameState();const result=performRebirth(state);
    expect(result).toMatchObject({ok:false,error:'requirements-not-met',requirements:{met:false}});expect(result.state).toBe(state);
    if(result.ok || result.error!=='requirements-not-met') throw Error('fixture');
    expect(result.requirements.requirements.map(r=>r.description)).toEqual(['Player Level 20','Dockside Detail Level 25']);
    expect(result.requirements.requirements.every(r=>!r.met)).toBe(true);
    const absent={...state,progression:{xp:getXpThresholdForLevel(100)}};
    expect(selectRebirth(absent).eligible).toBe(false);expect(selectRebirth(absent).reward).toBeNull();
  });
  it('requires no cash, vehicles, upgrades or dispatcher', () => {
    const fresh=createInitialGameState();const state={...fresh,progression:{xp:getXpThresholdForLevel(20)},
      businesses:{...fresh.businesses,owned:{[B.id]:{level:25}}}};
    expect(performRebirth(state)).toMatchObject({ok:true,reward:4,state:{garage:{ownedVehicleIds:[]}}});
  });
  it.each([[20,25,4],[37,48,7],[100,100,20]])('preview and award agree: %i / %i => %i EP', (player,business,reward) => {
    const state=rebirthState(player,business);
    expect(selectRebirth(state).reward).toBe(reward);
    expect(performRebirth(state)).toMatchObject({ok:true,reward,state:{permanentProgression:{skills: {}, empirePoints:reward,rebirthCount:1}}});
  });
  it('ignores cash/collection/equipment/automation and within-level XP in reward', () => {
    const state=rebirthState(37,48);const fresh=createInitialGameState();
    const stripped={...state,economy:fresh.economy,garage:fresh.garage,upgrades:fresh.upgrades,automation:fresh.automation,
      businesses:{...state.businesses,productionRemainderMilliCents:0,productionRemainderSubMilliCents:rational(0n)},
      progression:{xp:getXpThresholdForLevel(38)-1}};
    expect(selectRebirth(stripped).reward).toBe(7);expect(selectRebirth(state).reward).toBe(7);
  });
});
describe('explicit reset and retention', () => {
  it('resets every temporary field, retains garage and accumulates permanent counters immutably', () => {
    const state={...rebirthState(),permanentProgression:{skills: {}, empirePoints:12,rebirthCount:3}};
    const before=JSON.stringify(state);
    Object.freeze(state);Object.freeze(state.garage);Object.freeze(state.garage.ownedVehicleIds);
    const result=performRebirth(state);expect(result.ok).toBe(true);const after=result.state;
    expect(after.economy.cash).toBe('0');expect(after.businesses.owned).toEqual({});
    expect(after.businesses.owned[B.id]).toBeUndefined();expect(after.upgrades.purchasedIds).toEqual([]);
    expect(after.automation.unlockedIds).toEqual([]);expect(after.automation.starterJobElapsedMs).toBe(0);
    expect(after.progression.xp).toBe(0);expect(getPlayerLevel(after.progression.xp)).toBe(1);
    expect(after.businesses.productionRemainderMilliCents).toBe(0);
    expect(after.businesses.productionRemainderSubMilliCents).toEqual(rational(0n));
    expect(after.garage).toBe(state.garage);expect(after.garage.ownedVehicleIds).toEqual([V.id]);
    expect(after.permanentProgression).toEqual({skills: {}, empirePoints:16,rebirthCount:4});
    expect(after).toEqual({...createInitialGameState(),garage:state.garage,permanentProgression:{skills: {}, empirePoints:16,rebirthCount:4}});
    expect(JSON.stringify(state)).toBe(before);expect(result).toEqual(performRebirth(state));
    expect(Object.keys(REBIRTH_POLICY).sort()).toEqual(Object.keys(state).sort());
  });
  it('supports repeat Rebirths: 4 then 7 EP, count 2, same collection', () => {
    const first=performRebirth(rebirthState()).state;
    expect(first.permanentProgression).toEqual({skills: {}, empirePoints:4,rebirthCount:1});
    const rebuilt={...rebirthState(37,48),garage:first.garage,permanentProgression:first.permanentProgression};
    const second=performRebirth(rebuilt).state;
    expect(second.permanentProgression).toEqual({skills: {}, empirePoints:11,rebirthCount:2});
    expect(second.garage).toEqual(first.garage);
    expect(second).toEqual({...createInitialGameState(),garage:first.garage,permanentProgression:{skills: {}, empirePoints:11,rebirthCount:2}});
    expect(performRebirth(second).ok).toBe(false);
  });
  it.each(['empirePoints','rebirthCount'] as const)('rejects %s overflow without any reset', field => {
    const state={...rebirthState(),permanentProgression:{skills: {}, empirePoints:0,rebirthCount:0,[field]:MAX_PERMANENT_VALUE}};
    expect(performRebirth(state)).toEqual({ok:false,error:'overflow',state});expect(performRebirth(state).state).toBe(state);
  });
  it('accepts exact maximum permanent sums',()=>{
    const state={...rebirthState(),permanentProgression:{skills: {}, empirePoints:MAX_PERMANENT_VALUE-4,rebirthCount:MAX_PERMANENT_VALUE-1}};
    expect(performRebirth(state).state.permanentProgression).toEqual({skills: {}, empirePoints:MAX_PERMANENT_VALUE,rebirthCount:MAX_PERMANENT_VALUE});
  });
  it('fails loudly on corrupt authoritative values without hiding them with a fresh run', () => {
    const state={...rebirthState(),permanentProgression:{skills: {}, empirePoints:-1,rebirthCount:0}};
    const before=JSON.stringify(state);expect(()=>performRebirth(state)).toThrow(RangeError);expect(JSON.stringify(state)).toBe(before);
    expect(()=>performRebirth({...rebirthState(),garage:{ownedVehicleIds:['vehicle:unknown']}})).toThrow(RangeError);
    expect(()=>performRebirth({...rebirthState(),businesses:{...rebirthState().businesses,productionRemainderMilliCents:1000}})).toThrow(RangeError);
  });
  it('restores acquisition gates while the retained car automatically boosts a rebuilt Dockside', () => {
    let state=performRebirth(rebirthState()).state;
    expect(selectUpgrade(state,E.id)?.eligible).toBe(true);
    for(const upgrade of [S,L,F]) expect(selectUpgrade(state,upgrade.id)?.eligible).toBe(false);
    expect(selectDispatcher(state).eligible).toBe(false);
    expect(simulateGameElapsed(state,10000).state).toEqual(state);
    for(let i=0;i<6;i++)state=performStarterJob(state).state;
    state=purchaseBusiness(state,B.id).state;
    expect(state.upgrades.purchasedIds).toEqual([]);expect(state.garage.ownedVehicleIds).toEqual([V.id]);
    const production=evaluateBusinessProduction(state,B.id,1);
    expect(production).toMatchObject({ok:true,effective:rational(345n,4n),applied:[V.modifier]}); // $0.8625/s
    expect(simulateGameElapsed(state,1000).state.economy.cash).toBe('86');
    expect(reconcileOffline(state,0,1000).state).toEqual(simulateGameElapsed(state,1000).state);
  });
  it('permanent counters provide no stats and never accrue offline', () => {
    const state=rebirthState();const permanent={...state,permanentProgression:{skills: {}, empirePoints:999999,rebirthCount:99}};
    expect(evaluateBusinessProduction(permanent,B.id,25)).toEqual(evaluateBusinessProduction(state,B.id,25));
    expect(evaluateJobReward(permanent)).toEqual(evaluateJobReward(state));
    const offline=reconcileOffline(permanent,0,12*3600000);
    expect(offline.state.permanentProgression).toBe(permanent.permanentProgression);
    expect(offline.state).toEqual(simulateGameElapsed(permanent,OFFLINE_CAP_MS).state);
    expect(offline.ok&&offline.progress).toMatchObject({capped:true,xpEarned:14400});
  });
});
