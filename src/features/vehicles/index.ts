export { APPEARANCE_CATALOG, findAppearance, isVehicleAppearances } from './config/appearance-config';
export type { AppearanceId, AppearanceDefinition, VehicleAppearances } from './config/appearance-config';
export { TUNING_CATALOG, findTuning, activeTuning, isVehicleBuilds, cloneVehicleBuilds } from './config/tuning-config';
export type { TuningId, TuningDefinition, VehicleBuild, VehicleBuilds } from './config/tuning-config';
export { STARTER_VEHICLE, KAIRO_SENDA, NAMERA_LILT, VEHICLE_CATALOG, findVehicle } from './config/vehicle-config';
export type { VehicleId, VehicleDefinition, GarageState } from './model/vehicle';
export { assertGarageState } from './model/garage-state';
