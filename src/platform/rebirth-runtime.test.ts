import { createInitialStatistics } from '../features/statistics';
import { unlockEligibleAchievements } from '../game/achievements';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { describe, expect, it } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { performRebirth, selectRebirth } from '../game/rebirth';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { getXpThresholdForLevel } from '../features/progression';
import { MAX_PERMANENT_VALUE } from '../features/permanent-progression';
import { parseSave } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { rational } from '../shared/rational';

describe('durable Rebirth transaction', () => {
  it('reconciles business, completed jobs and threshold-crossing XP before computing reward', () => {
    const initial={...rebirthState(29,25),progression:{xp:getXpThresholdForLevel(30)-5}};
    const f=rebirthRuntime(initial);expect(selectRebirth(initial).reward).toBe(4);
    f.at(10000.75);f.wall(11000);
    expect(f.game.rebirth()).toEqual({ok:true,reward:5});
    const reconciled=onlineElapsed(initial,10000).state;
    expect(reconciled.progression.xp).toBe(getXpThresholdForLevel(30));
    expect(reconciled.automation.starterJobElapsedMs).toBe(7000);
    expect(f.events[0]).toEqual({type:'publish',state:reconciled});
    expect(BigInt(reconciled.economy.cash)).toBeGreaterThan(BigInt(initial.economy.cash)+3600n);
    const after=performRebirth(reconciled).state;
    expect(f.events.map(e=>e.type)).toEqual(['publish','write','publish']);
    expect(f.events[1]?.state).toEqual(after);expect(f.events[2]?.state).toEqual(after);
    expect(f.game.getSnapshot().result.state).toEqual(after);
    expect(after.automation).toEqual({ businessAutoUpgradeTargetId: 'business:dockside-detail', enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 });
    expect(after.businesses.productionRemainderMilliCents).toBe(0);
    expect(after.businesses.productionRemainderSubMilliCents).toEqual(rational(0n));
    expect(f.game.getSnapshot().automationEvent).toBeUndefined();expect(f.game.getSnapshot().levelEvent).toBeUndefined();
    expect(f.game.getSnapshot().offline).toBeNull();
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:11000,state:after}});f.game.stop();
  });
  it('uses a fresh fractional clock baseline for the new run with no old production or jobs', () => {
    const f=rebirthRuntime();f.at(10000.75);expect(f.game.rebirth().ok).toBe(true);
    const reset=f.game.getSnapshot().result.state;f.at(10001);f.tick();expect(f.game.getSnapshot().result.state).toEqual(reset);
    for(let i=0;i<6;i++)f.game.execute(performStarterJob);
    f.game.execute(state=>purchaseBusiness(state,B.id));const rebuilt=f.game.getSnapshot().result.state;
    f.at(11001);f.tick();expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(rebuilt,1000).state);
    expect(f.game.getSnapshot().result.state.progression.xp).toBe(60);
    expect(f.game.getSnapshot().result.state.automation.unlockedIds).toEqual([]);f.game.stop();
  });
  it('storage failure keeps the fully reconciled old run live and the prior durable save intact', () => {
    const initial=rebirthState();const f=rebirthRuntime(initial);const oldRaw=f.raw();f.fail();f.at(10000);f.wall(11000);
    expect(f.game.rebirth()).toMatchObject({ok:false,error:'persistence-failure',detail:'storage-write'});
    const beforeReset=onlineElapsed(initial,10000).state;
    expect(f.game.getSnapshot().result.state).toEqual(beforeReset);expect(f.raw()).toBe(oldRaw);
    expect(f.game.getSnapshot().result.state.permanentProgression).toEqual({ statistics: {...createInitialStatistics(),automatedJobsCompleted:1}, unlockedAchievementIds: ['achievement:first-steps','achievement:dockside-operator'],skills: {}, empirePoints:0,rebirthCount:0});
    expect(f.events.every(event=>event.state.businesses.owned[B.id]?.level===25)).toBe(true);
    expect(f.events.some(event=>event.type==='write')).toBe(false);
    f.at(11000);f.tick();f.autosave();expect(f.raw()).toBe(oldRaw);
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(initial,11000).state);
    expect(f.game.getSnapshot().result.state.permanentProgression.rebirthCount).toBe(0);f.game.stop();
  });
  it.each(['empirePoints','rebirthCount'] as const)('permanent %s overflow never writes or resets',field=>{
    const state={...rebirthState(),permanentProgression:{ statistics: createInitialStatistics(0), unlockedAchievementIds: [],skills: {}, empirePoints:0,rebirthCount:0,[field]:MAX_PERMANENT_VALUE}};
    const f=rebirthRuntime(state);const raw=f.raw();expect(f.game.rebirth()).toMatchObject({ok:false,error:'overflow'});
    expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(state).state);expect(f.raw()).toBe(raw);expect(f.events).toEqual([]);f.game.stop();
  });
  it('ineligible or stopped runtime cannot reset and cannot write',()=>{
    const f=rebirthRuntime(rebirthState(19,25));const raw=f.raw();
    expect(f.game.rebirth()).toMatchObject({ok:false,error:'requirements-not-met'});expect(f.raw()).toBe(raw);
    f.game.stop();expect(f.game.rebirth()).toEqual({ok:false,error:'runtime-unavailable'});expect(f.events).toEqual([]);
  });
  it('changed storage or invalid wall clock prevents destructive publication',()=>{
    for(const failure of ['conflict','timestamp']) {
      const f=rebirthRuntime();const state=f.game.getSnapshot().result.state;
      if(failure==='conflict')f.replaceRaw('another-session-save');else f.wall(NaN);
      const raw=f.raw();expect(f.game.rebirth()).toMatchObject({ok:false,error:'persistence-failure'});
      expect(f.game.getSnapshot().result.state).toBe(state);expect(f.raw()).toBe(raw);f.game.stop();
    }
  });
  it('writes a new earning anchor and reloads without replaying the former run',()=>{
    const f=rebirthRuntime();f.at(5000);f.wall(6000);expect(f.game.rebirth().ok).toBe(true);
    const reset=f.game.getSnapshot().result.state;f.game.stop();
    const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(reset);
    expect(reload.getSnapshot().offline).toMatchObject({rewardedElapsedMs:0,incomeEarned:'0',xpEarned:0});reload.stop();
    f.wall(16000);const later=f.make();later.start();
    expect(later.getSnapshot().offline).toMatchObject({rewardedElapsedMs:10000,incomeEarned:'0',xpEarned:0});
    expect(later.getSnapshot().result.state).toEqual(reset);later.stop();
  });
  it('autosave, remount and export retain the reset without extra timers or repeat Rebirth',()=>{
    const f=rebirthRuntime();expect(f.game.rebirth().ok).toBe(true);const state=onlineElapsed(f.game.getSnapshot().result.state,5000).state;
    f.at(5000);f.wall(6000);f.autosave();expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{state}});
    const code=f.game.exportCode();if(!code.ok)throw Error('fixture');expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toMatchObject({ok:true,envelope:{version: 17,state}});
    f.game.stop();f.game.start();f.game.start();expect(f.timers()).toBe(2);
    expect(f.game.getSnapshot().result.state).toEqual(state);f.game.stop();expect(f.timers()).toBe(0);
  });
  it('v7 import restores both permanent and temporary state without historical rewards or Rebirth',()=>{
    const f=rebirthRuntime();const imported={...rebirthState(37,48),permanentProgression:{ statistics: createInitialStatistics(2), unlockedAchievementIds: [],skills: {}, empirePoints:11,rebirthCount:2}};
    const code=exportSaveCode(imported,1);if(!code.ok)throw Error('fixture');
    f.at(50000);f.wall(1000000);expect(f.game.importCode(code.code)).toEqual({ok:true});
    expect(f.game.getSnapshot().result.state).toEqual(imported);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{savedAt:1000000,state:imported}});
    f.game.stop();const reload=f.make();reload.start();expect(reload.getSnapshot().result.state).toEqual(unlockEligibleAchievements(imported).state);
    expect(reload.getSnapshot().offline).toMatchObject({incomeEarned:'0',xpEarned:0});reload.stop();
    f.wall(1010000);const later=f.make();later.start();expect(later.getSnapshot().result.state).toEqual(simulateGameElapsed(imported,10000).state);
    expect(later.getSnapshot().result.state.permanentProgression).toEqual({...unlockEligibleAchievements(imported).state.permanentProgression,statistics:{...imported.permanentProgression.statistics,automatedJobsCompleted:1}});later.stop();
  });
});


it('failed pre-Rebirth XP reconciliation suspends without resetting or saving a partial state', () => {
  const initial = { ...rebirthState(), progression: { xp: Number.MAX_SAFE_INTEGER } };
  const f = rebirthRuntime(initial), raw = f.raw();
  f.at(10000);
  expect(f.game.rebirth()).toEqual({ ok: false, error: 'runtime-unavailable' });
  expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(initial).state);
  f.autosave(); expect(f.raw()).toBe(raw);
  expect(f.events.some(event => event.type === 'write')).toBe(false); f.game.stop();
});
it('future-clock reload preserves permanent counters and safely rebases without reward', () => {
  const initial = { ...rebirthState(), permanentProgression: { statistics: createInitialStatistics(2), unlockedAchievementIds: [], skills: {}, empirePoints: 11, rebirthCount: 2 } };
  const f = rebirthRuntime(initial); f.game.stop(); f.wall(500);
  const reload = f.make(); reload.start();
  expect(reload.getSnapshot().result.state).toEqual(unlockEligibleAchievements(initial).state);
  expect(reload.getSnapshot().offline).toMatchObject({ clockAnomaly: true, rewardedElapsedMs: 0, xpEarned: 0 });
  expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 500, state: unlockEligibleAchievements(initial).state } });
  reload.stop();
});
