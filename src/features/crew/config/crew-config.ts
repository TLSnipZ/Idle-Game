import { moneyFromMinorUnits } from '../../economy';
import { STARTER_BUSINESS } from '../../businesses';
import { NEON_MILE } from '../../territories';
import type { Requirement } from '../../../game/requirement';
import type { CrewMemberDefinition, CrewSlotId } from '../model/crew';

export const CREW_SLOTS = Object.freeze([
  Object.freeze({ id: 'operations', name: 'Operations' }),
  Object.freeze({ id: 'logistics', name: 'Logistics' }),
] as const);
const operations: readonly CrewSlotId[] = Object.freeze(['operations']);
export const RICO_VALE: CrewMemberDefinition = Object.freeze({
  id: 'crew:rico-vale', name: 'Rico Vale', description: 'A waterfront negotiator who makes every delivery pay better.',
  recruitmentCost: moneyFromMinorUnits('2000000'), allowedSlots: operations,
  requirements: Object.freeze<Requirement[]>([{ type: 'player-level', minimumLevel: 8 }]),
  effect: Object.freeze({ type: 'modifier', modifier: Object.freeze({
    id: 'modifier:crew-rico-job-reward', sourceId: 'crew:rico-vale',
    target: Object.freeze({ stat: 'job-reward' }), operation: 'multiply-basis-points', bonusBasisPoints: 1000,
  }) }),
});
export const MARA_KNOX: CrewMemberDefinition = Object.freeze({
  id: 'crew:mara-knox', name: 'Mara Knox', description: 'A discreet local fixer who helps attention fade faster.',
  recruitmentCost: moneyFromMinorUnits('3000000'), allowedSlots: operations,
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 10 }, { type: 'territory-owned', territoryId: NEON_MILE.id },
  ]), effect: Object.freeze({ type: 'heat-decay-interval', intervalMs: 45000 }),
});
export const JAX_MERCER: CrewMemberDefinition = Object.freeze({
  id: 'crew:jax-mercer', name: 'Jax Mercer', description: 'An operations mechanic who keeps the business running efficiently.',
  recruitmentCost: moneyFromMinorUnits('4000000'), allowedSlots: Object.freeze<CrewSlotId[]>(['logistics']),
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 12 },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 15 },
  ]), effect: Object.freeze({ type: 'modifier', modifier: Object.freeze({
    id: 'modifier:crew-jax-business-production', sourceId: 'crew:jax-mercer',
    target: Object.freeze({ stat: 'business-production', businessId: null }), operation: 'multiply-basis-points', bonusBasisPoints: 1500,
  }) }),
});
/** Presentation order is explicit, independent of stable modifier-ID evaluation order. */
export const CREW_CATALOG: readonly CrewMemberDefinition[] = Object.freeze([RICO_VALE, MARA_KNOX, JAX_MERCER]);
export function findCrewMember(id: unknown): CrewMemberDefinition | undefined { return CREW_CATALOG.find(member => member.id === id); }
export function findCrewSlot(id: unknown) { return CREW_SLOTS.find(slot => slot.id === id); }
