import { isElapsedMs } from '../features/economy';

export const MANUAL_JOB_INTERVAL_MS = 10_000;

export interface ManualJobState {
  readonly elapsedMs: number;
}

export function createInitialManualJobState(): ManualJobState {
  return { elapsedMs: MANUAL_JOB_INTERVAL_MS };
}

export function isManualJobState(value: unknown): value is ManualJobState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  if (Reflect.ownKeys(value).length !== 1) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, 'elapsedMs');
  const elapsed: unknown = descriptor?.value;
  return descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value')
    && typeof elapsed === 'number' && Number.isSafeInteger(elapsed)
    && elapsed >= 0 && elapsed <= MANUAL_JOB_INTERVAL_MS;
}

export function manualJobRemainingMs(state: ManualJobState): number {
  if (!isManualJobState(state)) throw new RangeError('Invalid authoritative manual-job readiness');
  return MANUAL_JOB_INTERVAL_MS - state.elapsedMs;
}

export function isManualJobReady(state: ManualJobState): boolean {
  return manualJobRemainingMs(state) === 0;
}

export function consumeManualJobReadiness(state: ManualJobState): ManualJobState {
  if (!isManualJobState(state)) throw new RangeError('Invalid authoritative manual-job readiness');
  return { elapsedMs: 0 };
}

/** Elapsed time restores at most one ready manual action; no backlog is banked. */
export function advanceManualJobReadiness(state: ManualJobState, elapsedMs: unknown): ManualJobState {
  if (!isManualJobState(state)) throw new RangeError('Invalid authoritative manual-job readiness');
  if (!isElapsedMs(elapsedMs)) throw new RangeError('Invalid elapsed time');
  if (elapsedMs === 0 || state.elapsedMs === MANUAL_JOB_INTERVAL_MS) return state;
  return { elapsedMs: Math.min(MANUAL_JOB_INTERVAL_MS, state.elapsedMs + elapsedMs) };
}
