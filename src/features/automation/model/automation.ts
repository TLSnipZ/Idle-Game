import { DELIVERY_DISPATCHER } from '../config/automation-config';

export type AutomationId = `automation:${string}`;
export interface AutomationState {
  readonly unlockedIds: readonly AutomationId[];
  readonly starterJobElapsedMs: number;
}
export function createInitialAutomationState(): AutomationState {
  return { unlockedIds: [], starterJobElapsedMs: 0 };
}
/** Full external slice validation; locked progress must be zero. */
export function isAutomationState(value: unknown): value is AutomationState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 2 || !keys.includes('unlockedIds') || !keys.includes('starterJobElapsedMs')) return false;
  const ids: unknown = Object.getOwnPropertyDescriptor(value, 'unlockedIds')?.value;
  const progress: unknown = Object.getOwnPropertyDescriptor(value, 'starterJobElapsedMs')?.value;
  return Array.isArray(ids) && (ids.length === 0 || (ids.length === 1 && ids[0] === DELIVERY_DISPATCHER.id))
    && typeof progress === 'number' && Number.isSafeInteger(progress) && progress >= 0
    && progress < DELIVERY_DISPATCHER.intervalMs && (ids.length > 0 || progress === 0);
}
