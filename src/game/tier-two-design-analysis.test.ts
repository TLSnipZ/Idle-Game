/** Tier-2 design experiment only. No proposed identity enters the runtime catalog. */
import { expect, it } from 'vitest';
import { BUSINESS_CATALOG, getLevelProduction, getUpgradeCost } from '../features/businesses';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_JOB, moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { VEHICLE_CATALOG, TUNING_CATALOG } from '../features/vehicles';
import { createInitialGameState } from './game-state';
import { evaluateStat, wholeStatValue } from './modifiers';
import type { Modifier, StatTarget } from './modifiers';
import type { Requirement } from './requirement';
import { evaluateRequirements } from './requirements';

function percent(id: string, target: StatTarget, bonusBasisPoints: number): Modifier {
  return { id, sourceId: 'analysis:tier-two', target, operation: 'multiply-basis-points', bonusBasisPoints };
}
const manual = (id: string, bp: number) => percent(id, { stat: 'job-reward', context: 'manual' }, bp);
const dispatcher = (id: string, bp: number) => percent(id, { stat: 'job-reward', context: 'dispatcher' }, bp);
const business = (id: string, bp: number) => percent(id, { stat: 'business-production', businessId: null }, bp);
const proposals = [
  { name: 'Serein', cost: 80000, player: 10, afterdark: 1,
    old: [manual('old:serein',1600)], proposed: [manual('new:serein',2600)] },
  { name: 'Rendan', cost: 115000, player: 12, afterdark: 3,
    old: [percent('old:rendan',{stat:'job-reward'},1000)],
    proposed: [percent('new:rendan',{stat:'job-reward'},1800)] },
  { name: 'Canto Club', cost: 165000, player: 14, afterdark: 5,
    old: [dispatcher('old:canto-dispatcher',1200),business('old:canto-business',500)],
    proposed: [dispatcher('new:canto-dispatcher',1200),business('new:canto-business',1800)] },
];
function value(base: string, target: StatTarget, modifiers: readonly Modifier[], discrete = false) {
  const result = evaluateStat(moneyFromMinorUnits(base),target,modifiers);
  if (!result.ok) throw Error('Analysis overflow');
  return discrete ? Number(wholeStatValue(result.effective))/100
    : Number(result.effective.numerator)/Number(result.effective.denominator)/100;
}
function reward(modifiers: readonly Modifier[], context: 'manual' | 'dispatcher') {
  return value(STARTER_JOB.reward,{stat:'job-reward',context},modifiers,true);
}
const current = VEHICLE_CATALOG.flatMap(car => [
  { name: car.name+' stock', modifiers:[car.modifier] },
  ...TUNING_CATALOG.filter(part=>part.vehicleId===car.id).map(part=>({
    name:car.name+' / '+part.name,modifiers:[car.modifier,part.modifier],
  })),
]);
function gates(p: typeof proposals[number]): Requirement[] {
  return [{type:'player-level',minimumLevel:p.player},
    {type:'business-owned',businessId:'business:afterdark-customs'},
    {type:'business-level',businessId:'business:afterdark-customs',minimumLevel:p.afterdark}];
}
it.each(proposals)('$name: gates require actual workshop ownership and both progression thresholds', p=>{
  const fresh=createInitialGameState();
  const at={...fresh,progression:{xp:getXpThresholdForLevel(p.player)},
    businesses:{...fresh.businesses,owned:{'business:afterdark-customs':{level:p.afterdark}}}};
  expect(evaluateRequirements(at,gates(p)).met).toBe(true);
  expect(evaluateRequirements({...at,businesses:fresh.businesses},gates(p)).met).toBe(false);
  expect(evaluateRequirements({...at,progression:{xp:getXpThresholdForLevel(p.player)-1}},gates(p)).met).toBe(false);
  if(p.afterdark>1) expect(evaluateRequirements({...at,businesses:{...at.businesses,
    owned:{'business:afterdark-customs':{level:p.afterdark-1}}}},gates(p)).met).toBe(false);
});
it('compares stock and tuned alternatives through the real scoped reward evaluator',()=>{
  const senda=current.find(row=>row.name==='Kairo Senda / Express ECU')!;
  expect(reward(senda.modifiers,'manual')).toBe(30.24);
  expect(reward(proposals[0]!.old,'manual')).toBeLessThan(reward(senda.modifiers,'manual'));
  expect(reward(proposals[0]!.proposed,'manual')).toBe(31.5);
  expect(reward(proposals[0]!.proposed,'dispatcher')).toBe(25);
  expect(reward(proposals[1]!.proposed,'manual')).toBe(29.5);
  expect(reward(proposals[1]!.proposed,'dispatcher')).toBe(29.5);
  expect(reward(proposals[2]!.proposed,'manual')).toBe(25);
  expect(reward(proposals[2]!.proposed,'dispatcher')).toBe(28);
});
it.each([
  {name:'workshop entry',levels:[7,10,1,0]},
  {name:'established workshop',levels:[15,10,5,0]},
  {name:'nightclub owner',levels:[25,15,8,1]},
])('$name: compares optional car opportunity costs at fixed business portfolios', sample=>{
  const rows=[...current,...proposals.flatMap(p=>[
    {name:p.name+' historical',modifiers:p.old},{name:p.name+' revised',modifiers:p.proposed}])];
  const results=rows.map(row=>{
    const production=BUSINESS_CATALOG.reduce((total,b,i)=>total+(sample.levels[i]!
      ?value(getLevelProduction(b,sample.levels[i]!),{stat:'business-production',businessId:b.id},row.modifiers):0),0);
    const manualCash=reward(row.modifiers,'manual'), dispatcherCash=reward(row.modifiers,'dispatcher');
    return {name:row.name,production,manualCash,dispatcherCash,
      coldIdlePerSecond:production+dispatcherCash*1000/DELIVERY_DISPATCHER.intervalMs,
      coldActivePerSecond:production+dispatcherCash*1000/DELIVERY_DISPATCHER.intervalMs+manualCash/5};
  });
  const fleet=results.find(r=>r.name==='Kairo KX-R / Fleet gearing')!;
  const oldCanto=results.find(r=>r.name==='Canto Club historical')!;
  const canto=results.find(r=>r.name==='Canto Club revised')!;
  expect(oldCanto.coldIdlePerSecond).toBeLessThan(fleet.coldIdlePerSecond);
  expect(canto.coldIdlePerSecond).toBeGreaterThan(fleet.coldIdlePerSecond);
  console.info('TIER_TWO_PORTFOLIO',JSON.stringify({sample,...{results},
    cantoMarginalPaybackHours:165000/(canto.coldIdlePerSecond-fleet.coldIdlePerSecond)/3600}));
});
it('reports business capital floors and distinguishes them from a purchase-time route',()=>{
  const rows=proposals.map(p=>{
    const levels=[7,10,p.afterdark,0];
    const businessCapital=BUSINESS_CATALOG.reduce((total,b,i)=>{
      const level=levels[i]!;
      if(!level)return total;
      let cost=BigInt(b.purchaseCost);
      for(let n=1;n<level;n++)cost+=BigInt(getUpgradeCost(b,n)!);
      return total+Number(cost)/100;
    },0);
    return {name:p.name,businessCapital,carCost:p.cost,totalCapital:businessCapital+p.cost,
      requiredXp:getXpThresholdForLevel(p.player)};
  });
  expect(rows.map(r=>r.totalCapital)).toEqual([538800,593800,743800]);
  console.info('TIER_TWO_CAPITAL',JSON.stringify(rows));
});
