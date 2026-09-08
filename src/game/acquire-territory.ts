import { findTerritory } from '../features/territories';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import { evaluateRequirements } from './requirements';
import type { RequirementResult } from './requirement';
import type { GameState } from './game-state';
import { validateSaveState } from './save-schema';

export type AcquireTerritoryResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: EconomyError | 'unknown-territory' | 'already-owned' }
  | { readonly ok: false; readonly state: GameState; readonly error: 'requirements-not-met'; readonly requirements: RequirementResult };

export function acquireTerritory(state: GameState, id: unknown): AcquireTerritoryResult {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative state for territory acquisition');
  const territory = findTerritory(id);
  if (!territory) return { ok: false, state, error: 'unknown-territory' };
  if (state.city.ownedTerritoryIds.includes(territory.id)) return { ok: false, state, error: 'already-owned' };
  const requirements = evaluateRequirements(state, territory.requirements);
  if (!requirements.met) return { ok: false, state, error: 'requirements-not-met', requirements };
  const payment = spendCash(state.economy, territory.purchaseCost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return { ok: true, state: { ...state, economy: payment.state,
    city: { ownedTerritoryIds: [...state.city.ownedTerritoryIds, territory.id] } } };
}
