import { describe, expect, it, vi } from 'vitest';
import { eventState, fakeRandom, TIP, SHAKE, WAREHOUSE } from '../game/test-fixtures/event-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { crewState } from '../game/test-fixtures/crew-state';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { createGameRuntime } from './game-runtime';
import { createPersistentGame } from './persistent-game';
import { createLocalSave } from './local-save';
import { parseSave, serializeSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { resolveEventChoice } from '../game/resolve-event-choice';
import { selectCityEvents } from '../game/event-selectors';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { upgradeBusiness } from '../game/upgrade-business';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { purchaseAutomation } from '../game/purchase-automation';
import { purchaseVehicle } from '../game/purchase-vehicle';
import { purchaseSkillRank } from '../game/purchase-skill-rank';
import { acquireTerritory } from '../game/acquire-territory';
import { layLow } from '../game/lay-low';
import { recruitCrewMember, assignCrewMember, unassignCrewSlot } from '../game/crew-commands';
import { getHeatDecayIntervalMs } from '../game/heat-decay-interval';
function active():GameState {
  const s=rebirthState(),c=crewState({operations:'crew:rico-vale',logistics:'crew:jax-mercer'});
  return {...s,crew:c.crew,city:{...c.city,heat:79,heatDecayElapsedMs:30000},permanentProgression:{empirePoints:20,rebirthCount:3,skills:{}},
    events:{pendingEventId:TIP,opportunityElapsedMs:200000}};
}
describe('online event command boundaries',()=>{
  it('spawns once through normal reconciliation, repeats neither announcement nor RNG during pending play',()=>{
    const s={...eventState(),events:{pendingEventId:null,opportunityElapsedMs:590000}},rng=fakeRandom(0,0),f=rebirthRuntime(s,rng);
    expect(rng.calls()).toBe(0);f.at(20000);f.tick();const snapshot=f.game.getSnapshot();
    expect(snapshot.cityEvent).toEqual({id:TIP,sequence:1});expect(snapshot.result.state.events).toEqual({pendingEventId:TIP,opportunityElapsedMs:10000});
    const announcement=snapshot.cityEvent;f.at(1200000);f.tick();f.game.execute(performStarterJob);expect(f.game.getSnapshot().cityEvent).toBe(announcement);expect(rng.calls()).toBe(2);
    expect(f.game.getSnapshot().result.state.events).toEqual(snapshot.result.state.events);expect(f.timers()).toBe(2);f.game.stop();
  });
  it('an opportunity completed before a manual command spawns before the command runs',()=>{
    const s={...eventState(),events:{pendingEventId:null,opportunityElapsedMs:599999}},rng=fakeRandom(0,0),f=rebirthRuntime(s,rng);f.at(1);
    f.game.execute(state=>{expect(state.events.pendingEventId).toBe(TIP);return performStarterJob(state);});
    expect(rng.calls()).toBe(2);expect(f.game.getSnapshot().result.ok).toBe(true);f.game.stop();
  });
  it.each([-1,1,NaN,Infinity])('invalid RNG %s publishes no partial economy, XP, Heat or event state',roll=>{
    const s={...active(),events:{opportunityElapsedMs:599999,pendingEventId:null}},rng=fakeRandom(roll);let now=0;const publish=vi.fn();
    const r=createGameRuntime(s,publish,{random:rng,now:()=>now,schedule:()=>()=>{}});r.start();now=10000;
    expect(()=>r.reconcile()).toThrow(RangeError);expect(r.getSnapshot().runtimeError).toBe('invalid-state');expect(r.getSnapshot().result.state).toBe(s);
    expect(publish).toHaveBeenCalledTimes(1);expect(publish.mock.calls[0]?.[0].result.state).toBe(s);r.stop();
  });
  it('invalid selection RNG also preserves the whole pre-interval candidate',()=>{
    const s={...active(),events:{opportunityElapsedMs:599999,pendingEventId:null}},f=rebirthRuntime(s,fakeRandom(0,1));f.at(10000);
    expect(()=>f.tick()).toThrow(RangeError);expect(f.game.getSnapshot().result.state).toEqual(s);f.game.stop();
  });
  it('pending resolution reconciles old modifiers first, then awards a fixed outcome and saves',()=>{
    const s=active(),rng=fakeRandom(),f=rebirthRuntime(s,rng);f.at(50000);f.wall(51000);
    const reconciled=simulateGameElapsed(s,50000).state;
    f.game.execute(state=>{expect(state).toEqual(reconciled);return resolveEventChoice(state,TIP,'choice:take-tip');});
    const expected=resolveEventChoice(reconciled,TIP,'choice:take-tip').state;
    expect(f.game.getSnapshot().result.state).toEqual(expected);expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:51000,state:expected}});
    expect(rng.calls()).toBe(0);f.game.stop();const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(expected);expect(reload.getSnapshot().cityEvent).toBeUndefined();reload.stop();
  });
  it.each([[SHAKE,'choice:pay-off'],[WAREHOUSE,'choice:invest']] as const)('current reconciled affordability for %s, failure retains elapsed income but no choice effect',(id,choice)=>{
    const s=eventState(id,'0',40),f=rebirthRuntime(s,fakeRandom()),raw=f.raw();f.at(1000);
    const expected=simulateGameElapsed(s,1000).state;f.game.execute(state=>resolveEventChoice(state,id,choice));
    expect(f.game.getSnapshot().result).toMatchObject({ok:false,error:'insufficient-funds',state:expected});expect(f.raw()).toBe(raw);
    expect(expected.events).toEqual(s.events);expect(expected.economy.cash).toBe('75');f.game.stop();
  });
  it('business income earned while choice is open can make it affordable before resolution',()=>{
    const s=eventState(SHAKE,'99999',20),f=rebirthRuntime(s,fakeRandom());expect(selectCityEvents(s).choices[0]?.canChoose).toBe(false);
    f.at(1000);f.game.execute(state=>resolveEventChoice(state,SHAKE,'choice:pay-off'));
    expect(f.game.getSnapshot().result.ok).toBe(true);expect(f.game.getSnapshot().result.state.economy.cash).toBe('74');f.game.stop();
  });
  it('spending while pending changes choice availability, but not event identity or timer',()=>{
    const s=eventState(SHAKE,'120000',40),f=rebirthRuntime(s,fakeRandom());f.game.execute(layLow);
    const current=f.game.getSnapshot().result.state;expect(current.economy.cash).toBe('70000');expect(current.events).toEqual(s.events);
    expect(selectCityEvents(current).choices.map(c=>c.canChoose)).toEqual([false,true]);f.game.execute(state=>resolveEventChoice(state,SHAKE,'choice:refuse'));expect(f.game.getSnapshot().result.ok).toBe(true);f.game.stop();
  });
  it('successful PASS persists, resets even frozen remainder and begins a fresh cadence',()=>{
    const s=eventState(WAREHOUSE),rng=fakeRandom(.99),f=rebirthRuntime(s,rng);f.at(.9);f.game.execute(state=>resolveEventChoice(state,WAREHOUSE,'choice:pass'));
    expect(f.game.getSnapshot().result.state.events).toEqual(createInitialGameState().events);expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state:{events:createInitialGameState().events}}});
    f.at(600000.5);f.tick();expect(rng.calls()).toBe(0);expect(f.game.getSnapshot().result.state.events.opportunityElapsedMs).toBe(599999);
    f.at(600000.9);f.tick();expect(rng.calls()).toBe(1);expect(f.game.getSnapshot().result.state.events.opportunityElapsedMs).toBe(0);f.game.stop();
  });
  it('ordinary choice save failure reports persistence failure and retains the completed live command plus recoverable old save',()=>{
    const s=eventState(TIP),f=rebirthRuntime(s,fakeRandom()),raw=f.raw();f.fail();f.game.execute(state=>resolveEventChoice(state,TIP,'choice:take-tip'));
    expect(f.game.getSnapshot().persistence.kind).toBe('error');expect(f.game.getSnapshot().result.state).toEqual(resolveEventChoice(s,TIP,'choice:take-tip').state);expect(f.raw()).toBe(raw);f.game.stop();
  });
  it.each([false,true])('Rebirth clears event spawned during final reconciliation only after durable success (failure=%s)',fail=>{
    const s={...active(),events:{pendingEventId:null,opportunityElapsedMs:599999}},rng=fakeRandom(0,0),f=rebirthRuntime(s,rng),raw=f.raw();f.at(1);if(fail)f.fail();
    const r=f.game.rebirth();expect(r.ok).toBe(!fail);expect(rng.calls()).toBe(2);
    const current=f.game.getSnapshot().result.state;
    if(fail){expect(current.events.pendingEventId).toBe(TIP);expect(f.raw()).toBe(raw);}else{
      expect(current.events).toEqual(createInitialGameState().events);expect(current.economy.cash).toBe('0');expect(current.city).toEqual(createInitialGameState().city);expect(current.crew).toEqual(createInitialGameState().crew);
      expect(current.garage).toEqual(s.garage);expect(current.permanentProgression).toEqual({...s.permanentProgression,empirePoints:24,rebirthCount:4});
      const write=f.events.findIndex(e=>e.type==='write');const reset=f.events.findIndex(e=>e.type==='publish'&&e.state.events.pendingEventId===null);expect(write).toBeLessThan(reset);
    }f.game.stop();
  });
  it('pending Shakedown continues cooling with Mara/Jax active and event progress paused',()=>{
    const b=active(),s={...b,crew:crewState({operations:'crew:mara-knox',logistics:'crew:jax-mercer'}).crew,events:{pendingEventId:SHAKE as typeof SHAKE,opportunityElapsedMs:200000}},rng=fakeRandom(),f=rebirthRuntime(s,rng);
    f.at(1800000);f.tick();const expected=simulateGameElapsed(s,1800000).state;
    expect(f.game.getSnapshot().result.state).toEqual(expected);expect(expected.events).toEqual(s.events);expect(getHeatDecayIntervalMs(expected)).toBe(45000);expect(expected.city.heat).toBeLessThan(s.city.heat);expect(rng.calls()).toBe(0);f.game.stop();
  });
});

type RuntimeCommand = Parameters<ReturnType<typeof createGameRuntime>['execute']>[0];
const fresh=createInitialGameState(),base=active();
const normalCommands: readonly {name:string;state:GameState;command:RuntimeCommand}[]=[
  {name:'manual job',state:base,command:performStarterJob},
  {name:'buy business',state:{...base,businesses:fresh.businesses},command:s=>purchaseBusiness(s,'business:dockside-detail')},
  {name:'level business',state:base,command:s=>upgradeBusiness(s,'business:dockside-detail')},
  {name:'normal upgrade',state:{...base,upgrades:fresh.upgrades},command:s=>purchaseUpgrade(s,'upgrade:express-tips')},
  {name:'Dispatcher',state:{...base,automation:fresh.automation},command:s=>purchaseAutomation(s,'automation:delivery-dispatcher')},
  {name:'Lay Low',state:base,command:layLow},
  {name:'recruit crew',state:{...base,crew:fresh.crew},command:s=>recruitCrewMember(s,'crew:rico-vale')},
  {name:'assign crew',state:{...base,crew:crewState().crew},command:s=>assignCrewMember(s,'operations','crew:rico-vale')},
  {name:'replace crew',state:base,command:s=>assignCrewMember(s,'operations','crew:mara-knox')},
  {name:'unassign crew',state:base,command:s=>unassignCrewSlot(s,'operations')},
  {name:'acquire Neon',state:{...base,city:{...base.city,ownedTerritoryIds:fresh.city.ownedTerritoryIds}},command:s=>acquireTerritory(s,'territory:neon-mile')},
  {name:'buy vehicle',state:{...base,garage:fresh.garage},command:s=>purchaseVehicle(s,'vehicle:starter-sport-sedan')},
  {name:'buy permanent skill',state:base,command:s=>purchaseSkillRank(s,'skill:streetwise-investment')},
];
describe('pending events do not block the operation',()=>{
  it.each(normalCommands)('$name remains playable and persists the same pending event',({state,command})=>{
    const rng=fakeRandom(),f=rebirthRuntime(state,rng);f.at(1234);f.game.execute(command);const current=f.game.getSnapshot().result;
    expect(current.ok).toBe(true);expect(current.state.events).toEqual(state.events);expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state:{events:state.events}}});expect(rng.calls()).toBe(0);f.game.stop();
  });
  it.each(normalCommands)('$name also reconciles an idle event opportunity before its command',({state,command})=>{
    const s={...state,events:{pendingEventId:null,opportunityElapsedMs:599999}},rng=fakeRandom(0,0),f=rebirthRuntime(s,rng);
    f.at(1);f.game.execute(current=>{expect(current.events.pendingEventId).toBe(TIP);return command(current);});
    expect(f.game.getSnapshot().result.ok).toBe(true);expect(rng.calls()).toBe(2);f.game.stop();
  });
  it('pending Rebirth is allowed, discards choice without cash compensation',()=>{
    const f=rebirthRuntime(base,fakeRandom());expect(f.game.rebirth().ok).toBe(true);expect(f.game.getSnapshot().result.state.events).toEqual(fresh.events);expect(f.game.getSnapshot().result.state.economy.cash).toBe('0');f.game.stop();
  });
});

describe('offline and import event exclusion',()=>{
  it.each([0,1,2])('rank %i caps normal simulation but never event progress or RNG',rank=>{
    for(const pendingEventId of [null,TIP] as const)for(const hours of [1,8,10,12,20]){
      const b=active(),s={...b,events:{pendingEventId,opportunityElapsedMs:420000},permanentProgression:{...b.permanentProgression,skills:rank?{'skill:never-sleeps':rank}:{}}};
      const encoded=serializeSave(s,1000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;const rng=fakeRandom(),order:string[]=[];
      const cap=(8+2*rank)*3600000,elapsed=hours*3600000,expected=simulateGameElapsed(s,Math.min(elapsed,cap)).state;
      const save=createLocalSave(()=>({getItem:()=>raw,setItem:(_key,value)=>{order.push('write');raw=value;}}),()=>1000+elapsed);
      const game=createPersistentGame(view=>{order.push('publish');expect(view.result.state).toEqual(expected);},save,{random:rng,now:()=>0,schedule:()=>()=>{}},()=>()=>{});
      game.start();expect(order[0]).toBe('write');expect(game.getSnapshot().result.state.events).toEqual(s.events);expect(game.getSnapshot().cityEvent).toBeUndefined();expect(rng.calls()).toBe(0);
      expect(save.bootstrap()).toMatchObject({kind:'loaded',state:expected,offline:{rewardedElapsedMs:0}});game.stop();
    }
  });
  it('420s saved online progress remains after 8h offline, then 180s online completes the opportunity',()=>{
    const s={...eventState(),events:{pendingEventId:null,opportunityElapsedMs:420000}},rng=fakeRandom(0,0),f=rebirthRuntime(s,rng);f.game.stop();f.wall(28801000);
    const game=f.make();game.start();expect(game.getSnapshot().result.state.events).toEqual(s.events);expect(rng.calls()).toBe(0);
    f.at(180000);f.tick();expect(rng.calls()).toBe(2);expect(game.getSnapshot().result.state.events).toEqual({pendingEventId:TIP,opportunityElapsedMs:0});game.stop();
  });
  it.each([null,SHAKE] as const)('historical import %s preserves state, rebases timing and consumes no RNG',pendingEventId=>{
    const s={...eventState(pendingEventId,'0',0),events:{pendingEventId,opportunityElapsedMs:420000}},rng=fakeRandom(0,0),f=rebirthRuntime(active(),rng);
    const code=exportSaveCode(s,0);if(!code.ok)throw Error('fixture');f.at(10000000);f.wall(20000000);expect(f.game.importCode(code.code)).toEqual({ok:true});
    expect(f.game.getSnapshot().result.state).toEqual(s);expect(f.game.getSnapshot().cityEvent).toBeUndefined();expect(rng.calls()).toBe(0);expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:20000000,state:s}});
    f.at(10180000);f.tick();expect(rng.calls()).toBe(pendingEventId?0:2);if(pendingEventId)expect(f.game.getSnapshot().result.state.events).toEqual(s.events);f.game.stop();
  });
  it('offline write failure preserves old event/economy and never schedules or rolls',()=>{
    const s=active(),encoded=serializeSave(s,0);if(!encoded.ok)throw Error('fixture');const rng=fakeRandom(),schedule=vi.fn(()=>()=>{});
    const game=createPersistentGame(()=>{},createLocalSave(()=>({getItem:()=>encoded.serialized,setItem:()=>{throw Error('quota');}}),()=>28800000),{random:rng,now:()=>0,schedule},schedule);
    game.start();expect(game.getSnapshot().result.state).toEqual(s);expect(game.getSnapshot().persistence.kind).toBe('offline-error');expect(schedule).not.toHaveBeenCalled();expect(rng.calls()).toBe(0);game.stop();
  });
  it('a future saved clock credits zero and preserves pending state without RNG',()=>{
    const s=active(),encoded=serializeSave(s,100000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;const rng=fakeRandom();
    const game=createPersistentGame(()=>{},createLocalSave(()=>({getItem:()=>raw,setItem:(_key,value)=>{raw=value;}}),()=>1000),{random:rng,now:()=>0,schedule:()=>()=>{}},()=>()=>{});
    game.start();expect(game.getSnapshot().result.state).toEqual(s);expect(game.getSnapshot().offline).toMatchObject({clockAnomaly:true,rewardedElapsedMs:0});expect(rng.calls()).toBe(0);game.stop();
  });
  it('failed import writes preserve previous pending event and existing online clock',()=>{
    const s=active(),f=rebirthRuntime(s,fakeRandom()),code=exportSaveCode(eventState(SHAKE),0),raw=f.raw();if(!code.ok)throw Error('fixture');f.at(1234);f.fail();
    expect(f.game.importCode(code.code).ok).toBe(false);expect(f.game.getSnapshot().result.state).toEqual(s);expect(f.raw()).toBe(raw);f.tick();expect(f.game.getSnapshot().result.state).toEqual(simulateGameElapsed(s,1234).state);f.game.stop();
  });
});
