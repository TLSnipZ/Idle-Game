import type { GameState } from './game-state';
import { describe, expect, it } from 'vitest';
import { skillState, ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { evaluateBusinessProduction, evaluateJobReward } from './effective-stats';
import { evaluateXpReward } from './xp-reward';
import { performStarterJob } from './perform-starter-job';
import { upgradeBusiness } from './upgrade-business';
import { simulateAutomation } from './simulate-automation';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { simulateElapsed } from './simulate-elapsed';
import { reconcileOffline } from './offline-progress';
import { getOfflineCapMs } from './offline-cap';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { purchaseBusiness } from './purchase-business';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { EXPRESS_TIPS as E, STREET_CONNECTIONS as S, UPGRADE_CATALOG } from '../features/upgrades';
import { rational } from '../shared/rational';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { evaluateStat } from './modifiers';

describe('permanent stat sources', () => {
  it.each([[0, 75, 1], [1, 315, 4], [2, 165, 2], [3, 345, 4]])('Streetwise rank %i has exact production', (rank, n, d) => {
    const state = skillState(rank ? { [ROOT]: rank } : {});
    expect(evaluateBusinessProduction(state, B.id, 1)).toMatchObject({ ok: true, effective: rational(BigInt(n), BigInt(d)) });
  });
  it.each([[1, 165, 2], [2, 90, 1]])('Silent Partner rank %i is active even without its acquisition prerequisite', (rank, n, d) => {
    expect(evaluateBusinessProduction(skillState({ [SILENT]: rank }), B.id, 1)).toMatchObject({ ok: true, effective: rational(BigInt(n), BigInt(d)) });
  });
  it('stacks permanent/vehicle/temporary sources exactly, with stable IDs and scoped filtering', () => {
    const state = { ...skillState({ [ROOT]: 2, [SILENT]: 1, [FAST]: 1, [LEARN]: 1 }), garage: { ownedVehicleIds: [V.id] } };
    const base = evaluateBusinessProduction(state, B.id, 1); expect(base).toMatchObject({ ok: true, effective: rational(8349n, 80n) });
    if (!base.ok) throw Error('fixture');
    expect(base.applied.map(m => m.sourceId).sort()).toEqual([ROOT, SILENT, V.id].sort());
    expect(base.applied.map(m => m.id)).toEqual(base.applied.map(m => m.id).sort());
    const all = { ...state, upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) } };
    // 104.3625 cents/s × 1.25 × 1.5 × 1.1
    expect(evaluateBusinessProduction(all, B.id, 1)).toMatchObject({ ok: true, effective: rational(275517n, 1280n) });
    expect(evaluateBusinessProduction({ ...all, upgrades: { purchasedIds: [...all.upgrades.purchasedIds].reverse() } }, B.id, 1)).toEqual(evaluateBusinessProduction(all, B.id, 1));
  });
  it('preserves both production fractions through arbitrary split durations with skills', () => {
    const original = skillState({ [ROOT]: 2, [SILENT]: 1 });
    const state = { ...original, garage: { ownedVehicleIds: [V.id] }, businesses: { ...original.businesses,
      productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n, 3n) } };
    const before = JSON.stringify(state); let split: GameState = state;
    for (const duration of [1, 13, 273, 901, 12345]) split = simulateElapsed(split, duration).state;
    expect(split).toEqual(simulateElapsed(state, 13533).state); expect(JSON.stringify(state)).toBe(before);
    expect(split.businesses.productionRemainderSubMilliCents).not.toEqual(rational(0n));
  });
  it.each([[0, '2500'], [1, '2750'], [2, '3000']])('Fast Talker rank %i shares manual and dispatcher reward', (rank, cash) => {
    const state = skillState(rank ? { [FAST]: Number(rank) } : {});
    expect(evaluateJobReward(state)).toMatchObject({ ok: true, reward: cash });
    const manual = performStarterJob(state), auto = simulateAutomation(state, 10000);
    expect(BigInt(manual.state.economy.cash) - BigInt(state.economy.cash)).toBe(BigInt(cash));
    expect(auto.state.economy.cash).toBe(manual.state.economy.cash);
    expect(manual.state.progression.xp).toBe(10); expect(auto.state.progression.xp).toBe(5);
  });
  it('flat-before-percent job stacking gives exactly $39.60', () => {
    const state = { ...skillState({ [FAST]: 1 }), upgrades: { purchasedIds: [E.id, S.id] } };
    expect(evaluateJobReward(state)).toMatchObject({ ok: true, reward: '3960' });
    expect(simulateAutomation(state, 30000)).toMatchObject({ ok: true, automation: { income: '11880', xpEarned: 15 } });
  });
});
describe('XP final award and batch flooring', () => {
  it.each([[0, 10, 25, 15], [1, 11, 27, 16], [2, 12, 30, 18]])('Learn rank %i modifies all XP sources', (rank, manual, level, batch) => {
    const state = skillState(rank ? { [LEARN]: rank } : {});
    expect(evaluateXpReward(state, 'manualJob')).toMatchObject({ ok: true, reward: manual });
    expect(performStarterJob(state).state.progression.xp).toBe(manual);
    expect(upgradeBusiness(state, B.id).state.progression.xp).toBe(level);
    expect(simulateAutomation(state, 30000)).toMatchObject({ ok: true, automation: { completedJobs: 3, xpEarned: batch } });
    expect(simulateAutomation(state, 9999).state.progression.xp).toBe(0);
    expect(performStarterJob(state).state.economy.cash).toBe(performStarterJob(skillState()).state.economy.cash);
  });
  it('floors once per dispatcher batch, deliberately not per cycle or across separate batches', () => {
    const state = skillState({ [LEARN]: 1 });
    const combined = simulateGameElapsed(state, 30000).state;
    let split: GameState = state; for (let i = 0; i < 3; i++) split = simulateGameElapsed(split, 10000).state;
    expect(combined.progression.xp).toBe(16); expect(split.progression.xp).toBe(15);
    expect(combined.economy).toEqual(split.economy); expect(combined.businesses).toEqual(split.businesses);
    expect(combined.automation).toEqual(split.automation);
    expect(Object.keys(combined.progression)).toEqual(['xp']);
    expect(evaluateXpReward(skillState({ [LEARN]: 2 }), 'dispatcherJob', 1234)).toMatchObject({ ok: true, reward: 7404 });
  });
  it('uses a neutral integer base for exact XP evaluation, never Money', () => {
    const result = evaluateStat(25n, { stat: 'xp-reward' }, [{ id: 'test:xp', sourceId: LEARN,
      target: { stat: 'xp-reward' }, operation: 'multiply-basis-points', bonusBasisPoints: 1000 }]);
    expect(result).toMatchObject({ ok: true, base: 25n, effective: rational(55n, 2n) });
  });
  it('XP or Money overflow preserves complete command/simulation state atomically', () => {
    const base = skillState({ [LEARN]: 1 });
    const state = { ...base, progression: { xp: Number.MAX_SAFE_INTEGER - 10 } };
    for (const result of [performStarterJob(state), upgradeBusiness(state, B.id), simulateGameElapsed(state, 30000)]) {
      expect(result).toMatchObject({ ok: false, error: 'xp-overflow' }); expect(result.state).toBe(state);
    }
    expect(evaluateXpReward(base, 'dispatcherJob', Number.MAX_SAFE_INTEGER)).toEqual({ ok: false, error: 'xp-overflow' });
    const full = { ...base, economy: { cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) } };
    expect(performStarterJob(full)).toMatchObject({ ok: false, error: 'overflow', state: full });
    expect(performStarterJob(full).state).toBe(full);
  });
});
describe('permanent offline and Rebirth effects', () => {
  it.each([0, 1, 2])('Never Sleeps rank %i caps all subsystems together and preserves actual absence', rank => {
    const state = skillState({ [ROOT]: 2, [SILENT]: 1, [FAST]: 1, [LEARN]: 1, ...(rank ? { [NEVER]: rank } : {}) });
    const cap = (8 + 2 * rank) * 3600000; expect(getOfflineCapMs(state)).toBe(cap);
    for (const elapsed of [cap - 1, cap, cap + 4 * 3600000 + 9999]) {
      const result = reconcileOffline(state, 1000, 1000 + elapsed); if (!result.ok) throw Error('fixture');
      expect(result.progress).toMatchObject({ capMs: cap, actualElapsedMs: elapsed,
        rewardedElapsedMs: Math.min(cap, elapsed), capped: elapsed >= cap });
      expect(result.state).toEqual(simulateGameElapsed(state, Math.min(cap, elapsed)).state);
      expect(result.state.permanentProgression).toEqual({...state.permanentProgression, unlockedAchievementIds: ['achievement:first-steps','achievement:first-rebirth']});
    }
  });
  it('all skill effects survive Rebirth, no refunds, and no temporary bonuses remain', () => {
    const before = { ...rebirthState(), permanentProgression: skillState({ [ROOT]: 2, [SILENT]: 1, [FAST]: 1, [LEARN]: 1, [NEVER]: 2 }, 3).permanentProgression };
    const result = performRebirth(before); expect(result.ok).toBe(true); const reset = result.state;
    expect(reset.permanentProgression).toEqual({ ...before.permanentProgression, empirePoints: 7, rebirthCount: 2, unlockedAchievementIds: ['achievement:first-steps', 'achievement:dockside-operator', 'achievement:first-rebirth'] });
    expect(getOfflineCapMs(reset)).toBe(12 * 3600000);
    const job = performStarterJob(reset); expect(job.state.economy.cash).toBe('2750'); expect(job.state.progression.xp).toBe(11);
    let state = reset; for (let i = 0; i < 6; i++) state = performStarterJob(state).state;
    state = purchaseBusiness(state, B.id).state; expect(state.upgrades.purchasedIds).toEqual([]);
    expect(evaluateBusinessProduction(state, B.id, 1)).toMatchObject({ ok: true, effective: rational(8349n, 80n) });
    const online = simulateGameElapsed(state, 80000).state;
    expect(BigInt(online.economy.cash) - BigInt(state.economy.cash)).toBe(8349n);
    expect(reconcileOffline(state, 0, 80000)).toMatchObject({ ok: true, state: online });
  });
});
