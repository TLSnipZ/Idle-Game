import type { Money } from '../../economy';
import { moneyFromMinorUnits } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import type { GarageState, VehicleId } from '../model/vehicle';
import { STARTER_VEHICLE, KAIRO_SENDA, NAMERA_LILT, VEHICLE_CATALOG } from './vehicle-config';

export type TuningId = 'tuning:kxr-fleet-gearing' | 'tuning:kxr-courier-ecu'
  | 'tuning:senda-express-ecu' | 'tuning:senda-fleet-gearing'
  | 'tuning:lilt-quiet-running' | 'tuning:lilt-decoy-kit'
  | 'tuning:serein-nightshift-ecu' | 'tuning:serein-workshop-gearing'
  | 'tuning:rendan-dispatch-gearing' | 'tuning:rendan-express-ecu'
  | 'tuning:canto-fleet-gearing' | 'tuning:canto-dispatch-ecu';
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
  { id: 'tuning:senda-express-ecu', vehicleId: KAIRO_SENDA.id,
    name: 'Express ECU', germanName: 'Express-Steuergerät', category: 'Engine', germanCategory: 'Motor',
    cost: moneyFromMinorUnits('1800000'),
    modifier: { id: 'modifier:senda-express-ecu', sourceId: 'tuning:senda-express-ecu',
      target: { stat: 'job-reward', context: 'manual' }, operation: 'multiply-basis-points', bonusBasisPoints: 800 } },
  { id: 'tuning:senda-fleet-gearing', vehicleId: KAIRO_SENDA.id,
    name: 'Fleet support gearing', germanName: 'Fuhrparkgetriebe', category: 'Drivetrain', germanCategory: 'Antrieb',
    cost: moneyFromMinorUnits('1400000'),
    modifier: { id: 'modifier:senda-fleet-gearing', sourceId: 'tuning:senda-fleet-gearing',
      target: { stat: 'business-production', businessId: null }, operation: 'multiply-basis-points', bonusBasisPoints: 400 } },
  { id: 'tuning:lilt-quiet-running', vehicleId: NAMERA_LILT.id,
    name: 'Quiet running kit', germanName: 'Leisetreter-Paket', category: 'Cooling', germanCategory: 'Abkühlung',
    cost: moneyFromMinorUnits('2000000'),
    modifier: { id: 'modifier:lilt-quiet-running', sourceId: 'tuning:lilt-quiet-running',
      target: { stat: 'heat-decay-interval' }, operation: 'reduce-interval', reductionMs: 3000 } },
  { id: 'tuning:lilt-decoy-kit', vehicleId: NAMERA_LILT.id,
    name: 'Decoy logistics kit', germanName: 'Ablenkungslogistik', category: 'Support', germanCategory: 'Unterstützung',
    cost: moneyFromMinorUnits('1200000'),
    modifier: { id: 'modifier:lilt-decoy-kit', sourceId: 'tuning:lilt-decoy-kit',
      target: { stat: 'heat-response-cost' }, operation: 'multiply-basis-points', bonusBasisPoints: -1000 } },
  { id: 'tuning:serein-nightshift-ecu', vehicleId: 'vehicle:namera-serein',
    name: 'Nightshift ECU', germanName: 'Nachtschicht-Steuergerät', category: 'Engine', germanCategory: 'Motor',
    cost: moneyFromMinorUnits('2400000'),
    modifier: { id: 'modifier:serein-nightshift-ecu', sourceId: 'tuning:serein-nightshift-ecu',
      target: { stat: 'job-reward', context: 'manual' }, operation: 'multiply-basis-points', bonusBasisPoints: 800 } },
  { id: 'tuning:serein-workshop-gearing', vehicleId: 'vehicle:namera-serein',
    name: 'Workshop support gearing', germanName: 'Werkstattgetriebe', category: 'Drivetrain', germanCategory: 'Antrieb',
    cost: moneyFromMinorUnits('2200000'),
    modifier: { id: 'modifier:serein-workshop-gearing', sourceId: 'tuning:serein-workshop-gearing',
      target: { stat: 'business-production', businessId: null }, operation: 'multiply-basis-points', bonusBasisPoints: 500 } },
  { id: 'tuning:rendan-dispatch-gearing', vehicleId: 'vehicle:toseki-rendan',
    name: 'Dispatch gearing', germanName: 'Disponentengetriebe', category: 'Drivetrain', germanCategory: 'Antrieb',
    cost: moneyFromMinorUnits('2800000'),
    modifier: { id: 'modifier:rendan-dispatch-gearing', sourceId: 'tuning:rendan-dispatch-gearing',
      target: { stat: 'job-reward', context: 'dispatcher' }, operation: 'multiply-basis-points', bonusBasisPoints: 1200 } },
  { id: 'tuning:rendan-express-ecu', vehicleId: 'vehicle:toseki-rendan',
    name: 'Express route ECU', germanName: 'Expressrouten-Steuergerät', category: 'Engine', germanCategory: 'Motor',
    cost: moneyFromMinorUnits('2500000'),
    modifier: { id: 'modifier:rendan-express-ecu', sourceId: 'tuning:rendan-express-ecu',
      target: { stat: 'job-reward', context: 'manual' }, operation: 'multiply-basis-points', bonusBasisPoints: 600 } },
  { id: 'tuning:canto-fleet-gearing', vehicleId: 'vehicle:sevrin-canto-club',
    name: 'Boardroom gearing', germanName: 'Vorstandsgetriebe', category: 'Drivetrain', germanCategory: 'Antrieb',
    cost: moneyFromMinorUnits('4000000'),
    modifier: { id: 'modifier:canto-fleet-gearing', sourceId: 'tuning:canto-fleet-gearing',
      target: { stat: 'business-production', businessId: null }, operation: 'multiply-basis-points', bonusBasisPoints: 500 } },
  { id: 'tuning:canto-dispatch-ecu', vehicleId: 'vehicle:sevrin-canto-club',
    name: 'Night manager ECU', germanName: 'Nachtmanager-Steuergerät', category: 'Engine', germanCategory: 'Motor',
    cost: moneyFromMinorUnits('3000000'),
    modifier: { id: 'modifier:canto-dispatch-ecu', sourceId: 'tuning:canto-dispatch-ecu',
      target: { stat: 'job-reward', context: 'dispatcher' }, operation: 'multiply-basis-points', bonusBasisPoints: 800 } },
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
