import type { OfflineProgress } from '../game/offline-progress';
import { OFFLINE_CAP_MS } from '../game/offline-progress';
import { formatCash } from '../features/economy/ui';
import { formatOfflineDuration, showOfflineReward } from './offline-presentation';

export function OfflineReturn({ progress, onDismiss }: {
  readonly progress: OfflineProgress | null;
  readonly onDismiss: () => void;
}) {
  if (!showOfflineReward(progress)) return null;
  return <section className="offline-return panel" aria-labelledby="offline-heading">
    <div role="status" aria-live="polite">
      <h2 id="offline-heading">Welcome back</h2>
      <p>While you were away</p>
      <p className="offline-income">+{formatCash(progress.incomeEarned)}</p>
      <p>Time credited: {formatOfflineDuration(progress.rewardedElapsedMs)}</p>
      {progress.capped && <p>Offline earnings capped at {formatOfflineDuration(OFFLINE_CAP_MS)}.</p>}
    </div>
    <button className="action-button delivery-button" onClick={onDismiss}>Continue</button>
  </section>;
}
