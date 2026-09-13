import { isVehicleBuilds } from '../config/tuning-config';
import { findVehicle } from '../config/vehicle-config';
import type { GarageState } from './vehicle';

/** Reject corrupt authoritative ownership or selection; never silently equip a car. */
export function assertGarageState(garage: GarageState): void {
  if (!Array.isArray(garage.ownedVehicleIds)
    || new Set(garage.ownedVehicleIds).size !== garage.ownedVehicleIds.length
    || garage.ownedVehicleIds.some(id => !findVehicle(id)))
    throw new RangeError('Invalid authoritative vehicle ownership');
  if (Object.hasOwn(garage, "builds") && !isVehicleBuilds(garage.builds, garage.ownedVehicleIds))
    throw new RangeError("Invalid authoritative vehicle build");
  if (garage.ownedVehicleIds.length === 0 ? garage.activeVehicleId !== null
    : garage.activeVehicleId === null || !findVehicle(garage.activeVehicleId) || !garage.ownedVehicleIds.includes(garage.activeVehicleId))
    throw new RangeError('Invalid authoritative active vehicle');
}
