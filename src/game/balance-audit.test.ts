import { describe, expect, it } from 'vitest';
import { runBalanceModel, docksideBill, productionDollars, successful } from './test-fixtures/balance-model';
import { selectRebirth, performRebirth } from './rebirth';
import { purchaseSkillRank } from './purchase-skill-rank';
import type { GameState } from './game-state';
import { createInitialGameState } from './game-state';
import { STARTER_BUSINESS as B, getUpgradeCost } from '../features/businesses';
import { UPGRADE_CATALOG, PRESSURE_WASHER, DETAILING_LINE, FLEET_LOGISTICS } from '../features/upgrades';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { RICO_VALE, JAX_MERCER } from '../features/crew';
import { evaluateJobReward } from './effective-stats';
import { getXpThresholdForLevel } from '../features/progression';
import { moneyFromMinorUnits } from '../features/economy';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D, AUTOMATIONS } from '../features/automation';
import { NEON_MILE, TERRITORY_CATALOG } from '../features/territories';
import { CREW_CATALOG } from '../features/crew';
import { EVENT_CATALOG } from '../features/events';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { createInitialStatistics } from '../features/statistics';
import { VEHICLE_CATALOG } from '../features/vehicles';
import { SKILL_CATALOG } from '../features/skills';
import { rebirthState } from './test-fixtures/rebirth-state';
import { performStarterJob } from './perform-starter-job';
import { purchaseBusiness } from './purchase-business';
import { purchaseAutomation } from './purchase-automation';
import { acquireTerritory } from './acquire-territory';
import { setAutomationEnabled } from './set-automation-enabled';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline } from './offline-progress';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';

describe('Phase 9C deterministic progression routes', () => {
  it.each(['active', 'idle-leaning', 'optimized'] as const)('%s can reach every current acquisition gate', model => {
    const run = runBalanceModel(model);
    expect(selectRebirth(run.firstRebirth).eligible).toBe(true);
    for (const checkpoint of ['Player 2', 'Dockside 1', 'Dockside 5', 'Delivery Dispatcher', 'Vortex S9',
      'Dockside 10', 'Neon Mile', 'Rico Vale', 'Mara Knox', 'Jax Mercer', 'Dockside 25', 'Player 20', 'Business Auto-Upgrader']) {
      expect(run.checkpoints[checkpoint], checkpoint).toBeDefined();
    }
    console.info(JSON.stringify({ model, checkpoints: run.checkpoints, firstReward: selectRebirth(run.firstRebirth).reward }));
    if (model === 'optimized') {
      let next = successful(performRebirth(run.firstRebirth));
      for (const id of ['skill:streetwise-investment', 'skill:fast-talker', 'skill:learn-the-streets']) next = successful(purchaseSkillRank(next, id));
      const second = runBalanceModel(model, next);
      expect(second.checkpoints['Rebirth eligible']?.seconds).toBeLessThan(run.checkpoints['Rebirth eligible']?.seconds ?? 0);
      console.info(JSON.stringify({ model: 'optimized-second', rebirth: second.checkpoints['Rebirth eligible'], reward: selectRebirth(second.firstRebirth).reward }));
    }
  }, 120000);
  it('derives the current Dockside capital curve', () => {
    console.info(JSON.stringify([5,10,15,25,50,100].map(level => ({ level, bill: docksideBill(level).toString() }))));
    expect(docksideBill(1)).toBe(15000n);
  });
  it('derives marginal production paybacks and job/business comparisons from evaluated rates', () => {
    const s = createInitialGameState();
    const rows = [5, 10, 15, 25, 50, 100].map(level => {
      const base = { ...s, businesses: { ...s.businesses, owned: { [B.id]: { level } } } };
      const equipped = { ...base, upgrades: { purchasedIds: [PRESSURE_WASHER.id, DETAILING_LINE.id, FLEET_LOGISTICS.id] } };
      const price = getUpgradeCost(B, level);
      const marginal = productionDollars(equipped) / level;
      const washed = { ...base, upgrades: { purchasedIds: [PRESSURE_WASHER.id] } };
      const lined = { ...base, upgrades: { purchasedIds: [PRESSURE_WASHER.id, DETAILING_LINE.id] } };
      return { level, basePerSecond: productionDollars(base), equipmentPerSecond: productionDollars(equipped),
        nextCost: price === null ? null : Number(price) / 100,
        nextLevelPaybackHours: price === null ? null : Number(price) / 100 / marginal / 3600,
        washerMinutes: Number(PRESSURE_WASHER.purchaseCost) / 100 / (productionDollars(washed) - productionDollars(base)) / 60,
        lineAfterWasherMinutes: Number(DETAILING_LINE.purchaseCost) / 100 / (productionDollars(lined) - productionDollars(washed)) / 60,
        fleetAfterLineMinutes: Number(FLEET_LOGISTICS.purchaseCost) / 100 / (productionDollars(equipped) - productionDollars(lined)) / 60,
        vortexMinutes: Number(V.purchaseCost) / 100 / (productionDollars({ ...equipped, garage: { ownedVehicleIds: [V.id] } }) - productionDollars(equipped)) / 60,
        jaxMinutes: Number(JAX_MERCER.recruitmentCost) / 100 / (productionDollars({ ...equipped, crew: { recruitedIds: [JAX_MERCER.id], assignments: { operations: null, logistics: JAX_MERCER.id } } }) - productionDollars(equipped)) / 60 };
    });
    expect(rows[0]?.basePerSecond).toBe(.75 * 5);
    console.info(JSON.stringify({ production: rows }));
    for (const heat of [0, 60, 100]) {
      const equipped = { ...s, upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) }, city: { ...s.city, heat } };
      const reward = evaluateJobReward(equipped);
      const rico = evaluateJobReward({ ...equipped, crew: { recruitedIds: [RICO_VALE.id], assignments: { operations: RICO_VALE.id, logistics: null } } });
      if (!reward.ok || !rico.ok) throw Error('reward');
      console.info(JSON.stringify({ heat, jobDollars: Number(reward.reward) / 100,
        ricoPaybackHoursAtFiveSecondJobsAndDispatcher: Number(RICO_VALE.recruitmentCost) / Number(BigInt(rico.reward) - BigInt(reward.reward)) / .3 / 3600 }));
    }
  });

  it('opens passive production after six deliveries and reaches Level 2 after ten', () => {
    let s = createInitialGameState();
    for (let i = 0; i < 6; i++) s = successful(performStarterJob(s));
    expect(s.economy.cash).toBe(B.purchaseCost);
    s = successful(purchaseBusiness(s, B.id));
    expect(s.economy.cash).toBe('0');
    for (let i = 0; i < 4; i++) s = successful(performStarterJob(s));
    expect(s.progression.xp).toBe(getXpThresholdForLevel(2));
    expect(successful(simulateGameElapsed(s, 1000)).economy.cash).toBe('10075');
  });
  it.each([
    ['skill:streetwise-investment', 'skill:fast-talker', 'skill:learn-the-streets'],
    ['skill:streetwise-investment', 'skill:streetwise-investment', 'skill:never-sleeps'],
    ['skill:streetwise-investment', 'skill:streetwise-investment', 'skill:fast-talker', 'skill:fast-talker'],
  ])('first eligible Rebirth funds a complete alternative four-EP path: %j', (...path) => {
    const base = rebirthState(20, 25);
    expect(selectRebirth(base).reward).toBe(4);
    let s = successful(performRebirth(base));
    for (const id of path) s = successful(purchaseSkillRank(s, id));
    expect(s.permanentProgression.empirePoints).toBe(0);
    expect(s.permanentProgression.rebirthCount).toBe(1);
  });
  it('permanent vehicle and Streetwise make an equivalent rebuilt business more productive', () => {
    const s = createInitialGameState();
    const business = { ...s, businesses: { ...s.businesses, owned: { [B.id]: { level: 1 } } } };
    const retained = { ...business, garage: { ownedVehicleIds: [V.id] },
      permanentProgression: { ...s.permanentProgression, skills: { 'skill:streetwise-investment': 1 } } };
    expect(productionDollars(retained)).toBeCloseTo(.905625, 8);
    expect(productionDollars(retained)).toBeGreaterThan(productionDollars(business));
  });
  it('Neon and opt-in spending can be acquired before Rebirth, then fund levels offline', () => {
    const base = createInitialGameState();
    let s: GameState = { ...base, economy: { cash: moneyFromMinorUnits('10000000') }, progression: { xp: getXpThresholdForLevel(12) },
      businesses: { ...base.businesses, owned: { [B.id]: { level: 15 } } } };
    s = successful(acquireTerritory(s, NEON_MILE.id));
    s = successful(purchaseAutomation(s, A.id));
    expect(s.economy.cash).toBe('0');
    expect(s.automation.enabledIds).toEqual([]);
    expect(selectRebirth(s).eligible).toBe(false);
    const paused = reconcileOffline(s, 0, 8 * 3600000);
    const enabled = successful(setAutomationEnabled(s, A.id, true));
    const active = reconcileOffline(enabled, 0, 8 * 3600000);
    expect(paused.ok).toBe(true); expect(active.ok).toBe(true);
    if (!active.ok) throw Error(active.error);
    expect(active.progress.autoUpgrader).toEqual({ levelsPurchased: 7, spent: '34440000' });
    expect(active.state.businesses.owned[B.id]?.level).toBe(22);
    expect(active.state.permanentProgression.statistics.businessLevelsPurchased).toBe(active.progress.autoUpgrader?.levelsPurchased);
    expect(active.state.progression.xp - s.progression.xp).toBe((active.progress.autoUpgrader?.levelsPurchased ?? 0) * 25);
    console.info(JSON.stringify({ preRebirthOffline: active.progress.autoUpgrader, finalLevel: active.state.businesses.owned[B.id]?.level }));
  });
  it('retains the exact catalogs without extra content or observational fields', () => {
    expect([TERRITORY_CATALOG.length, CREW_CATALOG.length, EVENT_CATALOG.length, ACHIEVEMENT_CATALOG.length,
      Object.keys(createInitialStatistics()).length, VEHICLE_CATALOG.length, UPGRADE_CATALOG.length, SKILL_CATALOG.length])
      .toEqual([2,3,3,6,8,1,5,5]);
    expect(AUTOMATIONS.map(a => a.id)).toEqual([D.id, A.id]);
  });
  it('roundtrips a rich existing v15 save and CE1 code without balance compensation or field changes', () => {
    const s = rebirthState(37, 48);
    const rich = { ...s, automation: { ...s.automation, unlockedIds: [D.id, A.id], enabledIds: [A.id], businessAutoUpgradeElapsedMs: 23456 },
      city: { ...s.city, ownedTerritoryIds: [...s.city.ownedTerritoryIds, NEON_MILE.id], heat: 72, heatDecayElapsedMs: 42000 },
      crew: { recruitedIds: CREW_CATALOG.map(c => c.id), assignments: { operations: RICO_VALE.id, logistics: JAX_MERCER.id } },
      events: { pendingEventId: 'event:shakedown' as const, opportunityElapsedMs: 123456 },
      permanentProgression: { ...s.permanentProgression, empirePoints: 8, rebirthCount: 2, skills: { 'skill:streetwise-investment': 3 },
        unlockedAchievementIds: ACHIEVEMENT_CATALOG.map(a => a.id), statistics: { manualJobsCompleted: 200, automatedJobsCompleted: 500,
          businessLevelsPurchased: 47, territoriesAcquired: 3, crewMembersRecruited: 9, eventsResolved: 12, rebirthsCompleted: 2, peakHeat: 99 } } };
    const savedAt = 1700000000000, before = structuredClone(rich);
    expect(CURRENT_SAVE_VERSION).toBe(15);
    const serialized = serializeSave(rich, savedAt);
    if (!serialized.ok) throw Error('serialization');
    expect(parseSave(serialized.serialized)).toEqual({ ok: true, envelope: { format: 'crime-empire-save', version: 15, savedAt, state: rich } });
    const exported = exportSaveCode(rich, savedAt);
    if (!exported.ok) throw Error('export');
    expect(exported.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(exported.code)).toEqual(parseSave(serialized.serialized));
    expect(rich).toEqual(before);
  });
});
