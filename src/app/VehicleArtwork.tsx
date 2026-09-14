import { useId } from 'react';
import type { AppearanceId, VehicleId } from '../features/vehicles';
import { findAppearance } from '../features/vehicles';
import { vehicleArtwork } from './vehicle-artwork';
import { FINISH_PALETTE, PAINT_MASKS, PAINT_DETAILS } from './vehicle-finishes';
import { useLocalizedText } from './LocalizationProvider';
import './VehicleAppearance.css';

export function VehicleArtwork({ vehicleId, appearanceId = null }: {
  readonly vehicleId: VehicleId; readonly appearanceId?: AppearanceId | null;
}) {
  const id = useId().replace(/:/g, ''), text = useLocalizedText();
  const artwork = vehicleArtwork(vehicleId), look = findAppearance(appearanceId);
  if (!artwork) return null;
  const [body, ...openings] = (PAINT_MASKS[vehicleId] ?? '').split(/(?=M)/);
  const finish = look?.vehicleId === vehicleId ? FINISH_PALETTE[look.id] : undefined;
  return <div className="vehicle-image" data-appearance={finish ? look?.id : 'factory'}>
    <img className="vehicle-artwork" src={artwork.src}
      alt={finish && look ? text(`${artwork.alt} · ${look.name}`, `${artwork.alt} · ${look.germanName}`) : text(artwork.alt)}
      width={artwork.width} height={artwork.height} loading="lazy" decoding="async" />
    {finish && <svg className="vehicle-paint" viewBox="0 0 720 405" aria-hidden="true" focusable="false">
      <defs>
        <mask id={`paint-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="405" style={{ maskType: 'luminance' }}>
          <path d={body} fill="white" />
          <path d={openings.join(' ')} fill="black" />
          <path d={PAINT_DETAILS[vehicleId]} fill="white" />
        </mask>
        <filter id={`finish-${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".6 .3 .1 0 0 .6 .3 .1 0 0 .6 .3 .1 0 0 0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={finish.red} />
            <feFuncG type="linear" slope={finish.green} />
            <feFuncB type="linear" slope={finish.blue} />
          </feComponentTransfer>
        </filter>
      </defs>
      <g mask={`url(#paint-${id})`}>
        <image href={artwork.src} width="720" height="405" preserveAspectRatio="none" filter={`url(#finish-${id})`} />
      </g>
    </svg>}
  </div>;
}
