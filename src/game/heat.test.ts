import { describe, expect, it } from 'vitest';
import { HEAT_TIERS, getHeatTier, gainHeat, decayHeat, dispatcherHeatGain, collectHeatModifiers, HEAT_MODIFIER_ID } from '../features/heat';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { territoryState } from './test-fixtures/territory-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { FAST, LEARN, NEVER } from './test-fixtures/skill-state';
import { performStarterJob } from './perform-starter-job';
import { acquireTerritory } from './acquire-territory';
import { layLow } from './lay-low';
import { simulateAutomation } from './simulate-automation';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { evaluateJobReward, evaluateBusinessProduction } from './effective-stats';
import { evaluateXpReward } from './xp-reward';
import { getOfflineCapMs } from './offline-cap';
import { reconcileOffline } from './offline-progress';
import { performRebirth, selectRebirth } from './rebirth';
import { purchaseBusiness } from './purchase-business';
import { STARTER_BUSINESS } from '../features/businesses';
import { NEON_MILE, WATERFRONT } from '../features/territories';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { rational } from '../shared/rational';

function heated(heat: number, remainder = 0, base: GameState = createInitialGameState()): GameState {
  return { ...base, city: { ...base.city, heat, heatDecayElapsedMs: remainder } };
}
function funded(heat: number, remainder = 0, cents = '1000000') {
  return { ...heated(heat, remainder), economy: { cash: moneyFromMinorUnits(cents) } };
}
function stack(heat: number) {
  const s = territoryState(true);
  return heated(heat, 0, { ...s, upgrades: { purchasedIds: ['upgrade:express-tips', 'upgrade:street-connections'] },
    permanentProgression: { ...s.permanentProgression, skills: { [FAST]: 1, [LEARN]: 1 } } });
}
function frozen<T>(value: T): T {
  if (typeof value === 'object' && value !== null) { Object.values(value).forEach(frozen); Object.freeze(value); }
  return value;
}

describe('Heat tiers and bounded arithmetic', () => {
  it('has exactly five explicitly ordered tiers and only two penalties', () => {
    expect(HEAT_TIERS.map(t => [t.label, t.minimum, t.bonusBasisPoints])).toEqual([
      ['COLD', 0, 0], ['NOTICED', 20, 0], ['WATCHED', 40, 0], ['HOT', 60, -1000], ['MANHUNT', 80, -2500],
    ]);
  });
  it.each([[0,'COLD'],[19,'COLD'],[20,'NOTICED'],[39,'NOTICED'],[40,'WATCHED'],[59,'WATCHED'],[60,'HOT'],[79,'HOT'],[80,'MANHUNT'],[100,'MANHUNT']] as const)('Heat %i is %s', (heat,label) => {
    expect(getHeatTier(heat).label).toBe(label);
  });
  it.each([-1,101,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])('rejects invalid Heat %s', heat => {
    expect(() => getHeatTier(heat)).toThrow(RangeError);
    expect(() => gainHeat({ heat, heatDecayElapsedMs: 0 }, 1)).toThrow(RangeError);
  });
  it('clamps gains safely without overflow or mutation', () => {
    const state = frozen({ heat: 95, heatDecayElapsedMs: 45000 });
    expect(gainHeat(state, Number.MAX_SAFE_INTEGER)).toEqual({ heat: 100, heatDecayElapsedMs: 45000 });
    expect(state.heat).toBe(95);
  });
  it.each([[0,0],[4,0],[5,1],[9,1],[10,2],[27,5]])('batches %i jobs into %i Heat', (jobs,gain) => {
    expect(dispatcherHeatGain(jobs)).toBe(gain);
    const s = territoryState(); const r = simulateAutomation(s, jobs * 10000);
    expect(r.ok).toBe(true); expect(r.state.city.heat).toBe(gain);
  });
  it('does not accumulate a cross-batch counter for 3 then 2 jobs', () => {
    const s = territoryState(); const a = simulateAutomation(s,30000); const b = simulateAutomation(a.state,20000);
    expect(a.state.city.heat).toBe(0); expect(b.state.city.heat).toBe(0);
    expect(simulateAutomation(s,50000).state.city.heat).toBe(1);
    expect(Object.keys(b.state.city).sort()).toEqual(['heat','heatDecayElapsedMs','ownedTerritoryIds']);
  });
  it('uses mathematical gain then decay for the synthetic ten-job/five-minute example', () => {
    expect(decayHeat(gainHeat({ heat: 20, heatDecayElapsedMs: 0 }, dispatcherHeatGain(10)),300000))
      .toEqual({ heat: 17, heatDecayElapsedMs: 0 });
    // The real 10-second dispatcher completes 30 jobs over five minutes.
    expect(simulateGameElapsed(heated(20,0,territoryState()),300000).state.city.heat).toBe(21);
  });
});

describe('cooling and deliberate reduction', () => {
  it('retains exact millisecond cooling progress and consumes full intervals', () => {
    const s = frozen({ heat: 10, heatDecayElapsedMs: 0 });
    expect(decayHeat(s,0)).toBe(s);
    const partial = decayHeat(s,59999); expect(partial).toEqual({ heat: 10, heatDecayElapsedMs: 59999 });
    expect(decayHeat(partial,1)).toEqual({ heat: 9, heatDecayElapsedMs: 0 });
    expect(decayHeat({ heat: 2, heatDecayElapsedMs: 0 },300000)).toEqual({ heat: 0, heatDecayElapsedMs: 0 });
  });
  it('never banks zero-Heat cooling; first gain needs a fresh minute', () => {
    const s = simulateGameElapsed(createInitialGameState(),600000).state;
    expect(s.city.heatDecayElapsedMs).toBe(0);
    const job = performStarterJob(s); expect(job.state.city).toMatchObject({ heat: 1, heatDecayElapsedMs: 0 });
    const partial = simulateGameElapsed(job.state,59999); expect(partial.state.city.heat).toBe(1);
    expect(simulateGameElapsed(partial.state,1).state.city).toMatchObject({ heat: 0, heatDecayElapsedMs: 0 });
  });
  it('gains preserve earned cooling progress while already hot', () => {
    const job = performStarterJob(heated(10,45000)); expect(job.state.city).toMatchObject({ heat: 11, heatDecayElapsedMs: 45000 });
    expect(simulateGameElapsed(job.state,15000).state.city).toMatchObject({ heat: 10, heatDecayElapsedMs: 0 });
  });
  it('decay alone is partition independent and safe at the maximum elapsed value', () => {
    const s = { heat: 100, heatDecayElapsedMs: 59999 };
    expect(decayHeat(decayHeat(s,59999),123456)).toEqual(decayHeat(s,183455));
    expect(decayHeat(s,Number.MAX_SAFE_INTEGER)).toEqual({ heat: 0, heatDecayElapsedMs: 0 });
    expect(simulateGameElapsed(heated(100,59999),Number.MAX_SAFE_INTEGER).state.city.heat).toBe(0);
  });
  it.each([[75,42000,65,42000],[6,42000,0,0],[10,30000,0,0],[20,30000,10,30000]])('Lay Low at %i preserves or clears cooling correctly', (heat,remainder,next,rest) => {
    const s = frozen(funded(heat,remainder)); const result = layLow(s);
    expect(result.ok).toBe(true); expect(result.state.economy.cash).toBe('950000');
    expect(result.state).toEqual({ ...s, economy: { cash: '950000' }, city: { ...s.city, heat: next, heatDecayElapsedMs: rest } });
  });
  it('spends exact funds down to zero without rewards', () => {
    const s = funded(6,42000,'50000'); expect(layLow(s)).toMatchObject({ ok: true, state: { economy: { cash: '0' }, city: { heat: 0, heatDecayElapsedMs: 0 }, progression: s.progression, permanentProgression: s.permanentProgression } });
  });
  it.each([[0,'1000000','already-cold'],[20,'49900','insufficient-funds']] as const)('Lay Low failure preserves all state (%s)', (heat,cash,error) => {
    const s = frozen(funded(heat,0,cash)); expect(layLow(s)).toEqual({ ok: false, error, state: s }); expect(layLow(s).state).toBe(s);
  });
});

describe('atomic Heat sources and exact job penalties', () => {
  it.each([[0,'2500',1],[59,'2500',60],[60,'2250',61],[79,'2250',80],[80,'1875',81],[99,'1875',100],[100,'1875',100]] as const)('manual job uses starting Heat %i', (heat,cash,next) => {
    const s = frozen(heated(heat)); const result = performStarterJob(s);
    expect(result).toMatchObject({ ok: true, moneyEarned: cash, xpEarned: 10 });
    expect(result.state.economy.cash).toBe(cash); expect(result.state.progression.xp).toBe(10); expect(result.state.city.heat).toBe(next);
    expect(s.city.heat).toBe(heat);
  });
  it.each(['money','xp'] as const)('%s overflow rejects the entire manual and elapsed transaction', kind => {
    const base = heated(79,45000,territoryState());
    const s = frozen(kind === 'money' ? { ...base, economy: { cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) } }
      : { ...base, progression: { xp: Number.MAX_SAFE_INTEGER } });
    expect(performStarterJob(s)).toMatchObject({ ok: false, state: s }); expect(performStarterJob(s).state).toBe(s);
    const r = simulateGameElapsed(s,50000); expect(r.ok).toBe(false); expect(r.state).toBe(s);
  });
  it('malformed Heat fails loudly without publishing intermediate economy changes', () => {
    const s = frozen(heated(101,0,territoryState())); const before = JSON.stringify(s);
    for (const command of [performStarterJob, layLow, (v: GameState) => simulateGameElapsed(v,50000), (v: GameState) => acquireTerritory(v,NEON_MILE.id)]) {
      expect(() => command(s)).toThrow(RangeError); expect(JSON.stringify(s)).toBe(before);
    }
  });
  it.each([[0,10],[95,100]])('Neon acquisition at %i Heat clamps to %i atomically', (heat,next) => {
    const s = frozen(heated(heat,heat ? 42000 : 0,territoryState())); const r = acquireTerritory(s,NEON_MILE.id);
    expect(r.ok).toBe(true); expect(r.state.city.heat).toBe(next); expect(r.state.city.heatDecayElapsedMs).toBe(s.city.heatDecayElapsedMs);
    expect(r.state.economy.cash).toBe('0'); expect(r.state.progression).toBe(s.progression); expect(r.state.permanentProgression).toBe(s.permanentProgression);
    expect(acquireTerritory(r.state,NEON_MILE.id).state).toBe(r.state);
  });
  it('failed acquisition never adds Heat or spends', () => {
    for (const s of [heated(50,0,territoryState(false,11)), { ...heated(50,0,territoryState()), economy: { cash: moneyFromMinorUnits('9999999') } }]) {
      expect(acquireTerritory(s,NEON_MILE.id).ok).toBe(false); expect(acquireTerritory(s,NEON_MILE.id).state).toBe(s);
    }
    const s = createInitialGameState(); expect(acquireTerritory(s,WATERFRONT.id).state).toBe(s);
  });
  it.each([[0,4356n,1n,'4356'],[60,19602n,5n,'3920'],[80,3267n,1n,'3267']] as const)('full stack at Heat %i retains exact rational before final cents', (heat,n,d,payout) => {
    const s = stack(heat), reward = evaluateJobReward(s); expect(reward).toMatchObject({ ok: true, effective: rational(n,d), reward: payout });
    const job = performStarterJob(s); expect(job.ok && job.moneyEarned).toBe(payout); expect(job.ok && job.xpEarned).toBe(11);
    const batch = simulateAutomation(s,30000); expect(batch.ok && batch.automation.income).toBe((BigInt(payout)*3n).toString());
    expect(batch.ok && batch.automation.xpEarned).toBe(16);
    if (!reward.ok) throw Error('fixture');
    expect(reward.applied.filter(m => m.id === HEAT_MODIFIER_ID)).toHaveLength(heat < 60 ? 0 : 1);
    const percents = reward.applied.filter(m => m.operation === 'multiply-basis-points').map(m => m.id);
    expect(percents).toEqual([...percents].sort());
  });
  it('uses HOT for ten jobs starting at 79, then gain and decay; future batches use final Heat', () => {
    const s = heated(79,0,territoryState()); const r = simulateGameElapsed(s,100000);
    expect(r.ok && r.automation.income).toBe('22500'); expect(r.state.city).toMatchObject({ heat: 80, heatDecayElapsedMs: 40000 });
    expect(simulateGameElapsed(r.state,10000)).toMatchObject({ ok: true, automation: { income: '1875' } });
  });
  it.each([[60,'405000'],[90,'337500']] as const)('whole thirty-minute batch uses start tier at Heat %i before a longer follow-up comparison cools to COLD', (heat,income) => {
    const s = heated(heat,0,territoryState()); const r = simulateGameElapsed(s,1800000);
    expect(r.ok && r.automation.income).toBe(income);
    // 180 jobs -> +36, clamp before -30 cooling.
    expect(r.state.city.heat).toBe(heat === 60 ? 66 : 70);
    const cold = simulateGameElapsed(s,7200000); expect(cold.state.city.heat).toBe(0);
    expect(cold.ok && cold.automation.income).toBe(heat === 60 ? '1620000' : '1350000');
    expect(simulateGameElapsed(cold.state,10000)).toMatchObject({ ok: true, automation: { income: '2500' } });
  });
  it('isolates production, XP, caps and Rebirth from Heat', () => {
    const cold = heated(0,0,rebirthState()), hot = heated(100,0,cold);
    expect(evaluateBusinessProduction(cold,STARTER_BUSINESS.id,25)).toEqual(evaluateBusinessProduction(hot,STARTER_BUSINESS.id,25));
    for (const source of ['manualJob','dispatcherJob','businessLevel'] as const) expect(evaluateXpReward(cold,source,3)).toEqual(evaluateXpReward(hot,source,3));
    expect(getOfflineCapMs(cold)).toBe(getOfflineCapMs(hot)); expect(selectRebirth(cold)).toEqual(selectRebirth(hot));
    expect(collectHeatModifiers(cold.city)).toEqual([]);
  });
});

describe('offline and fresh/Rebirth contracts', () => {
  it.each([0,20,79,100])('offline matches the shared online batch from Heat %i with saved cooling progress', heat => {
    const s = heated(heat,heat ? 30000 : 0,stack(heat));
    const online = simulateGameElapsed(s,90000); const offline = reconcileOffline(s,1000,91000);
    expect(offline.ok).toBe(true); expect(offline.state).toEqual(online.state);
    expect(online.state.city.heatDecayElapsedMs).toBe(0);
    expect(online.state.city.heat).toBe(Math.max(0,Math.min(100,heat+1)-2));
  });
  it.each([0,1,2])('uses only the shared Never Sleeps cap at rank %i', rank => {
    const base = stack(90); const s = heated(90,30000,{ ...base, permanentProgression: { ...base.permanentProgression, skills: { [FAST]: 1, [LEARN]: 1, ...(rank ? { [NEVER]: rank } : {}) } } });
    const cap = (8+rank*2)*3600000;
    for (const duration of [cap-1,cap,cap+1234567]) {
      const r = reconcileOffline(s,1000,1000+duration);
      expect(r.ok && r.progress).toMatchObject({ rewardedElapsedMs: Math.min(cap,duration), actualElapsedMs: duration, capped: duration >= cap, capMs: cap });
      expect(r.state).toEqual(simulateGameElapsed(s,Math.min(cap,duration)).state);
      expect(r.state.permanentProgression).toEqual({...s.permanentProgression, unlockedAchievementIds: ['achievement:first-steps','achievement:dockside-operator','achievement:neon-takeover']});
    }
  });
  it('Rebirth clears territory/Heat/remainder and every temporary field, retaining permanent state', () => {
    const base = rebirthState(); const s = heated(90,42000,{ ...base, city: territoryState(true).city, permanentProgression: { ...base.permanentProgression, skills: { [FAST]: 1, [LEARN]: 1 } } });
    const r = performRebirth(s); expect(r.ok).toBe(true);
    expect(r.state.city).toEqual(createInitialGameState().city); expect(r.state.garage).toEqual(s.garage);
    expect(r.state.permanentProgression.skills).toEqual(s.permanentProgression.skills);
    expect(r.state.permanentProgression.empirePoints).toBe(s.permanentProgression.empirePoints+4);
    expect(r.state.permanentProgression.rebirthCount).toBe(s.permanentProgression.rebirthCount+1);
    expect(r.state.economy.cash).toBe('0'); expect(r.state.progression.xp).toBe(0); expect(r.state.businesses.owned).toEqual({});
    expect(r.state.businesses.productionRemainderMilliCents).toBe(0); expect(r.state.businesses.productionRemainderSubMilliCents).toEqual(rational(0n));
    expect(r.state.upgrades.purchasedIds).toEqual([]); expect(r.state.automation).toEqual({ unlockedIds: [], starterJobElapsedMs: 0 });
    expect(performStarterJob(r.state)).toMatchObject({ ok: true, moneyEarned: '2750', xpEarned: 11 });
  });
  it('fresh progression is playable and max Heat never blocks work or revokes territory', () => {
    let s = createInitialGameState(); expect(s.city.heat).toBe(0); expect(layLow(s).ok).toBe(false);
    for (let i=0;i<6;i++) s=performStarterJob(s).state;
    expect(s.economy.cash).toBe('15000'); expect(s.progression.xp).toBe(60);
    expect(purchaseBusiness(s,STARTER_BUSINESS.id).ok).toBe(true);
    const max = heated(100,0,territoryState(true)); expect(performStarterJob(max).ok).toBe(true);
    expect(simulateGameElapsed(max,50000)).toMatchObject({ ok: true, automation: { completedJobs: 5 } });
    expect(performStarterJob(max).state.city.ownedTerritoryIds).toEqual(max.city.ownedTerritoryIds);
  });
});
