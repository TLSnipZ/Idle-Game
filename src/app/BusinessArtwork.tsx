import { useState } from 'react';
import type { BusinessArtworkDefinition } from './business-artwork';
import './BusinessArtwork.css';

/** Decorative only. A failed or not-yet-loaded asset never leaves an empty card. */
export function BusinessArtwork({ artwork }: {
  readonly artwork: BusinessArtworkDefinition;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  if (status === 'failed') return null;

  return <div className="business-artwork" hidden={status !== 'ready'} aria-hidden="true">
    <img src={artwork.src} alt="" width={artwork.width} height={artwork.height}
      loading="eager" decoding="async"
      onLoad={event => setStatus(event.currentTarget.naturalWidth > 0 ? 'ready' : 'failed')}
      onError={() => setStatus('failed')} />
  </div>;
}
