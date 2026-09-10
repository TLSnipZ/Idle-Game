/** Emit historical fixture contracts from current typed state; production never imports this. */
export function stringifySaveFixture(value: unknown): string {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value);
  const version: unknown = Object.getOwnPropertyDescriptor(value, 'version')?.value;
  const state: unknown = Object.getOwnPropertyDescriptor(value, 'state')?.value;
  if (typeof version !== 'number' || version < 4 || version >= 17
    || typeof state !== 'object' || state === null) return JSON.stringify(value);
  const automation: unknown = Object.getOwnPropertyDescriptor(state, 'automation')?.value;
  const garage: unknown = Object.getOwnPropertyDescriptor(state, 'garage')?.value;
  const ids: unknown = garage && typeof garage === 'object'
    ? Object.getOwnPropertyDescriptor(garage, 'ownedVehicleIds')?.value : undefined;
  const historicalGarage = version >= 6 && version < 16 && Array.isArray(ids) ? {
    garage: { ...(typeof garage === 'object' && garage !== null ? garage : {}), ownedVehicleIds: ids.map(
      id => id === 'vehicle:kairo-kx-r' ? 'vehicle:starter-sport-sedan' : id,
    ) },
  } : {};
  const historicalAutomation: { automation?: unknown } = {};
  if (typeof automation === 'object' && automation !== null && !Array.isArray(automation)) {
    const descriptors = Object.getOwnPropertyDescriptors(automation);
    delete descriptors.businessAutoUpgradeTargetId;
    if (version < 15) {
      delete descriptors.enabledIds;
      delete descriptors.businessAutoUpgradeElapsedMs;
    }
    historicalAutomation.automation = Object.create(Object.getPrototypeOf(automation), descriptors);
  }
  return JSON.stringify({ ...value, state: { ...state, ...historicalGarage, ...historicalAutomation } });
}
