import type { VehicleId } from '../features/vehicles';

/** Presentation-only registry. Replace with final imported artwork without changing saves. */
const VEHICLE_ARTWORK: Readonly<Partial<Record<VehicleId, { readonly label: string; readonly className: string }>>> = {
  'vehicle:starter-sport-sedan': { label: 'Vehicle preview coming later', className: 'vehicle-placeholder' },
};
export function vehicleArtwork(id: VehicleId) { return VEHICLE_ARTWORK[id]; }
