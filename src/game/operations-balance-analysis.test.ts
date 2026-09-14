/**
 * Operations Balance I: isolated counterfactual experiment, never a runtime API.
 * All ownership below is a fixed, already-funded portfolio, not an acquisition route.
 * Candidate Cash is a separate ledger. Real commands still own Heat, XP and time.
 */
import { describe, expect, it } from 'vitest';
import { BUSINESS_CATALOG, getOwnedProductionInputs } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_JOB, moneyFromMinorUnits } from '../features/economy';
import type { Money } from '../features/economy';
import { DISCREET_DELIVERY_BONUS_BASIS_POINTS, getPolicePressure } from '../features/heat';
import { getXpThresholdForLevel } from '../features/progression';
import { NEON_MILE, WATERFRONT, getDistrictHeat, switchCityDistrict, withDistrictHeat } from '../features/territories';
import { TUNING_CATALOG, VEHICLE_CATALOG } from '../features/vehicles';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { collectModifiers, evaluateJobReward, evaluateRiskyJobReward, evaluateDiscreetJobReward } from './effective-stats';
import { evaluateStat, wholeStatValue } from './modifiers';
import type { Modifier } from './modifiers';
import { performStarterJob, performRiskyDelivery, performDiscreetDelivery } from './perform-starter-job';
import { performRebirth } from './rebirth';
import { evaluateRequirements } from './requirements';
import { simulateGameElapsed } from './simulate-game-elapsed';

const TICK_MS = 250;
const WINDOW_MS = 30 * 60 * 1000;
const PROPOSED_MANUAL_INTERVAL_MS = 10_000;
type Policy = 'current' | 'flat-x4' | 'portfolio-paced';
type Context = 'manual' | 'dispatcher';
type Delivery = 'normal' | 'risky' | 'discreet';
const POLICIES: readonly Policy[] = ['current', 'flat-x4', 'portfolio-paced'];
interface Sample {
  readonly name: string;
  readonly levels: readonly [number, number, number, number];
  readonly playerLevel: number;
  readonly neon?: boolean;
}
const SAMPLES: readonly Sample[] = [
  { name: 'fresh', levels: [0, 0, 0, 0], playerLevel: 1 },
  { name: 'first-business', levels: [1, 0, 0, 0], playerLevel: 1 },
  { name: 'laundry-entry', levels: [7, 1, 0, 0], playerLevel: 5 },
  { name: 'workshop-entry', levels: [7, 10, 1, 0], playerLevel: 10 },
  { name: 'established-workshop', levels: [15, 10, 5, 0], playerLevel: 14 },
  { name: 'nightclub', levels: [25, 15, 8, 1], playerLevel: 16, neon: true },
];
function sample(name: string): Sample {
  const found = SAMPLES.find(item => item.name === name);
  if (!found) throw new Error(`Unknown analysis sample: ${name}`);
  return found;
}
function portfolio(definition: Sample): GameState {
  const initial = createInitialGameState();
  const owned: Partial<Record<BusinessId, { readonly level: number }>> = {};
  BUSINESS_CATALOG.forEach((business, index) => {
    const level = definition.levels[index] ?? 0;
    if (level > 0) owned[business.id] = { level };
  });
  let city = initial.city;
  if (definition.neon) {
    city = switchCityDistrict({ ...city, ownedTerritoryIds: [WATERFRONT.id, NEON_MILE.id] }, NEON_MILE.id);
    city = switchCityDistrict(city, WATERFRONT.id);
  }
  return { ...initial, city, progression: { xp: getXpThresholdForLevel(definition.playerLevel) },
    businesses: { ...initial.businesses, owned } };
}
function carState(state: GameState, carId: string, tuningId?: string): GameState {
  const car = VEHICLE_CATALOG.find(item => item.id === carId);
  if (!car) throw new Error(`Unknown analysis car: ${carId}`);
  const part = tuningId === undefined ? undefined : TUNING_CATALOG.find(item => item.id === tuningId && item.vehicleId === car.id);
  if (tuningId !== undefined && !part) throw new Error(`Incompatible analysis tuning: ${tuningId}`);
  return { ...state, garage: { ownedVehicleIds: [car.id], activeVehicleId: car.id,
    ...(part ? { builds: { [car.id]: { purchasedIds: [part.id], selectedId: part.id } } } : {}) } };
}
function withDispatcher(state: GameState): GameState {
  if (!evaluateRequirements(state, DELIVERY_DISPATCHER.requirements).met) return state;
  return { ...state, automation: { ...state.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
}
/** P is unmodified owned production, in integer cents/second; never effective income. */
function rawProduction(state: GameState): bigint {
  return getOwnedProductionInputs(state.businesses).reduce((sum, input) => sum + BigInt(input.base), 0n);
}
function candidateBase(policy: Policy, state: GameState, context: Context): Money {
  const floor = BigInt(STARTER_JOB.reward);
  if (policy === 'current') return STARTER_JOB.reward;
  if (policy === 'flat-x4') return moneyFromMinorUnits((floor * 4n).toString());
  const scaled = rawProduction(state) * (context === 'manual' ? 8n : 1n);
  return moneyFromMinorUnits((scaled > floor ? scaled : floor).toString());
}
function quote(policy: Policy, state: GameState, context: Context, delivery: Delivery = 'normal'): Money {
  const extra: Modifier[] = delivery === 'normal' ? [] : [{
    id: `analysis:delivery-${delivery}`, sourceId: 'analysis:operations-balance',
    target: { stat: 'job-reward', context: 'manual' }, operation: 'multiply-basis-points',
    bonusBasisPoints: delivery === 'risky' ? getPolicePressure(state.city.heat).riskyBonusBasisPoints : DISCREET_DELIVERY_BONUS_BASIS_POINTS,
  }];
  const result = evaluateStat(candidateBase(policy, state, context), { stat: 'job-reward', context }, [...collectModifiers(state, context), ...extra]);
  if (!result.ok) throw new Error(`Analysis reward failed: ${result.error}`);
  return wholeStatValue(result.effective);
}
function heat(state: GameState, value: number): GameState {
  return { ...state, city: withDistrictHeat(state.city, WATERFRONT.id, { heat: value, heatDecayElapsedMs: 0 }) };
}
interface Session {
  readonly businessCents: bigint;
  readonly dispatcherCents: bigint;
  readonly manualCents: bigint;
  readonly acceptedJobs: number;
  readonly attempts: number;
  readonly finalState: GameState;
}
/** No spending, Events, travel, Rebirth or changed ownership within this window. */
function session(initial: GameState, policy: Policy, attemptsEveryMs: number | null, durationMs = WINDOW_MS): Session {
  let state = initial;
  let businessCents = 0n, dispatcherCents = 0n, manualCents = 0n;
  let nextManualAt = 0, attempts = 0, acceptedJobs = 0;
  for (let elapsed = TICK_MS; elapsed <= durationMs; elapsed += TICK_MS) {
    const dispatcherReward = quote(policy, state, 'dispatcher');
    const next = simulateGameElapsed(state, TICK_MS);
    if (!next.ok) throw new Error(`Analysis simulation failed: ${next.error}`);
    const dispatchIncome = BigInt(dispatcherReward) * BigInt(next.automation.completedJobs);
    if (policy === 'current' && dispatchIncome !== BigInt(next.automation.income)) throw new Error('Counterfactual adapter disagrees with actual Dispatcher');
    businessCents += BigInt(next.businessIncome);
    dispatcherCents += dispatchIncome;
    state = next.state;
    if (attemptsEveryMs === null || elapsed % attemptsEveryMs !== 0) continue;
    attempts++;
    if (elapsed < nextManualAt) continue;
    const manualReward = quote(policy, state, 'manual');
    const completed = performStarterJob(state);
    if (!completed.ok) throw new Error(`Analysis manual job failed: ${completed.error}`);
    if (policy === 'current' && manualReward !== completed.moneyEarned) throw new Error('Counterfactual adapter disagrees with actual manual job');
    state = completed.state;
    manualCents += BigInt(manualReward);
    acceptedJobs++;
    nextManualAt = policy === 'portfolio-paced' ? elapsed + PROPOSED_MANUAL_INTERVAL_MS : elapsed;
  }
  return { businessCents, dispatcherCents, manualCents, acceptedJobs, attempts, finalState: state };
}
function report(result: Session) {
  return { businessCents: result.businessCents.toString(), dispatcherCents: result.dispatcherCents.toString(),
    manualCents: result.manualCents.toString(), acceptedJobs: result.acceptedJobs, attempts: result.attempts,
    finalHeat: result.finalState.city.heat, finalXp: result.finalState.progression.xp };
}
function actualReward(state: GameState, context: Context, delivery: Delivery = 'normal'): Money {
  const result = delivery === 'risky' ? evaluateRiskyJobReward(state)
    : delivery === 'discreet' ? evaluateDiscreetJobReward(state) : evaluateJobReward(state, context);
  if (!result.ok) throw new Error('Actual reward evaluation failed');
  return result.reward;
}
function boosted(state: GameState): GameState {
  return { ...state,
    upgrades: { purchasedIds: ['upgrade:commercial-pressure-washer', 'upgrade:industrial-detailing-line', 'upgrade:fleet-logistics', 'upgrade:street-connections', 'upgrade:express-tips'] },
    crew: { recruitedIds: ['crew:rico-vale', 'crew:jax-mercer'], assignments: { operations: 'crew:rico-vale', logistics: 'crew:jax-mercer' } },
    permanentProgression: { ...state.permanentProgression, skills: {
      'skill:streetwise-investment': 3, 'skill:fast-talker': 2, 'skill:silent-partner': 2,
    } },
  };
}

describe('Operations Balance I — isolated decision evidence', () => {
  it.each(SAMPLES)('$name: fixed portfolio baseline and two candidate base rewards', definition => {
    const state = portfolio(definition), before = JSON.stringify(state);
    const rows = POLICIES.map(policy => ({ policy, manualBase: candidateBase(policy, state, 'manual'),
      dispatcherBase: candidateBase(policy, state, 'dispatcher'), manualCold: quote(policy, state, 'manual'),
      dispatcherCold: quote(policy, state, 'dispatcher') }));
    expect(quote('current', state, 'manual')).toBe(actualReward(state, 'manual'));
    expect(quote('current', state, 'dispatcher')).toBe(actualReward(state, 'dispatcher'));
    expect(JSON.stringify(state)).toBe(before);
    console.info('OPERATIONS_BASES', JSON.stringify({ sample: definition.name, rawProductionCentsPerSecond: rawProduction(state).toString(),
      dispatcherEligible: evaluateRequirements(state, DELIVERY_DISPATCHER.requirements).met, rows }));
  });
  it('pins current portfolio bases and proposal units, including the two $25 floors', () => {
    expect(SAMPLES.map(item => rawProduction(portfolio(item)).toString())).toEqual(['0', '75', '1025', '7025', '13625', '25375']);
    expect(SAMPLES.map(item => candidateBase('portfolio-paced', portfolio(item), 'manual'))).toEqual(['2500', '2500', '8200', '56200', '109000', '203000']);
    expect(SAMPLES.map(item => candidateBase('portfolio-paced', portfolio(item), 'dispatcher'))).toEqual(['2500', '2500', '2500', '7025', '13625', '25375']);
    expect(BUSINESS_CATALOG[0]?.purchaseCost).toBe('15000');
    expect(6n * BigInt(candidateBase('portfolio-paced', createInitialGameState(), 'manual'))).toBe(15000n);
    expect(5 * PROPOSED_MANUAL_INTERVAL_MS).toBe(50_000); // Ready at t=0; six jobs, not instant spam.
  });
  it.each(SAMPLES)('$name: real 250ms online paths, with ownership-gated Dispatcher', definition => {
    const initial = portfolio(definition), before = JSON.stringify(initial);
    const rows = POLICIES.flatMap(policy => [
      { policy, mode: 'business-only', ...report(session(initial, policy, null)) },
      { policy, mode: 'idle-dispatcher', ...report(session(withDispatcher(initial), policy, null)) },
      { policy, mode: 'manual-every-30s', ...report(session(withDispatcher(initial), policy, 30_000)) },
    ]);
    for (const row of rows) {
      expect(BigInt(row.businessCents)).toBe(rawProduction(initial) * BigInt(WINDOW_MS / 1000));
      if (row.mode === 'manual-every-30s') expect(row.acceptedJobs).toBe(WINDOW_MS / 30_000);
      if (!evaluateRequirements(initial, DELIVERY_DISPATCHER.requirements).met) expect(row.dispatcherCents).toBe('0');
    }
    expect(JSON.stringify(initial)).toBe(before);
    console.info('OPERATIONS_ONLINE', JSON.stringify({ sample: definition.name, durationMs: WINDOW_MS, tickMs: TICK_MS, rows }));
  }, 60_000);
  it.each(POLICIES)('%s: one-hour pressure and high-input stress are not cold-income forecasts', policy => {
    const state = withDispatcher(portfolio(sample('established-workshop')));
    const slow = session(heat(state, 80), policy, 30_000, 3_600_000);
    const fast = session(state, policy, 1000, 3_600_000);
    const veryFast = session(state, policy, 250, 3_600_000);
    expect(slow.finalState.city.heat).toBeGreaterThanOrEqual(80);
    if (policy === 'portfolio-paced') {
      expect(fast.acceptedJobs).toBe(360);
      expect(veryFast.acceptedJobs).toBe(360);
      // Different first-attempt offsets can straddle Heat boundaries, not multiply income.
      expect(veryFast.manualCents * 100n).toBeLessThanOrEqual(fast.manualCents * 102n);
    } else {
      expect(fast.acceptedJobs).toBe(3600);
      expect(veryFast.acceptedJobs).toBe(14_400);
      expect(veryFast.manualCents).toBeGreaterThan(fast.manualCents * 3n);
    }
    console.info('OPERATIONS_STRESS', JSON.stringify({ policy, durationMs: 3_600_000,
      hotOccasional: report(slow), oneSecondAttempts: report(fast), quarterSecondAttempts: report(veryFast) }));
  }, 60_000);
  it.each([0, 40, 60, 80, 100])('Heat %s: adapter reproduces every actual reward branch with stacked bonuses', value => {
    const state = heat(carState(boosted(portfolio(sample('nightclub'))), 'vehicle:namera-serein', 'tuning:serein-nightshift-ecu'), value);
    for (const context of ['manual', 'dispatcher'] as const) expect(quote('current', state, context)).toBe(actualReward(state, context));
    for (const delivery of ['normal', 'risky', 'discreet'] as const) expect(quote('current', state, 'manual', delivery)).toBe(actualReward(state, 'manual', delivery));
    const risky = performRiskyDelivery(state);
    expect(risky.ok).toBe(value < 60);
    const discreet = performDiscreetDelivery(state);
    expect(discreet.ok).toBe(value > 0);
    if (discreet.ok) expect(discreet.xpEarned).toBe(0);
  });
  it('keeps all production modifiers out of the proposed reward base', () => {
    const state = portfolio(sample('nightclub'));
    const boostedCar = carState(boosted(state), 'vehicle:sevrin-canto-club', 'tuning:canto-fleet-gearing');
    expect(rawProduction(boostedCar)).toBe(rawProduction(state));
    expect(candidateBase('portfolio-paced', boostedCar, 'manual')).toBe(candidateBase('portfolio-paced', state, 'manual'));
    expect(BigInt(quote('portfolio-paced', boostedCar, 'manual'))).toBeGreaterThan(BigInt(quote('portfolio-paced', state, 'manual')));
    console.info('OPERATIONS_STACKED', JSON.stringify({ base: candidateBase('portfolio-paced', boostedCar, 'manual'),
      normal: quote('portfolio-paced', boostedCar, 'manual'), risky: quote('portfolio-paced', boostedCar, 'manual', 'risky'),
      discreet: quote('portfolio-paced', boostedCar, 'manual', 'discreet'), dispatcher: quote('portfolio-paced', boostedCar, 'dispatcher') }));
  });
  it('preserves manual district versus Waterfront Dispatcher Heat in both proposals', () => {
    const initial = portfolio(sample('nightclub'));
    const city = switchCityDistrict(initial.city, NEON_MILE.id);
    const state = { ...initial, city: { ...city, heat: 80 } };
    for (const policy of POLICIES) {
      expect(quote(policy, state, 'dispatcher')).toBe(quote(policy, initial, 'dispatcher'));
      expect(BigInt(quote(policy, state, 'manual'))).toBeLessThan(BigInt(quote(policy, initial, 'manual')));
    }
    expect(getDistrictHeat(state.city, WATERFRONT.id).heat).toBe(0);
  });
  it.each([0, 80])('offline starting Heat %s: actual one-batch semantics, not a fabricated per-job forecast', startingHeat => {
    const state = heat(withDispatcher(portfolio(sample('nightclub'))), startingHeat);
    const durationMs = 8 * 60 * 60 * 1000;
    const real = simulateGameElapsed(state, durationMs);
    if (!real.ok) throw new Error(real.error);
    expect(real.automation.completedJobs).toBe(durationMs / DELIVERY_DISPATCHER.intervalMs);
    expect(real.automation.income).toBe((BigInt(quote('current', state, 'dispatcher')) * BigInt(real.automation.completedJobs)).toString());
    const rows = POLICIES.map(policy => ({ policy, dispatcherCents: (BigInt(quote(policy, state, 'dispatcher')) * BigInt(real.automation.completedJobs)).toString() }));
    console.info('OPERATIONS_OFFLINE', JSON.stringify({ startingHeat, durationMs, jobs: real.automation.completedJobs,
      businessCents: real.businessIncome, finalHeat: real.state.city.heat, rows }));
  });
  it('retains the historical batching boundary instead of silently fixing Heat in this experiment', () => {
    const state = withDispatcher(portfolio(sample('established-workshop')));
    const batched = simulateGameElapsed(state, 50_000);
    if (!batched.ok) throw new Error(batched.error);
    const online = session(state, 'current', null, 50_000);
    expect(batched.state.city.heat).toBe(1);
    expect(online.finalState.city.heat).toBe(0);
    expect(online.acceptedJobs).toBe(0);
  });
  it('uses the actual Rebirth command and keeps the car while run-scaled bases reset', () => {
    const prior = carState(portfolio({ name: 'rebirth-source', levels: [25, 10, 5, 0], playerLevel: 20 }),
      'vehicle:namera-serein', 'tuning:serein-nightshift-ecu');
    const result = performRebirth(prior);
    if (!result.ok) throw new Error(`Rebirth fixture failed: ${result.error}`);
    const returned = result.state;
    expect(returned.garage).toEqual(prior.garage);
    expect(rawProduction(returned)).toBe(0n);
    expect(candidateBase('portfolio-paced', returned, 'manual')).toBe(STARTER_JOB.reward);
    expect(quote('portfolio-paced', returned, 'manual')).toBe('3402');
    expect(returned.automation.unlockedIds).not.toContain(DELIVERY_DISPATCHER.id);
    const first = { ...returned, businesses: { ...returned.businesses, owned: { 'business:dockside-detail': { level: 1 } } } };
    const rows = POLICIES.map(policy => ({ policy, ...report(session(first, policy, 30_000, 600_000)) }));
    console.info('OPERATIONS_REBIRTH', JSON.stringify({ retainedCar: returned.garage.activeVehicleId, durationMs: 600_000, rows }));
  }, 60_000);
  it.each(VEHICLE_CATALOG)('$name: all stock and fitted roles use current catalog effects, not copied bonuses', car => {
    const state = portfolio(sample('nightclub'));
    const parts = TUNING_CATALOG.filter(part => part.vehicleId === car.id);
    const choices = [undefined, ...parts];
    const rows = choices.map(part => {
      const selected = carState(state, car.id, part?.id);
      const actual = simulateGameElapsed(selected, 1000);
      if (!actual.ok) throw new Error(actual.error);
      expect(quote('current', selected, 'manual')).toBe(actualReward(selected, 'manual'));
      return { setup: part?.name ?? 'stock', carPrice: car.purchaseCost, setupPrice: part?.cost ?? '0',
        businessOneSecondCents: actual.businessIncome,
        policies: POLICIES.map(policy => ({ policy, manual: quote(policy, selected, 'manual'), dispatcher: quote(policy, selected, 'dispatcher') })) };
    });
    expect(parts).toHaveLength(2);
    console.info('OPERATIONS_GARAGE', JSON.stringify({ car: car.name, portfolio: 'nightclub', heat: 0, rows }));
  });
  it('bounds proposed bases at the current maximum portfolio and never imports a new runtime catalog entry', () => {
    const state = portfolio({ name: 'all-max', levels: [100, 100, 100, 100], playerLevel: 20, neon: true });
    expect(rawProduction(state)).toBe(607500n);
    expect(candidateBase('portfolio-paced', state, 'manual')).toBe('4860000');
    expect(candidateBase('portfolio-paced', state, 'dispatcher')).toBe('607500');
    expect(VEHICLE_CATALOG).toHaveLength(6);
    expect(TUNING_CATALOG).toHaveLength(12);
    expect(STARTER_JOB.reward).toBe('2500');
  });
});
