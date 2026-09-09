import { moneyFromMinorUnits } from '../features/economy';
import { describe,expect,it } from 'vitest';
import { autoUpgraderState as initial } from '../game/test-fixtures/auto-upgrader-state';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { createInitialGameState } from '../game/game-state';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { reconcileOffline } from '../game/offline-progress';
import { upgradeBusiness } from '../game/upgrade-business';
import { purchaseAutomation } from '../game/purchase-automation';
import { setAutomationEnabled } from '../game/set-automation-enabled';
import { purchaseVehicle } from '../game/purchase-vehicle';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { parseSave, serializeSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';
import { crewState } from '../game/test-fixtures/crew-state';
import { fakeRandom } from '../game/test-fixtures/event-state';
const level=(s:ReturnType<typeof initial>)=>s.businesses.owned[B.id]?.level;
describe('auto spending at online, offline and durable boundaries',()=>{
  it('purchase reconciles old elapsed and starts disabled; enabling credits no past purchases',()=>{
    const s=initial(),f=rebirthRuntime({...s,automation:createInitialGameState().automation});f.at(30000);
    f.game.execute(state=>purchaseAutomation(state,A.id));let after=f.game.getSnapshot().result.state;
    expect(level(after)).toBe(25);expect(after.automation.enabledIds).toEqual([]);expect(after.economy.cash).toBe('95056250');
    f.at(60000);f.game.execute(state=>setAutomationEnabled(state,A.id,true));after=f.game.getSnapshot().result.state;
    expect(level(after)).toBe(25);expect(after.automation.businessAutoUpgradeElapsedMs).toBe(0);
    f.at(89999);f.tick();expect(level(f.game.getSnapshot().result.state)).toBe(25);
    f.at(90000);f.tick();expect(level(f.game.getSnapshot().result.state)).toBe(26);f.game.stop();
  });
  it('disable reconciles old enabled state, saves paused progress, resumes only future time',()=>{
    const f=rebirthRuntime(initial());f.at(35000);f.game.execute(s=>setAutomationEnabled(s,A.id,false));
    const after=f.game.getSnapshot().result.state;expect(level(after)).toBe(26);expect(after.automation.businessAutoUpgradeElapsedMs).toBe(5000);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state:after}});
    f.at(395000);f.tick();expect(level(f.game.getSnapshot().result.state)).toBe(26);expect(f.game.getSnapshot().result.state.automation.businessAutoUpgradeElapsedMs).toBe(5000);
    f.game.execute(s=>setAutomationEnabled(s,A.id,true));f.at(420000);f.tick();expect(level(f.game.getSnapshot().result.state)).toBe(27);f.game.stop();
  });
  it('manual upgrade reconciles due automatic purchase then uses the new current cost',()=>{
    const s=initial(),f=rebirthRuntime(s);f.at(30000);f.game.execute(state=>upgradeBusiness(state,B.id));
    const after=f.game.getSnapshot().result.state;expect(level(after)).toBe(27);expect(after.economy.cash).toBe('80541250');
    expect(after.permanentProgression.statistics.businessLevelsPurchased).toBe(2);
    expect(f.events.filter(e=>e.type==='write')).toHaveLength(1);f.game.stop();
  });
  it('automatic spending before another purchase may make it unaffordable',()=>{
    const f=rebirthRuntime(initial(25,'10000000'));f.at(30000);f.game.execute(s=>purchaseVehicle(s,V.id));
    expect(f.game.getSnapshot().result).toMatchObject({ok:false,error:'insufficient-funds'});
    expect(level(f.game.getSnapshot().result.state)).toBe(26);expect(f.game.getSnapshot().result.state.garage.ownedVehicleIds).toEqual([]);f.game.stop();
  });
  it.each([0,1,2])('offline Rank %i shares cap, includes upgrades before durable publication, no events/RNG/double credit',rank=>{
    const s=initial(25,'10000000000'),c=crewState({operations:'crew:mara-knox',logistics:'crew:jax-mercer'});
    const state={...s,crew:c.crew,city:{...s.city,heat:79,heatDecayElapsedMs:42000},
      automation:{...s.automation,unlockedIds:[A.id,D.id],starterJobElapsedMs:7000,businessAutoUpgradeElapsedMs:20000},
      permanentProgression:{...s.permanentProgression,skills:rank?{'skill:never-sleeps':rank}:{}}};
    const cap=(8+rank*2)*3600000,wall=1000+cap+3600000,encoded=serializeSave(state,1000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;
    const expected=simulateGameElapsed(state,cap);if(!expected.ok)throw Error(expected.error);
    const trace:string[]=[],random=fakeRandom();
    const makeSaves=()=>createLocalSave(()=>({getItem:()=>raw,setItem:(_key,value)=>{expect(parseSave(value)).toMatchObject({ok:true,envelope:{state:expected.state,savedAt:wall}});trace.push('write');raw=value;}}),()=>wall);
    const game=createPersistentGame(view=>{trace.push('publish');expect(view.result.state).toEqual(expected.state);},makeSaves(),{now:()=>0,random,schedule:()=>()=>{}},()=>()=>{});
    game.start();expect(trace[0]).toBe('write');expect(game.getSnapshot().offline).toMatchObject({rewardedElapsedMs:cap,capMs:cap,capped:true,autoUpgrader:expected.autoUpgrader});
    expect(expected.autoUpgrader?.levelsPurchased).toBeGreaterThan(0);expect(random.calls()).toBe(0);expect(expected.state.events).toEqual(state.events);
    expect(expected.state.permanentProgression.statistics.businessLevelsPurchased).toBe(expected.autoUpgrader?.levelsPurchased);
    game.stop();expect(makeSaves().bootstrap()).toMatchObject({kind:'loaded',state:expected.state,offline:{incomeEarned:'0',xpEarned:0}});
  });
  it('offline chronological affordability yields exact income/spend/XP instead of a negative income exception',()=>{
    const s=initial(25,'9262500'),r=reconcileOffline(s,1000,91000);expect(r.ok).toBe(true);if(!r.ok)throw Error(r.error);
    expect(r.state.economy.cash).toBe('58500');expect(r.progress).toMatchObject({incomeEarned:'171000',xpEarned:25,autoUpgrader:{levelsPurchased:1,spent:'9375000'}});
  });
  it('disabled offline matches the unsplit baseline and preserves partial progress',()=>{
    const s=initial(),state={...s,automation:{...s.automation,enabledIds:[],businessAutoUpgradeElapsedMs:20000}};
    const r=reconcileOffline(state,1000,28801000);expect(r.state).toEqual(simulateGameElapsed(state,28800000).state);expect(level(r.state)).toBe(25);
    expect(r.state.automation.businessAutoUpgradeElapsedMs).toBe(20000);
  });
  it.each(['storage','statistics','xp','cash'] as const)('offline %s failure preserves old save and publishes no candidate',failure=>{
    const s=initial(),state={...s,...(failure==='xp'?{progression:{xp:Number.MAX_SAFE_INTEGER-30}}:{}),
      ...(failure==='cash'?{economy:{cash:moneyFromMinorUnits('9'.repeat(100))}}:{}),
      ...(failure==='statistics'?{permanentProgression:{...s.permanentProgression,statistics:{...s.permanentProgression.statistics,businessLevelsPurchased:Number.MAX_SAFE_INTEGER-1}}}:{})};
    const encoded=serializeSave(state,1000);if(!encoded.ok)throw Error('fixture');const raw=encoded.serialized;let writes=0;
    const saves=createLocalSave(()=>({getItem:()=>raw,setItem:()=>{writes++;throw Error('quota');}}),()=>91000);
    expect(saves.bootstrap()).toMatchObject({kind:'offline-error',state});expect(writes).toBe(failure==='storage'?1:0);
    expect(parseSave(raw)).toMatchObject({ok:true,envelope:{state,savedAt:1000}});
  });
  it('future clock awards no progress, upgrades or elapsed rewards',()=>{
    const s=initial(),r=reconcileOffline(s,2000,1000);expect(r.ok).toBe(true);expect(level(r.state)).toBe(25);expect(r.state.automation).toEqual(s.automation);
    expect(r.state.economy).toEqual(s.economy);expect(r.state.permanentProgression.statistics).toEqual(s.permanentProgression.statistics);
  });
  it('historical import preserves enabled progress exactly and rebases future attempt timing',()=>{
    const s=initial(),state={...s,automation:{...s.automation,businessAutoUpgradeElapsedMs:20000}};
    const code=exportSaveCode(state,1);if(!code.ok)throw Error('fixture');const rng=fakeRandom(),f=rebirthRuntime(createInitialGameState(),rng);
    f.at(123000);f.wall(604800000);expect(f.game.importCode(code.code).ok).toBe(true);
    expect(f.game.getSnapshot().result.state).toEqual(state);expect(rng.calls()).toBe(0);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state,savedAt:604800000}});
    f.at(132999);f.tick();expect(level(f.game.getSnapshot().result.state)).toBe(25);f.at(133000);f.tick();expect(level(f.game.getSnapshot().result.state)).toBe(26);f.game.stop();
  });
  it('Rebirth reconciles due upgrades then retains statistics/achievements in the durable reset',()=>{
    const f=rebirthRuntime(initial());f.at(30000);f.wall(31000);expect(f.game.rebirth().ok).toBe(true);
    const after=f.game.getSnapshot().result.state;expect(after.automation).toEqual(createInitialGameState().automation);expect(after.businesses.owned).toEqual({});
    expect(after.permanentProgression.statistics.businessLevelsPurchased).toBe(1);expect(after.permanentProgression.statistics.rebirthsCompleted).toBe(1);
    expect(after.permanentProgression.unlockedAchievementIds).toContain('achievement:first-rebirth');
    const write=f.events.findIndex(e=>e.type==='write'),reset=f.events.findIndex(e=>e.type==='publish'&&e.state.permanentProgression.rebirthCount===1);expect(reset).toBeGreaterThan(write);f.game.stop();
  });
  it('late auto-upgrade overflow suspends runtime without publishing earlier candidate purchases',()=>{
    const s=initial(),state={...s,permanentProgression:{...s.permanentProgression,statistics:{...s.permanentProgression.statistics,businessLevelsPurchased:Number.MAX_SAFE_INTEGER-1}}};
    const f=rebirthRuntime(state),before=f.game.getSnapshot().result.state,raw=f.raw();f.at(90000);f.tick();
    expect(f.game.getSnapshot().runtimeError).toBe('statistics-overflow');expect(f.game.getSnapshot().result.state).toBe(before);expect(f.raw()).toBe(raw);f.game.stop();
  });
});
