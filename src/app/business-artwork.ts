import { STARTER_BUSINESS } from '../features/businesses';
import docksideStorefront from '../assets/businesses/dockside-detail-storefront.webp';

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

/** Presentation lookup only. No art paths enter catalogs, GameState or saves. */
export function findBusinessArtwork(businessId: string): BusinessArtworkDefinition | null {
  return businessId === STARTER_BUSINESS.id ? DOCKSIDE_ARTWORK : null;
}
