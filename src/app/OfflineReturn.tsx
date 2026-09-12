import { findBusiness } from '../features/businesses';
import { describeLevelIncrease, formatXp } from './progression-presentation';
import type { OfflineProgress } from '../game/offline-progress';
import { formatCash } from './number-format';
import { formatOfflineDuration, showOfflineReward } from './offline-presentation';
import { useLocale, useLocalizedText } from './LocalizationProvider';

export function OfflineReturn({ progress, onDismiss }: {
  readonly progress: OfflineProgress | null;
  readonly onDismiss: () => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  if (!showOfflineReward(progress)) return null;
  return <section className="offline-return panel" aria-labelledby="offline-heading">
    <div role="status" aria-live="polite">
      <h2 id="offline-heading">{text('Welcome back', 'Willkommen zurück')}</h2>
      <p>{text('While you were away, the empire continued without asking permission.', 'Während du weg warst, hat dein Imperium einfach weitergemacht. Loyalität sieht anders aus, Profit aber gut.')}</p>
      <p className="offline-income">+{formatCash(progress.incomeEarned)}{progress.autoUpgrader?.levelsPurchased ? text(' earned before automatic spending', ' verdient vor automatischen Ausgaben') : ''}</p>
      {progress.autoUpgrader && progress.autoUpgrader.levelsPurchased > 0 && <p>Business Auto-Upgrader: {findBusiness(progress.autoUpgrader.targetId)?.name} +{progress.autoUpgrader?.levelsPurchased} {text('levels', 'Level')} · {text('Spent', 'Ausgegeben')} {formatCash(progress.autoUpgrader.spent)}</p>}
      {progress.automation && progress.businessIncome !== undefined && <>
        <p>{text('Business income:', 'Business-Einnahmen:')} {formatCash(progress.businessIncome)}</p>
        <p>Dispatcher: {progress.automation.completedJobs} {progress.automation.completedJobs === 1 ? text('delivery', 'Lieferung') : text('deliveries', 'Lieferungen')} · {formatCash(progress.automation.income)}</p>
      </>}
      {progress.xpEarned > 0 && <p>{text('XP earned:', 'XP verdient:')} +{formatXp(progress.xpEarned)} XP</p>}
      {progress.levelIncrease && <p>{describeLevelIncrease(progress.levelIncrease, locale)}</p>}
      <p>{text('Away:', 'Abwesend:')} {formatOfflineDuration(progress.actualElapsedMs)}</p>
      <p>{text('Time credited:', 'Angerechnete Zeit:')} {formatOfflineDuration(progress.rewardedElapsedMs)}</p>
      {progress.capped && <p>{text(`Offline earnings capped at ${formatOfflineDuration(progress.capMs)}.`, `Offline-Einnahmen bei ${formatOfflineDuration(progress.capMs)} gedeckelt. Selbst passives Einkommen hat in Solara Öffnungszeiten.`)}</p>}
    </div>
    <button className="action-button delivery-button" onClick={onDismiss}>{text('Continue', 'Weiter ins Geschäft')}</button>
  </section>;
}
