import { isElapsedMs } from '../features/economy';

export const MANUAL_JOB_INTERVAL_MS = 10_000;

export interface ManualJobState {
  readonly elapsedMs: number;
}

export function isManualJobState(value: unknown): value is ManualJobState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  if (Reflect.ownKeys(value).length !== 1) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, 'elapsedMs');
  const elapsed: unknown = descriptor?.value;
  return descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value')
    && typeof elapsed === 'number' && Number.isSafeInteger(elapsed)
    && elapsed >= 0 && elapsed < MANUAL_JOB_INTERVAL_MS;
}

/** Missing state is the canonical ready state; only pending progress is persisted. */
export function manualJobRemainingMs(state: ManualJobState | undefined): number {
  if (state === undefined) return 0;
  if (!isManualJobState(state)) throw new RangeError('Invalid authoritative manual-job readiness');
  return MANUAL_JOB_INTERVAL_MS - state.elapsedMs;
}

export function isManualJobReady(state: ManualJobState | undefined): boolean {
  return state === undefined;
}

export function consumeManualJobReadiness(state: ManualJobState | undefined): ManualJobState {
  if (state !== undefined && !isManualJobState(state))
    throw new RangeError('Invalid authoritative manual-job readiness');
  return { elapsedMs: 0 };
}

/** Elapsed time restores at most one ready manual action; no backlog is banked. */
export function advanceManualJobReadiness(state: ManualJobState | undefined, elapsedMs: unknown): ManualJobState | undefined {
  if (state !== undefined && !isManualJobState(state))
    throw new RangeError('Invalid authoritative manual-job readiness');
  if (!isElapsedMs(elapsedMs)) throw new RangeError('Invalid elapsed time');
  if (state === undefined || elapsedMs === 0) return state;
  const elapsed = state.elapsedMs + elapsedMs;
  return elapsed >= MANUAL_JOB_INTERVAL_MS ? undefined : { elapsedMs: elapsed };
}
