import { useRef } from 'react';
import type { useGame } from './use-game';
import { RateValue } from './RateValue';
import { dashboardPresentation } from './dashboard-presentation';
import { evaluateRequirements } from '../game/requirements';
import { BUSINESS_CATALOG } from '../features/businesses';
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
  const { snapshot, runtimeError, runStarterJob, upgradeOwnedBusiness, buyBusiness, buyUpgrade, buyAutomation, toggleAutomation, changeAutoUpgraderTarget, automationEvent } = game;
  const jobs = useRef<HTMLHeadingElement>(null);
  const businesses = useRef<HTMLHeadingElement>(null);
  const automation = useRef<HTMLHeadingElement>(null);
  function jump(target: HTMLHeadingElement | null) {
    target?.focus();
    target?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  const paused = runtimeError !== null;
  const reward = evaluateJobReward(snapshot.state);
  const xp = evaluateXpReward(snapshot.state, 'manualJob');
  return <div className="section-stack operations-layout">
    <nav className="operations-navigation" aria-label="Operations sections">
      <button type="button" onClick={() => jump(jobs.current)}>JOBS</button>
      <button type="button" onClick={() => jump(businesses.current)}>BUSINESSES</button>
      <button type="button" onClick={() => jump(automation.current)}>AUTOMATION</button>
    </nav>
    <div className="operations-anchor">
      <section className="panel starter-panel" aria-labelledby="starter-heading"><h2 id="starter-heading" className="operations-target" ref={jobs} tabIndex={-1}>Jobs</h2>
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
      <section className="operations-business" aria-labelledby="businesses-heading"><h2 id="businesses-heading" className="operations-target" ref={businesses} tabIndex={-1}>Businesses</h2>
        <p className="business-total">Total Business Production: <strong><RateValue text={dashboardPresentation(snapshot.state).production} /></strong></p>
        <div className="business-grid">{BUSINESS_CATALOG.map(definition => <BusinessCard key={definition.id} definition={definition}
          requirements={evaluateRequirements(snapshot.state, definition.requirements)}
          progress={selectBusinessProgress(snapshot.state, definition.id)} owned={selectOwnsBusiness(snapshot.state, definition.id)}
          canPurchase={selectCanPurchaseBusiness(snapshot.state, definition.id)} paused={paused}
          onUpgrade={() => upgradeOwnedBusiness(definition.id)} onPurchase={() => buyBusiness(definition.id)} />)}</div>
      </section>
    </div>
    <section className="equipment-section" aria-labelledby="upgrades-heading"><h2 id="upgrades-heading">Upgrades</h2><div className="upgrade-catalog">
      {UPGRADE_CATALOG.map(upgrade => <UpgradeCard key={upgrade.id} view={selectUpgrade(snapshot.state, upgrade.id)} paused={paused} onPurchase={() => buyUpgrade(upgrade.id)} />)}
    </div></section>
    <section aria-labelledby="automation-heading"><h2 id="automation-heading" className="operations-target" ref={automation} tabIndex={-1}>Automation</h2><p>Delegate deliveries. Choose when to enable automatic spending.</p><div className="automation-grid">
      <AutomationCard view={selectDispatcher(snapshot.state)} paused={paused} event={automationEvent} onPurchase={() => buyAutomation(DELIVERY_DISPATCHER.id)} />
      <AutoUpgraderCard view={selectAutoUpgrader(snapshot.state)} paused={paused} onPurchase={() => buyAutomation(BUSINESS_AUTO_UPGRADER.id)} onTargetChange={changeAutoUpgraderTarget} onToggle={enabled => toggleAutomation(BUSINESS_AUTO_UPGRADER.id, enabled)} />
    </div></section>
  </div>;
}
