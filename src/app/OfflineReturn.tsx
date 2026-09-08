import { describeLevelIncrease, formatXp } from './progression-presentation';
import type { OfflineProgress } from '../game/offline-progress';
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
      {progress.automation && progress.businessIncome !== undefined && <>
        <p>Business income: {formatCash(progress.businessIncome)}</p>
        <p>Dispatcher: {progress.automation.completedJobs} deliveries · {formatCash(progress.automation.income)}</p>
      </>}
      {progress.xpEarned > 0 && <p>XP earned: +{formatXp(progress.xpEarned)} XP</p>}
      {progress.levelIncrease && <p>{describeLevelIncrease(progress.levelIncrease)}</p>}
      <p>Away: {formatOfflineDuration(progress.actualElapsedMs)}</p>
      <p>Time credited: {formatOfflineDuration(progress.rewardedElapsedMs)}</p>
      {progress.capped && <p>Offline earnings capped at {formatOfflineDuration(progress.capMs)}.</p>}
    </div>
    <button className="action-button delivery-button" onClick={onDismiss}>Continue</button>
  </section>;
}
