import { AUTOMATIONS, BUSINESS_AUTO_UPGRADER, DELIVERY_DISPATCHER } from '../config/automation-config';

export type AutomationId = `automation:${string}`;
export interface AutomationState {
  readonly unlockedIds: readonly AutomationId[];
  readonly starterJobElapsedMs: number;
  readonly enabledIds: readonly AutomationId[];
  readonly businessAutoUpgradeElapsedMs: number;
}
export function createInitialAutomationState(): AutomationState {
  return { unlockedIds: [], starterJobElapsedMs: 0, enabledIds: [], businessAutoUpgradeElapsedMs: 0 };
}
function progress(value: unknown, interval: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value < interval;
}
function validIds(value: unknown, allowed: readonly string[]): value is AutomationId[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > allowed.length || Reflect.ownKeys(value).length !== value.length + 1) return false;
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    const id: unknown = descriptor?.value;
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || typeof id !== 'string'
      || !allowed.includes(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}
/** Current shape only; acquisition requirements are never retention requirements. */
export function isAutomationState(value: unknown): value is AutomationState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  const fields = ['unlockedIds', 'starterJobElapsedMs', 'enabledIds', 'businessAutoUpgradeElapsedMs'];
  if (Reflect.ownKeys(value).length !== fields.length || !fields.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
  })) return false;
  const ids: unknown = Object.getOwnPropertyDescriptor(value, 'unlockedIds')?.value;
  const enabled: unknown = Object.getOwnPropertyDescriptor(value, 'enabledIds')?.value;
  const jobs: unknown = Object.getOwnPropertyDescriptor(value, 'starterJobElapsedMs')?.value;
  const upgrades: unknown = Object.getOwnPropertyDescriptor(value, 'businessAutoUpgradeElapsedMs')?.value;
  return validIds(ids, AUTOMATIONS.map(definition => definition.id))
    && validIds(enabled, [BUSINESS_AUTO_UPGRADER.id])
    && enabled.every(id => ids.includes(id))
    && progress(jobs, DELIVERY_DISPATCHER.intervalMs) && (ids.includes(DELIVERY_DISPATCHER.id) || jobs === 0)
    && progress(upgrades, BUSINESS_AUTO_UPGRADER.intervalMs) && (ids.includes(BUSINESS_AUTO_UPGRADER.id) || upgrades === 0);
}
