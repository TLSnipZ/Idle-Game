import { stringifySaveFixture } from './test-fixtures/save-text';
import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_CATALOG, isAchievementIds } from '../features/achievements';
import { createInitialGameState } from './game-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
function rich() {
  const s=rebirthState(37,48), c=crewState({operations:'crew:mara-knox',logistics:'crew:jax-mercer'});
  return {...s,crew:c.crew,city:{...c.city,heat:70,heatDecayElapsedMs:50000},events:{pendingEventId:'event:shakedown' as const,opportunityElapsedMs:123456},permanentProgression:{...s.permanentProgression,statistics: createInitialStatistics(4),empirePoints:17,rebirthCount:4,skills:{'skill:fast-talker':2,'skill:learn-the-streets':1,'skill:streetwise-investment':3,'skill:silent-partner':2,'skill:never-sleeps':2}}};
}
const envelope=(state:unknown,version=CURRENT_SAVE_VERSION)=>({format:'crime-empire-save',version,savedAt:123456789,state});
describe('v13 permanent achievement saves',()=>{
  it('v12 migration adds empty IDs only, despite all six conditions being satisfied',()=>{
    const s=rich(),{statistics:_statistics,unlockedAchievementIds:_ids,...permanentProgression}=s.permanentProgression, old={...s,permanentProgression};
    const raw=stringifySaveFixture(envelope(old,12)); const result=parseSave(raw);
    expect(CURRENT_SAVE_VERSION).toBe(15); expect(result).toEqual({ok:true,envelope:envelope(s)});
    if(!result.ok)throw Error('fixture'); const {statistics:_statistics2,unlockedAchievementIds,...previous}=result.envelope.state.permanentProgression;
    expect(unlockedAchievementIds).toEqual([]); expect({...result.envelope.state,permanentProgression:previous}).toEqual(old);
    expect(validateSaveCode(encodeSaveText(raw))).toEqual(result); expect(stringifySaveFixture(envelope(old,12))).toBe(raw);
  });
  it.each([[],...ACHIEVEMENT_CATALOG.map(a=>[a.id]),ACHIEVEMENT_CATALOG.map(a=>a.id)].map(unlockedAchievementIds=>({unlockedAchievementIds})))('roundtrips historical completion %# independent of current conditions',({unlockedAchievementIds})=>{
    for(const base of [createInitialGameState(),rich()]) {
      const s={...base,permanentProgression:{...base.permanentProgression,unlockedAchievementIds}}, code=exportSaveCode(s,42), raw=serializeSave(s,42);
      if(!code.ok||!raw.ok)throw Error('fixture'); expect(code.code.startsWith('CE1-')).toBe(true);
      expect(validateSaveCode(code.code)).toEqual({ok:true,envelope:{...envelope(s),savedAt:42}}); expect(parseSave(raw.serialized)).toEqual(validateSaveCode(code.code));
      expect(Object.keys(s.permanentProgression).sort()).toEqual(['empirePoints','rebirthCount','skills','statistics','unlockedAchievementIds']);
    }
  });
  it.each([undefined,null,{},'achievement:first-steps',[0],[null],['achievement:unknown'],['achievement:first-steps','achievement:first-steps']])('rejects malformed achievement collection %#',unlockedAchievementIds=>{
    const s=rich(),bad={...s,permanentProgression:{...s.permanentProgression,unlockedAchievementIds}};
    expect(validateSaveState(bad)).toBeNull(); expect(parseSave(stringifySaveFixture(envelope(bad)))).toEqual({ok:false,error:'invalid-state'});
  });
  it('rejects sparse, custom and accessor arrays without invoking getters',()=>{
    for(const ids of [Array(1),Object.assign([],{extra:true}),Object.defineProperty([],0,{get(){throw Error('getter');},enumerable:true})]) expect(isAchievementIds(ids)).toBe(false);
  });
  it.each([1,2,3,4,5,6,7,8,9,10,11,12])('CE1 v%i migrates sequentially without inferred unlocks',version=>{
    const s=rich(),state={economy:s.economy,businesses:version===1?{ownedIds:['business:dockside-detail'],productionRemainderMilliCents:975}:{owned:s.businesses.owned,productionRemainderMilliCents:975,...(version>=3?{productionRemainderSubMilliCents:s.businesses.productionRemainderSubMilliCents}:{})},
      ...(version>=3?{upgrades:s.upgrades}:{}),...(version>=4?{automation:s.automation}:{}),...(version>=5?{progression:s.progression}:{}),...(version>=6?{garage:s.garage}:{}),
      ...(version>=7?{permanentProgression:{empirePoints:17,rebirthCount:4,...(version>=8?{skills:s.permanentProgression.skills}:{})}}:{}),...(version>=9?{city:version===9?{ownedTerritoryIds:s.city.ownedTerritoryIds}:s.city}:{}),...(version>=11?{crew:s.crew}:{}),...(version>=12?{events:s.events}:{})};
    const r=validateSaveCode(encodeSaveText(stringifySaveFixture(envelope(state,version)))); expect(r).toMatchObject({ok:true,envelope:{version:15,savedAt:123456789,state:{permanentProgression:{unlockedAchievementIds:[]},economy:s.economy}}});
  });
});
