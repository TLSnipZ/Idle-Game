import { evaluateRequirements } from './requirements';
import type { RequirementResult } from './requirement';
import { DELIVERY_DISPATCHER, findAutomation } from '../features/automation';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';

export type PurchaseAutomationResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'unknown-automation' | 'already-unlocked' }
  | { readonly ok: false; readonly state: GameState; readonly error: 'prerequisite-not-met'; readonly requirements: RequirementResult };
export function purchaseAutomation(state: GameState, id: unknown): PurchaseAutomationResult {
  const definition = findAutomation(id);
  if (!definition) return { ok: false, state, error: 'unknown-automation' };
  if (state.automation.unlockedIds.includes(definition.id)) return { ok: false, state, error: 'already-unlocked' };
  const requirements = evaluateRequirements(state, definition.requirements);
  if (!requirements.met) return { ok: false, state, error: 'prerequisite-not-met', requirements };
  const payment = spendCash(state.economy, definition.purchaseCost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state,
    automation: { ...state.automation, unlockedIds: [...state.automation.unlockedIds, definition.id],
      ...(definition.id === DELIVERY_DISPATCHER.id ? { starterJobElapsedMs: 0 } : { businessAutoUpgradeElapsedMs: 0 }) } } };
}
