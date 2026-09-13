/** Emit historical fixture contracts from current typed state; production never imports this. */
export function stringifySaveFixture(value: unknown): string {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value);
  const version: unknown = Object.getOwnPropertyDescriptor(value, 'version')?.value;
  const state: unknown = Object.getOwnPropertyDescriptor(value, 'state')?.value;
  if (typeof version !== 'number' || version < 4 || version >= 18
    || typeof state !== 'object' || state === null) return JSON.stringify(value);
  const automation: unknown = Object.getOwnPropertyDescriptor(state, 'automation')?.value;
  const garage: unknown = Object.getOwnPropertyDescriptor(state, 'garage')?.value;
  const ids: unknown = garage && typeof garage === 'object'
    ? Object.getOwnPropertyDescriptor(garage, 'ownedVehicleIds')?.value : undefined;
  const historicalGarage: { garage?: unknown } = {};
  if (version >= 6 && typeof garage === 'object' && garage !== null) {
    const descriptors = Object.getOwnPropertyDescriptors(garage);
    delete descriptors.activeVehicleId;
    if (version < 16 && Array.isArray(ids)) descriptors.ownedVehicleIds = {
      value: ids.map(id => id === 'vehicle:kairo-kx-r' ? 'vehicle:starter-sport-sedan' : id), enumerable: true,
    };
    historicalGarage.garage = Object.create(Object.getPrototypeOf(garage), descriptors);
  }
  const historicalAutomation: { automation?: unknown } = {};
  if (typeof automation === 'object' && automation !== null && !Array.isArray(automation)) {
    const descriptors = Object.getOwnPropertyDescriptors(automation);
    if (version < 17) delete descriptors.businessAutoUpgradeTargetId;
    if (version < 15) {
      delete descriptors.enabledIds;
      delete descriptors.businessAutoUpgradeElapsedMs;
    }
    historicalAutomation.automation = Object.create(Object.getPrototypeOf(automation), descriptors);
  }
  return JSON.stringify({ ...value, state: { ...state, ...historicalGarage, ...historicalAutomation } });
}
