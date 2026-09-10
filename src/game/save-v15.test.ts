import { stringifySaveFixture } from './test-fixtures/save-text';
import { describe, expect, it } from 'vitest';
import { autoUpgraderState } from './test-fixtures/auto-upgrader-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { createInitialGameState } from './game-state';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D, isAutomationState } from '../features/automation';
import { CURRENT_SAVE_VERSION, parseSave, validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode, encodeSaveText } from './save-code';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
const envelope=(state:unknown,version=CURRENT_SAVE_VERSION)=>({format:'crime-empire-save',version,savedAt:123456789,state});
function rich() {
  const s=rebirthState(37,48),c=crewState({operations:'crew:mara-knox',logistics:'crew:jax-mercer'});
  return {...s,crew:c.crew,city:{...c.city,heat:70,heatDecayElapsedMs:50000},
    events:{pendingEventId:'event:shakedown' as const,opportunityElapsedMs:123456},
    permanentProgression:{...s.permanentProgression,empirePoints:17,rebirthCount:4,
      skills:{'skill:streetwise-investment':3,'skill:fast-talker':2,'skill:learn-the-streets':1,'skill:silent-partner':2,'skill:never-sleeps':2},
      unlockedAchievementIds:ACHIEVEMENT_CATALOG.map(a=>a.id), statistics:{manualJobsCompleted:123,automatedJobsCompleted:456,
        businessLevelsPurchased:47,territoriesAcquired:5,crewMembersRecruited:8,eventsResolved:19,rebirthsCompleted:4,peakHeat:99}}};
}
describe('v15 automation migration and strict validation',()=>{
  it('v14 adds only unowned disabled Auto-Upgrader with zero progress, preserving every prior field',()=>{
    const s=rich(),{enabledIds:_enabled,businessAutoUpgradeElapsedMs:_progress,...automation}=s.automation;
    const old={...s,automation},raw=stringifySaveFixture(envelope(old,14)),result=parseSave(raw);
    expect(CURRENT_SAVE_VERSION).toBe(17);expect(result).toEqual({ok:true,envelope:envelope(s)});
    expect(stringifySaveFixture(envelope(old,14))).toBe(raw);expect(validateSaveCode(encodeSaveText(raw))).toEqual(result);
    if(!result.ok)throw Error('fixture');const {enabledIds,businessAutoUpgradeElapsedMs,...prior}=result.envelope.state.automation;
    expect({...result.envelope.state,automation:prior}).toEqual(old);expect(enabledIds).toEqual([]);expect(businessAutoUpgradeElapsedMs).toBe(0);
  });
  it.each([true,false])('CE1 roundtrip enabled=%s preserves all state; acquisition gates are not retention gates',enabled=>{
    const r=rich(),s={...r,progression:{xp:0},city:createInitialGameState().city,businesses:createInitialGameState().businesses,
      automation:{...r.automation,unlockedIds:[D.id,A.id],enabledIds:enabled?[A.id]:[],businessAutoUpgradeElapsedMs:25000}};
    expect(validateSaveState(s)).toEqual(s);const code=exportSaveCode(s,42);if(!code.ok)throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true);expect(validateSaveCode(code.code)).toEqual({ok:true,envelope:{...envelope(s),savedAt:42}});
  });
  it.each([undefined,-1,.5,30000,Number.MAX_SAFE_INTEGER+1,'20000',null,NaN,Infinity])('rejects invalid progress %#',businessAutoUpgradeElapsedMs=>{
    const s=autoUpgraderState();expect(validateSaveState({...s,automation:{...s.automation,businessAutoUpgradeElapsedMs}})).toBeNull();
  });
  it.each([undefined,null,{},'enabled',[D.id],[A.id,A.id],['automation:unknown'],[0]])('rejects malformed enabled IDs %#',enabledIds=>{
    const s=autoUpgraderState();expect(validateSaveState({...s,automation:{...s.automation,enabledIds}})).toBeNull();
  });
  it.each([['automation:unknown'],[A.id,A.id],['automation:delivery-dispatcher',0],null,'ids'])('rejects malformed ownership %#',unlockedIds=>{
    const s=autoUpgraderState();expect(validateSaveState({...s,automation:{...s.automation,unlockedIds}})).toBeNull();
  });
  it('rejects unowned enabled/progress, missing fields, unknown fields and corrupt Dispatcher state',()=>{
    const s=createInitialGameState();
    for(const automation of [{...s.automation,enabledIds:[A.id]},{...s.automation,businessAutoUpgradeElapsedMs:1},
      {unlockedIds:[],starterJobElapsedMs:0},{...s.automation,extra:0},{...s.automation,starterJobElapsedMs:1}]) expect(validateSaveState({...s,automation})).toBeNull();
    const d={...s,automation:{...s.automation,unlockedIds:[D.id],starterJobElapsedMs:9999}};expect(validateSaveState(d)).toEqual(d);
  });
  it('rejects sparse/custom/accessor arrays and object getters without executing them',()=>{
    const s=autoUpgraderState();
    for(const ids of [Array(1),Object.assign([A.id],{extra:1}),Object.defineProperty([],0,{get(){throw Error('getter');},enumerable:true})])
      expect(isAutomationState({...s.automation,unlockedIds:ids})).toBe(false);
    expect(isAutomationState({...s.automation,get enabledIds(){throw Error('getter');}})).toBe(false);
    expect(isAutomationState(Object.create(s.automation))).toBe(false);
  });
  it.each([0,1,25000,29999])('accepts exact paused/active progress %i',businessAutoUpgradeElapsedMs=>{
    const s=autoUpgraderState();expect(isAutomationState({...s.automation,businessAutoUpgradeElapsedMs})).toBe(true);
    expect(isAutomationState({...s.automation,enabledIds:[],businessAutoUpgradeElapsedMs})).toBe(true);
  });
  it.each([1,2,3,4,5,6,7,8,9,10,11,12,13,14])('CE1 v%i migrates sequentially with no purchase or simulation',version=>{
    const s=rich(),state={economy:s.economy,
      businesses:version===1?{ownedIds:['business:dockside-detail'],productionRemainderMilliCents:975}:
        {owned:s.businesses.owned,productionRemainderMilliCents:975,...(version>=3?{productionRemainderSubMilliCents:s.businesses.productionRemainderSubMilliCents}:{})},
      ...(version>=3?{upgrades:s.upgrades}:{}),...(version>=4?{automation:{unlockedIds:[D.id],starterJobElapsedMs:7000}}:{}),
      ...(version>=5?{progression:s.progression}:{}),...(version>=6?{garage:s.garage}:{}),
      ...(version>=7?{permanentProgression:{empirePoints:17,rebirthCount:4,...(version>=8?{skills:s.permanentProgression.skills}:{}),
        ...(version>=13?{unlockedAchievementIds:s.permanentProgression.unlockedAchievementIds}:{}),...(version>=14?{statistics:s.permanentProgression.statistics}:{})}}:{}),
      ...(version>=9?{city:version===9?{ownedTerritoryIds:s.city.ownedTerritoryIds}:s.city}:{}),...(version>=11?{crew:s.crew}:{}),...(version>=12?{events:s.events}:{})};
    const result=validateSaveCode(encodeSaveText(stringifySaveFixture(envelope(state,version))));expect(result).toMatchObject({ok:true,envelope:{version: 17,savedAt:123456789,state:{economy:s.economy,
      automation:{unlockedIds:version>=4?[D.id]:[],starterJobElapsedMs:version>=4?7000:0,enabledIds:[],businessAutoUpgradeElapsedMs:0}}}});
    // Release matrix: verify every historical slice, not just version/cash/automation.
    if (!result.ok) throw Error(result.error);
    const fresh = createInitialGameState();
    expect(result.envelope.state).toEqual({
      ...fresh, economy: s.economy,
      businesses: { owned: version === 1 ? { 'business:dockside-detail': { level: 1 } } : s.businesses.owned,
        productionRemainderMilliCents: 975,
        productionRemainderSubMilliCents: version >= 3 ? s.businesses.productionRemainderSubMilliCents : fresh.businesses.productionRemainderSubMilliCents },
      upgrades: version >= 3 ? s.upgrades : fresh.upgrades,
      automation: { ...fresh.automation, unlockedIds: version >= 4 ? [D.id] : [], starterJobElapsedMs: version >= 4 ? 7000 : 0 },
      progression: version >= 5 ? s.progression : fresh.progression,
      garage: version >= 6 ? s.garage : fresh.garage,
      permanentProgression: { empirePoints: version >= 7 ? 17 : 0, rebirthCount: version >= 7 ? 4 : 0,
        skills: version >= 8 ? s.permanentProgression.skills : {},
        unlockedAchievementIds: version >= 13 ? s.permanentProgression.unlockedAchievementIds : [],
        statistics: version >= 14 ? s.permanentProgression.statistics : { ...fresh.permanentProgression.statistics, rebirthsCompleted: version >= 7 ? 4 : 0 } },
      city: version >= 10 ? s.city : version === 9 ? { ...fresh.city, ownedTerritoryIds: s.city.ownedTerritoryIds } : fresh.city,
      crew: version >= 11 ? s.crew : fresh.crew,
      events: version >= 12 ? s.events : fresh.events,
    });
    expect(validateSaveState(result.envelope.state)).toEqual(result.envelope.state);
  });
  it('rejects v14 claiming future ownership or fields instead of silently granting it',()=>{
    const s=autoUpgraderState();expect(parseSave(JSON.stringify(envelope(s,14)))).toEqual({ok:false,error:'invalid-state'});
    expect(parseSave(JSON.stringify(envelope({...s,automation:{unlockedIds:[A.id],starterJobElapsedMs:0}},14))).ok).toBe(false);
  });
});
