import { describe, expect, it, vi } from 'vitest';

// Test-only catalog injection: no production entry, evaluator, command or schema is edited.
// Mocking the config seam also reaches ownership/production's internal lookup.
// This is an economy experiment, NOT a v16 save-compatibility test.
vi.mock('../features/businesses/config/business-config', async importOriginal => {
  const live = await importOriginal<typeof import('../features/businesses/config/business-config')>();
  const { BUSINESS_PROPOSALS } = await import('./test-fixtures/business-expansion-proposals');
  return { ...live, findBusiness: (id: unknown) => live.findBusiness(id) ?? BUSINESS_PROPOSALS.find(b => b.id === id) };
});

import { BUSINESS_PROPOSALS } from './test-fixtures/business-expansion-proposals';
import { runExpansionModel, productionDollars, successful } from './test-fixtures/business-expansion-model';
import { runBalanceModel } from './test-fixtures/balance-model';
import { createInitialGameState } from './game-state';
import { performRebirth, selectRebirth } from './rebirth';
import { purchaseSkillRank } from './purchase-skill-rank';
import { STARTER_BUSINESS as B, MAX_BUSINESS_LEVEL, getLevelProduction, getUpgradeCost } from '../features/businesses';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { JAX_MERCER } from '../features/crew';
import { FLEET_LOGISTICS, PRESSURE_WASHER, DETAILING_LINE } from '../features/upgrades';
import { evaluateBusinessProduction } from './effective-stats';
import { evaluateXpReward } from './xp-reward';
import { moneyFromMinorUnits } from '../features/economy';
import { purchaseBusiness } from './purchase-business';
import { upgradeBusiness } from './upgrade-business';
import { simulateElapsed } from './simulate-elapsed';
import { reconcileOffline } from './offline-progress';
import { getXpThresholdForLevel } from '../features/progression';
import { NEON_MILE } from '../features/territories';

describe('POST 3A isolated proposed-economy evidence', () => {
  it.each(['active', 'idle-leaning', 'optimized'] as const)('%s control and expansion with real domain transitions', model => {
    const control = runExpansionModel(model, { expanded: false });
    const oldPolicy = runBalanceModel(model);
    expect(oldPolicy.checkpoints['Rebirth eligible']).toBeDefined();
    expect(control.checkpoints['Rebirth eligible']).toMatchObject(oldPolicy.checkpoints['Rebirth eligible']!);
    const proposed = runExpansionModel(model, { expanded: true });
    for (const b of BUSINESS_PROPOSALS) expect(proposed.checkpoints[b.name]).toBeDefined();
    for (const run of [control, proposed]) {
      expect(selectRebirth(run.firstRebirth).eligible).toBe(true);
      console.info(JSON.stringify({ route: model, expanded: run === proposed, checkpoints: run.checkpoints,
        reward: selectRebirth(run.firstRebirth).reward }));
    }
    // Stops at first eligibility, then actually resets and buys a coherent four-EP path.
    if (model === 'optimized') {
      const first = runExpansionModel(model, { expanded: true, stopAtRebirth: true });
      let next = successful(performRebirth(first.firstRebirth));
      expect(next.businesses.owned).toEqual({});
      for (const id of ['skill:streetwise-investment', 'skill:fast-talker', 'skill:learn-the-streets'])
        next = successful(purchaseSkillRank(next, id));
      const second = runExpansionModel(model, { expanded: true, stopAtRebirth: true }, next);
      expect(second.checkpoints['Rebirth eligible']?.seconds).toBeLessThan(first.checkpoints['Rebirth eligible']?.seconds ?? 0);
      console.info(JSON.stringify({ route: 'second-run', checkpoints: second.checkpoints }));
      const skip = runExpansionModel(model, { expanded: true, skipVehicle: true, stopAtRebirth: true });
      expect(skip.firstRebirth.garage.ownedVehicleIds).toEqual([]);
      console.info(JSON.stringify({ route: 'optimized-no-kxr', checkpoints: skip.checkpoints }));
    }
  }, 120000);

  it('models actual Dockside-target offline automation separately', () => {
    const run = runExpansionModel('idle-leaning', { expanded: true, enableDocksideAuto: true });
    expect(selectRebirth(run.firstRebirth).eligible).toBe(true);
    console.info(JSON.stringify({ route: 'idle-dockside-auto-enabled', checkpoints: run.checkpoints }));
  }, 120000);

  it('stresses lean investment and optional acquisitions instead of assuming greedy is optimal', () => {
    for (const options of [
      { newLevelCap: 1 }, { newLevelCap: 3 }, { newLevelCap: 10 },
      { newLevelCap: 5, omitAfterdark: true }, { newLevelCap: 5, rushNights: true },
      { newLevelCap: 5, skipVehicle: true },
    ]) {
      const run = runExpansionModel('optimized', { expanded: true, stopAtRebirth: true, ...options });
      expect(selectRebirth(run.firstRebirth).eligible).toBe(true);
      // All extra XP must come from the existing award sources, never acquisitions.
      expect(run.firstRebirth.progression.xp).toBeGreaterThanOrEqual(getXpThresholdForLevel(20));
      console.info(JSON.stringify({ route: 'lean-stress', options, checkpoints: run.checkpoints }));
    }
  }, 120000);

  it('reports real formula samples, investment and XP efficiency without cost-proportional XP', () => {
    const fresh = createInitialGameState();
    const xp = evaluateXpReward(fresh, 'businessLevel');
    if (!xp.ok) throw Error(xp.error);
    const rows = [B, ...BUSINESS_PROPOSALS].map(b => {
      let total = BigInt(b.purchaseCost);
      for (let level = 1; level < MAX_BUSINESS_LEVEL; level++) total += BigInt(getUpgradeCost(b, level) ?? '0');
      const base = Number(getLevelProduction(b, 1)) / 100;
      const samples = [1, 5, 10, 25, 50, 99, 100].map(level => {
        const price = getUpgradeCost(b, level);
        return { level, production: Number(getLevelProduction(b, level)) / 100,
          upgradeCost: price === null ? null : Number(price) / 100,
          upgradePaybackSeconds: price === null ? null : Number(price) / 100 / base,
          xpPerDollar: price === null ? null : xp.reward / (Number(price) / 100) };
      });
      expect(getUpgradeCost(b, MAX_BUSINESS_LEVEL)).toBeNull();
      return { name: b.name, acquisitionPaybackSeconds: Number(b.purchaseCost) / 100 / base,
        maxInvestmentCents: total.toString(), samples };
    });
    console.info(JSON.stringify({ curves: rows }));
    expect(BUSINESS_PROPOSALS.every(b => BigInt(b.baseUpgradeCost) > BigInt(B.baseUpgradeCost))).toBe(true);
  });

  it('quantifies production shares, KX-R, Jax and permanent multipliers', () => {
    const fresh = createInitialGameState();
    const rows = [[7,1,0,0], [15,5,1,0], [25,10,5,1], [50,25,15,10], [100,100,100,100]].map(levels => {
      const catalog = [B, ...BUSINESS_PROPOSALS];
      const owned = Object.fromEntries(catalog.flatMap((b, i) => levels[i] ? [[b.id, { level: levels[i] }]] : []));
      const state = { ...fresh, businesses: { ...fresh.businesses, owned },
        upgrades: { purchasedIds: [PRESSURE_WASHER.id, DETAILING_LINE.id, FLEET_LOGISTICS.id] } };
      const total = productionDollars(state);
      const kxr = productionDollars({ ...state, garage: { ownedVehicleIds: [V.id] } });
      expect(kxr / total).toBeCloseTo(1.1, 10);
      const jax = { ...state, crew: { recruitedIds: [JAX_MERCER.id], assignments: { operations: null, logistics: JAX_MERCER.id } } };
      const skill = { ...jax, garage: { ownedVehicleIds: [V.id] }, permanentProgression: { ...fresh.permanentProgression,
        skills: { 'skill:streetwise-investment': 3, 'skill:silent-partner': 2 } } };
      const shares = Object.entries(owned).map(([id, entry]) => {
        const rate = evaluateBusinessProduction(state, id, entry.level);
        if (!rate.ok) throw Error('rate');
        return { id, share: Number(rate.effective.numerator) / Number(rate.effective.denominator) / 100 / total };
      });
      expect(Math.max(...shares.map(s => s.share))).toBeLessThan(.99);
      expect(productionDollars({ ...state, city: { ...state.city, ownedTerritoryIds: [...fresh.city.ownedTerritoryIds, NEON_MILE.id] } })).toBe(total);
      return { levels, total, kxrIncrease: kxr - total, jaxIncrease: productionDollars(jax) - total,
        fullProductionStack: productionDollars(skill), shares };
    });
    console.info(JSON.stringify({ shares: rows }));
  });

  it('keeps exact pooled fractions and acquisition boundaries with four proposed rates', () => {
    let state = createInitialGameState();
    state = { ...state, economy: { cash: moneyFromMinorUnits('100000000') },
      progression: { xp: getXpThresholdForLevel(20) }, city: { ...state.city, ownedTerritoryIds: [...state.city.ownedTerritoryIds, NEON_MILE.id] },
      businesses: { ...state.businesses, owned: { [B.id]: { level: 25 } } },
      garage: { ownedVehicleIds: [V.id] } };
    const before = successful(simulateElapsed(state, 13));
    const laundry = BUSINESS_PROPOSALS[0];
    if (!laundry) throw Error('proposal missing');
    const acquired = successful(purchaseBusiness(before, laundry.id));
    expect(acquired.progression).toEqual(before.progression);
    expect(acquired.permanentProgression.statistics).toEqual(before.permanentProgression.statistics);
    expect(acquired.businesses.productionRemainderMilliCents).toBe(before.businesses.productionRemainderMilliCents);
    let all = acquired;
    for (const b of BUSINESS_PROPOSALS.slice(1)) all = successful(purchaseBusiness(all, b.id));
    const whole = successful(simulateElapsed(all, 1003));
    const split = successful(simulateElapsed(successful(simulateElapsed(all, 417)), 586));
    expect(split).toEqual(whole);
    const offline = reconcileOffline(all, 0, 16 * 3600000);
    expect(offline.ok).toBe(true);
    if (!offline.ok) throw Error(offline.error);
    expect(offline.progress.rewardedElapsedMs).toBe(8 * 3600000);
    expect(offline.state.businesses).toEqual(successful(simulateElapsed(all, 8 * 3600000)).businesses);
    const upgraded = successful(upgradeBusiness(all, laundry.id));
    expect(upgraded.progression.xp - all.progression.xp).toBe(25);
    expect(upgraded.permanentProgression.statistics.businessLevelsPurchased - all.permanentProgression.statistics.businessLevelsPurchased).toBe(1);
  });
});
