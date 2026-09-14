import { useLayoutEffect, useRef, useState } from 'react';
import { BUSINESS_CATALOG, STARTER_BUSINESS } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import type { useGame } from './use-game';
import { selectBusinessProgress, selectCanPurchaseBusiness, selectOwnsBusiness } from '../game/selectors';
import { evaluateRequirements } from '../game/requirements';
import { BusinessCard } from './BusinessCard';
import { findBusinessArtwork } from './business-artwork';
import { useLocalizedText } from './LocalizationProvider';
import { formatPrice } from './number-format';
import { formatProduction } from './stat-format';
import { RateValue } from './RateValue';

export function businessHeading(id: string) { return id === STARTER_BUSINESS.id ? 'business-name' : `${id}-name`; }

/** Inspection is local UI state. Only the existing card dispatches purchases. */
export function BusinessPortfolio({ game, destination }: {
  readonly game: ReturnType<typeof useGame>;
  readonly destination?: { readonly sequence: number; readonly headingId: string } | null;
}) {
  const text = useLocalizedText();
  const state = game.snapshot.state;
  const [selected, setSelected] = useState<BusinessId>(STARTER_BUSINESS.id);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const handled = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!destination) return;
    const target = BUSINESS_CATALOG.find(item => businessHeading(item.id) === destination.headingId);
    if (target) { setSelected(target.id); setDetailOpen(true); }
  }, [destination]);
  useLayoutEffect(() => {
    if (handled.current === focusRequest) return;
    handled.current = focusRequest;
    const target = detailOpen ? document.getElementById(businessHeading(selected)) : root.current?.querySelector<HTMLElement>(`[data-business-id="${selected}"]`);
    if (target) { target.tabIndex = detailOpen ? -1 : 0; target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }, [focusRequest, selected, detailOpen]);
  return <div className={`business-portfolio ${detailOpen ? 'is-detail-open' : ''}`} ref={root}>
    <nav className="business-selection" aria-label={text('Choose a Business', 'Business auswählen')}>
      {BUSINESS_CATALOG.map((definition, index) => {
        const progress = selectBusinessProgress(state, definition.id);
        const owned = selectOwnsBusiness(state, definition.id);
        const requirements = evaluateRequirements(state, definition.requirements);
        const artwork = findBusinessArtwork(definition.id);
        return <button type="button" key={definition.id} className="business-tile" data-business-id={definition.id} aria-pressed={selected === definition.id}
          onClick={() => { setSelected(definition.id); setDetailOpen(true); setFocusRequest(n => n + 1); }}>
          {artwork && <img src={artwork.src} width={artwork.width} height={artwork.height} alt="" decoding="async" />}
          <span className="business-tile-copy"><span className="business-tile-index" aria-hidden="true">0{index + 1}</span><strong>{text(definition.name)}</strong>
            <span className="business-tile-state">{owned ? `${text('Level')} ${progress?.level ?? 1}` : requirements.met ? text('Available', 'Verfügbar') : text('Locked', 'Gesperrt')}</span>
            <span className="business-tile-value">{progress ? <RateValue text={formatProduction(progress.production)} /> : formatPrice(definition.purchaseCost)}</span>
          </span>
        </button>;
      })}
    </nav>
    <div className="business-detail">
      <button type="button" className="business-back" onClick={() => { setDetailOpen(false); setFocusRequest(n => n + 1); }}>{text('← All Businesses', '← Alle Businesses')}</button>
      {BUSINESS_CATALOG.map(definition => <div key={definition.id} hidden={selected !== definition.id}>
        <BusinessCard definition={definition} requirements={evaluateRequirements(state, definition.requirements)}
          progress={selectBusinessProgress(state, definition.id)} owned={selectOwnsBusiness(state, definition.id)}
          canPurchase={selectCanPurchaseBusiness(state, definition.id)} paused={game.runtimeError !== null}
          onUpgrade={() => game.upgradeOwnedBusiness(definition.id)} onPurchase={() => game.buyBusiness(definition.id)} />
      </div>)}
    </div>
  </div>;
}
