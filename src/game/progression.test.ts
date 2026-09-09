import { describe, expect, it } from 'vitest';
import { addXp, getPlayerLevel, getLevelProgress, getXpThresholdForLevel, getLevelIncrease, isXp, MAX_XP } from '../features/progression';
import { createInitialGameState } from './game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { EXPRESS_TIPS, STREET_CONNECTIONS, PRESSURE_WASHER } from '../features/upgrades';
import { performStarterJob } from './perform-starter-job';
import { upgradeBusiness } from './upgrade-business';
import { purchaseBusiness } from './purchase-business';
import { purchaseUpgrade } from './purchase-upgrade';
import { purchaseAutomation } from './purchase-automation';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline, OFFLINE_CAP_MS } from './offline-progress';

function owned(xp = 0) {
  const state = createInitialGameState();
  return { ...state, progression: { xp }, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...state.businesses, owned: { [B.id]: { level: 1 } } },
    automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 0 } };
}
describe('exact XP and derived levels', () => {
  it.each([[1,0],[2,100],[3,400],[4,900],[5,1600],[10,8100],[25,57600],[50,240100],[100,980100]])('level %i begins at %i XP', (level, xp) => {
    expect(getXpThresholdForLevel(level)).toBe(xp); expect(getPlayerLevel(xp)).toBe(level);
  });
  it('resolves both sides of every threshold without sqrt rounding', () => {
    for (let level = 2; level <= 100; level++) {
      const threshold = getXpThresholdForLevel(level);
      expect(getPlayerLevel(threshold - 1)).toBe(level - 1);
      expect(getPlayerLevel(threshold)).toBe(level);
    }
  });
  it('exposes within-level progress and caps only the derived level', () => {
    expect(getLevelProgress(1850)).toEqual({ currentLevel: 5, currentXp: 1850, currentLevelStartXp: 1600,
      nextLevelXp: 2500, xpIntoLevel: 250, xpNeededForLevel: 900, progressRatio: 250/900, isMaxLevel: false });
    expect(getLevelProgress(MAX_XP)).toMatchObject({ currentLevel: 100, nextLevelXp: null, isMaxLevel: true, progressRatio: 1 });
    expect(getLevelIncrease(99,900)).toEqual({ fromLevel: 1, toLevel: 4 });
    expect(getLevelIncrease(100,101)).toBeNull();
  });
  it.each([-1, .5, NaN, Infinity, MAX_XP + 1, '1', null, undefined])('rejects invalid XP %#', value => expect(isXp(value)).toBe(false));
  it.each([-1, .5, NaN, Infinity, MAX_XP + 1])('rejects invalid authoritative inputs %#', value => {
    expect(() => addXp({ xp: value }, 1)).toThrow();
    expect(() => addXp({ xp: 0 }, value)).toThrow();
    expect(() => addXp({ xp: 0 }, 1, value)).toThrow();
    expect(() => getPlayerLevel(value)).toThrow();
  });
  it.each([0,101,1.5,NaN])('rejects invalid requested levels %#', value => expect(() => getXpThresholdForLevel(value)).toThrow());
  it('batches exact XP and preserves immutable state on overflow/no-op', () => {
    const state = Object.freeze({ xp: MAX_XP - 15 });
    expect(addXp(state,5,3)).toEqual({ ok: true, state: { xp: MAX_XP } });
    expect(addXp(state,5,4)).toEqual({ ok: false, state, error: 'xp-overflow' });
    expect(addXp(state,MAX_XP,MAX_XP).state).toBe(state);
    expect(addXp(state,0).state).toBe(state);
  });
});
describe('three atomic XP sources', () => {
  it.each([[],[STREET_CONNECTIONS.id],[EXPRESS_TIPS.id],[STREET_CONNECTIONS.id,EXPRESS_TIPS.id]].map(purchasedIds => ({ purchasedIds })))('money modifiers never modify XP %#', ({ purchasedIds }) => {
    const state = { ...owned(), upgrades: { purchasedIds } };
    const reward = purchasedIds.length === 2 ? '3600' : purchasedIds.length ? '3000' : '2500';
    const manual = performStarterJob(state);
    expect(manual.ok).toBe(true); expect(manual.state.progression.xp).toBe(10);
    expect(BigInt(manual.state.economy.cash)-BigInt(state.economy.cash)).toBe(BigInt(reward));
    expect(manual.state.automation).toBe(state.automation);
    const auto = simulateGameElapsed(state,30000);
    expect(auto.ok && auto.automation).toEqual({ completedJobs: 3, income: String(BigInt(reward)*3n), xpEarned: 15 });
    expect(auto.state.progression.xp).toBe(15);
  });
  it('only completed cycles earn XP; partitioning preserves cash, XP and fractions', () => {
    const state = owned();
    expect(simulateGameElapsed(state,9999).state.progression.xp).toBe(0);
    const first = simulateGameElapsed(state,9999).state;
    const split = simulateGameElapsed(first,15002);
    expect(split).toMatchObject({ ok: true, state: simulateGameElapsed(state,25001).state });
    expect(split.state.progression.xp).toBe(10);
  });
  it('level upgrades award 25 each and purchases award none', () => {
    const state = owned(); const first = upgradeBusiness(state,B.id);
    expect(first.ok).toBe(true); expect(first.state.progression.xp).toBe(25);
    expect(upgradeBusiness(first.state,B.id).state.progression.xp).toBe(50);
    const fresh = { ...createInitialGameState(), economy: state.economy };
    expect(purchaseBusiness(fresh,B.id).state.progression.xp).toBe(0);
    expect(purchaseUpgrade(state,PRESSURE_WASHER.id).state.progression.xp).toBe(0);
    const locked = { ...state, automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 } };
    expect(purchaseAutomation(locked,D.id).state.progression.xp).toBe(0);
  });
  it('failed level commands award no XP', () => {
    const state = owned();
    for (const candidate of [createInitialGameState(), { ...state, economy: { cash: moneyFromMinorUnits('0') } },
      { ...state, businesses: { ...state.businesses, owned: { [B.id]: { level: 100 } } } }]) {
      expect(upgradeBusiness(candidate,B.id)).toMatchObject({ ok: false });
      expect(upgradeBusiness(candidate,B.id).state).toBe(candidate);
    }
    expect(upgradeBusiness(state,'unknown').state).toBe(state);
  });
  it('XP overflow rolls back money, level, fractions and cycle progress', () => {
    const state = owned(MAX_XP); const before = JSON.stringify(state);
    for (const result of [performStarterJob(state),upgradeBusiness(state,B.id),simulateGameElapsed(state,10000)]) {
      expect(result).toEqual({ ok: false, state, error: 'xp-overflow' });
      expect(result.state).toBe(state);
    }
    expect(JSON.stringify(state)).toBe(before);
  });
  it('money overflow awards no XP', () => {
    const state = { ...owned(), economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } };
    expect(performStarterJob(state)).toMatchObject({ ok: false, state });
    expect(simulateGameElapsed(state,10000)).toMatchObject({ ok: false, state });
  });
  it('offline cycles share the cap and retain prior progress; business-only income earns no XP', () => {
    const state = { ...owned(), automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 5000 },
      upgrades: { purchasedIds: [EXPRESS_TIPS.id, STREET_CONNECTIONS.id] } };
    const result = reconcileOffline(state,0,25000);
    expect(result.ok && result.progress).toMatchObject({ xpEarned: 15, automation: { completedJobs: 3, income: '10800' } });
    expect(result.state).toEqual(simulateGameElapsed(state,25000).state);
    const capped = reconcileOffline(owned(),0,12*3600000);
    expect(capped.ok && capped.progress).toMatchObject({ rewardedElapsedMs: OFFLINE_CAP_MS, xpEarned: 14400, levelIncrease: { fromLevel: 1, toLevel: 13 } });
    expect(capped.state.automation.starterJobElapsedMs).toBe(0);
    const locked = { ...owned(), automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 } };
    const business = reconcileOffline(locked,0,10000);
    expect(business.ok && business.progress.xpEarned).toBe(0);
    expect(reconcileOffline(state,10000,0).state.progression.xp).toBe(0);
  });
});
