import { DistrictHeat } from './DistrictHeat';
import { WATERFRONT, getActiveDistrictId } from '../features/territories';
import { DiscreetDelivery } from './DiscreetDelivery';
import { RiskyDelivery } from './RiskyDelivery';
import { useLayoutEffect, useRef, useState } from 'react';
import { BusinessPortfolio } from './BusinessPortfolio';
import type { useGame } from './use-game';
import { RateValue } from './RateValue';
import { dashboardPresentation } from './dashboard-presentation';
import { formatReward } from './number-format';
import { selectUpgrade } from '../game/selectors';
import { evaluateJobReward } from '../game/effective-stats';
import { evaluateXpReward } from '../game/xp-reward';
import { MANUAL_JOB_HEAT } from '../features/heat';
import { formatXp } from './progression-presentation';
import { ModifierBreakdown } from './ModifierBreakdown';
import { UpgradeCard } from './UpgradeCard';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { AutomationCard } from './AutomationCard';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { selectDispatcher, selectAutoUpgrader } from '../game/automation-selectors';
import { DELIVERY_DISPATCHER, BUSINESS_AUTO_UPGRADER } from '../features/automation';
import { useLocalizedText } from './LocalizationProvider';

export function OperationsSection({ game, destination }: { readonly game: ReturnType<typeof useGame>; readonly destination?: { readonly sequence: number; readonly headingId: string } | null }) {
  const text = useLocalizedText();
  const { snapshot, runtimeError, runStarterJob, buyUpgrade, buyAutomation, toggleAutomation, changeAutoUpgraderTarget, automationEvent } = game;
  const workspace = useRef<HTMLDivElement>(null);
  const [view, setView] = useState('starter-heading');
  const [focusRequest, setFocusRequest] = useState(0);
  const focusTarget = useRef('starter-heading');
  const handled = useRef(0);
  function open(id: string) { focusTarget.current = id; setView(id); setFocusRequest(n => n + 1); }
  useLayoutEffect(() => {
    if (!destination) return;
    const id = destination.headingId;
    const next = id === 'business-name' || id.startsWith('business:') || id === 'businesses-heading' ? 'businesses-heading'
      : UPGRADE_CATALOG.some(upgrade => `${upgrade.id}-heading` === id) || id === 'upgrades-heading' ? 'upgrades-heading'
      : ['automation-heading', 'delegation-heading', 'auto-upgrader-heading'].includes(id) ? 'automation-heading' : 'starter-heading';
    focusTarget.current = id; setView(next); setFocusRequest(n => n + 1);
  }, [destination]);
  useLayoutEffect(() => {
    if (handled.current === focusRequest) return;
    handled.current = focusRequest;
    const target = document.getElementById(focusTarget.current);
    if (target && workspace.current?.contains(target)) { target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }, [focusRequest, view]);

  const paused = runtimeError !== null;
  const waterfront = getActiveDistrictId(snapshot.state.city) === WATERFRONT.id;
  const reward = evaluateJobReward(snapshot.state);
  const xp = evaluateXpReward(snapshot.state, 'manualJob');
  const unavailable = text('Unavailable', 'Nicht verfügbar');
  const totalProduction = dashboardPresentation(snapshot.state).production;

  return <div className="operations-page operations-workspace" ref={workspace}>
    <nav className="operations-tabs section-index" aria-label={text('Operations sections', 'Bereiche der Operationen')}>
      <button type="button" data-operations-view="jobs" aria-pressed={view === 'starter-heading'} onClick={() => open('starter-heading')}>{text('JOBS', 'JOBS')}</button>
      <button type="button" data-operations-view="businesses" aria-pressed={view === 'businesses-heading'} onClick={() => open('businesses-heading')}>{text('BUSINESSES', 'BUSINESSES')}</button>
      <button type="button" data-operations-view="equipment" aria-pressed={view === 'upgrades-heading'} onClick={() => open('upgrades-heading')}>{text('EQUIPMENT', 'AUSRÜSTUNG')}</button>
      <button type="button" data-operations-view="automation" aria-pressed={view === 'automation-heading'} onClick={() => open('automation-heading')}>{text('AUTOMATION', 'AUTOMATISIERUNG')}</button>
    </nav>

    <div hidden={view !== 'starter-heading'} className="operations-view">
    <section className="operations-block jobs-block" aria-labelledby="starter-heading">
      <div className="standard-delivery">
      <div className="operations-section-heading">
        <div><span className="eyebrow">{text('QUICK CASH', 'SCHNELLES CASH')}</span><h2 id="starter-heading" className="operations-target" tabIndex={-1}>{waterfront ? text('Waterfront Delivery', 'Waterfront-Lieferung') : text('District Delivery', 'Bezirkslieferung')}</h2></div>
        <span className="operations-kicker">{text('Manual work', 'Handarbeit')}</span>
      </div>
      <p className="operations-lead">{text('Move a package across your operating district, get paid, and keep HR comfortably fictional. Manual delivery pay grows with the unmodified production of your owned Businesses.', 'Bring ein Paket durch deinen Einsatzbezirk, kassier ab und lass HR weiterhin angenehm fiktiv bleiben. Manuelle Liefer-Cash wächst mit der unmodifizierten Produktion deiner eigenen Businesses.')}</p>
      <dl className="job-metrics">
        <div><dt>{text('Payout', 'Auszahlung')}</dt><dd>{reward.ok ? formatReward(reward.reward) : unavailable}</dd></div>
        <div><dt>{text('XP')}</dt><dd>+{xp.ok ? formatXp(xp.reward) : unavailable}</dd></div>
        <div><dt>{text('Heat')}</dt><dd>+{MANUAL_JOB_HEAT}</dd></div>
      </dl>
      <p className="manual-readiness is-ready">{text('NO COOLDOWN · Standard deliveries are always ready. Click responsibly. Or don’t.', 'KEIN COOLDOWN · Normale Lieferungen sind immer bereit. Klick verantwortungsvoll. Oder auch nicht.')}</p>
      <button className="action-button delivery-button operations-primary-action" onClick={runStarterJob} disabled={paused}>
        <span>{paused ? text('Session paused', 'Session pausiert') : waterfront ? text('Run waterfront delivery', 'Waterfront-Lieferung fahren') : text('Run district delivery', 'Bezirkslieferung fahren')}</span>
        <span className="reward">+{reward.ok ? formatReward(reward.reward) : unavailable} <span aria-hidden="true">↗</span></span>
      </button>
      {reward.ok && reward.applied.length > 0 && <details className="operations-disclosure">
        <summary>{text('Reward details', 'Auszahlungsdetails')}</summary>
        <div className="operations-disclosure-body"><p>{text('Portfolio-paced base reward:', 'Portfolio-basierte Grundauszahlung:')} <strong>{formatReward(reward.base)}</strong></p><ModifierBreakdown modifiers={reward.applied} /><p>{text('Effective reward:', 'Tatsächliche Auszahlung:')} <strong>{formatReward(reward.reward)}</strong></p></div>
      </details>}
      </div>
      <RiskyDelivery state={snapshot.state} paused={paused} onRun={game.runRiskyDelivery} />
      <DiscreetDelivery state={snapshot.state} paused={paused} onRun={game.runDiscreetDelivery} />
    </section>
    <DistrictHeat state={snapshot.state} paused={paused || game.persistence.kind === 'blocked'} onChoose={game.chooseDistrict} onDecoy={game.runManhuntDecoy} />
    </div>
    <section hidden={view !== 'businesses-heading'} className="operations-block businesses-block" aria-labelledby="businesses-heading">
      <div className="operations-section-heading business-heading-row"><div><span className="eyebrow">{text('YOUR EMPIRE', 'DEIN IMPERIUM')}</span><h2 id="businesses-heading" className="operations-target" tabIndex={-1}>{text('Businesses', 'Businesses')}</h2></div><div className="business-total-compact"><span>{text('Total production', 'Gesamtproduktion')}</span><strong><RateValue text={totalProduction} /></strong></div></div>
      <p className="operations-lead">{text('Own the block, upgrade the paperwork, and pretend recurring revenue is a personality.', 'Übernimm den Block, upgrade den Papierkram und tu so, als wäre passives Einkommen eine Persönlichkeit.')}</p>
      <BusinessPortfolio game={game} destination={destination ?? null} />
    </section>
    <section hidden={view !== 'upgrades-heading'} className="operations-block upgrades-block" aria-labelledby="upgrades-heading">
      <div className="operations-section-heading"><div><span className="eyebrow">{text('EQUIPMENT', 'EQUIPMENT')}</span><h2 id="upgrades-heading" tabIndex={-1}>{text('Business Upgrades', 'Business-Upgrades')}</h2></div></div>
      <p className="operations-lead">{text('Spend money to make money. Economists hate this one extremely obvious trick.', 'Gib Geld aus, um mehr Geld zu machen. Volkswirte hassen diesen erstaunlich offensichtlichen Trick.')}</p>
      <div className="upgrade-catalog">{UPGRADE_CATALOG.map(upgrade => <UpgradeCard key={upgrade.id} view={selectUpgrade(snapshot.state, upgrade.id)} paused={paused} onPurchase={() => buyUpgrade(upgrade.id)} />)}</div>
    </section>
    <section hidden={view !== 'automation-heading'} className="operations-block automation-block" aria-labelledby="automation-heading">
      <div className="operations-section-heading"><div><span className="eyebrow">{text('DELEGATE THE BORING PART', 'DELEGIER DEN LANGWEILIGEN TEIL')}</span><h2 id="automation-heading" className="operations-target" tabIndex={-1}>{text('Automation', 'Automatisierung')}</h2></div></div>
      <p className="operations-lead">{text('Let the machinery earn money while you focus on making increasingly expensive decisions.', 'Lass die Maschinen Geld verdienen, während du dich auf zunehmend teure Fehlentscheidungen konzentrierst.')}</p>
      <div className="automation-grid"><AutomationCard view={selectDispatcher(snapshot.state)} paused={paused} event={automationEvent} onPurchase={() => buyAutomation(DELIVERY_DISPATCHER.id)} /><AutoUpgraderCard view={selectAutoUpgrader(snapshot.state)} paused={paused} onPurchase={() => buyAutomation(BUSINESS_AUTO_UPGRADER.id)} onTargetChange={changeAutoUpgraderTarget} onToggle={enabled => toggleAutomation(BUSINESS_AUTO_UPGRADER.id, enabled)} /></div>
    </section>
  </div>;
}
