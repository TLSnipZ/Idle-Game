import { STARTER_BUSINESS } from '../features/businesses';
import { formatCash } from '../features/economy/ui';

interface BusinessCardProps {
  readonly owned: boolean;
  readonly canPurchase: boolean;
  readonly onPurchase: () => void;
}

export function BusinessCard({ owned, canPurchase, onPurchase }: BusinessCardProps) {
  return (
    <section className="empty-state business-card" aria-labelledby="business-name">
      <span className="empty-state-label">{owned ? 'Owned' : 'Your first business'}</span>
      <h2 id="business-name">{STARTER_BUSINESS.name}</h2>
      <p>{STARTER_BUSINESS.description}</p>
      <p className="business-price">Purchase price · {formatCash(STARTER_BUSINESS.purchaseCost)}</p>
      <button className="starter-job" disabled={!canPurchase} onClick={onPurchase}>
        {owned ? 'Acquired' : 'Buy business'}
      </button>
      <p className="session-note">
        {owned ? 'Live production · Earning while this session is open.'
          : canPurchase ? 'Ready to make it yours.' : 'Complete deliveries to afford this business.'}
      </p>
    </section>
  );
}
