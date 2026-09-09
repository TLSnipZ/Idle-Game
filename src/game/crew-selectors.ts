import { CREW_CATALOG, CREW_SLOTS, findCrewMember, requireCrewState } from '../features/crew';
import { canAfford } from '../features/economy';
import { evaluateRequirements } from './requirements';
import type { GameState } from './game-state';

export function selectCrew(state: GameState) {
  requireCrewState(state.crew);
  const slots = CREW_SLOTS.map(slot => ({ ...slot, occupant: findCrewMember(state.crew.assignments[slot.id]) ?? null }));
  return { recruitedCrewCount: state.crew.recruitedIds.length, totalConfiguredCrew: CREW_CATALOG.length,
    activeAssignmentCount: slots.filter(slot => slot.occupant !== null).length, totalSlots: slots.length, slots };
}
export function selectCrewMember(state: GameState, id: unknown) {
  requireCrewState(state.crew);
  const definition = findCrewMember(id);
  if (!definition) return null;
  const recruited = state.crew.recruitedIds.includes(definition.id);
  const assignment = CREW_SLOTS.find(slot => state.crew.assignments[slot.id] === definition.id) ?? null;
  const requirements = evaluateRequirements(state, definition.requirements);
  const affordable = canAfford(state.economy, definition.recruitmentCost);
  const compatibleSlots = CREW_SLOTS.filter(slot => definition.allowedSlots.includes(slot.id)).map(slot => ({
    ...slot, occupant: findCrewMember(state.crew.assignments[slot.id]) ?? null,
    canAssign: recruited && assignment === null,
  }));
  return { definition, recruited, assignment, compatibleSlots, requirements, affordable,
    activeEffect: assignment ? definition.effect : null, canRecruit: !recruited && requirements.met && affordable };
}
