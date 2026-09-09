import { describe, expect, it } from 'vitest';
import { CREW_CATALOG, CREW_SLOTS, RICO_VALE as R, MARA_KNOX as M, JAX_MERCER as J, createInitialCrewState, collectCrewModifiers, isCrewState } from '../features/crew';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { moneyFromMinorUnits as money, MAX_MONEY_DIGITS } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { recruitCrewMember, assignCrewMember, unassignCrewSlot } from './crew-commands';
import { evaluateRequirements } from './requirements';
import { evaluateBusinessProduction, evaluateJobReward, collectModifiers } from './effective-stats';
import { evaluateXpReward } from './xp-reward';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { selectHeat } from './heat-selectors';
import { selectCrew, selectCrewMember } from './crew-selectors';
import { performStarterJob } from './perform-starter-job';
import { simulateAutomation } from './simulate-automation';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { simulateElapsed } from './simulate-elapsed';
import { reconcileOffline } from './offline-progress';
import { getOfflineCapMs } from './offline-cap';
import { performRebirth, selectRebirth } from './rebirth';
import { purchaseBusiness } from './purchase-business';
import { crewState } from './test-fixtures/crew-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { rational } from '../shared/rational';

function frozen<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(frozen); Object.freeze(value); }
  return value;
}
function heat(state: GameState, value: number, remainder = 0): GameState {
  return { ...state, city: { ...state.city, heat: value, heatDecayElapsedMs: remainder } };
}
function jobStack(value = 0) {
  const s = heat(crewState({ operations: R.id, logistics: null }), value);
  return { ...s, upgrades: { purchasedIds: ['upgrade:express-tips', 'upgrade:street-connections'] as const },
    permanentProgression: { ...s.permanentProgression, skills: { [FAST]: 1, [LEARN]: 1 } } };
}
function productionStack() {
  const s = crewState({ operations: null, logistics: J.id });
  return { ...s, businesses: { ...s.businesses, owned: { [B.id]: { level: 1 } } },
    garage: { ownedVehicleIds: [V.id] }, permanentProgression: { ...s.permanentProgression, skills: { [ROOT]: 2, [SILENT]: 1 } } };
}

describe('Crew catalog and acquisition', () => {
  it('has exactly three stable original specialists and two explicitly ordered slots', () => {
    expect(CREW_CATALOG.map(m => [m.id, m.name, m.recruitmentCost, m.allowedSlots])).toEqual([
      ['crew:rico-vale','Rico Vale','2000000',['operations']], ['crew:mara-knox','Mara Knox','3000000',['operations']],
      ['crew:jax-mercer','Jax Mercer','4000000',['logistics']],
    ]);
    expect(new Set(CREW_CATALOG.map(m => m.id)).size).toBe(3);
    expect(CREW_SLOTS).toEqual([{ id: 'operations', name: 'Operations' }, { id: 'logistics', name: 'Logistics' }]);
    expect(R.effect).toMatchObject({ type: 'modifier', modifier: { operation: 'multiply-basis-points', bonusBasisPoints: 1000, target: { stat: 'job-reward' } } });
    expect(M.effect).toEqual({ type: 'heat-decay-interval', intervalMs: 45000 });
    expect(J.effect).toMatchObject({ type: 'modifier', modifier: { operation: 'multiply-basis-points', bonusBasisPoints: 1500, target: { stat: 'business-production', businessId: null } } });
    expect(R.requirements).toEqual([{ type: 'player-level', minimumLevel: 8 }]);
    expect(M.requirements).toEqual([{ type: 'player-level', minimumLevel: 10 }, { type: 'territory-owned', territoryId: 'territory:neon-mile' }]);
    expect(J.requirements).toEqual([{ type: 'player-level', minimumLevel: 12 }, { type: 'business-level', businessId: B.id, minimumLevel: 15 }]);
  });
  it('starts empty, inactive and free with independent initial slices', () => {
    const s = createInitialGameState();
    expect(s.crew).toEqual({ recruitedIds: [], assignments: { operations: null, logistics: null } });
    expect(selectCrew(s)).toMatchObject({ recruitedCrewCount: 0, totalConfiguredCrew: 3, activeAssignmentCount: 0, totalSlots: 2 });
    expect(s.economy.cash).toBe('0'); expect(s.progression.xp).toBe(0); expect(collectCrewModifiers(s.crew)).toEqual([]);
    expect(s.crew).not.toBe(createInitialGameState().crew);
  });
  it.each(CREW_CATALOG)('$name recruits exactly once, without activation or other rewards', member => {
    const s = frozen({ ...crewState(), crew: createInitialCrewState() });
    const copy = JSON.stringify(s), r = recruitCrewMember(s, member.id);
    expect(r.ok).toBe(true); expect(r.state.economy.cash).toBe((BigInt(s.economy.cash) - BigInt(member.recruitmentCost)).toString());
    expect(r.state.crew.recruitedIds).toEqual([member.id]); expect(r.state.crew.assignments).toBe(s.crew.assignments);
    expect({ ...r.state, economy: s.economy, crew: s.crew }).toEqual(s);
    expect(collectCrewModifiers(r.state.crew)).toEqual([]); expect(getHeatDecayIntervalMs(r.state)).toBe(60000);
    expect(JSON.stringify(s)).toBe(copy);
    expect(recruitCrewMember(r.state, member.id)).toEqual({ ok: false, state: r.state, error: 'already-recruited' });
  });
  it.each([[R,8], [M,10], [J,12]] as const)('checks exact XP threshold for $0.name', (member, level) => {
    const base = { ...crewState(), crew: createInitialCrewState() };
    const below = { ...base, progression: { xp: getXpThresholdForLevel(level) - 1 } };
    const r = recruitCrewMember(below, member.id);
    expect(r).toMatchObject({ ok: false, error: 'requirements-not-met', requirements: { met: false } }); expect(r.state).toBe(below);
    expect(recruitCrewMember({ ...below, progression: { xp: getXpThresholdForLevel(level) } }, member.id).ok).toBe(true);
  });
  it('Mara needs Neon Mile; Jax needs owned Dockside at exactly level 15', () => {
    const s = { ...crewState(), crew: createInitialCrewState() };
    expect(recruitCrewMember({ ...s, city: createInitialGameState().city }, M.id)).toMatchObject({ ok: false, error: 'requirements-not-met' });
    for (const owned of [{}, { [B.id]: { level: 14 } }]) {
      const r = recruitCrewMember({ ...s, businesses: { ...s.businesses, owned } }, J.id);
      expect(r).toMatchObject({ ok: false, error: 'requirements-not-met', requirements: { requirements: [ { met: true }, { met: false } ] } });
    }
    expect(evaluateRequirements(s, J.requirements).met).toBe(true);
  });
  it.each(CREW_CATALOG)('$name distinguishes insufficient funds after requirements', member => {
    const s = frozen({ ...crewState(), crew: createInitialCrewState(), economy: { cash: money((BigInt(member.recruitmentCost)-1n).toString()) } });
    expect(recruitCrewMember(s,member.id)).toEqual({ ok:false,state:s,error:'insufficient-funds' });
    expect(recruitCrewMember({ ...s, economy:{ cash:member.recruitmentCost } },member.id).state.economy.cash).toBe('0');
  });
  it('rejects unknown recruitment and malformed authoritative state without mutation', () => {
    const s = frozen(crewState()); expect(recruitCrewMember(s,'crew:missing')).toEqual({ok:false,state:s,error:'unknown-crew-member'});
    expect(() => recruitCrewMember({ ...s, crew: { ...s.crew, recruitedIds:[R.id,R.id] } },R.id)).toThrow(RangeError);
  });
});
describe('Crew assignments', () => {
  it.each([[R,'operations'],[M,'operations'],[J,'logistics']] as const)('$0.name can fill %s, even below acquisition gates', (member,slot) => {
    const s = frozen({ ...createInitialGameState(), crew: crewState().crew });
    const r = assignCrewMember(s,slot,member.id); expect(r.ok).toBe(true);
    expect(r.state.crew.assignments[slot]).toBe(member.id); expect(r.state.crew.recruitedIds).toBe(s.crew.recruitedIds);
    expect({ ...r.state, crew:s.crew }).toEqual(s); expect(r.state).not.toBe(s);
    expect(assignCrewMember(r.state,slot,member.id)).toEqual({ok:false,state:r.state,error:'already-assigned'});
  });
  it.each([[R,'logistics'],[M,'logistics'],[J,'operations']] as const)('rejects incompatible $0.name / %s', (member,slot) => {
    const s=frozen(crewState());expect(assignCrewMember(s,slot,member.id)).toEqual({ok:false,state:s,error:'incompatible-slot'});
  });
  it('rejects unknown slots/people, unrecruited and duplicate assignment independently of compatibility', () => {
    const s=frozen(crewState());
    expect(assignCrewMember(s,'unknown',R.id)).toEqual({ok:false,state:s,error:'unknown-slot'});
    expect(assignCrewMember(s,'operations','unknown')).toEqual({ok:false,state:s,error:'unknown-crew-member'});
    const empty=createInitialGameState();expect(assignCrewMember(empty,'operations',R.id)).toEqual({ok:false,state:empty,error:'not-recruited'});
    const assigned=assignCrewMember(s,'operations',R.id).state;
    expect(assignCrewMember(assigned,'logistics',R.id)).toEqual({ok:false,state:assigned,error:'already-assigned'});
    expect(isCrewState({...assigned.crew,assignments:{operations:R.id,logistics:R.id}})).toBe(false);
  });
  it('replaces in both directions atomically without Heat/remainder changes', () => {
    const s=frozen(heat(crewState({ operations:R.id,logistics:J.id }),20,50000));
    const mara=assignCrewMember(s,'operations',M.id);expect(mara.ok).toBe(true);
    expect(mara.state.crew.assignments).toEqual({operations:M.id,logistics:J.id});
    expect(mara.state.crew.recruitedIds).toBe(s.crew.recruitedIds);expect({...mara.state,crew:s.crew}).toEqual(s);
    expect(selectCrewMember(mara.state,R.id)?.activeEffect).toBeNull();expect(getHeatDecayIntervalMs(mara.state)).toBe(45000);
    expect(assignCrewMember(mara.state,'operations',R.id).state).toEqual(s);
  });
  it.each(['operations','logistics'] as const)('unassigns %s; empty slots explicitly fail', slot => {
    const s=frozen(crewState({operations:R.id,logistics:J.id}));const r=unassignCrewSlot(s,slot);
    expect(r.ok).toBe(true);expect(r.state.crew.assignments[slot]).toBeNull();expect(r.state.crew.recruitedIds).toBe(s.crew.recruitedIds);
    expect({...r.state,crew:s.crew}).toEqual(s);expect(unassignCrewSlot(r.state,slot)).toEqual({ok:false,state:r.state,error:'already-empty'});
    expect(unassignCrewSlot(s,'unknown')).toEqual({ok:false,state:s,error:'unknown-slot'});
  });
});
describe('assigned Crew effects and exact shared math', () => {
  it.each([R,M,J])('$name has no bench effect on any existing stat', member => {
    const s=createInitialGameState(), bench={...s,crew:{...s.crew,recruitedIds:[member.id]}};
    expect(collectModifiers(bench)).toEqual(collectModifiers(s));expect(getHeatDecayIntervalMs(bench)).toBe(60000);
    expect(evaluateJobReward(bench)).toEqual(evaluateJobReward(s));expect(evaluateXpReward(bench,'manualJob')).toEqual(evaluateXpReward(s,'manualJob'));
    expect(evaluateBusinessProduction(bench,B.id,1)).toEqual(evaluateBusinessProduction(s,B.id,1));
    expect(getOfflineCapMs(bench)).toBe(getOfflineCapMs(s));expect(selectRebirth(bench)).toEqual(selectRebirth(s));
  });
  it.each([[0,rational(23958n,5n),'4791'],[60,rational(107811n,25n),'4312']] as const)('Rico full stack at Heat %i stays rational before existing per-job floor', (h,exact,payout) => {
    const s=jobStack(h), evaluated=evaluateJobReward(s);
    expect(evaluated).toMatchObject({ok:true,effective:exact,reward:payout});
    if(!evaluated.ok)throw Error('fixture');expect(evaluated.applied.some(m=>m.sourceId===R.id)).toBe(true);
    expect(evaluated.applied.filter(m=>m.operation==='multiply-basis-points').map(m=>m.id)).toEqual(evaluated.applied.filter(m=>m.operation==='multiply-basis-points').map(m=>m.id).sort());
    const manual=performStarterJob(s);expect(manual).toMatchObject({ok:true,moneyEarned:payout,xpEarned:11});expect(manual.state.city.heat).toBe(h+1);
    const batch=simulateAutomation(s,30000);expect(batch).toMatchObject({ok:true,automation:{completedJobs:3,income:(BigInt(payout)*3n).toString(),xpEarned:16}});
  });
  it('Rico alone adds 10% Money, disappears on unassignment, and changes neither XP nor Heat or production', () => {
    const base={...createInitialGameState(),crew:crewState().crew};const s=assignCrewMember(base,'operations',R.id).state;
    expect(evaluateJobReward(s)).toMatchObject({reward:'2750'});expect(performStarterJob(s)).toMatchObject({xpEarned:10,state:{city:{heat:1}}});
    expect(evaluateBusinessProduction(s,B.id,1)).toEqual(evaluateBusinessProduction(base,B.id,1));
    expect(getHeatDecayIntervalMs(s)).toBe(60000);
    expect(evaluateJobReward(unassignCrewSlot(s,'operations').state)).toMatchObject({reward:'2500'});
  });
  it.each([[40000,5000,0],[50000,1,5001],[59999,1,15000]] as const)('Mara preserves %ims then processes only positive elapsed', (remainder,elapsed,expected) => {
    const s=frozen(heat(crewState(),20,remainder));const assigned=assignCrewMember(s,'operations',M.id).state;
    expect(assigned.city).toBe(s.city);expect(getHeatDecayIntervalMs(assigned)).toBe(45000);
    expect(simulateGameElapsed(assigned,0).state).toEqual(assigned);
    expect(simulateGameElapsed(assigned,elapsed).state.city).toMatchObject({heat:19,heatDecayElapsedMs:expected});
    expect(selectHeat(assigned).untilDecayMs).toBe(Math.max(0,45000-remainder));
  });
  it('Mara cools at exact 44,999+1ms, never banks at zero, and replacement returns to 60s', () => {
    const s=heat({...createInitialGameState(),crew:crewState({operations:M.id,logistics:null}).crew},10);
    const first=simulateGameElapsed(s,44999);expect(first.state.city).toMatchObject({heat:10,heatDecayElapsedMs:44999});
    const second=simulateGameElapsed(first.state,1);expect(second.state.city).toMatchObject({heat:9,heatDecayElapsedMs:0});
    const zero=simulateGameElapsed(heat(s,0),600000).state;expect(zero.city).toMatchObject({heat:0,heatDecayElapsedMs:0});
    const job=performStarterJob(zero).state;expect(job.city).toMatchObject({heat:1,heatDecayElapsedMs:0});
    expect(simulateGameElapsed(job,44999).state.city.heat).toBe(1);expect(simulateGameElapsed(job,45000).state.city.heat).toBe(0);
    expect(getHeatDecayIntervalMs(unassignCrewSlot(s,'operations').state)).toBe(60000);
    expect(getHeatDecayIntervalMs(assignCrewMember(s,'operations',R.id).state)).toBe(60000);
  });
  it('Jax canonical production is exact, including earned sub-milli-cents and partitions', () => {
    const s=productionStack();const e=evaluateBusinessProduction(s,B.id,1);
    expect(e).toMatchObject({ok:true,effective:rational(192027n,1600n)});
    if(!e.ok)throw Error('fixture');expect(e.applied.map(m=>m.sourceId)).toEqual(expect.arrayContaining([V.id,ROOT,SILENT,J.id]));
    const one=simulateElapsed(s,1).state;
    expect(one.businesses.productionRemainderMilliCents).toBe(120);expect(one.businesses.productionRemainderSubMilliCents).toEqual(rational(27n,1600n));
    let split: GameState=s;for(const ms of [1,7,993,2345,7654])split=simulateElapsed(split,ms).state;
    expect(split).toEqual(simulateElapsed(s,11000).state);
    expect(reconcileOffline(s,0,11000).state).toEqual(simulateGameElapsed(s,11000).state);
  });
  it('Jax stacks with all three production upgrades through the same stable path', () => {
    const s={...productionStack(),upgrades:{purchasedIds:UPGRADE_CATALOG.filter(u=>u.modifier.target.stat==='business-production').map(u=>u.id)}};
    expect(evaluateBusinessProduction(s,B.id,1)).toMatchObject({effective:rational(6336891n,25600n)});
    expect(evaluateJobReward(s)).toEqual(evaluateJobReward(unassignCrewSlot(s,'logistics').state));
    expect(evaluateXpReward(s,'manualJob')).toEqual(evaluateXpReward(unassignCrewSlot(s,'logistics').state,'manualJob'));
    expect(getHeatDecayIntervalMs(s)).toBe(60000);
    expect(evaluateBusinessProduction(unassignCrewSlot(productionStack(),'logistics').state,B.id,1)).toMatchObject({effective:rational(8349n,80n)});
  });
  it('Money/XP overflow with assigned Crew remains whole-state atomic', () => {
    const base=jobStack();for(const s of [{...base,economy:{cash:money('9'.repeat(MAX_MONEY_DIGITS))}}, {...base,progression:{xp:Number.MAX_SAFE_INTEGER}}]) {
      expect(performStarterJob(s).ok).toBe(false);expect(performStarterJob(s).state).toBe(s);
      expect(simulateGameElapsed(s,10000).ok).toBe(false);expect(simulateGameElapsed(s,10000).state).toBe(s);
    }
  });
});
describe('Crew offline and Rebirth contracts', () => {
  it.each([R,M,J])('$name online/offline share one elapsed batch and all other subsystem rules', member => {
    const s=heat(assignCrewMember(crewState(),member.allowedSlots[0],member.id).state,79,30000);
    const duration=95001, online=simulateGameElapsed(s,duration), offline=reconcileOffline(s,1000,1000+duration);
    expect(offline.state).toEqual(online.state);expect(online).toMatchObject({ok:true,automation:{completedJobs:9,xpEarned:45}});
    // Start HOT: no re-pricing after gain/cooling. Neon is also owned in this fixture.
    expect(online).toMatchObject({automation:{income:member.id===R.id?'24498':'22275'}});
    expect(online.state.city.heat).toBe(78);
  });
  it.each([0,1,2])('Never Sleeps rank %i remains the sole cap source with Crew', rank => {
    for(const operations of [R.id,M.id]) {
      const base=heat(crewState({operations,logistics:J.id}),90,50000);
      const s={...base,permanentProgression:{...base.permanentProgression,skills:rank?{[NEVER]:rank}:{}}};
      const cap=(8+rank*2)*3600000;expect(getOfflineCapMs(s)).toBe(cap);
      for(const duration of [cap-1,cap,cap+500001]) {
        const result=reconcileOffline(s,1000,1000+duration);expect(result).toMatchObject({ok:true,progress:{capMs:cap,actualElapsedMs:duration,rewardedElapsedMs:Math.min(duration,cap),capped:duration>=cap}});
        expect(result.state).toEqual(simulateGameElapsed(s,Math.min(duration,cap)).state);
      }
    }
  });
  it('Rebirth explicitly resets Crew/all temporary slices, retains permanents and never refunds; repeated rebuild works', () => {
    const base=rebirthState();const s=frozen({...base,crew:crewState({operations:R.id,logistics:J.id}).crew,
      city:heat(crewState(),90,50000).city, permanentProgression:{empirePoints:3,rebirthCount:2,skills:{[FAST]:1,[ROOT]:2,[SILENT]:1,[LEARN]:1,[NEVER]:1}}});
    const r=performRebirth(s);expect(r).toMatchObject({ok:true,reward:4});
    const fresh=createInitialGameState();expect(r.state.crew).toEqual(fresh.crew);expect(r.state.city).toEqual(fresh.city);
    for(const key of ['economy','businesses','upgrades','automation','progression'] as const)expect(r.state[key]).toEqual(fresh[key]);
    expect(r.state.garage).toEqual(s.garage);expect(r.state.permanentProgression).toEqual({...s.permanentProgression,empirePoints:7,rebirthCount:3});
    expect(evaluateJobReward(r.state)).toMatchObject({reward:'2750'});expect(getHeatDecayIntervalMs(r.state)).toBe(60000);expect(collectCrewModifiers(r.state.crew)).toEqual([]);
    const rebuilt=purchaseBusiness({...r.state,economy:{cash:B.purchaseCost}},B.id).state;
    expect(evaluateBusinessProduction(rebuilt,B.id,1)).toMatchObject({effective:rational(8349n,80n)});
    const second=performRebirth({...s,permanentProgression:r.state.permanentProgression});expect(second.state.permanentProgression.empirePoints).toBe(11);expect(second.state.crew).toEqual(fresh.crew);
  });
  it('fresh progression and max Heat work without optional Crew', () => {
    let s=createInitialGameState();for(let i=0;i<6;i++)s=performStarterJob(s).state;
    expect(s.progression.xp).toBe(60);expect(purchaseBusiness(s,B.id).ok).toBe(true);expect(s.crew).toEqual(createInitialCrewState());
    expect(performStarterJob(heat(s,100))).toMatchObject({ok:true,moneyEarned:'1875'});
    const d=heat({...crewState(),crew:createInitialCrewState()},100);expect(simulateGameElapsed(d,10000).ok).toBe(true);
  });
});
