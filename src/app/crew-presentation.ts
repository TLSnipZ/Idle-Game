import { findCrewMember, findCrewSlot } from '../features/crew';
import type { CrewEffect } from '../features/crew';
import { selectCrewMember } from '../game/crew-selectors';
import type { GameState } from '../game/game-state';
import type { CrewCommandResult } from '../game/crew-commands';
import { formatCash } from '../features/economy/ui';
import { formatModifier } from './stat-format';

export function describeCrewEffect(effect: CrewEffect): string {
  if (effect.type === 'heat-decay-interval') return `Heat cools every ${effect.intervalMs / 1000}s`;
  return `${formatModifier(effect.modifier)} ${effect.modifier.target.stat === 'job-reward' ? 'Job & Dispatcher cash' : 'global business production'}`;
}
export function crewPresentation(state: GameState, id: unknown) {
  const view = selectCrewMember(state, id);
  if (!view) return null;
  return { ...view, effect: describeCrewEffect(view.definition.effect),
    status: view.assignment ? 'ACTIVE' : view.recruited ? 'RECRUITED' : !view.requirements.met ? 'LOCKED' : 'AVAILABLE',
    availability: view.assignment ? `Active in ${view.assignment.name}` : view.recruited ? 'Unassigned — effect inactive'
      : !view.requirements.met ? 'Meet the recruitment requirements' : !view.affordable ? 'Insufficient cash' : 'Ready to recruit',
  };
}
export function describeCrewCommand(result: CrewCommandResult, action: 'recruit' | 'assign' | 'unassign', id?: unknown, slotId?: unknown): string {
  if (!result.ok) {
    switch (result.error) {
      case 'requirements-not-met': return `Recruitment locked: ${result.requirements.requirements.filter(r => !r.met).map(r => r.description).join('; ')}.`;
      case 'insufficient-funds': return 'Not enough cash to recruit. Nothing was spent.';
      case 'already-recruited': return 'This specialist is already recruited.';
      case 'not-recruited': return 'Recruit this specialist before assigning them.';
      case 'incompatible-slot': return 'This specialist cannot fill that slot.';
      case 'already-assigned': return 'This specialist is already assigned. Unassign them before moving slots.';
      case 'already-empty': return 'This slot is already empty.';
      case 'unknown-slot': case 'unknown-crew-member': case 'invalid-amount': case 'overflow': return 'Crew action failed. Nothing changed.';
    }
  }
  const slot = findCrewSlot(slotId);
  if (action === 'unassign') return `${slot?.name ?? 'Crew slot'} unassigned. Specialist remains recruited; effect inactive.`;
  const member = findCrewMember(id);
  if (!member) return 'Crew updated.';
  return action === 'recruit' ? `${member.name} recruited. -${formatCash(member.recruitmentCost)} · Available for ${member.allowedSlots.map(id => findCrewSlot(id)?.name).join(', ')}. Effect inactive until assigned.`
    : `${member.name} assigned to ${slot?.name}. ${describeCrewEffect(member.effect)}.`;
}
