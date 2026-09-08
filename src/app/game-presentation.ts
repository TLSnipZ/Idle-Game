import { STARTER_BUSINESS } from '../features/businesses';
import { STARTER_JOB } from '../features/economy';
import { formatCash } from '../features/economy/ui';
import type { RuntimeSnapshot } from '../platform/game-runtime';

export function describeAction(action: 'delivery' | 'purchase', result: RuntimeSnapshot['result']): string {
  if (result.ok) {
    return action === 'delivery'
      ? `Delivery completed. +${formatCash(STARTER_JOB.reward)} earned.`
      : `${STARTER_BUSINESS.name} acquired. Live production has started.`;
  }
  switch (result.error) {
    case 'insufficient-funds': return 'Not enough cash yet. Complete a delivery to keep building your balance.';
    case 'already-owned': return 'This business is already yours.';
    case 'unknown-business': return 'This business is unavailable. No purchase was made.';
    case 'overflow': return 'Cash limit reached. This action could not be completed.';
    case 'invalid-amount': return 'This action could not be completed. No transaction was made.';
  }
}

export function businessPresentation(owned: boolean, canPurchase: boolean, paused: boolean) {
  return {
    live: owned && !paused,
    status: owned ? 'Owned' : canPurchase ? 'Ready to acquire' : 'Not owned',
    productionLabel: paused ? 'Production paused' : owned ? 'Live production' : 'Potential production',
    buttonLabel: paused ? 'Session paused' : owned ? 'Acquired' : canPurchase ? 'Acquire business' : 'More cash needed',
    disabled: paused || owned || !canPurchase,
    note: paused ? 'Reload to start a new session. Current progress will reset.'
      : owned ? 'Your garage is earning automatically. Keep this session open.'
      : canPurchase ? 'Make it yours. Production starts as soon as you acquire it.'
      : 'Complete waterfront deliveries to fund your first business.',
  };
}
