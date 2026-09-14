import { findVehicle } from './vehicle-config';
import type { VehicleId } from '../model/vehicle';

export type AppearanceId = 'appearance:kxr-coastal' | 'appearance:kxr-graphite'
  | 'appearance:senda-champagne' | 'appearance:senda-amethyst'
  | 'appearance:lilt-ivory' | 'appearance:lilt-lagoon';
export type VehicleAppearances = Partial<Record<VehicleId, AppearanceId>>;
export interface AppearanceDefinition {
  readonly id: AppearanceId;
  readonly vehicleId: VehicleId;
  readonly name: string;
  readonly germanName: string;
}
export const APPEARANCE_CATALOG: readonly AppearanceDefinition[] = [
  { id: 'appearance:kxr-coastal', vehicleId: 'vehicle:kairo-kx-r', name: 'Coastal Mint', germanName: 'Küstenmint' },
  { id: 'appearance:kxr-graphite', vehicleId: 'vehicle:kairo-kx-r', name: 'Graphite Club', germanName: 'Graphit-Club' },
  { id: 'appearance:senda-champagne', vehicleId: 'vehicle:kairo-senda', name: 'Champagne Account', germanName: 'Champagnerkonto' },
  { id: 'appearance:senda-amethyst', vehicleId: 'vehicle:kairo-senda', name: 'Afterhours Amethyst', germanName: 'Feierabend-Amethyst' },
  { id: 'appearance:lilt-ivory', vehicleId: 'vehicle:namera-lilt', name: 'Ivory Alibi', germanName: 'Elfenbein-Alibi' },
  { id: 'appearance:lilt-lagoon', vehicleId: 'vehicle:namera-lilt', name: 'Lagoon Escape', germanName: 'Lagunenflucht' },
];
export function findAppearance(id: unknown) { return APPEARANCE_CATALOG.find(look => look.id === id); }
export function isVehicleAppearances(value: unknown, owned: readonly VehicleId[]): value is VehicleAppearances {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  return Reflect.ownKeys(value).every(key => {
    if (typeof key !== 'string') return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) return false;
    const vehicle = findVehicle(key);
    return !!vehicle && owned.includes(vehicle.id) && findAppearance(descriptor.value)?.vehicleId === vehicle.id;
  });
}
