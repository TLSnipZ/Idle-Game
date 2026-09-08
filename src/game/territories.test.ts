import { describe, expect, it } from 'vitest';
import { CITY_NAME, WATERFRONT as W, NEON_MILE as N, TERRITORY_CATALOG, isCityState, collectTerritoryModifiers } from '../features/territories';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { moneyFromMinorUnits, subtractMoney, MAX_MONEY_DIGITS } from '../features/economy';
import { getPlayerLevel } from '../features/progression';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { acquireTerritory } from './acquire-territory';
import { selectCity, selectTerritory } from './territory-selectors';
import { evaluateRequirements, newlyEligibleContent } from './requirements';
import { evaluateBusinessProduction, evaluateJobReward } from './effective-stats';
import { performStarterJob } from './perform-starter-job';
import { purchaseBusiness } from './purchase-business';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { simulateAutomation } from './simulate-automation';
import { performRebirth, REBIRTH_POLICY } from './rebirth';
import { reconcileOffline } from './offline-progress';
import { territoryState } from './test-fixtures/territory-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { FAST, LEARN, ROOT, NEVER } from './test-fixtures/skill-state';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function cashDelta(after: GameState, before: GameState) { return subtractMoney(after.economy.cash, before.economy.cash); }

describe('Solara City catalog and acquisition', () => {
  it('has exactly two frozen, ordered identities with one starting foothold and one cash modifier', () => {
    expect(CITY_NAME).toBe('SOLARA CITY');
    expect(TERRITORY_CATALOG.map(t => t.id)).toEqual(['territory:waterfront', 'territory:neon-mile']);
    expect(new Set(TERRITORY_CATALOG.map(t => t.id)).size).toBe(2);
    expect(W).toMatchObject({ starting: true, purchaseCost: '0', requirements: [], modifiers: [] });
    expect(N).toMatchObject({ starting: false, purchaseCost: '10000000', requirements: [
      { type: 'player-level', minimumLevel: 12 }, { type: 'business-owned', businessId: B.id },
      { type: 'business-level', businessId: B.id, minimumLevel: 15 },
    ], modifiers: [{ id: 'modifier:territory-neon-mile-job-reward', sourceId: N.id,
      target: { stat: 'job-reward' }, operation: 'multiply-basis-points', bonusBasisPoints: 1000 }] });
    for (const t of TERRITORY_CATALOG) {
      expect(Object.isFrozen(t)).toBe(true); expect(Object.isFrozen(t.requirements)).toBe(true);
      expect(Object.isFrozen(t.modifiers)).toBe(true); t.requirements.forEach(r => expect(Object.isFrozen(r)).toBe(true));
    }
  });
  it('fresh city costs nothing, grants no rewards, and is an independent fresh array', () => {
    const state = createInitialGameState();
    expect(state.city).toEqual({ heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id] }); expect(state.city).not.toBe(createInitialGameState().city);
    expect(state.economy.cash).toBe('0'); expect(state.progression.xp).toBe(0);
    expect(state.permanentProgression).toEqual({ empirePoints: 0, rebirthCount: 0, skills: {} });
    expect(selectCity(state)).toEqual({ ownedTerritoryCount: 1, totalConfiguredTerritories: 2 });
    expect(collectTerritoryModifiers(state.city)).toEqual([]);
  });
  it.each([[11, 15, false], [12, 14, false], [12, 15, true], [20, 25, true]] as const)(
    'player %i / business %i eligibility %s', (player, business, eligible) => {
      const state = territoryState(false, player, business);
      expect(selectTerritory(state, N.id)?.eligible).toBe(eligible);
      const result = acquireTerritory(state, N.id); expect(result.ok).toBe(eligible);
      if (!result.ok) { expect(result.error).toBe('requirements-not-met'); expect(result.state).toBe(state); }
    });
  it('reports missing business and level as structured ordered requirements before cash', () => {
    const state = freeze(createInitialGameState()), result = acquireTerritory(state, N.id);
    expect(result).toMatchObject({ ok: false, state, error: 'requirements-not-met', requirements: { met: false } });
    if (result.ok || result.error !== 'requirements-not-met') throw Error('fixture');
    expect(result.requirements.requirements.map(r => r.met)).toEqual([false, false, false]);
    expect(result.requirements.requirements.map(r => r.description)).toEqual(['Player Level 12', 'Own Dockside Detail', 'Dockside Detail Level 15']);
    expect(result.state).toBe(state);
  });
  it('spends exactly once atomically, retaining XP, EP, count, progress and both fractions', () => {
    const base = territoryState();
    const state = freeze({ ...base, businesses: { ...base.businesses, productionRemainderMilliCents: 975,
      productionRemainderSubMilliCents: { numerator: '1', denominator: '3' } },
      automation: { ...base.automation, starterJobElapsedMs: 7000 } });
    const before = JSON.stringify(state), result = acquireTerritory(state, N.id);
    expect(result.ok).toBe(true); expect(result.state.economy.cash).toBe('0');
    expect(result.state.city.ownedTerritoryIds).toEqual([W.id, N.id]);
    expect(result.state).toEqual({ ...state, economy: { cash: '0' }, city: { heat: 10, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] } });
    expect(JSON.stringify(state)).toBe(before); expect(selectCity(result.state).ownedTerritoryCount).toBe(2);
    expect(acquireTerritory(result.state, N.id)).toEqual({ ok: false, state: result.state, error: 'already-owned' });
  });
  it('distinguishes insufficient funds, duplicate and unknown identity without state changes', () => {
    const base = territoryState();
    const state = freeze({ ...base, economy: { cash: moneyFromMinorUnits('9999999') } });
    expect(selectTerritory(state, N.id)).toMatchObject({ eligible: true, affordable: false, canAcquire: false });
    for (const [id, error] of [[N.id, 'insufficient-funds'], [W.id, 'already-owned'], ['territory:missing', 'unknown-territory']]) {
      const result = acquireTerritory(state, id); expect(result).toEqual({ ok: false, state, error }); expect(result.state).toBe(state);
    }
    expect(selectTerritory(state, 'unknown')).toBeNull();
  });
  it('spends precisely at large Money values without Number conversion', () => {
    const state = { ...territoryState(), economy: { cash: moneyFromMinorUnits('900719925474099312345') } };
    expect(acquireTerritory(state, N.id).state.economy.cash).toBe('900719925474089312345');
  });
  it('uses pure typed territory requirements in deterministic AND lists', () => {
    const state = freeze(territoryState()), before = JSON.stringify(state);
    const requirements = [{ type: 'territory-owned', territoryId: N.id }, { type: 'player-level', minimumLevel: 12 }] as const;
    const result = evaluateRequirements(state, requirements);
    expect(result.met).toBe(false); expect(result.requirements.map(r => r.met)).toEqual([false, true]);
    expect(result.requirements[0]?.description).toBe('Control Neon Mile');
    expect(evaluateRequirements(acquireTerritory(state, N.id).state, requirements).met).toBe(true);
    expect(evaluateRequirements(state, [{ type: 'territory-owned', territoryId: W.id }]).met).toBe(true);
    expect(JSON.stringify(state)).toBe(before);
    expect(newlyEligibleContent(territoryState(false, 11), state)).toContain(N.name);
  });
  it('fresh players work, buy Dockside and reach level 2 without acquiring territory', () => {
    let state = createInitialGameState();
    for (let i = 0; i < 6; i++) state = performStarterJob(state).state;
    expect(state.economy.cash).toBe('15000'); expect(state.progression.xp).toBe(60);
    const purchase = purchaseBusiness(state, B.id); expect(purchase.ok).toBe(true); state = purchase.state;
    for (let i = 0; i < 4; i++) state = performStarterJob(state).state;
    expect(getPlayerLevel(state.progression.xp)).toBe(2); expect(state.city.ownedTerritoryIds).toEqual([W.id]);
  });
});

describe('territory modifiers and temporary Rebirth policy', () => {
  it('adds exactly one job source, leaving business production and XP unaffected', () => {
    const old = territoryState(), state = territoryState(true);
    expect(evaluateJobReward(old)).toMatchObject({ reward: '2500', applied: [] });
    expect(evaluateJobReward(state)).toMatchObject({ reward: '2750', applied: N.modifiers });
    expect(evaluateBusinessProduction(state, B.id, 15)).toEqual(evaluateBusinessProduction(old, B.id, 15));
    expect(performStarterJob(state).state.progression.xp - state.progression.xp).toBe(10);
    expect(cashDelta(performStarterJob(state).state, state)).toEqual({ ok: true, value: '2750' });
    expect(collectTerritoryModifiers(state.city)).toEqual(N.modifiers);
  });
  it('evaluates the complete flat/percentage stack at exactly $43.56 for manual and Dispatcher cash', () => {
    const base = territoryState(true);
    const state: GameState = { ...base, upgrades: { purchasedIds: ['upgrade:express-tips', 'upgrade:street-connections'] },
      permanentProgression: { ...base.permanentProgression, skills: { [FAST]: 1, [LEARN]: 1 } } };
    const reward = evaluateJobReward(state); if (!reward.ok) throw Error('fixture');
    expect(reward.reward).toBe('4356');
    expect(reward.applied.map(m => m.sourceId)).toEqual(['upgrade:express-tips', 'skill:fast-talker', 'upgrade:street-connections', N.id]);
    expect(evaluateJobReward({ ...state, upgrades: { purchasedIds: [...state.upgrades.purchasedIds].reverse() } })).toEqual(reward);
    const manual = performStarterJob(state);
    expect(cashDelta(manual.state, state)).toEqual({ ok: true, value: '4356' });
    expect(manual.state.progression.xp - state.progression.xp).toBe(11);
    const batch = simulateAutomation(state, 30000); if (!batch.ok) throw Error('fixture');
    expect(batch.automation).toEqual({ completedJobs: 3, income: '13068', xpEarned: 16 });
    const without = simulateAutomation({ ...state, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id] } }, 30000);
    expect(batch.state.progression).toEqual(without.state.progression);
    expect(batch.state.automation).toEqual(without.state.automation);
  });
  it('retains partition-independent cash and cycle progress with exact production fractions', () => {
    const base = territoryState(true);
    const state = { ...base, businesses: { ...base.businesses, productionRemainderMilliCents: 975,
      productionRemainderSubMilliCents: { numerator: '1', denominator: '3' } } };
    const combined = simulateGameElapsed(state, 25001);
    let split: GameState = state;
    for (const duration of [9999, 1, 333, 14668]) split = simulateGameElapsed(split, duration).state;
    expect(split).toEqual(combined.state); expect(combined.state.city).toEqual(state.city);
  });
  it('cash or XP overflow rejects the whole elapsed candidate', () => {
    for (const state of [
      { ...territoryState(true), economy: { cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) } },
      { ...territoryState(true), progression: { xp: Number.MAX_SAFE_INTEGER } },
    ]) { const result = simulateGameElapsed(state, 10000); expect(result.ok).toBe(false); expect(result.state).toBe(state); }
  });
  it.each([0, 1, 2])('offline uses the same batch and shared derived cap at Never Sleeps rank %i', rank => {
    const base = territoryState(true);
    const state = { ...base, permanentProgression: { ...base.permanentProgression,
      skills: { [FAST]: 1, [LEARN]: 1, ...(rank ? { [NEVER]: rank } : {}) } },
      automation: { ...base.automation, starterJobElapsedMs: 5000 } };
    const cap = (8 + rank * 2) * 3600000;
    const result = reconcileOffline(state, 1000, 1000 + 14 * 3600000); if (!result.ok) throw Error('fixture');
    const online = simulateGameElapsed(state, cap); if (!online.ok) throw Error('fixture');
    expect(result.state).toEqual(online.state);
    expect(result.progress).toMatchObject({ capMs: cap, rewardedElapsedMs: cap, actualElapsedMs: 50400000, capped: true, automation: online.automation });
    expect(result.state.automation.starterJobElapsedMs).toBe(5000);
    const without = reconcileOffline({ ...state, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id] } }, 1000, 1000 + 14 * 3600000);
    if (!without.ok) throw Error('fixture');
    expect(result.progress.businessIncome).toEqual(without.progress.businessIncome);
    expect(result.progress.xpEarned).toEqual(without.progress.xpEarned);
    expect(result.state.permanentProgression).toEqual(state.permanentProgression);
  });
  it('Rebirth resets the full temporary matrix, retains permanent slices and allows paid reacquisition', () => {
    const base = rebirthState();
    const state = freeze({ ...base, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] },
      permanentProgression: { empirePoints: 3, rebirthCount: 2, skills: { [ROOT]: 1, [FAST]: 1 } } });
    const result = performRebirth(state); if (!result.ok) throw Error('fixture');
    expect(Object.keys(REBIRTH_POLICY).sort()).toEqual(Object.keys(state).sort());
    expect(result.state.city).toEqual(createInitialGameState().city);
    expect(result.state.economy.cash).toBe('0'); expect(result.state.businesses.owned).toEqual({});
    expect(result.state.businesses.productionRemainderMilliCents).toBe(0);
    expect(result.state.businesses.productionRemainderSubMilliCents).toEqual({ numerator: '0', denominator: '1' });
    expect(result.state.upgrades.purchasedIds).toEqual([]); expect(result.state.automation).toEqual({ unlockedIds: [], starterJobElapsedMs: 0 });
    expect(result.state.progression.xp).toBe(0); expect(result.state.garage).toEqual(state.garage);
    expect(result.state.permanentProgression).toEqual({ empirePoints: 7, rebirthCount: 3, skills: state.permanentProgression.skills });
    expect(evaluateJobReward(result.state)).toMatchObject({ reward: '2750' });
    expect(acquireTerritory(result.state, N.id)).toMatchObject({ ok: false, error: 'requirements-not-met' });
    const rebuilt = { ...result.state, economy: territoryState().economy, businesses: territoryState().businesses, progression: territoryState().progression };
    expect(acquireTerritory(rebuilt, N.id)).toMatchObject({ ok: true, state: { economy: { cash: '0' }, city: { ...state.city, heat: 10 } } });
  });
  it('accepts grandfathered Neon Mile below acquisition gates, rejects corrupt authoritative ownership', () => {
    const state = { ...createInitialGameState(), city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] } };
    expect(isCityState(state.city)).toBe(true); expect(evaluateJobReward(state)).toMatchObject({ reward: '2750' });
    const invalid = { ...state, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [N.id] } };
    expect(() => acquireTerritory(invalid, W.id)).toThrow(RangeError);
    expect(() => evaluateJobReward(invalid)).toThrow(RangeError);
  });
});
