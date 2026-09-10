import { stringifySaveFixture } from './test-fixtures/save-text';
import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { parseSave, serializeSave, CURRENT_SAVE_VERSION, validateSaveState } from './save-schema';
import { encodeSaveText, validateSaveCode, exportSaveCode } from './save-code';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';

const legacy=()=>({format:'crime-empire-save',version:5,savedAt:123456789,
  state:{economy:{cash:'900719925474099312345'},progression:{xp:4321},
    businesses:{owned:{[B.id]:{level:10}},productionRemainderMilliCents:975,
      productionRemainderSubMilliCents:{numerator:'1',denominator:'3'}},
    upgrades:{purchasedIds:UPGRADE_CATALOG.map(u=>u.id)},
    automation: { enabledIds:[],businessAutoUpgradeElapsedMs:0,unlockedIds:[D.id],starterJobElapsedMs:4321}}});
function current() {
  const result=parseSave(stringifySaveFixture(legacy())); if (!result.ok) throw Error('fixture');
  return {...result.envelope.state,garage:{ownedVehicleIds:[V.id]}};
}
describe('v6 vehicle saves',()=>{
  it('migrates realistic v5 preserving every previous field and savedAt through local/CE1 validation',()=>{
    const old=legacy(); const serialized=stringifySaveFixture(old);
    const expected={ok:true,envelope:{...old,version: 17,state:{...old.state, automation: { ...old.state.automation, businessAutoUpgradeTargetId: B.id }, events: { opportunityElapsedMs: 0, pendingEventId: null }, crew: { recruitedIds: [], assignments: { operations: null, logistics: null } },city:{heat:0,heatDecayElapsedMs:0,ownedTerritoryIds:['territory:waterfront']},permanentProgression:{ statistics: createInitialStatistics(0), unlockedAchievementIds: [],skills: {}, empirePoints:0,rebirthCount:0},garage:{ownedVehicleIds:[]}}}};
    expect(CURRENT_SAVE_VERSION).toBe(17); expect(parseSave(serialized)).toEqual(expected);
    expect(validateSaveCode(encodeSaveText(serialized))).toEqual(expected); expect(stringifySaveFixture(old)).toBe(serialized);
  });
  it('roundtrips exact v6 ownership and all progress through the same envelope',()=>{
    const state=current(); const encoded=serializeSave(state,42); if (!encoded.ok) throw Error('fixture');
    const code=exportSaveCode(state,42); if (!code.ok) throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toEqual(parseSave(encoded.serialized));
    expect(parseSave(encoded.serialized)).toMatchObject({ok:true,envelope:{version: 17,savedAt:42,state}});
    expect(encoded.serialized).not.toMatch(/artwork|Vortex|vehicle-placeholder|ownedVehicleCount/);
  });
  it.each([null,{}, {ownedVehicleIds:null}, {ownedVehicleIds:['vehicle:unknown']},
    {ownedVehicleIds:[V.id,V.id]}, {ownedVehicleIds:[null]}, {ownedVehicleIds:'ids'},
    {ownedVehicleIds:[],equipped:null}])('rejects malformed garage %#',garage=>{
    expect(validateSaveState({...current(),garage})).toBeNull();
  });
  it('rejects missing garage, custom prototypes/accessors, future and malformed legacy envelopes',()=>{
    const {garage:_garage,...missing}=current(); expect(validateSaveState(missing)).toBeNull();
    expect(validateSaveState({...current(),garage:Object.create({ownedVehicleIds:[]})})).toBeNull();
    const accessor=Object.defineProperty({},'ownedVehicleIds',{get:()=>{throw Error('must not read');}});
    expect(validateSaveState({...current(),garage:accessor})).toBeNull();
    expect(parseSave(stringifySaveFixture({...legacy(),version:CURRENT_SAVE_VERSION+1}))).toEqual({ok:false,error:'unsupported-version'});
    const old=legacy(); expect(parseSave(stringifySaveFixture({...old,state:{...old.state,progression:{xp:-1}}})).ok).toBe(false);
    expect(parseSave(stringifySaveFixture({...old,state:{...old.state,garage:{ownedVehicleIds:[V.id]}}})).ok).toBe(false);
  });
  it('accepts grandfathered ownership without acquisition gates',()=>{
    const state={...current(),progression:{xp:0},businesses:{...current().businesses,owned:{}}};
    expect(validateSaveState(state)).toEqual(state);
    const code=exportSaveCode(state,1); if(!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ok:true,envelope:{state}});
  });
});
