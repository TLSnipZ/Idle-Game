import type { BusinessId } from '../features/businesses';
import docksideDetail from '../assets/businesses/dockside-detail-hero.webp';

/** Presentation-only artwork registry. Stable Business IDs remain gameplay authority. */
const BUSINESS_ARTWORK: Readonly<Partial<Record<BusinessId, {
  readonly src: string;
  readonly alt: string;
  readonly position?: string;
}>>> = {
  'business:dockside-detail': {
    src: docksideDetail,
    alt: 'Dockside Detail service bays beside the Solara City waterfront at night',
    position: '60% 50%',
  },
};

export function businessArtwork(id: BusinessId) { return BUSINESS_ARTWORK[id]; }
