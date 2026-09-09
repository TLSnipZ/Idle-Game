import { CREW_CATALOG } from '../../features/crew';
import type { CrewState } from '../../features/crew';
import type { GameState } from '../game-state';
import { territoryState } from './territory-state';
export function crewState(assignments: CrewState['assignments'] = { operations: null, logistics: null }): GameState {
  return { ...territoryState(true), crew: { recruitedIds: CREW_CATALOG.map(member => member.id), assignments } };
}
