import { findEvent, createInitialEventState } from '../features/events';
import type { EventChoice } from '../features/events';
import { spendCash, earnCash } from '../features/economy';
import type { EconomyError } from '../features/economy';
import { gainHeat, reduceHeat } from '../features/heat';
import { validateSaveState } from './save-schema';
import type { GameState } from './game-state';

export type EventResolutionResult =
  | { readonly ok: true; readonly state: GameState; readonly choice: EventChoice }
  | { readonly ok: false; readonly state: GameState;
      readonly error: EconomyError | 'no-pending-event' | 'wrong-event' | 'unknown-choice' };

/** Resolve exactly the current identity, never an arbitrary catalog reward. No RNG. */
export function resolveEventChoice(
  state: GameState, eventId: unknown, choiceId: unknown,
): EventResolutionResult {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative event resolution state');
  if (state.events.pendingEventId === null) return { ok: false, state, error: 'no-pending-event' };
  if (state.events.pendingEventId !== eventId) return { ok: false, state, error: 'wrong-event' };
  const choice = findEvent(eventId)?.choices.find(choice => choice.id === choiceId);
  if (!choice) return { ok: false, state, error: 'unknown-choice' };

  // Keep all intermediate slices local, including Warehouse's full spend then credit.
  const payment = spendCash(state.economy, choice.cost);
  if (!payment.ok) return { ok: false, state, error: payment.error };
  const credit = earnCash(payment.state, choice.reward);
  if (!credit.ok) return { ok: false, state, error: credit.error };
  const city = choice.heatChange >= 0
    ? gainHeat(state.city, choice.heatChange)
    : reduceHeat(state.city, -choice.heatChange);
  return {
    ok: true, choice,
    state: { ...state, economy: credit.state, city, events: createInitialEventState() },
  };
}
