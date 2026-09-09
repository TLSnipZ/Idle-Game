import { BUSINESS_AUTO_UPGRADER, findAutomation } from '../features/automation';
import type { GameState } from './game-state';
export type ToggleAutomationResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: 'unknown-automation' | 'not-toggleable' | 'automation-not-owned' | 'invalid-enabled' };
export function setAutomationEnabled(state: GameState, id: unknown, enabled: unknown): ToggleAutomationResult {
  const definition = findAutomation(id);
  if (!definition) return { ok: false, state, error: 'unknown-automation' };
  if (definition.id !== BUSINESS_AUTO_UPGRADER.id) return { ok: false, state, error: 'not-toggleable' };
  if (!state.automation.unlockedIds.includes(definition.id)) return { ok: false, state, error: 'automation-not-owned' };
  if (typeof enabled !== 'boolean') return { ok: false, state, error: 'invalid-enabled' };
  if (state.automation.enabledIds.includes(definition.id) === enabled) return { ok: true, state };
  return { ok: true, state: { ...state, automation: { ...state.automation,
    enabledIds: enabled ? [definition.id] : [] } } };
}
