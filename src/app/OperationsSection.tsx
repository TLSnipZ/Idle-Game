import type { useGame } from './use-game';
import { STARTER_BUSINESS } from '../features/businesses';
import { STARTER_JOB } from '../features/economy';
import { formatReward } from './number-format';
import { selectBusinessProgress, selectOwnsBusiness, selectCanPurchaseBusiness, selectUpgrade } from '../game/selectors';
import { evaluateJobReward } from '../game/effective-stats';
import { evaluateXpReward } from '../game/xp-reward';
import { MANUAL_JOB_HEAT } from '../features/heat';
import { formatXp } from './progression-presentation';
import { BusinessCard } from './BusinessCard';
import { ModifierBreakdown } from './ModifierBreakdown';
import { UpgradeCard } from './UpgradeCard';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { AutomationCard } from './AutomationCard';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { selectDispatcher, selectAutoUpgrader } from '../game/automation-selectors';
import { DELIVERY_DISPATCHER, BUSINESS_AUTO_UPGRADER } from '../features/automation';
export function OperationsSection({ game }: { readonly game: ReturnType<typeof useGame> }) {
  const { snapshot, runtimeError, runStarterJob, upgradeOwnedBusiness, buyBusiness, buyUpgrade, buyAutomation, toggleAutomation, automationEvent } = game;
  const paused = runtimeError !== null;
  const owned = selectOwnsBusiness(snapshot.state, STARTER_BUSINESS.id);
  const reward = evaluateJobReward(snapshot.state);
  const xp = evaluateXpReward(snapshot.state, 'manualJob');
  return <div className="section-stack operations-layout">
    <div className="operations-anchor">
      <section className="panel starter-panel" aria-labelledby="starter-heading"><h2 id="starter-heading">Starter job</h2>
            <div className="delivery-block">
              <p>Take a waterfront delivery and put cash toward your first set of keys.</p>
              <dl className="action-outcomes"><div><dt>Payout</dt><dd>{reward.ok ? formatReward(reward.reward) : 'Unavailable'}</dd></div>
                <div><dt>XP</dt><dd>+{xp.ok ? formatXp(xp.reward) : 'Unavailable'}</dd></div>
                <div><dt>Heat</dt><dd>+{MANUAL_JOB_HEAT}</dd></div></dl>
              <button className="action-button delivery-button" onClick={runStarterJob} disabled={paused}>
                <span>{STARTER_JOB.label}</span>
                <span className="reward">+{reward.ok ? formatReward(reward.reward) : 'Unavailable'} <span aria-hidden="true">↗</span></span>
              </button>
              {reward.ok && reward.applied.length > 0 && <><p>Base reward: {formatReward(reward.base)}</p><ModifierBreakdown modifiers={reward.applied} /><p>Effective reward: {formatReward(reward.reward)}</p></>}
            </div>
      </section>
      <section className="operations-business" aria-labelledby="businesses-heading"><h2 id="businesses-heading">Businesses</h2>
        <BusinessCard progress={selectBusinessProgress(snapshot.state, STARTER_BUSINESS.id)} owned={owned}
          canPurchase={selectCanPurchaseBusiness(snapshot.state, STARTER_BUSINESS.id)} paused={paused}
          onUpgrade={() => upgradeOwnedBusiness(STARTER_BUSINESS.id)} onPurchase={() => buyBusiness(STARTER_BUSINESS.id)} />
      </section>
    </div>
    <section className="equipment-section" aria-labelledby="upgrades-heading"><h2 id="upgrades-heading">Upgrades</h2><div className="upgrade-catalog">
      {UPGRADE_CATALOG.map(upgrade => <UpgradeCard key={upgrade.id} view={selectUpgrade(snapshot.state, upgrade.id)} paused={paused} onPurchase={() => buyUpgrade(upgrade.id)} />)}
    </div></section>
    <section aria-labelledby="automation-heading"><h2 id="automation-heading">Automation</h2><p>Delegate deliveries. Choose when to enable automatic spending.</p><div className="automation-grid">
      <AutomationCard view={selectDispatcher(snapshot.state)} paused={paused} event={automationEvent} onPurchase={() => buyAutomation(DELIVERY_DISPATCHER.id)} />
      <AutoUpgraderCard view={selectAutoUpgrader(snapshot.state)} paused={paused} onPurchase={() => buyAutomation(BUSINESS_AUTO_UPGRADER.id)} onToggle={enabled => toggleAutomation(BUSINESS_AUTO_UPGRADER.id, enabled)} />
    </div></section>
  </div>;
}
