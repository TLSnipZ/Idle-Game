import { Statistics } from './Statistics';
import { Achievements } from './Achievements';
import { CityEvents } from './CityEvents';
import { CrewPanel } from './CrewPanel';
import { CITY_NAME } from '../features/territories';
import { City } from './City';
import { SkillTree } from './SkillTree';
import { RebirthPanel } from './RebirthPanel';
import { Garage } from './Garage';
import { PlayerProgress } from './PlayerProgress';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { AutomationCard } from './AutomationCard';
import { selectDispatcher, selectAutoUpgrader } from '../game/automation-selectors';
import { DELIVERY_DISPATCHER, BUSINESS_AUTO_UPGRADER } from '../features/automation';
import { ModifierBreakdown } from './ModifierBreakdown';
import { UpgradeCard } from './UpgradeCard';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { selectUpgrade } from '../game/selectors';
import { evaluateJobReward } from '../game/effective-stats';
import { OfflineReturn } from './OfflineReturn';
import { getOfflineCapMs } from '../game/offline-cap';
import { formatOfflineDuration } from './offline-presentation';
import { SaveManagement } from './SaveManagement';
import { STARTER_BUSINESS } from '../features/businesses';
import { BusinessCard } from './BusinessCard';
import { STARTER_JOB } from '../features/economy';
import { formatCash } from '../features/economy/ui';
import { selectBusinessProgress, selectCash, selectOwnsBusiness, selectCanPurchaseBusiness } from '../game/selectors';
import { describePersistence } from './game-presentation';
import { useGame } from './use-game';
import './App.css';

export function App() {
  const { toggleAutomation, achievementEvent, chooseEvent, cityEvent, recruitCrew, assignCrew, unassignCrew, coolDown, takeTerritory, buySkill, rebirth, buyVehicle, levelEvent, buyAutomation, automationEvent, buyUpgrade, upgradeOwnedBusiness, offline, dismissOffline, saveActions, persistence, snapshot, runtimeError, feedback, runStarterJob, buyBusiness } = useGame();
  const owned = selectOwnsBusiness(snapshot.state, STARTER_BUSINESS.id);
  const reward = evaluateJobReward(snapshot.state);
  const paused = runtimeError !== null;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <span className="wordmark"><span className="brand-mark" aria-hidden="true">CE</span> Crime Empire</span>
        <span className="edition">{CITY_NAME}</span>
      </header>
      <main id="main" className="foundation" tabIndex={-1}>
        <div className="chapter-heading">
          <div>
            <p className="eyebrow">Small beginnings. Bigger ambitions.</p>
            <h1>Build your <em>first empire.</em></h1>
            <p className="intro">Run a delivery. Get the keys. Make the waterfront work for you.</p>
          </div>
          <span className={`session-badge ${paused ? 'is-paused' : ''}`}>
            <span className="status-dot" aria-hidden="true" />{paused ? 'Session paused' : 'Session open'}
          </span>
        </div>
        <OfflineReturn progress={offline} onDismiss={dismissOffline} />
        <div className="play-grid">
          <section className="cash-panel panel" aria-labelledby="cash-heading">
            <div className="panel-heading"><h2 id="cash-heading">Available cash</h2><span className="unit-label">USD</span></div>
            <div className="cash-window" tabIndex={0} role="region" aria-label="Current cash balance, scroll horizontally for very large balances">
              <p className="cash-balance">{formatCash(selectCash(snapshot.state))}</p>
            </div>
            <p className={`cash-context ${owned && !paused ? 'is-live' : ''}`}>
              <span className="status-dot" aria-hidden="true" />
              {paused ? 'Earnings paused' : owned ? 'Your business is working for you' : 'Your next move starts here'}
            </p>
            <PlayerProgress xp={snapshot.state.progression.xp} event={levelEvent} paused={paused} />
            <div className="delivery-block">
              <p className="eyebrow">Make a connection</p>
              <h3>A quick run. A fresh start.</h3>
              <p>Take a waterfront delivery and put cash toward your first set of keys.</p>
              <button className="action-button delivery-button" onClick={runStarterJob} disabled={paused}>
                <span>{STARTER_JOB.label}</span>
                <span className="reward">+{reward.ok ? formatCash(reward.reward) : 'Unavailable'} <span aria-hidden="true">↗</span></span>
              </button>
              {reward.ok && reward.applied.length > 0 && <><p>Base reward: {formatCash(reward.base)}</p><ModifierBreakdown modifiers={reward.applied} /><p>Effective reward: {formatCash(reward.reward)}</p></>}
            </div>
            <div className="action-status" role="status" aria-live="polite" aria-atomic="true">
              <span key={feedback.sequence}>{paused ? '' : feedback.message}</span>
            </div>
          </section>
          <BusinessCard
            progress={selectBusinessProgress(snapshot.state, STARTER_BUSINESS.id)}
            onUpgrade={() => upgradeOwnedBusiness(STARTER_BUSINESS.id)}
            owned={owned}
            canPurchase={selectCanPurchaseBusiness(snapshot.state, STARTER_BUSINESS.id)}
            paused={paused}
            onPurchase={() => buyBusiness(STARTER_BUSINESS.id)}
          />
        </div>
        <div role="alert" className={paused ? 'runtime-error' : undefined}>
          {paused && <><strong>Session paused. Production has stopped.</strong><p>Reload to restore the last available local save. Unsaved progress may be lost.</p></>}
        </div>
        <p role="status" className={persistence.kind === 'blocked' || persistence.kind === 'error' || persistence.kind === 'offline-error' ? 'runtime-error' : 'session-note'}>{describePersistence(persistence)}</p>
        <section aria-labelledby="upgrades-heading"><h2 id="upgrades-heading">Upgrades</h2><div className="upgrade-catalog">{UPGRADE_CATALOG.map(upgrade => <UpgradeCard key={upgrade.id} view={selectUpgrade(snapshot.state, upgrade.id)} paused={paused} onPurchase={() => buyUpgrade(upgrade.id)} />)}</div></section>
        <AutomationCard view={selectDispatcher(snapshot.state)} paused={paused} event={automationEvent} onPurchase={() => buyAutomation(DELIVERY_DISPATCHER.id)} />
        <AutoUpgraderCard view={selectAutoUpgrader(snapshot.state)} paused={paused} onPurchase={() => buyAutomation(BUSINESS_AUTO_UPGRADER.id)} onToggle={enabled => toggleAutomation(BUSINESS_AUTO_UPGRADER.id, enabled)} />
        <City state={snapshot.state} paused={paused} onAcquire={takeTerritory} onLayLow={coolDown} />
        <CityEvents state={snapshot.state} paused={paused} announcement={cityEvent} onChoose={chooseEvent} />
        <CrewPanel state={snapshot.state} paused={paused} onRecruit={recruitCrew} onAssign={assignCrew} onUnassign={unassignCrew} />
        <Garage state={snapshot.state} paused={paused} onPurchase={buyVehicle} />
        <RebirthPanel state={snapshot.state} unavailable={paused || persistence.kind === 'blocked'} onRebirth={rebirth} />
        <SkillTree state={snapshot.state} paused={paused} onPurchase={buySkill} />
        <Achievements state={snapshot.state} announcement={achievementEvent} />
        <Statistics state={snapshot.state} />
        <SaveManagement actions={saveActions} />
        <p className="session-note">Local progress <span aria-hidden="true">/</span> Earn while away for up to {formatOfflineDuration(getOfflineCapMs(snapshot.state))}.</p>
      </main>
      <footer className="app-footer"><span>Crime Empire <span aria-hidden="true">/</span> Working title</span><span>Start small. Own the night.</span></footer>
    </div>
  );
}
