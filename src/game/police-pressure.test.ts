import { describe, expect, it } from 'vitest';
import { getPolicePressure } from '../features/heat';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { performDiscreetDelivery, performRiskyDelivery, performStarterJob } from './perform-starter-job';
import { selectDiscreetDelivery } from './discreet-delivery';
import { evaluateJobReward, evaluateBusinessProduction } from './effective-stats';
import { serializeSave, parseSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { readyManualJobFixture } from './test-fixtures/manual-job-ready';

function heated(heat: number, remainder = 0): GameState {
  const s = createInitialGameState();
  return { ...s, city: { ...s.city, heat, heatDecayElapsedMs: remainder } };
}
describe('Police Pressure derived rules', () => {
  it.each([[0,5000,true], [39,5000,true], [40,2500,true], [59,2500,true], [60,2500,false], [80,2500,false], [100,2500,false]] as const)(
    'Heat %i gives bonus %i and risk access %s', (heat, bonus, available) => {
      expect(getPolicePressure(heat)).toMatchObject({ riskyBonusBasisPoints: bonus, riskyAvailable: available });
    });
  it('uses the pre-action surveillance tier on both sides of the threshold', () => {
    const first = performRiskyDelivery(heated(39));
    expect(first).toMatchObject({ ok: true, moneyEarned: '3750' });
    expect(first.state.city.heat).toBe(44);
    expect(performRiskyDelivery(first.state)).toMatchObject({ ok: false, error: 'manual-job-not-ready' });
    expect(performRiskyDelivery(readyManualJobFixture(first.state))).toMatchObject({ ok: true, moneyEarned: '3125' });
  });
  it.each([-1, 101, NaN, 1.1])('rejects malformed pressure %s', heat => {
    expect(() => getPolicePressure(heat)).toThrow(RangeError);
  });
});
describe('Discreet delivery counterplay', () => {
  it.each([[1,'1250',0],[2,'1250',0],[39,'1250',37],[40,'1250',38],[59,'1250',57],[60,'1125',58],[79,'1125',77],[80,'937',78],[100,'937',98]] as const)(
    'Heat %i pays %s before reducing to %i', (heat, reward, next) => {
      const s = heated(heat, 23456), before = JSON.stringify(s);
      const result = performDiscreetDelivery(s);
      expect(result).toMatchObject({ ok: true, moneyEarned: reward, xpEarned: 0 });
      expect(result.state.city).toMatchObject({ heat: next, heatDecayElapsedMs: next ? 23456 : 0 });
      expect(result.state.progression).toBe(s.progression);
      expect(result.state.permanentProgression.statistics.manualJobsCompleted).toBe(1);
      expect(JSON.stringify(s)).toBe(before);
      const preview = selectDiscreetDelivery(s);
      expect(preview.reward.ok && preview.reward.reward).toBe(reward);
      expect(preview.resultingHeat).toBe(next);
    });
  it('stops at zero, never grants a free cold payout or banks cooling', () => {
    const s = heated(0);
    expect(performDiscreetDelivery(s)).toEqual({ ok: false, error: 'already-cold', state: s });
    expect(performDiscreetDelivery(s).state).toBe(s);
    expect(selectDiscreetDelivery(s).canRun).toBe(false);
  });
  it('preserves peak Heat and all unrelated systems while reopening risky work', () => {
    const s = heated(60);
    const state = { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...s.permanentProgression.statistics, peakHeat: 90 } } };
    const after = performDiscreetDelivery(state).state;
    expect(after.permanentProgression.statistics.peakHeat).toBe(90);
    expect(after.garage).toBe(state.garage); expect(after.automation).toBe(state.automation);
    expect(evaluateBusinessProduction(after, 'business:dockside-detail', 1)).toEqual(evaluateBusinessProduction(state, 'business:dockside-detail', 1));
    expect(performRiskyDelivery(after)).toMatchObject({ ok: false, error: 'manual-job-not-ready' });
    expect(performRiskyDelivery(readyManualJobFixture(after)).ok).toBe(true);
    expect(evaluateJobReward(after, 'dispatcher')).toMatchObject({ ok: true, reward: '2500' });
  });
  it('retains exact manual Senda and upgrade effects with one floor at payout', () => {
    const s = heated(80);
    const state: GameState = { ...s, garage: { ownedVehicleIds: ['vehicle:kairo-senda'], activeVehicleId: 'vehicle:kairo-senda' },
      upgrades: { purchasedIds: ['upgrade:express-tips', 'upgrade:street-connections'] } };
    // ($25 + $5) × 1.2 × 1.12 × .75 × .5 = $15.12
    expect(performDiscreetDelivery(state)).toMatchObject({ ok: true, moneyEarned: '1512', xpEarned: 0 });
    expect(evaluateJobReward(state, 'dispatcher')).toMatchObject({ ok: true, reward: '2700' });
  });
  it.each(['cash','statistics'] as const)('%s overflow rolls back cash, Heat and counters together', kind => {
    const s = heated(80);
    const state = kind === 'cash' ? { ...s, economy: { cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) } }
      : { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...s.permanentProgression.statistics, manualJobsCompleted: Number.MAX_SAFE_INTEGER } } };
    expect(performDiscreetDelivery(state).ok).toBe(false);
    expect(performDiscreetDelivery(state).state).toBe(state);
  });
  it('does not award or overflow XP at the XP ceiling', () => {
    const s = heated(20), state = { ...s, progression: { xp: Number.MAX_SAFE_INTEGER } };
    expect(performDiscreetDelivery(state)).toMatchObject({ ok: true, xpEarned: 0 });
    expect(performDiscreetDelivery(state).state.progression).toBe(state.progression);
    expect(performStarterJob(state).ok).toBe(false);
  });
  it('round-trips cooling and counters through current saves and CE1', () => {
    const state = performDiscreetDelivery(heated(80, 23456)).state;
    const saved = serializeSave(state, 1000), code = exportSaveCode(state, 1000);
    if (!saved.ok || !code.ok) throw Error('fixture');
    const parsed = parseSave(saved.serialized), imported = validateSaveCode(code.code);
    expect(parsed.ok && parsed.envelope.state).toEqual(state);
    expect(imported.ok && imported.envelope.state).toEqual(state);
  });
});
