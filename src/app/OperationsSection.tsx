import { useRef } from 'react';
import type { useGame } from './use-game';
import { RateValue } from './RateValue';
import { dashboardPresentation } from './dashboard-presentation';
import { evaluateRequirements } from '../game/requirements';
import { BUSINESS_CATALOG } from '../features/businesses';
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
import { useLocalizedText } from './LocalizationProvider';

export function OperationsSection({ game }: { readonly game: ReturnType<typeof useGame> }) {
  const text = useLocalizedText();
  const { snapshot, runtimeError, runStarterJob, upgradeOwnedBusiness, buyBusiness, buyUpgrade, buyAutomation, toggleAutomation, changeAutoUpgraderTarget, automationEvent } = game;
  const jobs = useRef<HTMLHeadingElement>(null);
  const businesses = useRef<HTMLHeadingElement>(null);
  const automation = useRef<HTMLHeadingElement>(null);

  function jump(target: HTMLHeadingElement | null) {
    target?.focus();
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  const paused = runtimeError !== null;
  const reward = evaluateJobReward(snapshot.state);
  const xp = evaluateXpReward(snapshot.state, 'manualJob');
  const unavailable = text('Unavailable', 'Nicht verfügbar');
  const totalProduction = dashboardPresentation(snapshot.state).production;

  return <div className="operations-page">
    <nav className="operations-tabs" aria-label={text('Operations sections', 'Bereiche der Operationen')}>
      <button type="button" onClick={() => jump(jobs.current)}>{text('JOBS', 'JOBS')}</button>
      <button type="button" onClick={() => jump(businesses.current)}>{text('BUSINESSES', 'BUSINESSES')}</button>
      <button type="button" onClick={() => jump(automation.current)}>{text('AUTOMATION', 'AUTOMATISIERUNG')}</button>
    </nav>

    <section className="operations-block jobs-block" aria-labelledby="starter-heading">
      <div className="operations-section-heading">
        <div><span className="eyebrow">{text('QUICK CASH', 'SCHNELLES CASH')}</span><h2 id="starter-heading" className="operations-target" ref={jobs} tabIndex={-1}>{text('Waterfront Delivery', 'Waterfront-Lieferung')}</h2></div>
        <span className="operations-kicker">{text('Manual work', 'Handarbeit')}</span>
      </div>
      <p className="operations-lead">{text('Move a package across the waterfront, get paid, and keep HR comfortably fictional.', 'Bring ein Paket über die Waterfront, kassier ab und lass HR weiterhin angenehm fiktiv bleiben.')}</p>
      <dl className="job-metrics">
        <div><dt>{text('Payout', 'Auszahlung')}</dt><dd>{reward.ok ? formatReward(reward.reward) : unavailable}</dd></div>
        <div><dt>XP</dt><dd>+{xp.ok ? formatXp(xp.reward) : unavailable}</dd></div>
        <div><dt>Heat</dt><dd>+{MANUAL_JOB_HEAT}</dd></div>
      </dl>
      <button className="action-button delivery-button operations-primary-action" onClick={runStarterJob} disabled={paused}>
        <span>{text('Run waterfront delivery', 'Waterfront-Lieferung fahren')}</span>
        <span className="reward">+{reward.ok ? formatReward(reward.reward) : unavailable} <span aria-hidden="true">↗</span></span>
      </button>
      {reward.ok && reward.applied.length > 0 && <details className="operations-disclosure">
        <summary>{text('Reward details', 'Auszahlungsdetails')}</summary>
        <div className="operations-disclosure-body"><p>{text('Base reward:', 'Basis-Auszahlung:')} <strong>{formatReward(reward.base)}</strong></p><ModifierBreakdown modifiers={reward.applied} /><p>{text('Effective reward:', 'Tatsächliche Auszahlung:')} <strong>{formatReward(reward.reward)}</strong></p></div>
      </details>}
    </section>

    <section className="operations-block businesses-block" aria-labelledby="businesses-heading">
      <div className="operations-section-heading business-heading-row">
        <div><span className="eyebrow">{text('YOUR EMPIRE', 'DEIN IMPERIUM')}</span><h2 id="businesses-heading" className="operations-target" ref={businesses} tabIndex={-1}>{text('Businesses', 'Businesses')}</h2></div>
        <div className="business-total-compact"><span>{text('Total production', 'Gesamtproduktion')}</span><strong><RateValue text={totalProduction} /></strong></div>
      </div>
      <p className="operations-lead">{text('Own the block, upgrade the paperwork, and pretend recurring revenue is a personality.', 'Übernimm den Block, upgrade den Papierkram und tu so, als wäre passives Einkommen eine Persönlichkeit.')}</p>
      <div className="business-grid">{BUSINESS_CATALOG.map(definition => <BusinessCard key={definition.id} definition={definition}
        requirements={evaluateRequirements(snapshot.state, definition.requirements)}
        progress={selectBusinessProgress(snapshot.state, definition.id)} owned={selectOwnsBusiness(snapshot.state, definition.id)}
        canPurchase={selectCanPurchaseBusiness(snapshot.state, definition.id)} paused={paused}
        onUpgrade={() => upgradeOwnedBusiness(definition.id)} onPurchase={() => buyBusiness(definition.id)} />)}</div>
    </section>

    <section className="operations-block upgrades-block" aria-labelledby="upgrades-heading">
      <div className="operations-section-heading"><div><span className="eyebrow">{text('EQUIPMENT', 'EQUIPMENT')}</span><h2 id="upgrades-heading">{text('Business Upgrades', 'Business-Upgrades')}</h2></div></div>
      <p className="operations-lead">{text('Spend money to make money. Economists hate this one extremely obvious trick.', 'Gib Geld aus, um mehr Geld zu machen. Volkswirte hassen diesen erstaunlich offensichtlichen Trick.')}</p>
      <div className="upgrade-catalog">{UPGRADE_CATALOG.map(upgrade => <UpgradeCard key={upgrade.id} view={selectUpgrade(snapshot.state, upgrade.id)} paused={paused} onPurchase={() => buyUpgrade(upgrade.id)} />)}</div>
    </section>

    <section className="operations-block automation-block" aria-labelledby="automation-heading">
      <div className="operations-section-heading"><div><span className="eyebrow">{text('DELEGATE THE BORING PART', 'DELEGIER DEN LANGWEILIGEN TEIL')}</span><h2 id="automation-heading" className="operations-target" ref={automation} tabIndex={-1}>{text('Automation', 'Automatisierung')}</h2></div></div>
      <p className="operations-lead">{text('Let the machinery earn money while you focus on making increasingly expensive decisions.', 'Lass die Maschinen Geld verdienen, während du dich auf zunehmend teure Fehlentscheidungen konzentrierst.')}</p>
      <div className="automation-grid">
        <AutomationCard view={selectDispatcher(snapshot.state)} paused={paused} event={automationEvent} onPurchase={() => buyAutomation(DELIVERY_DISPATCHER.id)} />
        <AutoUpgraderCard view={selectAutoUpgrader(snapshot.state)} paused={paused} onPurchase={() => buyAutomation(BUSINESS_AUTO_UPGRADER.id)} onTargetChange={changeAutoUpgraderTarget} onToggle={enabled => toggleAutomation(BUSINESS_AUTO_UPGRADER.id, enabled)} />
      </div>
    </section>
  </div>;
}
