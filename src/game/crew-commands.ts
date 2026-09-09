import { countStatistic } from './statistics';
import type { StatisticsError } from '../features/statistics';
import { CREW_SLOTS, findCrewMember, findCrewSlot } from '../features/crew';
import { spendCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import type { GameState } from './game-state';
import type { RequirementResult } from './requirement';
import { evaluateRequirements } from './requirements';
import { validateSaveState } from './save-schema';

export type CrewCommandError = StatisticsError | EconomyError | 'unknown-crew-member' | 'already-recruited'
  | 'unknown-slot' | 'not-recruited' | 'incompatible-slot' | 'already-assigned' | 'already-empty';
export type CrewCommandResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: CrewCommandError }
  | { readonly ok: false; readonly state: GameState; readonly error: 'requirements-not-met'; readonly requirements: RequirementResult };
function requireState(state: GameState) {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative state for Crew command');
}
export function recruitCrewMember(state: GameState, id: unknown): CrewCommandResult {
  requireState(state);
  const member = findCrewMember(id);
  if (!member) return { ok: false, state, error: 'unknown-crew-member' };
  if (state.crew.recruitedIds.includes(member.id)) return { ok: false, state, error: 'already-recruited' };
  const requirements = evaluateRequirements(state, member.requirements);
  if (!requirements.met) return { ok: false, state, error: 'requirements-not-met', requirements };
  const payment = spendCash(state.economy, member.recruitmentCost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  return countStatistic(state, { ...state, economy: payment.state,
    crew: { ...state.crew, recruitedIds: [...state.crew.recruitedIds, member.id] } }, 'crewMembersRecruited');
}
/** Explicit replacement of the target slot; never moves someone from another slot. */
export function assignCrewMember(state: GameState, slotId: unknown, id: unknown): CrewCommandResult {
  requireState(state);
  const slot = findCrewSlot(slotId);
  if (!slot) return { ok: false, state, error: 'unknown-slot' };
  const member = findCrewMember(id);
  if (!member) return { ok: false, state, error: 'unknown-crew-member' };
  if (!state.crew.recruitedIds.includes(member.id)) return { ok: false, state, error: 'not-recruited' };
  if (CREW_SLOTS.some(candidate => state.crew.assignments[candidate.id] === member.id)) return { ok: false, state, error: 'already-assigned' };
  if (!member.allowedSlots.includes(slot.id)) return { ok: false, state, error: 'incompatible-slot' };
  return { ok: true, state: { ...state, crew: { ...state.crew,
    assignments: { ...state.crew.assignments, [slot.id]: member.id } } } };
}
/** Empty slots fail explicitly, so no-op requests do not trigger meaningful-command saves. */
export function unassignCrewSlot(state: GameState, slotId: unknown): CrewCommandResult {
  requireState(state);
  const slot = findCrewSlot(slotId);
  if (!slot) return { ok: false, state, error: 'unknown-slot' };
  if (state.crew.assignments[slot.id] === null) return { ok: false, state, error: 'already-empty' };
  return { ok: true, state: { ...state, crew: { ...state.crew,
    assignments: { ...state.crew.assignments, [slot.id]: null } } } };
}
