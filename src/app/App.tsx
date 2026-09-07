import { STARTER_BUSINESS } from '../features/businesses';
import { BusinessCard } from './BusinessCard';
import { STARTER_JOB } from '../features/economy';
import { formatCash } from '../features/economy/ui';
import { selectCash, selectOwnsBusiness, selectCanPurchaseBusiness } from '../game/selectors';
import { useGame } from './use-game';
import './App.css';

export function App() {
  const { snapshot, runStarterJob, buyBusiness } = useGame();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <span className="wordmark">Crime Empire</span>
        <span className="edition">Early access</span>
      </header>
      <main id="main" className="foundation" tabIndex={-1}>
        <p className="eyebrow">First connections</p>
        <h1>The city is waiting.</h1>
        <p className="intro">Your empire starts here.</p>
        <div className="empty-state">
          <span className="empty-state-label">Cash on hand</span>
          <p className="cash-balance">{formatCash(selectCash(snapshot.state))}</p>
          <button className="starter-job" onClick={runStarterJob}>
            <span>{STARTER_JOB.label}</span>
            <span>+{formatCash(STARTER_JOB.reward)}</span>
          </button>
          <p className="session-note">Session only · Progress resets on reload.</p>
          <p role="status" className="action-status">
            {!snapshot.ok ? 'Action could not be completed. Your cash and ownership are unchanged.' : ''}
          </p>
        </div>
        <BusinessCard
          owned={selectOwnsBusiness(snapshot.state, STARTER_BUSINESS.id)}
          canPurchase={selectCanPurchaseBusiness(snapshot.state, STARTER_BUSINESS.id)}
          onPurchase={() => buyBusiness(STARTER_BUSINESS.id)}
        />
      </main>
      <footer className="app-footer">Crime Empire · Working title</footer>
    </div>
  );
}
