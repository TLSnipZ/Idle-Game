import { advanceEventOpportunity, eventChanceSucceeds, selectEventId } from '../features/events';
import type { RandomSource } from '../features/events';
import { eligibleEvents } from './event-selectors';
import { simulateGameElapsed } from './simulate-game-elapsed';
import type { GameSimulationResult } from './simulate-game-elapsed';
import type { GameState } from './game-state';

/** Online-only composition. Economy/Heat finishes before current spawn eligibility. */
export function simulateOnlineElapsed(
  state: GameState, elapsedMs: number, random: RandomSource,
): GameSimulationResult {
  const result = simulateGameElapsed(state, elapsedMs);
  if (!result.ok) return result;
  const opportunity = advanceEventOpportunity(result.state.events, elapsedMs);
  let events = opportunity.state;
  if (opportunity.attempt) {
    const eligible = eligibleEvents(result.state);
    // No eligible content: not even the chance roll is consumed.
    if (eligible.length > 0 && eventChanceSucceeds(random.next())) {
      events = {
        ...events,
        pendingEventId: selectEventId(eligible.map(event => event.id), random.next()),
      };
    }
  }
  return events === result.state.events ? result : { ...result, state: { ...result.state, events } };
}
