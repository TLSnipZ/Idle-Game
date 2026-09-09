import { unlockEligibleAchievements } from '../game/achievements';
import { describe, expect, it } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { territoryState } from '../game/test-fixtures/territory-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { performStarterJob } from '../game/perform-starter-job';
import { acquireTerritory } from '../game/acquire-territory';
import { layLow } from '../game/lay-low';
import { NEON_MILE } from '../features/territories';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { parseSave, serializeSave } from '../game/save-schema';
import { createLocalSave } from './local-save';
import { createPersistentGame } from './persistent-game';
import { createGameRuntime } from './game-runtime';
import { FAST, NEVER } from '../game/test-fixtures/skill-state';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';

function initial(heat = 79, heatDecayElapsedMs = 0, owned = false) {
  const s=territoryState(owned);return {...s,city:{...s.city,heat,heatDecayElapsedMs}};
}
describe('shared Heat runtime and durable boundaries', () => {
  it('Neon acquisition reconciles old tier/ownership, then spends and adds Heat before future rewards', () => {
    const s=initial(50),f=rebirthRuntime(s);f.at(50000);f.wall(51000);
    f.game.execute(state=>acquireTerritory(state,NEON_MILE.id));
    expect(f.game.getSnapshot().automationEvent).toMatchObject({completedJobs:5,income:'12500'});
    const r=onlineElapsed(s,50000);expect(r.state.city).toMatchObject({heat:51,heatDecayElapsedMs:50000});
    const after=acquireTerritory(r.state,NEON_MILE.id).state;
    expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(after).state);expect(after.city.heat).toBe(61);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:51000,state:unlockEligibleAchievements(after).state}});
    f.at(60000);f.tick();expect(f.game.getSnapshot().automationEvent).toMatchObject({income:'2475'});
    expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:60,heatDecayElapsedMs:0});
    f.game.execute(performStarterJob);expect(f.game.getSnapshot().result).toMatchObject({moneyEarned:'2475'});f.game.stop();
  });
  it('Lay Low reconciles old HOT jobs and cooling first; future jobs use reduced Heat', () => {
    const s=initial(65),f=rebirthRuntime(s);f.at(50000);f.wall(51000);f.game.execute(layLow);
    const elapsed=onlineElapsed(s,50000);const expected=layLow(elapsed.state).state;
    expect(f.game.getSnapshot().automationEvent).toMatchObject({income:'11250',completedJobs:5});
    expect(f.game.getSnapshot().result.state).toEqual(expected);expect(expected.city).toMatchObject({heat:56,heatDecayElapsedMs:50000});
    expect(expected.automation).toEqual(elapsed.state.automation);
    f.at(60000);f.tick();expect(f.game.getSnapshot().automationEvent).toMatchObject({income:'2500'});
    expect(f.game.getSnapshot().result.state.city.heat).toBe(55);f.game.stop();
  });
  it('already-cold after reconciliation fails without spending; elapsed results remain authoritative', () => {
    const s={...initial(1),automation:{unlockedIds:[],starterJobElapsedMs:0}},f=rebirthRuntime(s),raw=f.raw();
    f.at(60000);f.game.execute(layLow);
    expect(f.game.getSnapshot().result).toMatchObject({ok:false,error:'already-cold'});
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(s,60000).state);expect(f.raw()).toBe(raw);f.game.stop();
  });
  it('manual job feedback carries its actual old-tier payout through a boundary', () => {
    const f=rebirthRuntime(initial(79));f.game.execute(performStarterJob);
    expect(f.game.getSnapshot().result).toMatchObject({ok:true,moneyEarned:'2250',state:{city:{heat:80}}});
    f.game.execute(performStarterJob);expect(f.game.getSnapshot().result).toMatchObject({moneyEarned:'1875'});f.game.stop();
  });
  it('autosave/export retain exact Heat progress; immediate reload and Strict Mode do not double-cool', () => {
    const f=rebirthRuntime(initial(70,45000));f.at(1000);f.wall(2000);f.tick();
    expect(f.events.filter(e=>e.type==='write')).toHaveLength(0);
    f.at(5000);f.wall(6000);f.autosave();const saved=f.game.getSnapshot().result.state;
    expect(saved.city).toMatchObject({heat:70,heatDecayElapsedMs:50000});
    const code=f.game.exportCode();if(!code.ok)throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ok:true,envelope:{version: 14,savedAt:6000,state:saved}});
    f.game.stop();f.game.start();f.game.start();expect(f.timers()).toBe(2);expect(f.game.getSnapshot().result.state).toEqual(saved);f.game.stop();
    const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(saved);reload.stop();
  });
  it('ordinary Lay Low write failure leaves valid result live with warning and old durable save recoverable', () => {
    const f=rebirthRuntime(initial(70,45000)),raw=f.raw();f.fail();f.game.execute(layLow);
    expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:60,heatDecayElapsedMs:45000});
    expect(f.game.getSnapshot().persistence).toMatchObject({kind:'error',error:'storage-write'});expect(f.raw()).toBe(raw);f.game.stop();
  });
  it('historical import preserves Heat/remainder with no cooling/jobs and resumes at import time', () => {
    const imported=initial(70,45000,true),code=exportSaveCode(imported,0);if(!code.ok)throw Error('fixture');
    const f=rebirthRuntime();f.at(999999);f.wall(1000000);
    expect(f.game.importCode(code.code)).toEqual({ok:true});expect(f.game.getSnapshot().result.state).toEqual(imported);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:1000000,state:imported}});
    f.at(1004999);f.tick();expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:70,heatDecayElapsedMs:50000});
    f.at(1014999);f.tick();expect(f.game.getSnapshot().result.state.city).toMatchObject({heat:69,heatDecayElapsedMs:0});f.game.stop();
  });
  it('failed import preserves live/durable Heat and timing', () => {
    const f=rebirthRuntime(initial()),state=f.game.getSnapshot().result.state,raw=f.raw();
    const code=exportSaveCode(initial(1),0);if(!code.ok)throw Error('fixture');f.fail();
    expect(f.game.importCode(code.code)).toMatchObject({ok:false,error:'persistence-failure'});
    expect(f.raw()).toBe(raw);expect(f.game.getSnapshot().result.state).toBe(state);f.at(10000);f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(state,10000).state);f.game.stop();
  });
  it.each([false,true])('Rebirth reconciles then resets Heat only after a successful durable write (failure=%s)', failed => {
    const base=rebirthState(),state={...base,city:initial(90,42000,true).city,permanentProgression:{...base.permanentProgression,skills:{[FAST]:1}}};
    const f=rebirthRuntime(state),raw=f.raw();if(failed)f.fail();f.at(50000);f.wall(51000);
    const result=f.game.rebirth();expect(result.ok).toBe(!failed);
    if(failed){expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(state,50000).state);expect(f.raw()).toBe(raw);}
    else {
      const reset=f.game.getSnapshot().result.state;
      expect(reset.city).toEqual({ownedTerritoryIds:['territory:waterfront'],heat:0,heatDecayElapsedMs:0});
      expect(f.events.filter(e=>e.state.permanentProgression.rebirthCount===state.permanentProgression.rebirthCount+1).map(e=>e.type)).toEqual(['write','publish']);
      expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:51000,state:reset}});
      f.game.stop();const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(reset);reload.stop();
    }f.game.stop();
  });
  it.each([0,1,2])('offline at derived cap rank %i is durable, shared, one-time and ignores discarded time', rank => {
    const base=initial(90,30000,true),s={...base,permanentProgression:{...base.permanentProgression,skills:rank?{[NEVER]:rank}:{}}};
    const encoded=serializeSave(s,1000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;const events:string[]=[];
    const cap=(8+rank*2)*3600000,now=1000+cap+123456;
    const make=()=>createPersistentGame(v=>{if(v.persistence.kind==='loaded')events.push('publish');},createLocalSave(()=>({getItem:()=>raw,setItem:(_key:string,v:string)=>{raw=v;events.push('write');}}),()=>now),{random: { next: () => 0.99 }, now: () =>0,schedule:()=>()=>{}},()=>()=>{});
    const game=make();game.start();const expected=simulateGameElapsed(s,cap).state;
    expect(game.getSnapshot().result.state).toEqual(expected);expect(events.slice(0,2)).toEqual(['write','publish']);
    expect(game.getSnapshot().offline).toMatchObject({rewardedElapsedMs:cap,capMs:cap,capped:true});game.stop();
    const reload=make();reload.start();expect(reload.getSnapshot().result.state).toEqual(expected);expect(reload.getSnapshot().offline?.incomeEarned).toBe('0');reload.stop();
  });
  it('failed offline write pauses startup and preserves original Heat/save without timers', () => {
    const s=initial(90),encoded=serializeSave(s,1000);if(!encoded.ok)throw Error('fixture');let timers=0;
    const game=createPersistentGame(()=>{},createLocalSave(()=>({getItem:()=>encoded.serialized,setItem:()=>{throw Error('quota');}}),()=>600000),{random: { next: () => 0.99 }, now: () =>0,schedule:()=>{timers++;return()=>{};}},()=>{timers++;return()=>{};});
    game.start();expect(game.getSnapshot().persistence).toMatchObject({kind:'offline-error'});expect(game.getSnapshot().result.state).toEqual(s);expect(timers).toBe(0);game.stop();
  });
  it('future timestamp rebases with no Heat gain/cooling, and runtime corruption suspends atomically', () => {
    const s=initial(70,45000),encoded=serializeSave(s,10000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;
    const saves=createLocalSave(()=>({getItem:()=>raw,setItem:(_key:string,v:string)=>{raw=v;}}),()=>500);
    expect(saves.bootstrap()).toMatchObject({kind:'loaded',state:unlockEligibleAchievements(s).state,offline:{clockAnomaly:true,rewardedElapsedMs:0}});
    expect(parseSave(raw)).toMatchObject({ok:true,envelope:{savedAt:500,state:unlockEligibleAchievements(s).state}});
    const bad={...s,city:{...s.city,heat:101}};let now=0,cancelled=false;
    const runtime=createGameRuntime(bad,()=>{},{random: { next: () => 0.99 }, now: () =>now,schedule:()=>()=>{cancelled=true;}});runtime.start();now=50000;
    expect(()=>runtime.reconcile()).toThrow(RangeError);expect(runtime.getSnapshot().result.state).toBe(bad);expect(cancelled).toBe(true);expect(runtime.getSnapshot().runtimeError).toBe('invalid-state');
  });
  it.each(['money','xp'] as const)('elapsed %s overflow publishes no partial Heat/cooling/economy', kind => {
    const base=initial(90,42000),s=kind==='money'?{...base,economy:{cash:moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS))}}:{...base,progression:{xp:Number.MAX_SAFE_INTEGER}};
    const f=rebirthRuntime(s),raw=f.raw();f.at(50000);f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(s).state);expect(f.game.getSnapshot().runtimeError).not.toBeNull();expect(f.raw()).toBe(raw);f.autosave();expect(f.raw()).toBe(raw);f.game.stop();
  });
});
