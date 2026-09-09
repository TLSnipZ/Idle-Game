import { stringifySaveFixture } from './test-fixtures/save-text';
import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it, vi } from 'vitest';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { createInitialGameState } from './game-state';
import { isEventState } from '../features/events';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { TIP, SHAKE, WAREHOUSE, eventState } from './test-fixtures/event-state';
import { selectCityEvents, eligibleEvents } from './event-selectors';
function rich() {
  const s=rebirthState(37,48),c=crewState({operations:'crew:mara-knox',logistics:'crew:jax-mercer'});
  return {...s,crew:c.crew,city:{...c.city,heat:70,heatDecayElapsedMs:50000},
    permanentProgression:{ statistics: createInitialStatistics(4), unlockedAchievementIds: [],empirePoints:17,rebirthCount:4,skills:{'skill:streetwise-investment':3,'skill:fast-talker':2,'skill:learn-the-streets':1,'skill:silent-partner':2,'skill:never-sleeps':2}}};
}
function envelope(state:unknown,version=CURRENT_SAVE_VERSION) {return {format:'crime-empire-save',version,savedAt:123456789,state};}
describe('v12 event persistence boundary',()=>{
  it('v11 migration adds only empty events, preserving every prior field and original timestamp',()=>{
    const {events:_events,...old}=rich(),raw=stringifySaveFixture(envelope(withoutAchievements(old),11));
    const parsed=parseSave(raw);expect(CURRENT_SAVE_VERSION).toBe(15);
    expect(parsed).toEqual({ok:true,envelope:envelope({...old,events:createInitialGameState().events})});
    if(!parsed.ok)throw Error('fixture');const {events,...previous}=parsed.envelope.state;
    expect(previous).toEqual(old);expect(events).toEqual({opportunityElapsedMs:0,pendingEventId:null});
    expect(previous.city).toEqual(old.city);expect(previous.crew).toEqual(old.crew);expect(previous.businesses.productionRemainderSubMilliCents).toEqual({numerator:'1',denominator:'3'});
    expect(validateSaveCode(encodeSaveText(raw))).toEqual(parsed);expect(stringifySaveFixture(envelope(withoutAchievements(old),11))).toBe(raw);
  });
  it.each([1,2,3,4,5,6,7,8,9,10,11])('CE1 v%i sequentially migrates without event creation',version=>{
    const s=rich(),state={economy:s.economy,businesses:version===1?{ownedIds:['business:dockside-detail'],productionRemainderMilliCents:975}:
      {owned:s.businesses.owned,productionRemainderMilliCents:975,...(version>=3?{productionRemainderSubMilliCents:s.businesses.productionRemainderSubMilliCents}:{})},
      ...(version>=3?{upgrades:s.upgrades}:{}),...(version>=4?{automation:s.automation}:{}),...(version>=5?{progression:s.progression}:{}),
      ...(version>=6?{garage:s.garage}:{}),...(version>=7?{permanentProgression:{empirePoints:17,rebirthCount:4,...(version>=8?{skills:s.permanentProgression.skills}:{})}}:{}),
      ...(version>=9?{city:version===9?{ownedTerritoryIds:s.city.ownedTerritoryIds}:s.city}:{}),...(version>=11?{crew:s.crew}:{})};
    const code=encodeSaveText(stringifySaveFixture(envelope(state,version)));expect(code.startsWith('CE1-')).toBe(true);
    const r=validateSaveCode(code);expect(r).toMatchObject({ok:true,envelope:{version: 15,savedAt:123456789,state:{economy:s.economy,events:createInitialGameState().events}}});
    if(!r.ok)throw Error('fixture');if(version===11)expect(r.envelope.state.crew).toEqual(s.crew);
  });
  it.each([null,TIP,SHAKE,WAREHOUSE] as const)('roundtrips %s without eligibility checks or extra state',pendingEventId=>{
    for(const opportunityElapsedMs of [0,1,123456,599999]){
      const s={...rich(),events:{pendingEventId,opportunityElapsedMs}},raw=serializeSave(s,42),code=exportSaveCode(s,42);
      if(!raw.ok||!code.ok)throw Error('fixture');expect(validateSaveCode(code.code)).toEqual({ok:true,envelope:{...envelope(s),savedAt:42}});
      expect(parseSave(raw.serialized)).toEqual(validateSaveCode(code.code));expect(Object.keys(s.events).sort()).toEqual(['opportunityElapsedMs','pendingEventId']);
      expect(raw.serialized).not.toMatch(/seed|rngCursor|lastRoll|selectionIndex|history|eventCount|chance/);
    }
    const grandfathered={...createInitialGameState(),events:{pendingEventId,opportunityElapsedMs:500}};
    expect(validateSaveState(grandfathered)).toEqual(grandfathered);expect(eligibleEvents(grandfathered)).toEqual([]);
  });
  it.each([-1,.5,600000,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'500',null,undefined])('rejects invalid progress %s',opportunityElapsedMs=>{
    const s={...rich(),events:{pendingEventId:null,opportunityElapsedMs}};
    expect(validateSaveState(s)).toBeNull();expect(parseSave(stringifySaveFixture(envelope(s)))).toEqual({ok:false,error:'invalid-state'});
  });
  it.each(['event:unknown',0,[],{},true,undefined])('rejects invalid pending identity %#',pendingEventId=>{
    const s={...rich(),events:{opportunityElapsedMs:0,pendingEventId}};expect(validateSaveState(s)).toBeNull();
  });
  it.each([undefined,null,[],{},'events',{pendingEventId:null},{opportunityElapsedMs:0},
    {opportunityElapsedMs:0,pendingEventId:null,queue:[]},{opportunityElapsedMs:0,pendingEventId:null,seed:123}])('rejects malformed event shape %#',events=>{
    const s={...rich(),events};expect(validateSaveState(s)).toBeNull();expect(parseSave(stringifySaveFixture(envelope(s))).ok).toBe(false);
  });
  it('rejects accessors, hidden keys and prototypes without executing getters',()=>{
    const e=createInitialGameState().events;
    for(const bad of [{...e,get pendingEventId(){throw Error('getter');}},{...e,[Symbol('x')]:1},Object.create(e),Object.defineProperty({...e},'pendingEventId',{enumerable:false})])expect(isEventState(bad)).toBe(false);
    expect(parseSave(stringifySaveFixture(envelope(rich(),16)))).toEqual({ok:false,error:'unsupported-version'});
    expect(parseSave(stringifySaveFixture(envelope(rich(),11)))).toEqual({ok:false,error:'invalid-state'});
  });
  it('selectors, validation, migration and CE1 never require or consume RNG',()=>{
    const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw Error('Persistence must not roll');});
    try {
      const s=eventState(SHAKE,'0',0),{events:_events,...old}=s;
      selectCityEvents(s);validateSaveState(s);parseSave(stringifySaveFixture(envelope(withoutAchievements(old),11)));
      const code=exportSaveCode(s,0);if(!code.ok)throw Error('fixture');validateSaveCode(code.code);
      expect(random).not.toHaveBeenCalled();
    } finally {random.mockRestore();}
  });
});

function withoutAchievements<T extends { permanentProgression: { statistics: unknown; unlockedAchievementIds: readonly unknown[] } }>(state: T) {
  const { statistics: _statistics, unlockedAchievementIds: _ids, ...permanentProgression } = state.permanentProgression;
  return { ...state, permanentProgression };
}
