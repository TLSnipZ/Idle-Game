import { STARTER_BUSINESS } from '../features/businesses';
import docksideStorefront from '../assets/businesses/dockside-detail-storefront.webp';
import neonLaundryStorefront from '../assets/businesses/neon-laundry-storefront.webp';
import afterdarkCustomsStorefront from '../assets/businesses/afterdark-customs-storefront.webp';
import solaraNightsStorefront from '../assets/businesses/solara-nights-storefront.webp';

export interface BusinessArtworkDefinition {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

const DOCKSIDE_ARTWORK: BusinessArtworkDefinition = Object.freeze({
  src: docksideStorefront,
  width: 728,
  height: 189,
});

const NEON_LAUNDRY_ARTWORK: BusinessArtworkDefinition = Object.freeze({
  src: neonLaundryStorefront,
  width: 732,
  height: 188,
});

const AFTERDARK_CUSTOMS_ARTWORK: BusinessArtworkDefinition = Object.freeze({
  src: afterdarkCustomsStorefront,
  width: 728,
  height: 177,
});

const SOLARA_NIGHTS_ARTWORK: BusinessArtworkDefinition = Object.freeze({
  src: solaraNightsStorefront,
  width: 728,
  height: 177,
});

/** Presentation lookup only. No art paths enter catalogs, GameState or saves. */
export function findBusinessArtwork(businessId: string): BusinessArtworkDefinition | null {
  if (businessId === STARTER_BUSINESS.id) return DOCKSIDE_ARTWORK;
  if (businessId === 'business:neon-laundry') return NEON_LAUNDRY_ARTWORK;
  if (businessId === 'business:afterdark-customs') return AFTERDARK_CUSTOMS_ARTWORK;
  if (businessId === 'business:solara-nights') return SOLARA_NIGHTS_ARTWORK;
  return null;
}
