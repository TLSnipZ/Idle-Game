import { requireXp } from '../features/progression';
import { simulateElapsed } from './simulate-elapsed';
import { simulateAutomation } from './simulate-automation';
import { subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import type { AutomationSimulationResult } from './simulate-automation';
import type { GameState } from './game-state';

export type GameSimulationResult = Extract<AutomationSimulationResult, { ok: false }>
  | (Extract<AutomationSimulationResult, { ok: true }> & { readonly businessIncome: Money });
/** One transaction: business production, then delegated jobs, for the same interval. */
export function simulateGameElapsed(state: GameState, elapsedMs: unknown): GameSimulationResult {
  const business = simulateElapsed(state, elapsedMs);
  if (!business.ok) return business;
  requireXp(state.progression.xp);
  const automation = simulateAutomation(business.state, elapsedMs);
  if (!automation.ok) return { ...automation, state };
  const income = subtractMoney(business.state.economy.cash, state.economy.cash);
  if (!income.ok) throw new Error('Production must not reduce cash');
  return { ...automation, businessIncome: income.value };
}
