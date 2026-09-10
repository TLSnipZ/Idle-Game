import type { BusinessId } from '../features/businesses';
import { BUSINESS_AUTO_UPGRADER, isAutomationState } from '../features/automation';
import { simulateAutoUpgrader } from './simulate-auto-upgrader';
import type { UpgradeBusinessResult } from './upgrade-business';
import { countStatistic, observePeakHeat } from './statistics';
import type { StatisticsError } from '../features/statistics';
import { unlockEligibleAchievements } from './achievements';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
import { decayHeat } from '../features/heat';
import { isElapsedMs } from '../features/economy';
import { requireXp } from '../features/progression';
import { simulateElapsed } from './simulate-elapsed';
import { simulateAutomation } from './simulate-automation';
import { moneyFromMinorUnits, subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { AutomationSimulationResult } from './simulate-automation';
import type { GameState } from './game-state';

export type GameSimulationResult = { readonly ok: false; readonly state: GameState; readonly error: StatisticsError | 'simulation-limit' }
  | Extract<UpgradeBusinessResult, { ok: false }>
  | Extract<AutomationSimulationResult, { ok: false }>
  | (Extract<AutomationSimulationResult, { ok: true }> & { readonly businessIncome: Money; readonly autoUpgrader?: { readonly targetId: BusinessId; readonly levelsPurchased: number; readonly spent: Money } });
/** One transaction: production, start-tier job rewards/XP, batch Heat gain, then cooling. */
export function simulateGameElapsed(state: GameState, elapsedMs: unknown): GameSimulationResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, state, error: 'invalid-elapsed' };
  // A valid authoritative snapshot needs no evaluation or historical observation
  // when no time passed. Bootstrap's separate achievement policy remains outside.
  if (elapsedMs === 0) {
    // Retain the zero-time corruption check without planning rewards or production.
    if (!isAutomationState(state.automation)) throw new RangeError('Invalid authoritative automation');
    return { ok: true, state, businessIncome: moneyFromMinorUnits('0'),
      automation: { completedJobs: 0, income: moneyFromMinorUnits('0'), xpEarned: 0 } };
  }
  if (state.automation.enabledIds.includes(BUSINESS_AUTO_UPGRADER.id)) return simulateAutoUpgrader(state, elapsedMs);
  const business = simulateElapsed(state, elapsedMs);
  if (!business.ok) return business;
  requireXp(state.progression.xp);
  const automation = simulateAutomation(business.state, elapsedMs);
  if (!automation.ok) return { ...automation, state };
  const income = subtractMoney(business.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  const city = decayHeat(automation.state.city, elapsedMs, getHeatDecayIntervalMs(state));
  const candidate = city === automation.state.city ? automation.state : { ...automation.state, city };
  const counted = countStatistic(state, candidate, 'automatedJobsCompleted', automation.automation.completedJobs);
  if (!counted.ok) return counted;
  return { ...automation, state: unlockEligibleAchievements(observePeakHeat(counted.state)).state, businessIncome: income.value };
}
