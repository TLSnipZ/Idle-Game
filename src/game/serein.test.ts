import { expect, it } from 'vitest';
import { NAMERA_SEREIN as N, STARTER_VEHICLE as K } from '../features/vehicles';
import { moneyFromMinorUnits } from '../features/economy';
import { createInitialGameState } from './game-state';
import { purchaseVehicle } from './purchase-vehicle';
import { setActiveVehicle } from './set-active-vehicle';
import { evaluateJobReward, evaluateRiskyJobReward, evaluateDiscreetJobReward } from './effective-stats';
import { performStarterJob } from './perform-starter-job';
import { migrateToCurrentSave, serializeSave, parseSave, SAVE_FORMAT } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { selectVehicleAppearance } from './vehicle-appearance';
import { purchaseTuning } from './vehicle-tuning';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { DELIVERY_DISPATCHER } from '../features/automation';
function eligible() {
  const s=createInitialGameState();
  return {...s,progression:{xp:8100},economy:{cash:moneyFromMinorUnits('8000000')},
    businesses:{...s.businesses,owned:{'business:afterdark-customs':{level:1}}}};
}
it('buys at exact gates and price, activates first purchase and rejects duplicate',()=>{
  const result=purchaseVehicle(eligible(),N.id);
  expect(result).toMatchObject({ok:true,state:{economy:{cash:'0'},garage:{ownedVehicleIds:[N.id],activeVehicleId:N.id}}});
  expect(purchaseVehicle(result.state,N.id)).toMatchObject({ok:false,error:'already-owned',state:result.state});
});
it.each(['level','business','cash'] as const)('rejects missing %s without spending',missing=>{
  const s=eligible();
  const state=missing==='level'?{...s,progression:{xp:8099}}:missing==='business'
    ?{...s,businesses:{...s.businesses,owned:{}}}:{...s,economy:{cash:moneyFromMinorUnits('7999999')}};
  expect(purchaseVehicle(state,N.id)).toMatchObject({ok:false,state,
    error:missing==='cash'?'insufficient-funds':'prerequisite-not-met'});
});
it('keeps existing active car/build/paint on purchase; only activation supplies Serein reward',()=>{
  const state={...eligible(),garage:{ownedVehicleIds:[K.id],activeVehicleId:K.id,
    builds:{[K.id]:{purchasedIds:['tuning:kxr-courier-ecu' as const],selectedId:'tuning:kxr-courier-ecu' as const}},
    appearances:{[K.id]:'appearance:kxr-coastal' as const}}};
  const bought=purchaseVehicle(state,N.id);expect(bought.ok).toBe(true);
  expect(bought.state.garage).toEqual({...state.garage,ownedVehicleIds:[K.id,N.id]});
  expect(evaluateJobReward(bought.state)).toMatchObject({reward:'2700'});
  const selected=setActiveVehicle(bought.state,N.id);
  expect(selected.ok).toBe(true);
  expect(evaluateJobReward(selected.state)).toMatchObject({reward:'3150'});
  expect(evaluateJobReward(selected.state,'dispatcher')).toMatchObject({reward:'2500'});
  expect(evaluateRiskyJobReward(selected.state)).toMatchObject({reward:'4725'});
  expect(evaluateDiscreetJobReward(selected.state)).toMatchObject({reward:'1575'});
  expect(performStarterJob(selected.state)).toMatchObject({moneyEarned:'3150'});
});
it('uses unchanged Dispatcher earnings with saved Serein active',()=>{
  const s=createInitialGameState();
  const state={...s,garage:{ownedVehicleIds:[N.id],activeVehicleId:N.id},
    automation:{...s.automation,unlockedIds:[DELIVERY_DISPATCHER.id]}};
  expect(simulateGameElapsed(state,30000)).toMatchObject({automation:{completedJobs:3,income:'7500',xpEarned:15}});
});
it.each([19,20,21,22,23])('rejects Serein injection into historical v%i',version=>{
  const s=createInitialGameState();
  const state={...s,garage:{ownedVehicleIds:[N.id],activeVehicleId:N.id}};
  expect(migrateToCurrentSave({format:SAVE_FORMAT,version,savedAt:1234,state})).toMatchObject({ok:false,error:'invalid-state'});
});
it('migrates v23 exactly without grants and preserves current CE1 Serein ownership',()=>{
  const s=eligible();
  const old={...s,garage:{ownedVehicleIds:[K.id],activeVehicleId:K.id,
    builds:{[K.id]:{purchasedIds:['tuning:kxr-courier-ecu' as const],selectedId:'tuning:kxr-courier-ecu' as const}},
    appearances:{[K.id]:'appearance:kxr-coastal' as const}}};
  expect(migrateToCurrentSave({format:SAVE_FORMAT,version:23,savedAt:1234,state:old}))
    .toEqual({ok:true,envelope:{format:SAVE_FORMAT,version:24,savedAt:1234,state:old}});
  const bought=purchaseVehicle(old,N.id).state;
  const saved=serializeSave(bought,5678);if(!saved.ok)throw Error(saved.error);
  expect(parseSave(saved.serialized)).toMatchObject({ok:true,envelope:{version:24,state:bought,savedAt:5678}});
  const code=exportSaveCode(bought,5678);if(!code.ok)throw Error(code.error);
  expect(validateSaveCode(code.code)).toMatchObject({ok:true,envelope:{state:bought}});
});
it('rejects foreign finishes/parts and unowned selection for the factory-only model',()=>{
  const state=purchaseVehicle(eligible(),N.id).state;
  expect(selectVehicleAppearance(state,N.id,'appearance:kxr-coastal').ok).toBe(false);
  expect(purchaseTuning(state,'tuning:kxr-courier-ecu').ok).toBe(false);
  expect(setActiveVehicle(createInitialGameState(),N.id)).toMatchObject({ok:false,error:'vehicle-not-owned'});
  expect(migrateToCurrentSave({format:SAVE_FORMAT,version:24,savedAt:0,state:{
    ...state,garage:{...state.garage,appearances:{[N.id]:'appearance:kxr-coastal'}}}}).ok).toBe(false);
});
