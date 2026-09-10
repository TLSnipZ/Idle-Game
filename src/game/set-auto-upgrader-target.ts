import { BUSINESS_AUTO_UPGRADER } from '../features/automation';
import { findBusiness, ownsBusiness } from '../features/businesses';
import type { GameState } from './game-state';

export function setBusinessAutoUpgraderTarget(state: GameState, id: unknown):
  { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: 'unknown-business' | 'not-owned' | 'automation-not-owned' } {
  const target = findBusiness(id);
  if (!target) return { ok: false, state, error: 'unknown-business' };
  if (!state.automation.unlockedIds.includes(BUSINESS_AUTO_UPGRADER.id))
    return { ok: false, state, error: 'automation-not-owned' };
  if (!ownsBusiness(state.businesses, target.id)) return { ok: false, state, error: 'not-owned' };
  if (state.automation.businessAutoUpgradeTargetId === target.id) return { ok: true, state };
  return { ok: true, state: { ...state, automation: { ...state.automation, businessAutoUpgradeTargetId: target.id } } };
}
