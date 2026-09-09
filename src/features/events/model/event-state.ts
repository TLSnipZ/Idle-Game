import { EVENT_OPPORTUNITY_MS, EVENT_SPAWN_CHANCE, findEvent } from '../config/event-config';
import type { EventState, EventId } from './event';
import { isElapsedMs } from '../../economy';
export function createInitialEventState(): EventState { return {opportunityElapsedMs:0,pendingEventId:null}; }
export function isEventState(value: unknown): value is EventState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Reflect.ownKeys(value).length !== 2) return false;
  const elapsed = Object.getOwnPropertyDescriptor(value,'opportunityElapsedMs');
  const pending = Object.getOwnPropertyDescriptor(value,'pendingEventId');
  if (!elapsed?.enumerable || !pending?.enumerable || !Object.hasOwn(elapsed,'value') || !Object.hasOwn(pending,'value')) return false;
  return isElapsedMs(elapsed.value) && elapsed.value < EVENT_OPPORTUNITY_MS && (pending.value === null || findEvent(pending.value) !== undefined);
}
export function requireEventState(value: unknown): asserts value is EventState {
  if (!isEventState(value)) throw new RangeError('Invalid authoritative event state');
}
/** Only computes cadence. Pending freezes it; arbitrarily many windows yield one opportunity. */
export function advanceEventOpportunity(state: EventState, elapsedMs: number) {
  requireEventState(state);
  if (!isElapsedMs(elapsedMs)) throw new RangeError('Invalid event elapsed');
  if (state.pendingEventId !== null || elapsedMs === 0) return {state,attempt:false};
  const total = BigInt(state.opportunityElapsedMs) + BigInt(elapsedMs);
  const remainder = Number(total % BigInt(EVENT_OPPORTUNITY_MS));
  return {state: remainder === state.opportunityElapsedMs ? state : {...state,opportunityElapsedMs:remainder},attempt:total >= BigInt(EVENT_OPPORTUNITY_MS)};
}
export function requireNormalizedRandom(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Invalid normalized RNG value');
}
export function eventChanceSucceeds(value: number): boolean { requireNormalizedRandom(value); return value < EVENT_SPAWN_CHANCE; }
export function selectEventId(eligible: readonly EventId[], value: number): EventId | null {
  requireNormalizedRandom(value);
  return eligible[Math.floor(value * eligible.length)] ?? null;
}
