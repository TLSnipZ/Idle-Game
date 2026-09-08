import { XP_REWARDS } from '../features/progression';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { formatProduction } from './stat-format';
import { evaluateJobReward } from '../game/effective-stats';
import { findUpgrade } from '../features/upgrades';
import { selectBusinessProgress } from '../game/selectors';
import { STARTER_BUSINESS } from '../features/businesses';
import { formatCash } from '../features/economy/ui';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import type { PersistenceStatus } from '../platform/persistent-game';

export function describeAction(action: 'delivery' | 'purchase' | 'upgrade' | 'equipment' | 'automation', result: RuntimeSnapshot['result'], upgradeId?: unknown): string {
  if (result.ok) {
    if (action === 'automation') return `${DELIVERY_DISPATCHER.name} hired. Automated deliveries are active.`;
    if (action === 'equipment') {
      const upgrade = findUpgrade(upgradeId);
      return `${upgrade?.name ?? 'Upgrade'} purchased. ${upgrade?.modifier.target.stat === 'job-reward' ? 'Delivery' : 'Production'} bonus is active.`;
    }
    if (action === 'upgrade') {
      const progress = selectBusinessProgress(result.state, STARTER_BUSINESS.id);
      return progress ? `${STARTER_BUSINESS.name} upgraded to Level ${progress.level}. Production increased to ${formatProduction(progress.production)}/sec · +${XP_REWARDS.businessLevel} XP.` : 'Business upgraded.';
    }
    return action === 'delivery'
      ? `Delivery completed. +${formatCash(deliveryReward(result.state))} · +${XP_REWARDS.manualJob} XP.`
      : `${STARTER_BUSINESS.name} acquired. Live production has started.`;
  }
  switch (result.error) {
    case 'insufficient-funds': return 'Not enough cash yet. Complete a delivery to keep building your balance.';
    case 'already-owned': return 'This business is already yours.';
    case 'unknown-business': return 'This business is unavailable. No purchase was made.';
    case 'unknown-automation': return 'This delegation is unavailable.';
    case 'already-unlocked': return 'This dispatcher is already hired.';
    case 'unknown-upgrade': return 'This upgrade is unavailable.';
    case 'already-purchased': return 'This upgrade is already purchased.';
    case 'prerequisite-not-met': return 'This purchase’s requirement is not met yet.';
    case 'not-owned': return 'Acquire this business before upgrading.';
    case 'max-level-reached': return 'This business is at max level.';
    case 'invalid-level': return 'Business level is invalid. No transaction was made.';
    case 'xp-overflow': return 'XP limit reached. This action could not be completed.';
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

function deliveryReward(state: RuntimeSnapshot['result']['state']) {
  const reward = evaluateJobReward(state);
  if (!reward.ok) throw new RangeError('Configured job reward exceeds range');
  return reward.reward;
}
