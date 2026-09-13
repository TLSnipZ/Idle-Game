import { STARTER_BUSINESS } from '../features/businesses';
import docksideStorefront from '../assets/businesses/dockside-detail-storefront.webp';
import neonLaundryStorefront from '../assets/businesses/neon-laundry-storefront.webp';

export interface BusinessArtworkDefinition {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

const DOCKSIDE_ARTWORK: BusinessArtworkDefinition = Object.freeze({
  src: docksideStorefront,
  width: 564,
  height: 270,
});

const NEON_LAUNDRY_ARTWORK: BusinessArtworkDefinition = Object.freeze({
  src: neonLaundryStorefront,
  width: 732,
  height: 188,
});

/** Presentation lookup only. No art paths enter catalogs, GameState or saves. */
export function findBusinessArtwork(businessId: string): BusinessArtworkDefinition | null {
  if (businessId === STARTER_BUSINESS.id) return DOCKSIDE_ARTWORK;
  if (businessId === 'business:neon-laundry') return NEON_LAUNDRY_ARTWORK;
  return null;
}
