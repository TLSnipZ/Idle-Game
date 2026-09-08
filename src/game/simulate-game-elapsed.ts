import { decayHeat } from '../features/heat';
import { isElapsedMs } from '../features/economy';
import { requireXp } from '../features/progression';
import { simulateElapsed } from './simulate-elapsed';
import { simulateAutomation } from './simulate-automation';
import { subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { AutomationSimulationResult } from './simulate-automation';
import type { GameState } from './game-state';

export type GameSimulationResult = Extract<AutomationSimulationResult, { ok: false }>
  | (Extract<AutomationSimulationResult, { ok: true }> & { readonly businessIncome: Money });
/** One transaction: production, start-tier job rewards/XP, batch Heat gain, then cooling. */
export function simulateGameElapsed(state: GameState, elapsedMs: unknown): GameSimulationResult {
  if (!isElapsedMs(elapsedMs)) return { ok: false, state, error: 'invalid-elapsed' };
  const business = simulateElapsed(state, elapsedMs);
  if (!business.ok) return business;
  requireXp(state.progression.xp);
  const automation = simulateAutomation(business.state, elapsedMs);
  if (!automation.ok) return { ...automation, state };
  const income = subtractMoney(business.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  const city = decayHeat(automation.state.city, elapsedMs);
  return { ...automation, state: city === automation.state.city ? automation.state : { ...automation.state, city }, businessIncome: income.value };
}
