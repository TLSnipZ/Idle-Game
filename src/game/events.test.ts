import { describe, expect, it } from 'vitest';
import { EVENT_CATALOG, EVENT_OPPORTUNITY_MS, EVENT_SPAWN_CHANCE, advanceEventOpportunity, eventChanceSucceeds, selectEventId } from '../features/events';
import { createInitialGameState } from './game-state';
import { evaluateEventEligibility, eligibleEvents, selectCityEvents } from './event-selectors';
import { resolveEventChoice } from './resolve-event-choice';
import { simulateOnlineElapsed } from './simulate-online-elapsed';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { eventState, fakeRandom, TIP, SHAKE, WAREHOUSE } from './test-fixtures/event-state';
import { getXpThresholdForLevel } from '../features/progression';
import { moneyFromMinorUnits } from '../features/economy';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { performRebirth } from './rebirth';

const ids = [TIP,SHAKE,WAREHOUSE] as const;
describe('city event catalog and eligibility',()=>{
  it('has exactly three ordered stable identities, two unique choices each, and provisional cadence',()=>{
    expect(EVENT_CATALOG.map(e=>e.id)).toEqual(ids);expect(EVENT_CATALOG.map(e=>e.name)).toEqual(['Hot Tip','Shakedown','Warehouse Opportunity']);
    expect(EVENT_CATALOG.map(e=>e.choices.map(c=>c.id))).toEqual([
      ['choice:take-tip','choice:play-safe'],['choice:pay-off','choice:refuse'],['choice:invest','choice:pass']]);
    expect(new Set(ids).size).toBe(3);for(const e of EVENT_CATALOG){expect(e.choices).toHaveLength(2);expect(new Set(e.choices.map(c=>c.id)).size).toBe(2);}
    expect(EVENT_OPPORTUNITY_MS).toBe(600000);expect(EVENT_SPAWN_CHANCE).toBe(.35);
    expect(EVENT_CATALOG.map(e=>e.choices.map(c=>[c.cost,c.reward,c.heatChange]))).toEqual([
      [['0','150000',5],['0','0',-5]],[['100000','0',-10],['0','0',10]],[['250000','400000',5],['0','0',0]]]);
  });
  it.each([[4,false],[5,true]])('Hot Tip derived level %i eligibility %s',(level,met)=>{
    const s={...createInitialGameState(),progression:{xp:getXpThresholdForLevel(level)}};
    expect(evaluateEventEligibility(s,EVENT_CATALOG[0]!).met).toBe(met);
  });
  it.each([[19,false],[20,true]])('Shakedown Heat %i eligibility %s',(heat,met)=>{
    expect(evaluateEventEligibility(eventState(null,'0',heat),EVENT_CATALOG[1]!)).toMatchObject({met,heat:{minimum:20,current:heat,met}});
  });
  it.each([[9,true,false],[10,false,false],[10,true,true]])('Warehouse level %i owned %s',(level,owned,met)=>{
    const b=eventState(),s={...b,progression:{xp:getXpThresholdForLevel(level)},businesses:owned?b.businesses:createInitialGameState().businesses};
    const eligibility=evaluateEventEligibility(s,EVENT_CATALOG[2]!);expect(eligibility.met).toBe(met);expect(eligibility.requirements.met).toBe(met);
  });
  it('fresh state has no event, no free outcome and structured unmet requirements',()=>{
    const s=createInitialGameState();expect(s.events).toEqual({pendingEventId:null,opportunityElapsedMs:0});expect(eligibleEvents(s)).toEqual([]);
    expect(selectCityEvents(s)).toMatchObject({configuredCount:3,choices:[],untilOpportunityMs:600000});
    expect(evaluateEventEligibility(s,EVENT_CATALOG[0]!).requirements.met).toBe(false);expect(s.economy.cash).toBe('0');expect(s.progression.xp).toBe(0);
  });
});
describe('opportunity arithmetic and explicit RNG consumption',()=>{
  it.each([[0,true],[.349999,true],[.35,false],[.999999,false]])('chance boundary %s',(roll,success)=>expect(eventChanceSucceeds(roll)).toBe(success));
  it.each([-1,1,1.5,NaN,Infinity])('rejects invalid chance and selection %s without clamping',value=>{
    expect(()=>eventChanceSucceeds(value)).toThrow(RangeError);expect(()=>selectEventId(ids,value)).toThrow(RangeError);
    const s=eventState(),before=structuredClone(s);expect(()=>simulateOnlineElapsed(s,600000,fakeRandom(value))).toThrow(RangeError);expect(s).toEqual(before);
    expect(()=>simulateOnlineElapsed(s,600000,fakeRandom(0,value))).toThrow(RangeError);expect(s).toEqual(before);
  });
  it.each([[0,TIP],[1/3-Number.EPSILON,TIP],[1/3,SHAKE],[.5,SHAKE],[2/3,WAREHOUSE],[.999999,WAREHOUSE]] as const)('uniform three-event selection %s', (roll,id)=>expect(selectEventId(ids,roll)).toBe(id));
  it.each([0,.499999,.5,.999999])('one and two eligible selection ranges %s',roll=>{
    expect(selectEventId([TIP],roll)).toBe(TIP);expect(selectEventId([TIP,SHAKE],roll)).toBe(roll<.5?TIP:SHAKE);
  });
  it.each([[0,599999,false,599999],[599999,1,true,0],[590000,20000,true,10000],[0,2100000,true,300000]])('cadence rest %i + %i',(rest,elapsed,attempt,remainder)=>{
    const s={opportunityElapsedMs:rest,pendingEventId:null};const r=advanceEventOpportunity(s,elapsed);
    expect(r).toEqual({attempt,state:{pendingEventId:null,opportunityElapsedMs:remainder}});expect(s.opportunityElapsedMs).toBe(rest);
  });
  it('handles safe-integer elapsed plus remainder exactly using integer arithmetic',()=>{
    const r=advanceEventOpportunity({opportunityElapsedMs:599999,pendingEventId:null},Number.MAX_SAFE_INTEGER);
    expect(r.state.opportunityElapsedMs).toBe(Number((BigInt(Number.MAX_SAFE_INTEGER)+599999n)%600000n));expect(r.attempt).toBe(true);
  });
  it.each([0,1,599999])('incomplete window %i consumes no RNG',elapsed=>{
    const s={...eventState(),events:createInitialGameState().events},rng=fakeRandom();simulateOnlineElapsed(s,elapsed,rng);expect(rng.calls()).toBe(0);
  });
  it('no eligible content consumes zero rolls and retains modulo remainder',()=>{
    const rng=fakeRandom(),s=createInitialGameState();const r=simulateOnlineElapsed(s,610000,rng);
    expect(r.state).toEqual({...s,events:{pendingEventId:null,opportunityElapsedMs:10000}});expect(rng.calls()).toBe(0);
  });
  it.each([.35,.99])('failed spawn consumes one roll %s without outcomes',roll=>{
    const s=eventState(),rng=fakeRandom(roll),normal=simulateGameElapsed(s,600000);
    const r=simulateOnlineElapsed(s,600000,rng);expect(r).toEqual(normal);expect(rng.calls()).toBe(1);
  });
  it('success consumes exactly two values, spawns only one, applies no choice and freezes remainder',()=>{
    const s=eventState(),rng=fakeRandom(0,0);const normal=simulateGameElapsed(s,2100000),r=simulateOnlineElapsed(s,2100000,rng);
    expect(r.state).toEqual({...normal.state,events:{pendingEventId:TIP,opportunityElapsedMs:423456}});expect(rng.calls()).toBe(2);
    const later=simulateOnlineElapsed(r.state,1800000,rng);expect(later.state.events).toBe(r.state.events);expect(rng.calls()).toBe(2);
  });
  it('spawn eligibility uses fully reconciled economy/XP/Heat, never retention rules',()=>{
    const s={...createInitialGameState(),city:{...createInitialGameState().city,heat:20,heatDecayElapsedMs:0}},rng=fakeRandom();
    expect(simulateOnlineElapsed(s,600000,rng).state.events.pendingEventId).toBeNull();expect(rng.calls()).toBe(0);
    const pending={...s,events:{pendingEventId:SHAKE as typeof SHAKE,opportunityElapsedMs:200000}};
    const r=simulateOnlineElapsed(pending,1800000,rng);expect(r.state.city.heat).toBe(0);expect(r.state.events).toBe(pending.events);
  });
});
describe('atomic current-event choice resolution',()=>{
  it.each([
    [TIP,'choice:take-tip','0',98,'150000',100,30000],
    [TIP,'choice:take-tip','0',100,'150000',100,30000],
    [TIP,'choice:play-safe','100',3,'100',0,0],
    [TIP,'choice:play-safe','100',20,'100',15,30000],
    [SHAKE,'choice:pay-off','100000',6,'0',0,0],
    [SHAKE,'choice:pay-off','100000',30,'0',20,30000],
    [SHAKE,'choice:refuse','0',95,'0',100,30000],
    [SHAKE,'choice:refuse','0',0,'0',10,0],
    [WAREHOUSE,'choice:invest','250000',50,'400000',55,30000],
    [WAREHOUSE,'choice:pass','0',50,'0',50,30000],
  ] as const)('%s / %s exact fixed transaction', (id,choice,cash,heat,afterCash,afterHeat,remainder)=>{
    const s=eventState(id,cash,heat),before=structuredClone(s);Object.freeze(s);Object.freeze(s.events);
    const r=resolveEventChoice(s,id,choice);expect(r.ok).toBe(true);expect(s).toEqual(before);
    expect(r.state).toEqual({...s,economy:{cash:afterCash},city:{...s.city,heat:afterHeat,heatDecayElapsedMs:remainder},events:{pendingEventId:null,opportunityElapsedMs:0}});
    expect(r.state.progression).toBe(s.progression);expect(r.state.permanentProgression).toBe(s.permanentProgression);
  });
  it.each([[SHAKE,'choice:pay-off','99999'],[WAREHOUSE,'choice:invest','249999']] as const)('unaffordable %s preserves entire state and pending timer',(id,choice,cash)=>{
    const s=eventState(id,cash),before=structuredClone(s);expect(resolveEventChoice(s,id,choice)).toEqual({ok:false,error:'insufficient-funds',state:s});expect(s).toEqual(before);
    expect(selectCityEvents(s).choices.map(c=>c.canChoose)).toEqual([false,true]);
  });
  it.each([TIP,WAREHOUSE] as const)('reward overflow %s rolls back payment/Heat/timer',id=>{
    const s=eventState(id,'9'.repeat(100)),r=resolveEventChoice(s,id,id===TIP?'choice:take-tip':'choice:invest');
    expect(r).toEqual({ok:false,error:'overflow',state:s});expect(r.state).toBe(s);
  });
  it.each([[null,TIP,'choice:take-tip','no-pending-event'],[TIP,SHAKE,'choice:refuse','wrong-event'],[TIP,TIP,'choice:invest','unknown-choice'],[TIP,TIP,'choice:missing','unknown-choice']] as const)('only the current pending identity resolves %#',(pending,id,choice,error)=>{
    const s=eventState(pending);expect(resolveEventChoice(s,id,choice)).toEqual({ok:false,state:s,error});
  });
  it.each([0,60,90,100])('all stat sources and Heat %i leave event Money/XP unchanged',heat=>{
    const b=rebirthState(),crew=crewState({operations:'crew:rico-vale',logistics:'crew:jax-mercer'});
    for(const id of [TIP,WAREHOUSE] as const){const s={...b,...eventState(id,'1000000',heat),upgrades:b.upgrades,garage:b.garage,crew:crew.crew,
      city:{...crew.city,heat,heatDecayElapsedMs:heat?30000:0},permanentProgression:{empirePoints:10,rebirthCount:2,skills:{'skill:fast-talker':2,'skill:learn-the-streets':2,'skill:streetwise-investment':3,'skill:silent-partner':2,'skill:never-sleeps':2}}};
      const r=resolveEventChoice(s,id,id===TIP?'choice:take-tip':'choice:invest');expect(r.ok).toBe(true);expect(r.state.economy.cash).toBe('1150000');expect(r.state.progression).toBe(s.progression);expect(r.state.permanentProgression).toBe(s.permanentProgression);}
  });
  it('current cash changes availability without resnapshotting or eligibility rechecks',()=>{
    const s=eventState(SHAKE,'200000',0);expect(selectCityEvents(s).choices[0]?.canChoose).toBe(true);
    const spent={...s,economy:{cash:moneyFromMinorUnits('50000')}};expect(selectCityEvents(spent).choices.map(c=>c.canChoose)).toEqual([false,true]);
    expect(resolveEventChoice(spent,SHAKE,'choice:refuse').ok).toBe(true);
  });
  it.each([null,TIP,SHAKE,WAREHOUSE] as const)('Rebirth discards %s and timer without resolving/refunding',pendingEventId=>{
    const s={...rebirthState(),events:{opportunityElapsedMs:123456,pendingEventId}},r=performRebirth(s);expect(r.ok).toBe(true);
    expect(r.state.events).toEqual(createInitialGameState().events);expect(r.state.economy.cash).toBe('0');expect(r.state.garage).toEqual(s.garage);
    expect(r.state.permanentProgression).toEqual({...s.permanentProgression,empirePoints:4,rebirthCount:1});
  });
});
