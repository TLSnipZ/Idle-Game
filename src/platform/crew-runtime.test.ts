import { unlockEligibleAchievements } from '../game/achievements';
import { describe, expect, it } from 'vitest';
import { RICO_VALE as R, MARA_KNOX as M, JAX_MERCER as J, createInitialCrewState } from '../features/crew';
import { crewState } from '../game/test-fixtures/crew-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { NEVER } from '../game/test-fixtures/skill-state';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';
import { createGameRuntime } from './game-runtime';
import { recruitCrewMember, assignCrewMember, unassignCrewSlot } from '../game/crew-commands';
import { performStarterJob } from '../game/perform-starter-job';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { simulateElapsed } from '../game/simulate-elapsed';
import { getHeatDecayIntervalMs } from '../game/heat-decay-interval';
import { evaluateJobReward } from '../game/effective-stats';
import { parseSave, serializeSave } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { createInitialGameState } from '../game/game-state';

function heated(operations: typeof R.id | null = null) {
  const s=crewState({operations,logistics:J.id});return {...s,city:{...s.city,heat:79,heatDecayElapsedMs:30000}};
}
describe('Crew runtime boundaries and persistence',()=>{
  it('recruitment reconciles first, preserves assignment and saves only the complete purchase',()=>{
    const s={...heated(R.id),crew:{recruitedIds:[R.id,J.id],assignments:{operations:R.id,logistics:J.id}}};
    const f=rebirthRuntime(s);f.at(12000);f.wall(13000);
    const reconciled=onlineElapsed(s,12000).state;
    f.game.execute(state=>{expect(state).toEqual(reconciled);return recruitCrewMember(state,M.id);});
    const expected=recruitCrewMember(reconciled,M.id).state;
    expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(expected).state);expect(expected.crew.assignments).toEqual(s.crew.assignments);
    expect(f.events.filter(e=>e.type==='write').map(e=>e.state)).toEqual([unlockEligibleAchievements(expected).state]);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{version: 14,savedAt:13000,state:unlockEligibleAchievements(expected).state}});
  });
  it('Rico → Mara and reverse switch use old Money/decay before replacement and new effects after',()=>{
    const s=heated(R.id),f=rebirthRuntime(s);f.at(30000);
    const old=onlineElapsed(s,30000).state;
    f.game.execute(state=>{expect(state).toEqual(old);return assignCrewMember(state,'operations',M.id);});
    let switched=f.game.getSnapshot().result.state;expect(switched.city).toEqual(old.city);expect(getHeatDecayIntervalMs(switched)).toBe(45000);
    expect(f.game.getSnapshot().automationEvent?.income).toBe('8166'); // HOT + Neon + Rico, three per-job floored payouts.
    f.at(50000);const beforeReverse=onlineElapsed(switched,20000).state;
    f.game.execute(state=>{expect(state).toEqual(beforeReverse);return assignCrewMember(state,'operations',R.id);});
    switched=f.game.getSnapshot().result.state;expect(switched.city).toEqual(beforeReverse.city);expect(getHeatDecayIntervalMs(switched)).toBe(60000);
    f.at(60000);f.tick();expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(switched,10000).state);
    const current=f.game.getSnapshot().result.state;f.game.execute(performStarterJob);
    const reward=evaluateJobReward(current);if(!reward.ok)throw Error('fixture');
    expect(f.game.getSnapshot().result).toMatchObject({ok:true,moneyEarned:reward.reward});
  });
  it.each([[40000,5000,0],[50000,1,5001]] as const)('Mara assignment preserves %ims without zero-time cooling', (rest,ms,remainder)=>{
    const s={...crewState(),city:{...crewState().city,heat:20,heatDecayElapsedMs:rest}};
    const f=rebirthRuntime(s);f.game.execute(state=>assignCrewMember(state,'operations',M.id));
    expect(f.game.getSnapshot().result.state.city).toEqual(s.city);f.tick();expect(f.game.getSnapshot().result.state.city).toEqual(s.city);
    f.at(ms);f.tick();expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:19,heatDecayElapsedMs:remainder});
  });
  it('unassignment reconciles with Mara before returning to 60s and preserving remainder',()=>{
    const s={...heated(M.id),automation:createInitialGameState().automation,city:{...heated(M.id).city,heat:20,heatDecayElapsedMs:40000}},f=rebirthRuntime(s);
    f.at(5000);f.game.execute(state=>unassignCrewSlot(state,'operations'));const current=f.game.getSnapshot().result.state;
    expect(current.city).toMatchObject({heat:19,heatDecayElapsedMs:0});expect(getHeatDecayIntervalMs(current)).toBe(60000);
    f.at(50000);f.tick();expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:19,heatDecayElapsedMs:45000});
  });
  it('Jax assignment and unassignment bracket production exactly with both fractions retained',()=>{
    const s={...crewState(),automation:createInitialGameState().automation},f=rebirthRuntime(s);
    f.at(1234);const before=onlineElapsed(s,1234).state;f.game.execute(state=>assignCrewMember(state,'logistics',J.id));
    const assigned=assignCrewMember(before,'logistics',J.id).state;expect(f.game.getSnapshot().result.state).toEqual(assigned);
    f.at(5678);const beforeUnassign=onlineElapsed(assigned,4444).state;f.game.execute(state=>unassignCrewSlot(state,'logistics'));
    const unassigned=unassignCrewSlot(beforeUnassign,'logistics').state;expect(f.game.getSnapshot().result.state).toEqual(unassigned);
    f.at(9000);f.tick();expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(unassigned,3322).state);
  });
  it('drops only sub-ms runtime duration at active assignment changes, not recruitment/failures',()=>{
    let now=0;const s={...crewState(),automation:createInitialGameState().automation};
    const runtime=createGameRuntime(s,()=>{}, {random: { next: () => 0.99 }, now: () =>now,schedule:()=>()=>{}});runtime.start();
    now=.5;runtime.execute(state=>assignCrewMember(state,'logistics',J.id));const assigned=runtime.getSnapshot().result.state;
    now=1;runtime.reconcile();expect(runtime.getSnapshot().result.state).toEqual(assigned);
    now=1.5;runtime.reconcile();expect(runtime.getSnapshot().result.state).toEqual(onlineElapsed(assigned,1).state);
    const f=rebirthRuntime({...s,crew:createInitialCrewState()});f.at(.9);f.game.execute(state=>recruitCrewMember(state,R.id));
    const recruited=f.game.getSnapshot().result.state;f.at(1);f.tick();expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(recruited,1).state);
  });
  it('failed commands preserve reconciled state, assignment, funds and durable save',()=>{
    const f=rebirthRuntime(heated());const raw=f.raw();f.at(1234);const old=onlineElapsed(heated(),1234).state;
    f.game.execute(state=>assignCrewMember(state,'operations',J.id));expect(f.game.getSnapshot().result).toMatchObject({ok:false,state:old});
    expect(f.raw()).toBe(raw);expect(f.events.some(e=>e.type==='write')).toBe(false);
  });
  it('saves recruit/assign/unassign and preserves explicit state through autosave, export, reload and Strict Mode',()=>{
    const f=rebirthRuntime({...crewState(),crew:createInitialCrewState()});
    f.game.execute(state=>recruitCrewMember(state,R.id));f.game.execute(state=>assignCrewMember(state,'operations',R.id));
    f.game.execute(state=>recruitCrewMember(state,J.id));f.game.execute(state=>assignCrewMember(state,'logistics',J.id));
    f.at(4321);f.wall(5321);f.autosave();const expected=f.game.getSnapshot().result.state;
    const code=f.game.exportCode();if(!code.ok)throw Error('fixture');expect(validateSaveCode(code.code)).toMatchObject({ok:true,envelope:{version: 14,savedAt:5321,state:expected}});
    f.game.stop();const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(expected);
    reload.stop();reload.start();expect(reload.getSnapshot().result.state).toEqual(expected);expect(f.timers()).toBe(2);
    reload.execute(state=>unassignCrewSlot(state,'operations'));expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state:{crew:{recruitedIds:[R.id,J.id],assignments:{operations:null,logistics:J.id}}}}});
  });
  it('ordinary command write failure retains valid live assignments plus warning and previous save',()=>{
    const f=rebirthRuntime(crewState()),raw=f.raw();f.fail();f.game.execute(state=>assignCrewMember(state,'operations',R.id));
    expect(f.game.getSnapshot().result.state.crew.assignments.operations).toBe(R.id);expect(f.game.getSnapshot().persistence.kind).toBe('error');expect(f.raw()).toBe(raw);
  });
  it('import retains grandfathered ownership/assignments and 50s Mara progress, no historical simulation',()=>{
    const s={...createInitialGameState(),crew:crewState({operations:M.id,logistics:J.id}).crew,city:{...createInitialGameState().city,heat:20,heatDecayElapsedMs:50000}};
    const f=rebirthRuntime();f.at(100000);f.wall(999999);const code=exportSaveCode(s,0);if(!code.ok)throw Error('fixture');
    expect(f.game.importCode(code.code)).toEqual({ok:true});expect(f.game.getSnapshot().result.state).toEqual(s);
    expect(f.game.getSnapshot().automationEvent).toBeUndefined();expect(getHeatDecayIntervalMs(f.game.getSnapshot().result.state)).toBe(45000);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:999999,state:s}});
    f.at(100001);f.tick();expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:19,heatDecayElapsedMs:5001});
  });
  it('failed import replacement changes neither live Crew nor previous durable save',()=>{
    const f=rebirthRuntime(crewState()),before=f.game.getSnapshot().result.state,raw=f.raw();const code=exportSaveCode(heated(M.id),0);if(!code.ok)throw Error('fixture');
    f.fail();expect(f.game.importCode(code.code)).toMatchObject({ok:false,error:'persistence-failure'});expect(f.raw()).toBe(raw);expect(f.game.getSnapshot().result.state).toBe(before);
  });
  it.each([R.id,M.id])('final pre-Rebirth reconciliation uses %s plus Jax before durable reset',operations=>{
    const base=rebirthState(),s={...base,crew:crewState({operations,logistics:J.id}).crew,city:heated(operations).city};
    const f=rebirthRuntime(s);f.at(55001);f.wall(56001);const before=onlineElapsed(s,55001).state;
    expect(f.game.rebirth()).toMatchObject({ok:true});const after=f.game.getSnapshot().result.state;
    expect(f.events[0]).toEqual({type:'publish',state:before});
    expect(f.events.findIndex(e=>e.type==='write'&&e.state.crew.recruitedIds.length===0)).toBeLessThan(f.events.findIndex(e=>e.type==='publish'&&e.state.crew.recruitedIds.length===0));
    expect(after.crew).toEqual(createInitialCrewState());expect(after.city).toEqual(createInitialGameState().city);
    expect(after.garage).toEqual(s.garage);expect(after.permanentProgression.rebirthCount).toBe(s.permanentProgression.rebirthCount+1);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:56001,state:after}});
    f.game.stop();const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(after);
    expect(simulateElapsed(after,5000).state.economy.cash).toBe('0');
  });
  it('failed Rebirth write retains all reconciled Crew and other live progression',()=>{
    const s={...rebirthState(),crew:heated(M.id).crew,city:heated(M.id).city};const f=rebirthRuntime(s),raw=f.raw();f.at(45001);f.fail();
    const expected=onlineElapsed(s,45001).state;expect(f.game.rebirth()).toMatchObject({ok:false,error:'persistence-failure'});
    expect(f.game.getSnapshot().result.state).toEqual(expected);expect(f.raw()).toBe(raw);
  });
  it.each([0,1,2])('offline rank %i caps all assigned effects once before publication',rank=>{
    for(const operations of [R.id,M.id]) {
      const b=heated(operations),s={...b,permanentProgression:{...b.permanentProgression,skills:rank?{[NEVER]:rank}:{}}};
      const cap=(8+2*rank)*3600000,now=cap+7000123;const encoded=serializeSave(s,0);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;
      const expected=simulateGameElapsed(s,cap).state;const order:string[]=[];
      const saves=createLocalSave(()=>({getItem:()=>raw,setItem:(_k,v)=>{order.push('write');raw=v;}}),()=>now);
      const game=createPersistentGame(view=>{order.push('publish');expect(view.result.state).toEqual(expected);},saves,{random: { next: () => 0.99 }, now: () =>0,schedule:()=>()=>{}},()=>()=>{});
      game.start();expect(order[0]).toBe('write');expect(game.getSnapshot().offline).toMatchObject({capMs:cap,rewardedElapsedMs:cap,actualElapsedMs:now});
      expect(saves.bootstrap()).toMatchObject({kind:'loaded',state:expected,offline:{rewardedElapsedMs:0}});
    }
  });
  it('failed offline write pauses without partial Crew/economy changes and no schedules',()=>{
    const s=heated(M.id),encoded=serializeSave(s,0);if(!encoded.ok)throw Error('fixture');const raw=encoded.serialized;let timers=0;
    const game=createPersistentGame(()=>{},createLocalSave(()=>({getItem:()=>raw,setItem:()=>{throw Error('quota');}}),()=>95000),
      {random: { next: () => 0.99 }, now: () =>0,schedule:()=>{timers++;return()=>{};}},()=>{timers++;return()=>{};});
    game.start();expect(game.getSnapshot().persistence.kind).toBe('offline-error');expect(game.getSnapshot().result.state).toEqual(s);expect(timers).toBe(0);
    game.execute(state=>unassignCrewSlot(state,'operations'));expect(game.getSnapshot().result.state).toEqual(s);
  });
  it('future clock credits zero, preserving Mara remainder above her interval without normalization',()=>{
    const s={...heated(M.id),city:{...heated(M.id).city,heatDecayElapsedMs:50000}};const encoded=serializeSave(s,100000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;
    const result=createLocalSave(()=>({getItem:()=>raw,setItem:(_k,v)=>{raw=v;}}),()=>1000).bootstrap();
    expect(result).toMatchObject({kind:'loaded',state:unlockEligibleAchievements(s).state,offline:{clockAnomaly:true,rewardedElapsedMs:0}});
  });
  it('invalid Crew suspends shared simulation and cannot publish partial income',()=>{
    const s=heated();let now=0;const runtime=createGameRuntime(s,()=>{}, {random: { next: () => 0.99 }, now: () =>now,schedule:()=>()=>{}});runtime.start();
    // Simulate integration corruption, never accepted through a save boundary.
    Object.defineProperty(s.crew.assignments,'operations',{value:J.id,enumerable:true});now=10000;
    expect(()=>runtime.reconcile()).toThrow(RangeError);expect(runtime.getSnapshot().runtimeError).toBe('invalid-state');expect(runtime.getSnapshot().result.state.economy.cash).toBe(s.economy.cash);
  });
});
