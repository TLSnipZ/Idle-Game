import { BUSINESS_AUTO_UPGRADER } from '../features/automation';
import { getBusinessLevel, MAX_BUSINESS_LEVEL } from '../features/businesses';
import { addMoney, earnCash, moneyFromMinorUnits, subtractMoney } from '../features/economy';
import { addXp } from '../features/progression';
import { decayHeat, dispatcherHeatGain, gainHeat } from '../features/heat';
import { unlockEligibleAchievements } from './achievements';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { planDispatcher } from './simulate-automation';
import { simulateElapsed } from './simulate-elapsed';
import { countStatistic, observePeakHeat } from './statistics';
import { upgradeBusiness } from './upgrade-business';
import type { UpgradeBusinessResult } from './upgrade-business';
import type { GameState } from './game-state';
import type { GameSimulationResult } from './simulate-game-elapsed';

export function attemptBusinessAutoUpgrade(state: GameState):
  { readonly ok: true; readonly state: GameState; readonly outcome: 'upgraded' | 'insufficient-funds' | 'max-level' | 'not-owned' }
  | Extract<UpgradeBusinessResult, { ok: false }> {
  const result = upgradeBusiness(state, BUSINESS_AUTO_UPGRADER.targetBusinessId);
  if (result.ok) return { ...result, outcome: 'upgraded' };
  if (result.error === 'insufficient-funds' || result.error === 'not-owned') return { ok: true, state, outcome: result.error };
  if (result.error === 'max-level-reached') return { ok: true, state, outcome: 'max-level' };
  return result;
}

/** Business purchases are chronological. Dispatcher prefix differences preserve one
 * outer reward/XP batch; Heat and Events are never re-batched at purchase boundaries. */
export function simulateAutoUpgrader(state: GameState, elapsedMs: number): GameSimulationResult {
  const totalPlan = planDispatcher(state, elapsedMs);
  if (!totalPlan.ok) return totalPlan;
  let candidate = state;
  let elapsed = 0;
  let progress = state.automation.businessAutoUpgradeElapsedMs;
  let previousIncome = moneyFromMinorUnits('0');
  let previousXp = 0;
  let businessIncome = moneyFromMinorUnits('0');
  let spent = moneyFromMinorUnits('0');
  let levelsPurchased = 0;
  const interval = BUSINESS_AUTO_UPGRADER.intervalMs;
  while (elapsed < elapsedMs) {
    const level = getBusinessLevel(candidate.businesses, BUSINESS_AUTO_UPGRADER.targetBusinessId);
    // With no possible purchase, collapsing all remaining no-op attempts is exact.
    const noPurchases = level === null || level === MAX_BUSINESS_LEVEL;
    const segment = noPurchases ? elapsedMs - elapsed : Math.min(elapsedMs - elapsed, interval - progress);
    const business = simulateElapsed(candidate, segment);
    if (!business.ok) return { ...business, state };
    const produced = subtractMoney(business.state.economy.cash, candidate.economy.cash);
    if (!produced.ok) throw new Error('Production must not reduce cash');
    const combined = addMoney(businessIncome, produced.value);
    if (!combined.ok) return { ok: false, state, error: combined.error };
    businessIncome = combined.value;
    elapsed += segment;
    const prefix = elapsed === elapsedMs ? totalPlan : planDispatcher(state, elapsed);
    if (!prefix.ok) return { ...prefix, state };
    const income = subtractMoney(prefix.automation.income, previousIncome);
    if (!income.ok) throw new Error('Dispatcher income must not decrease');
    const cash = earnCash(business.state.economy, income.value);
    if (!cash.ok) return { ok: false, state, error: cash.error };
    const xp = addXp(business.state.progression, prefix.automation.xpEarned - previousXp);
    if (!xp.ok) return { ok: false, state, error: xp.error };
    previousIncome = prefix.automation.income;
    previousXp = prefix.automation.xpEarned;
    candidate = { ...business.state, economy: cash.state, progression: xp.state };
    const completed = BigInt(progress) + BigInt(segment) >= BigInt(interval);
    progress = Number((BigInt(progress) + BigInt(segment)) % BigInt(interval));
    if (completed && !noPurchases) {
      const attempt = attemptBusinessAutoUpgrade(candidate);
      if (!attempt.ok) return { ...attempt, state };
      if (attempt.outcome === 'upgraded') {
        const cost = subtractMoney(candidate.economy.cash, attempt.state.economy.cash);
        if (!cost.ok) throw new Error('An upgrade must spend cash');
        const sum = addMoney(spent, cost.value);
        if (!sum.ok) return { ok: false, state, error: sum.error };
        spent = sum.value;
        levelsPurchased += 1; // At most 99 successful purchases; not a lifetime counter.
      }
      candidate = attempt.state;
    }
  }
  const city = decayHeat(gainHeat(state.city, dispatcherHeatGain(totalPlan.automation.completedJobs)), elapsedMs, getHeatDecayIntervalMs(state));
  candidate = { ...candidate, city, automation: { ...candidate.automation,
    starterJobElapsedMs: totalPlan.progress, businessAutoUpgradeElapsedMs: progress } };
  const counted = countStatistic(state, candidate, 'automatedJobsCompleted', totalPlan.automation.completedJobs);
  if (!counted.ok) return counted;
  return { ok: true, state: unlockEligibleAchievements(observePeakHeat(counted.state)).state,
    automation: totalPlan.automation, businessIncome, autoUpgrader: { levelsPurchased, spent } };
}
