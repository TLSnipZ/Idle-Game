import type { VehicleId } from '../features/vehicles';
import kairoKxr from '../assets/vehicles/kairo-kx-r.webp';
import kairoSenda from '../assets/vehicles/kairo-senda.webp';
import nameraLilt from '../assets/vehicles/namera-lilt.webp';
import nameraSerein from '../assets/vehicles/namera-serein.webp';

/** Presentation metadata only; reference masters are never imported by runtime. */
const VEHICLE_ARTWORK: Readonly<Partial<Record<VehicleId, {
  readonly src: string; readonly alt: string; readonly width: number; readonly height: number;
}>>> = {
  'vehicle:namera-serein': { src: nameraSerein, alt: 'Namera Serein at the Solara City marina', width: 1672, height: 940 },
  'vehicle:kairo-senda': { src: kairoSenda, alt: 'Kairo Senda in Solara City', width: 1672, height: 941 },
  'vehicle:namera-lilt': { src: nameraLilt, alt: 'Namera Lilt in Solara City', width: 1672, height: 941 },
  'vehicle:kairo-kx-r': { src: kairoKxr, alt: 'Kairo KX-R in the Solara City garage', width: 1672, height: 941 },
};
export function vehicleArtwork(id: VehicleId) { return VEHICLE_ARTWORK[id]; }
