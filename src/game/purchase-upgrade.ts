import { evaluateRequirements } from './requirements';
import type { RequirementResult } from './requirement';
import { findUpgrade } from '../features/upgrades';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';
export type PurchaseUpgradeResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'unknown-upgrade' | 'already-purchased' }
  | { readonly ok: false; readonly state: GameState; readonly error: 'prerequisite-not-met'; readonly requirements: RequirementResult };
export function purchaseUpgrade(state: GameState, id: unknown): PurchaseUpgradeResult {
  const upgrade = findUpgrade(id);
  if (!upgrade) return { ok: false, state, error: 'unknown-upgrade' };
  if (state.upgrades.purchasedIds.includes(upgrade.id)) return { ok: false, state, error: 'already-purchased' };
  const requirements = evaluateRequirements(state, upgrade.requirements);
  if (!requirements.met) return { ok: false, state, error: 'prerequisite-not-met', requirements };
  const payment = spendCash(state.economy, upgrade.purchaseCost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state,
    upgrades: { purchasedIds: [...state.upgrades.purchasedIds, upgrade.id] } } };
}
