import type { VehicleId } from '../features/vehicles';
import kairoKxr from '../assets/vehicles/kairo-kx-r.webp';

/** Presentation metadata only; reference masters are never imported by runtime. */
const VEHICLE_ARTWORK: Readonly<Partial<Record<VehicleId, {
  readonly src: string; readonly alt: string; readonly width: number; readonly height: number;
}>>> = {
  'vehicle:kairo-kx-r': { src: kairoKxr, alt: 'Kairo KX-R in the Solara City garage', width: 1672, height: 941 },
};
export function vehicleArtwork(id: VehicleId) { return VEHICLE_ARTWORK[id]; }
