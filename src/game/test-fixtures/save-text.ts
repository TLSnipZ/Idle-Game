/** Existing phase fixtures use today's typed state. Emit the historical two-field
 * automation slice only when explicitly serializing an older save envelope. */
export function stringifySaveFixture(value: unknown): string {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value);
  const version: unknown = Object.getOwnPropertyDescriptor(value, 'version')?.value;
  const state: unknown = Object.getOwnPropertyDescriptor(value, 'state')?.value;
  if (typeof version !== 'number' || version < 4 || version >= 15
    || typeof state !== 'object' || state === null) return JSON.stringify(value);
  const automation: unknown = Object.getOwnPropertyDescriptor(state, 'automation')?.value;
  if (typeof automation !== 'object' || automation === null || Array.isArray(automation)) return JSON.stringify(value);
  const descriptors = Object.getOwnPropertyDescriptors(automation);
  delete descriptors.enabledIds;
  delete descriptors.businessAutoUpgradeElapsedMs;
  return JSON.stringify({ ...value, state: { ...state, automation: Object.create(Object.getPrototypeOf(automation), descriptors) } });
}
