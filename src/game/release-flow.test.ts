import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { performStarterJob } from './perform-starter-job';
import { purchaseBusiness } from './purchase-business';
import { purchaseSkillRank } from './purchase-skill-rank';
import { performRebirth, selectRebirth } from './rebirth';
import { simulateOnlineElapsed } from './simulate-online-elapsed';
import { resolveEventChoice } from './resolve-event-choice';
import { setAutomationEnabled } from './set-automation-enabled';
import { validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { runBalanceModel, successful, productionDollars } from './test-fixtures/balance-model';
import { rebirthState } from './test-fixtures/rebirth-state';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';

describe('Phase 9E Base Game release flow', () => {
  it('fresh state has no inferred history and exports a valid v15 CE1 backup', () => {
    const state = createInitialGameState();
    expect(state.economy.cash).toBe('0');
    expect(state.city).toEqual({ ownedTerritoryIds: ['territory:waterfront'], heat: 0, heatDecayElapsedMs: 0 });
    expect(state.crew).toEqual({ recruitedIds: [], assignments: { operations: null, logistics: null } });
    expect(state.events).toEqual({ pendingEventId: null, opportunityElapsedMs: 0 });
    expect(state.automation).toEqual({ unlockedIds: [], enabledIds: [], starterJobElapsedMs: 0, businessAutoUpgradeElapsedMs: 0 });
    expect(state.permanentProgression).toEqual({ empirePoints: 0, rebirthCount: 0, skills: {}, unlockedAchievementIds: [],
      statistics: { manualJobsCompleted: 0, automatedJobsCompleted: 0, businessLevelsPurchased: 0,
        territoriesAcquired: 0, crewMembersRecruited: 0, eventsResolved: 0, rebirthsCompleted: 0, peakHeat: 0 } });
    expect(state.garage.ownedVehicleIds).toEqual([]);
    expect(validateSaveState(state)).toEqual(state);
    const code = exportSaveCode(state, 123);
    if (!code.ok) throw Error(code.error);
    expect(validateSaveCode(code.code)).toEqual({ ok: true, envelope: { format: 'crime-empire-save', version: 15, savedAt: 123, state } });
  });

  it('legal earnings and acquisitions reach all milestones, then reset and rebuild with permanent benefits', () => {
    // No gifted cash, XP, ownership or completed milestones. Sixty legal jobs
    // also exercise Running Hot before the existing deterministic idle route.
    let state = createInitialGameState();
    for (let job = 0; job < 60; job++) state = successful(performStarterJob(state));
    const route = runBalanceModel('idle-leaning', state);
    for (const name of ['Player 2', 'Dockside 1', 'Dockside 5', 'Dockside 10', 'Delivery Dispatcher',
      'Vortex S9', 'Neon Mile', 'Rico Vale', 'Mara Knox', 'Jax Mercer', 'Business Auto-Upgrader', 'Rebirth eligible'])
      expect(route.checkpoints[name], name).toBeDefined();
    state = route.state;
    expect(state.automation.unlockedIds).toEqual(expect.arrayContaining([D.id, A.id]));
    expect(state.automation.enabledIds).toEqual([]);
    state = successful(setAutomationEnabled(state, A.id, true));
    // A due online opportunity spawns through injected RNG, not a forged pending ID.
    state = successful(simulateOnlineElapsed(state, 600000, { next: () => 0 }));
    expect(state.events.pendingEventId).toBe('event:hot-tip');
    state = successful(resolveEventChoice(state, 'event:hot-tip', 'choice:play-safe'));
    state = successful(simulateOnlineElapsed(state, 600001, { next: () => 0 }));
    expect(state.events.pendingEventId).not.toBeNull();
    expect(state.automation.businessAutoUpgradeElapsedMs).toBeGreaterThan(0);
    const before = structuredClone(state), reward = selectRebirth(state).reward;
    let reset = successful(performRebirth(state));
    expect(state).toEqual(before);
    const fresh = createInitialGameState();
    for (const key of ['economy', 'businesses', 'upgrades', 'automation', 'progression', 'city', 'crew', 'events'] as const)
      expect(reset[key], key).toEqual(fresh[key]);
    expect(reset.garage).toEqual(state.garage);
    expect(reset.garage.ownedVehicleIds).toContain(V.id);
    expect(reset.permanentProgression.empirePoints).toBe(reward);
    expect(reset.permanentProgression.rebirthCount).toBe(1);
    expect(reset.permanentProgression.statistics).toEqual({ ...state.permanentProgression.statistics, rebirthsCompleted: 1 });
    expect(reset.permanentProgression.unlockedAchievementIds).toEqual(ACHIEVEMENT_CATALOG.map(a => a.id));
    expect(validateSaveState(reset)).toEqual(reset);
    reset = successful(purchaseSkillRank(reset, 'skill:streetwise-investment'));
    for (let job = 0; job < 6; job++) reset = successful(performStarterJob(reset));
    reset = successful(purchaseBusiness(reset, B.id));
    expect(productionDollars(reset)).toBeCloseTo(0.905625, 8);
    expect(reset.permanentProgression.statistics.manualJobsCompleted).toBe(state.permanentProgression.statistics.manualJobsCompleted + 6);
    // A subsequent legal run retains the purchased skill and unspent EP too.
    const second = runBalanceModel('idle-leaning', reset).state;
    const again = successful(performRebirth(second));
    expect(again.permanentProgression.skills).toEqual(reset.permanentProgression.skills);
    expect(again.permanentProgression.empirePoints).toBe(reset.permanentProgression.empirePoints + (selectRebirth(second).reward ?? 0));
    expect(again.permanentProgression.rebirthCount).toBe(2);
    expect(again.permanentProgression.statistics.rebirthsCompleted).toBe(2);
    expect(again.garage).toEqual(reset.garage);
    expect(validateSaveState(again)).toEqual(again);
  });

  it('exact first eligibility at Player 20 / Dockside 25 awards four EP', () => {
    const state = rebirthState(20, 25);
    const result = performRebirth(state);
    expect(result).toMatchObject({ ok: true, reward: 4, state: { permanentProgression: { empirePoints: 4, rebirthCount: 1 } } });
  });
});
