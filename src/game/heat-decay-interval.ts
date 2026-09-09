import { activeCrewMembers } from '../features/crew';
import { HEAT_DECAY_INTERVAL_MS } from '../features/heat';
import type { GameState } from './game-state';

/** Derived configuration; no normalization or cooling occurs when assignments change. */
export function getHeatDecayIntervalMs(state: GameState): number {
  let interval = HEAT_DECAY_INTERVAL_MS;
  for (const member of activeCrewMembers(state.crew)) {
    if (member.effect.type === 'heat-decay-interval') interval = Math.min(interval, member.effect.intervalMs);
  }
  return interval;
}
