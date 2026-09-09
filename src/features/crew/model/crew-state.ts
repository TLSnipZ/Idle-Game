import { CREW_CATALOG, CREW_SLOTS, findCrewMember } from '../config/crew-config';
import type { CrewState, CrewMemberId } from './crew';

export function createInitialCrewState(): CrewState {
  return { recruitedIds: [], assignments: { operations: null, logistics: null } };
}
function record(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function keys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Reflect.ownKeys(value).length === expected.length && expected.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
  });
}
/** Structural ownership/compatibility only. Never re-evaluate recruitment gates here. */
export function isCrewState(value: unknown): value is CrewState {
  if (!record(value) || !keys(value, ['recruitedIds', 'assignments'])) return false;
  const { recruitedIds, assignments } = value;
  if (!Array.isArray(recruitedIds) || Object.getPrototypeOf(recruitedIds) !== Array.prototype
      || recruitedIds.length > CREW_CATALOG.length || Reflect.ownKeys(recruitedIds).length !== recruitedIds.length + 1
      || !record(assignments) || !keys(assignments, CREW_SLOTS.map(slot => slot.id))) return false;
  const recruited = new Set<CrewMemberId>();
  for (let index = 0; index < recruitedIds.length; index++) {
    const entry = Object.getOwnPropertyDescriptor(recruitedIds, index);
    if (!entry?.enumerable || !Object.hasOwn(entry, 'value')) return false;
    const member = findCrewMember(entry.value);
    if (!member || recruited.has(member.id)) return false;
    recruited.add(member.id);
  }
  const assigned = new Set<CrewMemberId>();
  for (const slot of CREW_SLOTS) {
    const id = assignments[slot.id];
    if (id === null) continue;
    const member = findCrewMember(id);
    if (!member || !recruited.has(member.id) || assigned.has(member.id) || !member.allowedSlots.includes(slot.id)) return false;
    assigned.add(member.id);
  }
  return true;
}
export function requireCrewState(value: unknown): asserts value is CrewState {
  if (!isCrewState(value)) throw new RangeError('Invalid authoritative crew state');
}
/** Assignment, never recruitment alone, activates an effect. */
export function activeCrewMembers(state: CrewState) {
  requireCrewState(state);
  return CREW_CATALOG.filter(member => CREW_SLOTS.some(slot => state.assignments[slot.id] === member.id));
}
export function collectCrewModifiers(state: CrewState) {
  return activeCrewMembers(state).flatMap(member => member.effect.type === 'modifier' ? [member.effect.modifier] : []);
}
