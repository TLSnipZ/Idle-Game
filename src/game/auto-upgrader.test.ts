import { describe, expect, it } from 'vitest';
import { AUTOMATIONS, BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { getXpThresholdForLevel, MAX_XP } from '../features/progression';
import { moneyFromMinorUnits } from '../features/economy';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { CUMULATIVE_STATISTICS } from '../features/statistics';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { autoUpgraderState as initial } from './test-fixtures/auto-upgrader-state';
import { purchaseAutomation } from './purchase-automation';
import { setAutomationEnabled } from './set-automation-enabled';
import { selectAutoUpgrader } from './automation-selectors';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { simulateElapsed } from './simulate-elapsed';
import { simulateAutomation } from './simulate-automation';
import { attemptBusinessAutoUpgrade } from './simulate-auto-upgrader';
import { upgradeBusiness } from './upgrade-business';
import { unlockEligibleAchievements } from './achievements';
import { countStatistic, observePeakHeat } from './statistics';
import { decayHeat } from '../features/heat';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { rational } from '../shared/rational';
import { skillState, ROOT, LEARN, FAST, SILENT } from './test-fixtures/skill-state';
import { STARTER_VEHICLE } from '../features/vehicles';
import { crewState } from './test-fixtures/crew-state';
import { simulateOnlineElapsed } from './simulate-online-elapsed';
import { performRebirth } from './rebirth';
const level = (s: GameState) => s.businesses.owned[B.id]?.level;
function simulated(s: GameState, elapsed: number) {
  const result = simulateGameElapsed(s, elapsed); if (!result.ok) throw Error(result.error); return result;
}
function unowned() { const s = initial(); return { ...s, automation: createInitialGameState().automation }; }
function withDispatcher(s: GameState) { return { ...s, automation: { ...s.automation, unlockedIds: [...s.automation.unlockedIds, D.id], starterJobElapsedMs: 7000 } }; }

describe('Business Auto-Upgrader purchase and explicit opt-in', () => {
  it('adds exactly one configured automation with exact identity and acquisition data', () => {
    expect(AUTOMATIONS.map(a => a.id)).toEqual([D.id, 'automation:business-auto-upgrader']);
    expect(A).toMatchObject({ name: 'Business Auto-Upgrader', purchaseCost: '5000000', intervalMs: 30000, targetBusinessId: B.id });
    expect(A.requirements).toEqual([{ type: 'player-level', minimumLevel: 12 }, { type: 'business-owned', businessId: B.id },
      { type: 'business-level', businessId: B.id, minimumLevel: 15 }, { type: 'territory-owned', territoryId: 'territory:neon-mile' }]);
    expect(ACHIEVEMENT_CATALOG).toHaveLength(6); expect(CUMULATIVE_STATISTICS).toHaveLength(7);
  });
  it.each([11,12])('requires derived player Level %i at the exact boundary', n => {
    const s = unowned(), state = { ...s, progression: { xp: getXpThresholdForLevel(n) } };
    expect(purchaseAutomation(state, A.id).ok).toBe(n === 12);
  });
  it.each([null,14,15])('requires owned Dockside Level %s', n => {
    const s = unowned(), state = { ...s, businesses: { ...s.businesses, owned: n === null ? {} : { [B.id]: { level: n } } } };
    expect(purchaseAutomation(state, A.id).ok).toBe(n === 15);
  });
  it('requires Neon Mile, separately from affordability', () => {
    const s = unowned(), state = { ...s, city: createInitialGameState().city };
    expect(purchaseAutomation(state, A.id)).toMatchObject({ ok: false, error: 'prerequisite-not-met', state });
    const poor = { ...s, economy: { cash: moneyFromMinorUnits('4999900') } };
    expect(selectAutoUpgrader(poor)).toMatchObject({ requirements: { met: true }, affordable: false });
    expect(purchaseAutomation(poor, A.id)).toEqual({ ok: false, state: poor, error: 'insufficient-funds' });
  });
  it('spends exactly $50k, starts disabled, grants nothing; immutable and one-time', () => {
    const base = unowned(), s = { ...base, economy: { cash: A.purchaseCost } }, before = structuredClone(s);
    const result = purchaseAutomation(s, A.id); expect(result.ok).toBe(true);
    expect(result.state).toEqual({ ...s, economy: { cash: '0' }, automation: { ...s.automation, unlockedIds: [A.id] } });
    expect(s).toEqual(before); expect(purchaseAutomation(result.state, A.id)).toEqual({ ok: false, state: result.state, error: 'already-unlocked' });
  });
  it('purchasing either automation preserves the other progress and opt-in', () => {
    const a = initial(); const d = purchaseAutomation({ ...a, automation: { ...a.automation, businessAutoUpgradeElapsedMs: 25000 } }, D.id);
    expect(d.ok).toBe(true); expect(d.state.automation).toMatchObject({ enabledIds: [A.id], businessAutoUpgradeElapsedMs: 25000 });
    const s = unowned(), b = purchaseAutomation({ ...s, automation: { ...s.automation, unlockedIds: [D.id], starterJobElapsedMs: 9000 } }, A.id);
    expect(b.state.automation).toMatchObject({ starterJobElapsedMs: 9000, enabledIds: [], businessAutoUpgradeElapsedMs: 0 });
  });
  it.each([[D.id,'not-toggleable'], ['automation:unknown','unknown-automation']])('rejects toggling %s', (id,error) => {
    const s = initial(); expect(setAutomationEnabled(s,id,true)).toEqual({ ok: false, state:s,error });
  });
  it('rejects unowned/invalid toggles, switches atomically, and supports idempotent no-op', () => {
    const s = unowned(); expect(setAutomationEnabled(s,A.id,true)).toEqual({ok:false,state:s,error:'automation-not-owned'});
    const active = initial(); expect(setAutomationEnabled(active,A.id,'yes')).toMatchObject({ok:false,error:'invalid-enabled'});
    expect(setAutomationEnabled(active,A.id,true).state).toBe(active);
    const paused = setAutomationEnabled(active,A.id,false); expect(paused.ok).toBe(true);
    expect(paused.state).toEqual({...active,automation:{...active.automation,enabledIds:[]}});
    expect(setAutomationEnabled(paused.state,A.id,true).state).toEqual(active);
  });
});

describe('chronological paid upgrades and outer batching', () => {
  it('29,999 +1ms consumes exactly one boundary', () => {
    const first=simulated(initial(),29999); expect(level(first.state)).toBe(25); expect(first.state.automation.businessAutoUpgradeElapsedMs).toBe(29999);
    const next=simulated(first.state,1); expect(level(next.state)).toBe(26); expect(next.state.automation.businessAutoUpgradeElapsedMs).toBe(0);
  });
  it('65 seconds buys two levels, with exact before/after production and remainder', () => {
    const r=simulated(initial(),65000);
    // $562.50 at L25 + $585 at L26 + $101.25 at L27; costs $93,750 + $101,400.
    expect(r.businessIncome).toBe('124875'); expect(r.state.economy.cash).toBe('80609875');
    expect(level(r.state)).toBe(27); expect(r.state.progression.xp).toBe(initial().progression.xp+50);
    expect(r.autoUpgrader).toEqual({levelsPurchased:2,spent:'19515000'});
    expect(r.state.automation.businessAutoUpgradeElapsedMs).toBe(5000);
    expect(r.state.permanentProgression.statistics.businessLevelsPurchased).toBe(2);
  });
  it('an unaffordable attempt is consumed; production funds the next boundary', () => {
    const s=initial(25,'9262500'); // $92,625 + $562.50 is short; +$562.50 reaches exact cost.
    const first=simulated(s,30000); expect(level(first.state)).toBe(25); expect(first.autoUpgrader?.levelsPurchased).toBe(0);
    expect(first.state.automation).toMatchObject({enabledIds:[A.id],businessAutoUpgradeElapsedMs:0});
    expect(first.state.progression).toEqual(s.progression);
    const r=simulated(s,90000); expect(level(r.state)).toBe(26); expect(r.state.economy.cash).toBe('58500');
    expect(r.businessIncome).toBe('171000'); expect(r.autoUpgrader?.levelsPurchased).toBe(1);
    expect(r.state.permanentProgression.statistics.businessLevelsPurchased).toBe(1);
  });
  it('three upgrades use changing costs and three separate XP floors: 81, not 82', () => {
    const s=initial(), state={...s,permanentProgression:{...s.permanentProgression,skills:{[LEARN]:1}}};
    const r=simulated(state,90000); expect(level(r.state)).toBe(28);
    expect(r.autoUpgrader?.spent).toBe('30450000');
    expect(r.state.progression.xp-state.progression.xp).toBe(81);
    expect(r.state.permanentProgression.statistics.businessLevelsPurchased).toBe(3);
  });
  it.each([99,100])('consumes max-level attempts at starting Level %i', n => {
    const s=initial(n,'200000000'),r=simulated(s,95000);expect(level(r.state)).toBe(100);
    expect(r.autoUpgrader?.levelsPurchased).toBe(100-n); expect(r.state.automation.businessAutoUpgradeElapsedMs).toBe(5000);
    expect(selectAutoUpgrader(r.state)).toMatchObject({maxed:true,nextCost:null,enabled:true});
  });
  it('maxed huge elapsed collapses no-op boundaries and keeps exact modulo', () => {
    const s=initial(100),r=simulated(s,Number.MAX_SAFE_INTEGER);
    expect(r.state.automation.businessAutoUpgradeElapsedMs).toBe(Number(BigInt(Number.MAX_SAFE_INTEGER)%30000n));
    expect(r.autoUpgrader?.levelsPurchased).toBe(0);
  });
  it('disabled progress pauses for an hour then resumes at the remaining 5 seconds', () => {
    const s=initial(), paused={...s,automation:{...s.automation,enabledIds:[],businessAutoUpgradeElapsedMs:25000}};
    const r=simulated(paused,3600000); expect(level(r.state)).toBe(25); expect(r.state.automation.businessAutoUpgradeElapsedMs).toBe(25000);
    const enabled=setAutomationEnabled(r.state,A.id,true).state;
    const almost=simulated(enabled,4999); expect(level(almost.state)).toBe(25);
    expect(level(simulated(almost.state,1).state)).toBe(26);
  });
  it('shared manual command and auto attempt have identical paid upgrade results and harmless outcomes', () => {
    const s=initial();expect(attemptBusinessAutoUpgrade(s)).toEqual({...upgradeBusiness(s,B.id),outcome:'upgraded'});
    expect(attemptBusinessAutoUpgrade(initial(25,'0'))).toMatchObject({ok:true,outcome:'insufficient-funds'});
    expect(attemptBusinessAutoUpgrade(initial(100))).toMatchObject({ok:true,outcome:'max-level'});
    const absent={...s,businesses:createInitialGameState().businesses};expect(attemptBusinessAutoUpgrade(absent)).toMatchObject({ok:true,outcome:'not-owned'});
    expect(simulated(absent,60000).autoUpgrader?.levelsPurchased).toBe(0);
  });
  it('automatic upgrade unlocks existing level and XP achievements with no new definitions', () => {
    const s=initial(9),state={...s,progression:{xp:90},city:createInitialGameState().city};
    const r=simulated(state,30000); expect(r.state.permanentProgression.unlockedAchievementIds).toEqual(['achievement:first-steps','achievement:dockside-operator']);
    expect(r.state.city).toEqual(state.city);
  });
  it('exact Jax/vehicle/skills production matches explicit manual upgrade boundaries and split intervals', () => {
    const s=initial(),c=crewState({operations:null,logistics:'crew:jax-mercer'});
    const state={...s,crew:c.crew,garage:{ownedVehicleIds:[STARTER_VEHICLE.id]},
      permanentProgression:{...s.permanentProgression,skills:{[ROOT]:2,[SILENT]:1}},
      businesses:{...s.businesses,productionRemainderMilliCents:975,productionRemainderSubMilliCents:rational(1n,3n)}};
    let expected: GameState=state;
    for (const segment of [30000,30000,5123]) {
      const r=simulateElapsed(expected,segment);if(!r.ok)throw Error(r.error); expected=r.state;
      if(segment===30000)expected=upgradeBusiness(expected,B.id).state;
    }
    const actual=simulated(state,65123).state;
    expect(actual.businesses).toEqual(expected.businesses);expect(actual.economy).toEqual(expected.economy);
    expect(actual.businesses.productionRemainderSubMilliCents.denominator).not.toBe('1');
    const split=simulated(simulated(state,31000).state,34123).state;expect(split).toEqual(actual);
  });
  it.each(['crew:rico-vale','crew:mara-knox'] as const)('preserves Dispatcher outer Money/XP/Heat and %s effects', operations => {
    const s=withDispatcher(initial()),c=crewState({operations,logistics:'crew:jax-mercer'});
    const state={...s,crew:c.crew,city:{...s.city,heat:79,heatDecayElapsedMs:42000},
      permanentProgression:{...s.permanentProgression,skills:{[LEARN]:1,[FAST]:1}}};
    const r=simulated(state,2105000),disabled=simulated({...state,automation:{...state.automation,enabledIds:[]}},2105000);
    expect(r.automation).toEqual(disabled.automation);expect(r.state.city).toEqual(disabled.state.city);
    expect(r.state.progression.xp-state.progression.xp).toBe(disabled.automation.xpEarned+(r.autoUpgrader?.levelsPurchased??0)*27);
    expect(r.state.permanentProgression.statistics.automatedJobsCompleted).toBe(disabled.state.permanentProgression.statistics.automatedJobsCompleted);
    expect(r.state.permanentProgression.statistics.peakHeat).toBe(disabled.state.permanentProgression.statistics.peakHeat);
  });
  it('Dispatcher earnings become spendable only at their chronological prefix', () => {
    const s=withDispatcher(initial(25,'9255625'));
    const r=simulated(s,60000);expect(r.automation.completedJobs).toBe(6);expect(level(r.state)).toBe(26);
    // First attempt cannot spend future jobs; only second boundary buys.
    expect(r.businessIncome).toBe('112500');expect(r.autoUpgrader?.levelsPurchased).toBe(1);
  });
  it('many internal segments still consume exactly one outer Event chance and selection', () => {
    let calls=0;const r=simulateOnlineElapsed(withDispatcher(initial()),2100000,{next:()=>{calls++;return 0;}});
    expect(r.ok).toBe(true);expect(calls).toBe(2);expect(r.state.events).toEqual({opportunityElapsedMs:300000,pendingEventId:'event:hot-tip'});
    calls=0;simulateOnlineElapsed(r.state,2100000,{next:()=>{calls++;return 0;}});expect(calls).toBe(0);
  });
  it.each(['unowned','disabled'] as const)('%s exactly preserves the Phase 8B composition', mode => {
    const s=skillState({[ROOT]:2,[LEARN]:1,[FAST]:1}),state={...s,city:{...s.city,heat:79},
      automation:{...s.automation,...(mode==='disabled'?{unlockedIds:[D.id,A.id],businessAutoUpgradeElapsedMs:23000}:{})}};
    const business=simulateElapsed(state,91234);if(!business.ok)throw Error('fixture');const jobs=simulateAutomation(business.state,91234);if(!jobs.ok)throw Error('fixture');
    const city=decayHeat(jobs.state.city,91234,getHeatDecayIntervalMs(state));
    const counted=countStatistic(state,{...jobs.state,city},'automatedJobsCompleted',jobs.automation.completedJobs);
    expect(counted.ok).toBe(true);
    const expected=unlockEligibleAchievements(observePeakHeat(counted.state)).state;
    const result=simulated(state,91234);expect(result.state).toEqual(expected);expect(result.automation).toEqual(jobs.automation);expect(result.autoUpgrader).toBeUndefined();
  });
  it.each(['xp','statistics','cash'] as const)('%s overflow rolls back the entire outer interval', kind => {
    const s=initial(),state={...s,
      ...(kind==='xp'?{progression:{xp:MAX_XP-30}}:{}),
      ...(kind==='statistics'?{permanentProgression:{...s.permanentProgression,statistics:{...s.permanentProgression.statistics,businessLevelsPurchased:Number.MAX_SAFE_INTEGER-1}}}:{}),
      ...(kind==='cash'?{economy:{cash:moneyFromMinorUnits('9'.repeat(100))}}:{})};
    const before=structuredClone(state),r=simulateGameElapsed(state,90000);expect(r.ok).toBe(false);expect(r.state).toBe(state);expect(state).toEqual(before);
    expect(r).toMatchObject({error:kind==='xp'?'xp-overflow':kind==='statistics'?'statistics-overflow':'overflow'});
  });
  it('Rebirth resets both automations, enable state and progress without refunds; permanent history remains', () => {
    const s=withDispatcher(initial()),state={...s,automation:{...s.automation,businessAutoUpgradeElapsedMs:25000}};
    const elapsed=simulated(state,5000),r=performRebirth(elapsed.state);expect(r.ok).toBe(true);
    expect(r.state.automation).toEqual(createInitialGameState().automation);expect(r.state.businesses.owned).toEqual({});
    expect(r.state.permanentProgression.statistics.businessLevelsPurchased).toBe(1);expect(r.state.permanentProgression.unlockedAchievementIds).toContain('achievement:first-rebirth');
  });
});
