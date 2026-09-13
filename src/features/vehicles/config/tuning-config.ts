import type { Money } from '../../economy';
import { moneyFromMinorUnits } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import type { GarageState, VehicleId } from '../model/vehicle';
import { STARTER_VEHICLE, VEHICLE_CATALOG } from './vehicle-config';

export type TuningId = 'tuning:kxr-fleet-gearing' | 'tuning:kxr-courier-ecu';
export interface VehicleBuild {
  readonly purchasedIds: readonly TuningId[];
  readonly selectedId: TuningId | null;
}
export type VehicleBuilds = Partial<Record<VehicleId, VehicleBuild>>;
export interface TuningDefinition {
  readonly id: TuningId;
  readonly vehicleId: VehicleId;
  readonly name: string;
  readonly germanName: string;
  readonly category: string;
  readonly germanCategory: string;
  readonly cost: Money;
  readonly modifier: Modifier;
}
export const TUNING_CATALOG: readonly TuningDefinition[] = [
  { id: 'tuning:kxr-fleet-gearing', vehicleId: STARTER_VEHICLE.id,
    name: 'Fleet gearing', germanName: 'Flottengetriebe', category: 'Drivetrain', germanCategory: 'Antrieb',
    cost: moneyFromMinorUnits('1500000'),
    modifier: { id: 'modifier:kxr-fleet-gearing', sourceId: 'tuning:kxr-fleet-gearing',
      target: { stat: 'business-production', businessId: null }, operation: 'multiply-basis-points', bonusBasisPoints: 500 } },
  { id: 'tuning:kxr-courier-ecu', vehicleId: STARTER_VEHICLE.id,
    name: 'Courier ECU', germanName: 'Kurier-Steuergerät', category: 'Engine', germanCategory: 'Motor',
    cost: moneyFromMinorUnits('1000000'),
    modifier: { id: 'modifier:kxr-courier-ecu', sourceId: 'tuning:kxr-courier-ecu',
      target: { stat: 'job-reward', context: 'manual' }, operation: 'multiply-basis-points', bonusBasisPoints: 800 } },
];
export function findTuning(id: unknown) { return TUNING_CATALOG.find(item => item.id === id); }
function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value))
    && Reflect.ownKeys(value).every(key => typeof key === 'string'
      && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'));
}
export function isVehicleBuilds(value: unknown, owned: readonly VehicleId[]): value is VehicleBuilds {
  if (!plain(value)) return false;
  return Object.entries(value).every(([id, build]) => {
    if (!owned.some(vehicleId => vehicleId === id) || !plain(build)
      || Object.keys(build).length !== 2 || !Object.hasOwn(build, 'purchasedIds') || !Object.hasOwn(build, 'selectedId')
      || !Array.isArray(build.purchasedIds) || build.purchasedIds.length === 0
      || new Set(build.purchasedIds).size !== build.purchasedIds.length
      || Array.from(build.purchasedIds).some(part => findTuning(part)?.vehicleId !== id)) return false;
    return build.selectedId === null || build.purchasedIds.includes(build.selectedId);
  });
}
export function cloneVehicleBuilds(builds: VehicleBuilds): VehicleBuilds {
  const result: VehicleBuilds = {};
  for (const vehicle of VEHICLE_CATALOG) {
    const build = builds[vehicle.id];
    if (build) result[vehicle.id] = { purchasedIds: [...build.purchasedIds], selectedId: build.selectedId };
  }
  return result;
}
export function activeTuning(garage: GarageState): TuningDefinition | undefined {
  return garage.activeVehicleId ? findTuning(garage.builds?.[garage.activeVehicleId]?.selectedId) : undefined;
}
