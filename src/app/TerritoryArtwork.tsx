import { useState } from 'react';
import { WATERFRONT, NEON_MILE } from '../features/territories';
import type { TerritoryId } from '../features/territories';
import waterfront from '../assets/territories/waterfront-candidate.webp';
import neonMile from '../assets/territories/neon-mile-candidate.webp';

/** Decorative district views. Asset selection never enters gameplay or saves. */
export function TerritoryArtwork({ territoryId }: { readonly territoryId: TerritoryId }) {
  const [failed, setFailed] = useState(false);
  const src = territoryId === WATERFRONT.id ? waterfront : territoryId === NEON_MILE.id ? neonMile : null;
  if (!src || failed) return null;

  return <div className="territory-artwork" aria-hidden="true">
    <img src={src} alt="" width={1672} height={941} loading="lazy" decoding="async"
      onError={() => setFailed(true)} />
  </div>;
}
