import { describe, expect, it } from 'vitest';
import { parseSave, serializeSave, validateSaveState, CURRENT_SAVE_VERSION } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { rebirthState } from './test-fixtures/rebirth-state';
import { createInitialGameState } from './game-state';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { MAX_PERMANENT_VALUE } from '../features/permanent-progression';
import { createLocalSave } from '../platform/local-save';
import { simulateGameElapsed } from './simulate-game-elapsed';
function legacy() {
  const {permanentProgression:_permanent,...state}=rebirthState(37,48);
  return {format:'crime-empire-save',version:6,savedAt:123456789,state};
}
describe('v7 permanent progression schema',()=>{
  it('migrates realistic v6 preserving every prior field and timestamp; never performs Rebirth',()=>{
    const old=legacy();const text=JSON.stringify(old);expect(CURRENT_SAVE_VERSION).toBe(7);
    const expected={ok:true,envelope:{...old,version:7,state:{...old.state,permanentProgression:{empirePoints:0,rebirthCount:0}}}};
    expect(parseSave(text)).toEqual(expected);expect(validateSaveCode(encodeSaveText(text))).toEqual(expected);
    expect(JSON.stringify(old)).toBe(text);
  });
  it.each([1,2,3,4,5,6])('keeps sequential CE1 migration from v%i',version=>{
    const old=legacy();const source=old.state;
    const businesses=version===1?{ownedIds:[B.id],productionRemainderMilliCents:975}:
      {owned:source.businesses.owned,productionRemainderMilliCents:975,
        ...(version>=3?{productionRemainderSubMilliCents:source.businesses.productionRemainderSubMilliCents}:{})};
    const state={economy:source.economy,businesses,...(version>=3?{upgrades:source.upgrades}:{}),
      ...(version>=4?{automation:source.automation}:{}),...(version>=5?{progression:source.progression}:{}),
      ...(version>=6?{garage:source.garage}:{})};
    const encoded=encodeSaveText(JSON.stringify({...old,version,state}));const result=validateSaveCode(encoded);
    expect(result).toMatchObject({ok:true,envelope:{version:7,savedAt:old.savedAt,state:{economy:source.economy,
      permanentProgression:{empirePoints:0,rebirthCount:0},businesses:{owned:{[B.id]:{level:version===1?1:48}},productionRemainderMilliCents:975}}}});
  });
  it.each([0,11,MAX_PERMANENT_VALUE])('roundtrips exact counters %i without runtime/UI state',value=>{
    const state={...rebirthState(),permanentProgression:{empirePoints:value,rebirthCount:value}};
    const serialized=serializeSave(state,42);const code=exportSaveCode(state,42);
    if(!serialized.ok||!code.ok)throw Error('fixture');
    expect(parseSave(serialized.serialized)).toMatchObject({ok:true,envelope:{version:7,savedAt:42,state}});
    expect(validateSaveCode(code.code)).toEqual(parseSave(serialized.serialized));
    expect(serialized.serialized).not.toMatch(/confirming|rebirth-policy|reward|message/);
  });
  describe.each(['empirePoints','rebirthCount'] as const)('%s validation',field=>{
    it.each([-1,.5,NaN,Infinity,MAX_PERMANENT_VALUE+1,'1',null,undefined])('rejects invalid value %#',value=>{
      const state=createInitialGameState();expect(validateSaveState({...state,
        permanentProgression:{...state.permanentProgression,[field]:value}})).toBeNull();
    });
    it('rejects missing fields and getters without executing them',()=>{
      const permanent={...createInitialGameState().permanentProgression};Reflect.deleteProperty(permanent,field);
      expect(validateSaveState({...createInitialGameState(),permanentProgression:permanent})).toBeNull();
      Object.defineProperty(permanent,field,{get:()=>{throw Error('must not read');}});
      expect(validateSaveState({...createInitialGameState(),permanentProgression:permanent})).toBeNull();
    });
  });
  it('rejects missing slice, extra fields, wrong prototypes and future schemas',()=>{
    expect(validateSaveState(legacy().state)).toBeNull();
    for(const permanentProgression of [null,[],{empirePoints:0,rebirthCount:0,skills:[]},Object.create({empirePoints:0,rebirthCount:0})])
      expect(validateSaveState({...rebirthState(),permanentProgression})).toBeNull();
    expect(parseSave(JSON.stringify({...legacy(),version:8}))).toEqual({ok:false,error:'unsupported-version'});
    expect(parseSave(JSON.stringify({...legacy(),state:rebirthState()}))).toEqual({ok:false,error:'invalid-state'});
  });
  it('retains the v6 timestamp for ordinary offline migration and consumes it once',()=>{
    const old=legacy();let raw=JSON.stringify(old);const wall=old.savedAt+25000;
    const save=createLocalSave(()=>({getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}}),()=>wall);
    const expected=simulateGameElapsed(rebirthState(37,48),25000).state;
    expect(save.bootstrap()).toMatchObject({kind:'loaded',state:expected});
    expect(parseSave(raw)).toMatchObject({ok:true,envelope:{version:7,savedAt:wall,state:expected}});
    expect(save.bootstrap()).toMatchObject({kind:'loaded',offline:{incomeEarned:'0',xpEarned:0}});
  });
});
