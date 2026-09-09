import { stringifySaveFixture } from '../game/test-fixtures/save-text';
import { unlockEligibleAchievements } from '../game/achievements';
import { describe, expect, it } from 'vitest';
import { createPersistentGame } from './persistent-game';
import { createLocalSave } from './local-save';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { purchaseVehicle } from '../game/purchase-vehicle';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { reconcileOffline, OFFLINE_CAP_MS } from '../game/offline-progress';
import { parseSave, serializeSave } from '../game/save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from '../game/save-code';
import { rational } from '../shared/rational';
function initial(owned=false): GameState {
  const state=createInitialGameState();
  return {...state,garage:{ownedVehicleIds:owned?[V.id]:[]},progression:{xp:3600},
    economy:{cash:moneyFromMinorUnits('10000000')},
    businesses:{...state.businesses,owned:{[B.id]:{level:10}},productionRemainderMilliCents:975,
      productionRemainderSubMilliCents:rational(1n,3n)},
    upgrades:{purchasedIds:UPGRADE_CATALOG.map(u=>u.id)},automation:{enabledIds:[],businessAutoUpgradeElapsedMs:0,unlockedIds:[D.id],starterJobElapsedMs:5000}};
}
function fixture(state=initial(), savedAt=1000) {
  const encoded=serializeSave(state,savedAt); if(!encoded.ok) throw Error('fixture');
  let raw=encoded.serialized, now=0, wall=1000, fail=false, writes=0, timers=0;
  let tick=()=>{}; let autosave=()=>{};
  const make=()=>createPersistentGame(view=>{
    if(view.offline && view.persistence.kind==='loaded')
      expect(parseSave(raw)).toMatchObject({ok:true,envelope:{state:view.result.state}});
  },createLocalSave(()=>({getItem:()=>raw,setItem:(_key:string,value:string)=>{
    if(fail) throw Error('quota'); raw=value; writes++;
  }}),()=>wall),{random: { next: () => 0.99 }, now: () =>now,schedule:callback=>{tick=callback;timers++;return()=>{timers--;};}},
  callback=>{autosave=callback;timers++;return()=>{timers--;};});
  return {make,raw:()=>raw,writes:()=>writes,timers:()=>timers,tick:()=>tick(),autosave:()=>autosave(),
    at:(value:number)=>{now=value;},wall:(value:number)=>{wall=value;},fail:()=>{fail=true;}};
}
describe('vehicle runtime and durable progression',()=>{
  it('reconciles old bonuses before purchase and uses new bonus only afterward without affecting dispatcher',()=>{
    const state=initial(); const f=fixture(state); const game=f.make(); game.start(); game.dismissOffline();
    f.at(10000); f.wall(11000); game.execute(current=>purchaseVehicle(current,V.id));
    const expected=purchaseVehicle(onlineElapsed(state,10000).state,V.id).state;
    expect(game.getSnapshot().result.state).toEqual(expected);
    expect(game.getSnapshot().automationEvent).toMatchObject({completedJobs:1,income:'3600',xpEarned:5});
    expect(expected.progression.xp).toBe(3605); expect(expected.automation.starterJobElapsedMs).toBe(5000);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state:expected}});
    f.at(15000); f.tick(); expect(game.getSnapshot().result.state).toEqual(onlineElapsed(expected,5000).state);
    game.stop(); expect(f.timers()).toBe(0);
  });
  it('drops only runtime sub-ms at the vehicle boundary, preserving earned fractions',()=>{
    const f=fixture(); const game=f.make();game.start();game.dismissOffline();
    f.at(10.75);game.execute(state=>purchaseVehicle(state,V.id));const bought=game.getSnapshot().result.state;
    expect(bought.businesses).toEqual(onlineElapsed(initial(),10).state.businesses);
    f.at(11);f.tick();expect(game.getSnapshot().result.state).toBe(bought);
    f.at(11.75);f.tick();expect(game.getSnapshot().result.state).toEqual(onlineElapsed(bought,1).state);game.stop();
  });
  it('failed acquisition retains reconciled income and continues with old modifiers',()=>{
    const state={...initial(),progression:{xp:0}};const f=fixture(state);const game=f.make();game.start();game.dismissOffline();
    f.at(1000);game.execute(current=>purchaseVehicle(current,V.id));
    expect(game.getSnapshot().result).toMatchObject({ok:false,error:'prerequisite-not-met'});
    expect(game.getSnapshot().result.state).toEqual(onlineElapsed(state,1000).state);
    f.at(2000);f.tick();expect(game.getSnapshot().result.state).toEqual(onlineElapsed(state,2000).state);game.stop();
  });
  it('exports current state, autosaves conservatively, reloads and remounts without duplicate loops',()=>{
    const f=fixture(initial(true)); const game=f.make();game.start();game.dismissOffline();const writes=f.writes();
    f.at(250);f.wall(1250);f.tick();expect(f.writes()).toBe(writes);
    f.at(5000);f.wall(6000);const exported=game.exportCode();if(!exported.ok)throw Error('export');
    const expected=onlineElapsed(initial(true),5000).state;
    expect(validateSaveCode(exported.code)).toMatchObject({ok:true,envelope:{version: 16,savedAt:6000,state:expected}});
    f.autosave();expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state:expected}});
    game.stop();game.start();game.start();expect(f.timers()).toBe(2);game.stop();
    const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(expected);
    expect(reload.getSnapshot().offline?.incomeEarned).toBe('0');reload.stop();
  });
  it.each([1,4656,25000,OFFLINE_CAP_MS,12*3600000])('matches online simulation for credited offline duration %i',duration=>{
    const state=initial(true);const offline=reconcileOffline(state,1000,1000+duration);
    expect(offline.ok).toBe(true);expect(offline.state).toEqual(simulateGameElapsed(state,Math.min(duration,OFFLINE_CAP_MS)).state);
    expect(offline.ok&&offline.progress.rewardedElapsedMs).toBe(Math.min(duration,OFFLINE_CAP_MS));
    expect(OFFLINE_CAP_MS).toBe(28800000);
  });
  it('consumes capped offline duration once and persists before bootstrap publication',()=>{
    const state=initial(true);const f=fixture(state);f.wall(1000+12*3600000);
    const game=f.make();game.start();const expected=simulateGameElapsed(state,OFFLINE_CAP_MS).state;
    expect(game.getSnapshot().result.state).toEqual(expected);expect(game.getSnapshot().offline?.capped).toBe(true);game.stop();
    const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(expected);
    expect(reload.getSnapshot().offline?.incomeEarned).toBe('0');expect(reload.getSnapshot().offline?.xpEarned).toBe(0);reload.stop();
  });
  it('future clock preserves state and rebases without income or XP',()=>{
    const state=initial(true);const f=fixture(state,2000);const game=f.make();game.start();
    expect(game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(state).state);
    expect(game.getSnapshot().offline).toMatchObject({clockAnomaly:true,incomeEarned:'0',xpEarned:0});
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:1000,state:unlockEligibleAchievements(state).state}});game.stop();
  });
  it.each(['storage','overflow'] as const)('failed %s bootstrap preserves old save and never starts timers',failure=>{
    const state=failure==='overflow'?{...initial(true),economy:{cash:moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS))}}:initial(true);
    const f=fixture(state);const raw=f.raw();f.wall(26000);if(failure==='storage')f.fail();
    const game=f.make();game.start();expect(game.getSnapshot().persistence.kind).toBe('offline-error');
    expect(game.getSnapshot().result.state).toEqual(state);expect(f.raw()).toBe(raw);expect(f.timers()).toBe(0);
    f.autosave();expect(f.raw()).toBe(raw);game.stop();
  });
  it('imports grandfathered vehicle without historical money/XP then begins offline time at import',()=>{
    const imported={...initial(true),progression:{xp:0},businesses:{...initial(true).businesses,owned:{[B.id]:{level:1}}}};
    const f=fixture();f.wall(1000000);const game=f.make();game.start();game.dismissOffline();
    const code=exportSaveCode(imported,1);if(!code.ok)throw Error('fixture');
    expect(game.importCode(code.code)).toEqual({ok:true});expect(game.getSnapshot().result.state).toEqual(imported);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:1000000,state:imported}});game.stop();
    f.wall(1025000);const reload=f.make();reload.start();
    expect(reload.getSnapshot().result.state).toEqual(simulateGameElapsed(imported,25000).state);reload.stop();
  });
  it('import storage failure leaves both runtime and durable save unchanged',()=>{
    const f=fixture();const game=f.make();game.start();game.dismissOffline();const state=game.getSnapshot().result.state;const raw=f.raw();
    const code=exportSaveCode(initial(true),1);if(!code.ok)throw Error('fixture');f.fail();
    expect(game.importCode(code.code)).toMatchObject({ok:false,error:'persistence-failure'});
    expect(game.getSnapshot().result.state).toBe(state);expect(f.raw()).toBe(raw);game.stop();
  });
});


it('v5 local migration consumes its saved timestamp without losing offline time',()=>{
  const state=initial();const { events: _events, crew: _crew,city:_city,permanentProgression:_permanent,garage:_garage,...legacy}=state;
  let raw=stringifySaveFixture({format:'crime-empire-save',version:5,savedAt:1000,state:legacy});
  const save=createLocalSave(()=>({getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}}),()=>26000);
  const expected=simulateGameElapsed(state,25000).state;
  expect(save.bootstrap()).toMatchObject({kind:'loaded',state:expected});
  expect(parseSave(raw)).toMatchObject({ok:true,envelope:{version: 16,savedAt:26000,state:expected}});
  expect(save.bootstrap()).toMatchObject({kind:'loaded',offline:{incomeEarned:'0',xpEarned:0}});
});

it('preserves partition equivalence across a vehicle save/reload boundary',()=>{
  const state=initial(true);const first=onlineElapsed(state,91).state;
  const encoded=serializeSave(first,1000);if(!encoded.ok)throw Error('fixture');
  const loaded=parseSave(encoded.serialized);if(!loaded.ok)throw Error('fixture');
  expect(reconcileOffline(loaded.envelope.state,1000,5565).state).toEqual({...simulateGameElapsed(state,4656).state,events:first.events});
});

it.each([false, true])('permanent purchase persists before publication; failed write=%s never publishes ownership', fail => {
  const state = initial(), encoded = serializeSave(state, 1000); if (!encoded.ok) throw Error('fixture');
  let raw = encoded.serialized, failing = false, now = 0;
  const trace: string[] = [];
  const random = { next: () => { throw Error('purchase must not draw RNG'); } };
  const game = createPersistentGame(view => {
    if (view.result.state.garage.ownedVehicleIds.length) {
      trace.push('owner'); expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { state: view.result.state } });
    }
  }, createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => {
    trace.push('write'); if (failing) throw Error('quota'); raw = value;
  } }), () => 2000), { random, now: () => now, schedule: () => () => {} }, () => () => {});
  game.start(); trace.length = 0; failing = fail;
  const previous = game.getSnapshot().result.state, saved = raw;
  now = 0; const completed = game.execute(s => purchaseVehicle(s, V.id));
  if (fail) {
    expect(completed).toBeUndefined(); expect(game.getSnapshot().result.state).toBe(previous);
    expect(raw).toBe(saved); expect(trace).toEqual(['write']); expect(game.getSnapshot().persistence.kind).toBe('error');
  } else {
    expect(completed?.ok).toBe(true); expect(trace).toEqual(['write', 'owner']);
    expect(game.getSnapshot().result.state.economy.cash).toBe((BigInt(previous.economy.cash) - 2500000n).toString());
  }
  game.stop();
});

it.each([false, true])('historical v15 CE1 owner=%s imports atomically without historical income and re-exports v16', owner => {
  const state = initial(owner), legacy = { ...state, garage: { ownedVehicleIds: owner ? ['vehicle:starter-sport-sedan'] : [] } };
  const code = encodeSaveText(JSON.stringify({ format: 'crime-empire-save', version: 15, savedAt: 1, state: legacy }));
  const f = fixture(); const game = f.make(); game.start(); f.wall(1000000);
  expect(game.importCode(code)).toEqual({ ok: true }); expect(game.getSnapshot().result.state).toEqual(state);
  const exported = game.exportCode(); if (!exported.ok) throw Error('fixture');
  expect(validateSaveCode(exported.code)).toMatchObject({ ok: true, envelope: { version: 16, savedAt: 1000000, state } });
  expect(f.raw()).not.toContain('vehicle:starter-sport-sedan'); game.stop();
});

it('historical owner bootstrap migrates before offline evaluation and persists current +10% once', () => {
  const fresh = createInitialGameState();
  const state = { ...fresh, businesses: { ...fresh.businesses, owned: { [B.id]: { level: 4 } } }, garage: { ownedVehicleIds: [V.id] } };
  let raw = JSON.stringify({ format: 'crime-empire-save', version: 15, savedAt: 1000,
    state: { ...state, garage: { ownedVehicleIds: ['vehicle:starter-sport-sedan'] } } });
  const saves = createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }), () => 2000);
  const result = saves.bootstrap();
  expect(result).toMatchObject({ kind: 'loaded', state: { garage: state.garage, economy: { cash: '330' } } });
  expect(raw).not.toContain('vehicle:starter-sport-sedan');
  expect(saves.bootstrap()).toMatchObject({ kind: 'loaded', offline: { incomeEarned: '0' } });
});

it.each(['invalid', 'storage'] as const)('historical CE1 %s failure never partially publishes mapped ownership', failure => {
  const f = fixture(), game = f.make(); game.start();
  const before = game.getSnapshot().result.state, raw = f.raw();
  const legacy = { ...initial(true), garage: { ownedVehicleIds: failure === 'invalid'
    ? ['vehicle:starter-sport-sedan', 'vehicle:unknown'] : ['vehicle:starter-sport-sedan'] } };
  const code = encodeSaveText(JSON.stringify({ format: 'crime-empire-save', version: 15, savedAt: 1, state: legacy }));
  if (failure === 'storage') f.fail();
  expect(game.importCode(code)).toMatchObject({ ok: false, error: failure === 'invalid' ? 'invalid-state' : 'persistence-failure' });
  expect(game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw); game.stop();
});
