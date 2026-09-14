import type { BusinessId } from '../features/businesses';
import { BUSINESS_AUTO_UPGRADER, isAutomationState } from '../features/automation';
import { simulateAutoUpgrader } from './simulate-auto-upgrader';
import type { UpgradeBusinessResult } from './upgrade-business';
import { countStatistic, observePeakHeat } from './statistics';
import type { StatisticsError } from '../features/statistics';
import { unlockEligibleAchievements } from './achievements';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { coolDistricts } from '../features/territories';
import { isElapsedMs } from '../features/economy';
import { requireXp } from '../features/progression';
import { simulateElapsed } from './simulate-elapsed';
import { simulateAutomation } from './simulate-automation';
import { moneyFromMinorUnits, subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { AutomationSimulationResult } from './simulate-automation';
import { advanceManualJobReadiness } from './manual-job-readiness';
import type { GameState } from './game-state';

export type GameSimulationResult = { readonly ok: false; readonly state: GameState; readonly error: StatisticsError | 'simulation-limit' }
  | Extract<UpgradeBusinessResult, { ok: false }>
  | Extract<AutomationSimulationResult, { ok: false }>
  | (Extract<AutomationSimulationResult, { ok: true }> & { readonly businessIncome: Money; readonly autoUpgrader?: { readonly targetId: BusinessId; readonly levelsPurchased: number; readonly spent: Money } });
/** One transaction: production, start-tier job rewards/XP, batch Heat gain, cooling, then manual readiness. */
export function simulateGameElapsed(state: GameState, elapsedMs: unknown): GameSimulationResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, state, error: 'invalid-elapsed' };
  if (elapsedMs === 0) {
    if (!isAutomationState(state.automation)) throw new RangeError('Invalid authoritative automation');
    advanceManualJobReadiness(state.manualJobs, 0);
    return { ok: true, state, businessIncome: moneyFromMinorUnits('0'),
      automation: { completedJobs: 0, income: moneyFromMinorUnits('0'), xpEarned: 0 } };
  }
  if (state.automation.enabledIds.includes(BUSINESS_AUTO_UPGRADER.id)) {
    const upgraded = simulateAutoUpgrader(state, elapsedMs);
    if (!upgraded.ok) return upgraded;
    return { ...upgraded, state: { ...upgraded.state, manualJobs: advanceManualJobReadiness(upgraded.state.manualJobs, elapsedMs) } };
  }
  const business = simulateElapsed(state, elapsedMs);
  if (!business.ok) return business;
  requireXp(state.progression.xp);
  const automation = simulateAutomation(business.state, elapsedMs);
  if (!automation.ok) return { ...automation, state };
  const income = subtractMoney(business.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  const city = coolDistricts(automation.state.city, elapsedMs, getHeatDecayIntervalMs(state));
  const candidate = city === automation.state.city ? automation.state : { ...automation.state, city };
  const counted = countStatistic(state, candidate, 'automatedJobsCompleted', automation.automation.completedJobs);
  if (!counted.ok) return counted;
  const achieved = unlockEligibleAchievements(observePeakHeat(counted.state)).state;
  return { ...automation, state: { ...achieved, manualJobs: advanceManualJobReadiness(achieved.manualJobs, elapsedMs) }, businessIncome: income.value };
}
