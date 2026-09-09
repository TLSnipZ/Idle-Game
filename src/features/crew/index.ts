export type { CrewMemberId, CrewSlotId, CrewState, CrewMemberDefinition, CrewEffect } from './model/crew';
export { CREW_CATALOG, CREW_SLOTS, RICO_VALE, MARA_KNOX, JAX_MERCER, findCrewMember, findCrewSlot } from './config/crew-config';
export { createInitialCrewState, isCrewState, requireCrewState, activeCrewMembers, collectCrewModifiers } from './model/crew-state';
