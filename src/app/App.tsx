import './App.css';

export function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <span className="wordmark">Crime Empire</span>
        <span className="edition">Project foundation</span>
      </header>
      <main id="main" className="foundation" tabIndex={-1}>
        <p className="eyebrow">Chapter zero</p>
        <h1>The city is waiting.</h1>
        <p className="intro">Your empire starts here.</p>
        <div className="empty-state">
          <span className="empty-state-label">Not yet playable</span>
          <p>The foundation is ready. Gameplay will arrive in future development phases.</p>
        </div>
      </main>
      <footer className="app-footer">Crime Empire · Working title</footer>
    </div>
  );
}
