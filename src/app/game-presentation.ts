import { selectBusinessProgress } from '../game/selectors';
import { STARTER_BUSINESS } from '../features/businesses';
import { STARTER_JOB } from '../features/economy';
import { formatCash } from '../features/economy/ui';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import type { PersistenceStatus } from '../platform/persistent-game';

export function describeAction(action: 'delivery' | 'purchase' | 'upgrade', result: RuntimeSnapshot['result']): string {
  if (result.ok) {
    if (action === 'upgrade') {
      const progress = selectBusinessProgress(result.state, STARTER_BUSINESS.id);
      return progress ? `${STARTER_BUSINESS.name} upgraded to Level ${progress.level}. Production increased to ${formatCash(progress.production)}/sec.` : 'Business upgraded.';
    }
    return action === 'delivery'
      ? `Delivery completed. +${formatCash(STARTER_JOB.reward)} earned.`
      : `${STARTER_BUSINESS.name} acquired. Live production has started.`;
  }
  switch (result.error) {
    case 'insufficient-funds': return 'Not enough cash yet. Complete a delivery to keep building your balance.';
    case 'already-owned': return 'This business is already yours.';
    case 'unknown-business': return 'This business is unavailable. No purchase was made.';
    case 'not-owned': return 'Acquire this business before upgrading.';
    case 'max-level-reached': return 'This business is at max level.';
    case 'invalid-level': return 'Business level is invalid. No transaction was made.';
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
    note: paused ? 'Reload to restore the last available local save. Unsaved progress may be lost.'
      : owned ? 'Your garage is earning automatically. Keep this session open.'
      : canPurchase ? 'Make it yours. Production starts as soon as you acquire it.'
      : 'Complete waterfront deliveries to fund your first business.',
  };
}

export function describePersistence(status: PersistenceStatus): string {
  switch (status.kind) {
    case 'ready': return 'Local autosave ready. Progress saves after actions and every few seconds.';
    case 'loaded': return 'Local save restored and offline interval recorded.';
    case 'offline-error': return 'Offline progress could not be recorded. Session paused; your previous save is preserved. Reload to try again.';
    case 'saved': return 'Progress saved on this browser.';
    case 'error': return 'Saving failed. You can keep playing, but recent progress may be lost on reload. Autosave will try again.';
    case 'blocked':
      if (status.error === 'unsupported-version') return 'This save needs a newer game version. It has been preserved. This fresh session will not be saved.';
      if (status.error === 'storage-read') return 'Local storage could not be read. This session will not be saved; existing data has not been changed.';
      if (status.error === 'storage-conflict') return 'The local save changed in another session. Saving has stopped to protect it. Reload to load the stored save.';
      return 'The local save could not be validated and has been preserved. You are playing a fresh session with saving disabled.';
  }
}
