import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { RICO_VALE as R, MARA_KNOX as M, JAX_MERCER as J, createInitialCrewState, isCrewState } from '../features/crew';
import { crewState } from './test-fixtures/crew-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { evaluateJobReward, evaluateBusinessProduction } from './effective-stats';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { createInitialGameState } from './game-state';
import { STARTER_BUSINESS as B } from '../features/businesses';

function rich() {
  return { ...rebirthState(37,48), city:{...crewState().city,heat:70,heatDecayElapsedMs:50000},
    crew:crewState({operations:M.id,logistics:J.id}).crew,
    permanentProgression:{ statistics: createInitialStatistics(4), unlockedAchievementIds: [],empirePoints:17,rebirthCount:4,skills:{[ROOT]:3,[FAST]:2,[LEARN]:1,[SILENT]:2,[NEVER]:2}} };
}
function envelope(state:unknown,version=CURRENT_SAVE_VERSION){return {format:'crime-empire-save',version,savedAt:123456789,state};}
describe('save v11 Crew migration and validation',()=>{
  it('only adds empty Crew to realistic v10, preserving every prior field exactly',()=>{
    const { events: _events, crew: _crew,...old}=rich();const text=JSON.stringify(envelope(withoutAchievements(old),10));const parsed=parseSave(text);
    expect(CURRENT_SAVE_VERSION).toBe(14);expect(parsed).toEqual({ok:true,envelope:envelope({...old,events:createInitialGameState().events,crew:createInitialCrewState()})});
    if(!parsed.ok)throw Error('fixture');
    const {events:_events2,crew,...previous}=parsed.envelope.state;expect(previous).toEqual(old);expect(crew).toEqual(createInitialCrewState());
    for(const key of ['economy','businesses','upgrades','automation','garage','progression','permanentProgression','city'] as const)expect(previous[key]).toEqual(old[key]);
    expect(previous.city.heat).toBe(70);expect(previous.city.heatDecayElapsedMs).toBe(50000);expect(previous.automation.starterJobElapsedMs).toBe(7000);
    expect(previous.businesses.productionRemainderMilliCents).toBe(975);expect(previous.businesses.productionRemainderSubMilliCents).toEqual({numerator:'1',denominator:'3'});
    expect(parsed.envelope.savedAt).toBe(123456789);expect(validateSaveCode(encodeSaveText(text))).toEqual(parsed);expect(JSON.stringify(envelope(withoutAchievements(old),10))).toBe(text);
  });
  it.each([1,2,3,4,5,6,7,8,9,10])('migrates old CE1 v%i sequentially, never recruiting',version=>{
    const s=rich();const state={economy:s.economy,businesses:version===1?{ownedIds:[B.id],productionRemainderMilliCents:975}:
      {owned:s.businesses.owned,productionRemainderMilliCents:975,...(version>=3?{productionRemainderSubMilliCents:s.businesses.productionRemainderSubMilliCents}:{})},
      ...(version>=3?{upgrades:s.upgrades}:{}),...(version>=4?{automation:s.automation}:{}),...(version>=5?{progression:s.progression}:{}),
      ...(version>=6?{garage:s.garage}:{}),...(version>=7?{permanentProgression:{empirePoints:17,rebirthCount:4,...(version>=8?{skills:s.permanentProgression.skills}:{})}}:{}),
      ...(version>=9?{city:version===9?{ownedTerritoryIds:s.city.ownedTerritoryIds}:s.city}:{})};
    const code=encodeSaveText(JSON.stringify(envelope(state,version)));expect(code.startsWith('CE1-')).toBe(true);
    const parsed=validateSaveCode(code);expect(parsed).toMatchObject({ok:true,envelope:{version: 14,savedAt:123456789,state:{crew:createInitialCrewState(),economy:s.economy}}});
    if(!parsed.ok)throw Error('fixture');expect(parsed.envelope.state.city.heat).toBe(version===10?70:0);
  });
  it.each([createInitialCrewState(),crewState().crew,crewState({operations:R.id,logistics:null}).crew,
    crewState({operations:M.id,logistics:null}).crew,crewState({operations:null,logistics:J.id}).crew,
    crewState({operations:R.id,logistics:J.id}).crew,crewState({operations:M.id,logistics:J.id}).crew])('roundtrips structural assignments %# without acquisition checks',crew=>{
    const s={...createInitialGameState(),crew};const code=exportSaveCode(s,42),raw=serializeSave(s,42);if(!code.ok||!raw.ok)throw Error('fixture');
    expect(validateSaveCode(code.code)).toEqual({ok:true,envelope:{...envelope(s),savedAt:42}});expect(parseSave(raw.serialized)).toEqual(validateSaveCode(code.code));
    expect(raw.serialized).not.toMatch(/Rico|Mara|Jax|recruitmentCost|allowedSlots|activeEffect|intervalMs/);
    expect(evaluateJobReward(s).ok).toBe(true);expect(evaluateBusinessProduction(s,B.id,1).ok).toBe(true);
  });
  it.each([45000,50000,59999])('accepts Mara remainder %i under fixed persisted 60s ceiling',heatDecayElapsedMs=>{
    const s=rich(),state={...s,city:{...s.city,heatDecayElapsedMs}};
    expect(validateSaveState(state)).toEqual(state);expect(getHeatDecayIntervalMs(state)).toBe(45000);
  });
  it.each([undefined,null,[],{},'crew',{recruitedIds:[],assignments:null},
    {recruitedIds:'crew:rico-vale',assignments:{operations:null,logistics:null}},
    {recruitedIds:['crew:unknown'],assignments:{operations:null,logistics:null}},
    {recruitedIds:[R.id,R.id],assignments:{operations:null,logistics:null}},
    {recruitedIds:[],assignments:{operations:R.id,logistics:null}},
    {recruitedIds:[R.id],assignments:{operations:'crew:unknown',logistics:null}},
    {recruitedIds:[R.id],assignments:{operations:null,logistics:R.id}},
    {recruitedIds:[M.id],assignments:{operations:null,logistics:M.id}},
    {recruitedIds:[J.id],assignments:{operations:J.id,logistics:null}},
    {recruitedIds:[R.id],assignments:{operations:R.id,logistics:R.id}},
    {recruitedIds:[],assignments:{operations:null}},
    {recruitedIds:[],assignments:{operations:null,logistics:null,extra:null}},
    {recruitedIds:[],assignments:[]},
    {recruitedIds:[],assignments:{operations:null,logistics:null},extra:true}])('rejects malformed Crew %# without repair',crew=>{
    const s={...rich(),crew};expect(validateSaveState(s)).toBeNull();expect(parseSave(JSON.stringify(envelope(s)))).toEqual({ok:false,error:'invalid-state'});
  });
  it('rejects accessors, sparse/custom arrays, symbols and prototypes without executing getters',()=>{
    const s=rich();const bad=[
      {...s.crew,get recruitedIds(){throw Error('must not execute');}},
      {...s.crew,assignments:{get operations(){throw Error('must not execute');},logistics:null}},
      {...s.crew,recruitedIds:Array(1)}, {...s.crew,recruitedIds:Object.assign([R.id],{extra:true})},
      {...s.crew,[Symbol('secret')]:true}, Object.create({ ...s.crew }),
      {...s.crew,recruitedIds:Object.defineProperty([],0,{get(){throw Error('must not execute');},enumerable:true})},
    ];for(const crew of bad)expect(isCrewState(crew)).toBe(false);
    expect(parseSave(JSON.stringify(envelope(s,15)))).toEqual({ok:false,error:'unsupported-version'});
    expect(parseSave(JSON.stringify(envelope(s,10)))).toEqual({ok:false,error:'invalid-state'});
  });
});

function withoutAchievements<T extends { permanentProgression: { statistics: unknown; unlockedAchievementIds: readonly unknown[] } }>(state: T) {
  const { statistics: _statistics, unlockedAchievementIds: _ids, ...permanentProgression } = state.permanentProgression;
  return { ...state, permanentProgression };
}
