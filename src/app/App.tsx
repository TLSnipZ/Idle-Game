import { useEffect, useRef, useState } from 'react';
import { CITY_NAME } from '../features/territories';
import { getOfflineCapMs } from '../game/offline-cap';
import { formatOfflineDuration } from './offline-presentation';
import { OfflineReturn } from './OfflineReturn';
import { useGame } from './use-game';
import { useSaveManagement } from './SaveManagement';
import { useRebirthControls } from './RebirthPanel';
import { DEFAULT_SECTION, PRIMARY_SECTIONS, SECTION } from './navigation';
import type { SectionId } from './navigation';
import { SectionContent } from './SectionContent';
import { dashboardPresentation } from './dashboard-presentation';
import { GlobalStatus } from './GlobalStatus';
import { GlobalFeedback } from './GlobalFeedback';
import { useActionFocus } from './use-action-focus';
import './App.css';
import './sections.css';

/** Exactly one runtime hook, outside all navigation-dependent presentation. */
export function App() { return <GameShell game={useGame()} />; }

export function GameShell({ game }: { readonly game: ReturnType<typeof useGame> }) {
  const [active, setActive] = useState<SectionId>(DEFAULT_SECTION);
  const save = useSaveManagement(game.saveActions);
  const rebirth = useRebirthControls(game.rebirth);
  const heading = useRef<HTMLHeadingElement>(null);
  const main = useRef<HTMLElement>(null);
  const captureAction = useActionFocus();
  const previous = useRef(active);
  useEffect(() => {
    if (previous.current !== active) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      previous.current = active;
    }
  }, [active]);
  const section = PRIMARY_SECTIONS.find(section => section.id === active) ?? SECTION.overview;
  const paused = game.runtimeError !== null;
  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={() => main.current?.focus()}>Skip to main content</a>
    <header className="app-header"><span className="wordmark">{CITY_NAME}</span><span className="edition">Own the night</span>{(game.persistence.kind === 'ready' || game.persistence.kind === 'saved' || game.persistence.kind === 'loaded') && <span className="save-health">Autosave on</span>}</header>
    <GlobalStatus view={dashboardPresentation(game.snapshot.state)} active={active} onNavigate={setActive} paused={paused} />
    <main ref={main} id="main" className="foundation" tabIndex={-1}>
      <GlobalFeedback game={game} transferMessage={active === SECTION.empire.id ? '' : save.state.message} rebirthMessage={active === SECTION.empire.id ? '' : rebirth.interaction.message} />
      {(save.state.confirming || rebirth.interaction.confirming) && active !== SECTION.empire.id && <button className="action-button section-shortcut" onClick={() => setActive(SECTION.empire.id)}>Return to Empire · Confirmation awaiting your choice</button>}
      <OfflineReturn progress={game.offline} onDismiss={game.dismissOffline} />
      <div onClickCapture={captureAction} id="section-content" data-section={active} aria-labelledby="section-heading">
        <div className="section-heading"><h1 id="section-heading" ref={heading} tabIndex={-1}>{section.label}</h1><p>{section.description}</p></div>
        <SectionContent active={active} game={game} onNavigate={setActive} save={save} rebirth={rebirth} />
      </div>
      <p className="session-note">Local progress <span aria-hidden="true">/</span> Earn while away for up to {formatOfflineDuration(getOfflineCapMs(game.snapshot.state))}.</p>
    </main>
    <footer className="app-footer"><span>{CITY_NAME} <span aria-hidden="true">/</span> Crime empire</span><span>Start small. Own the night.</span></footer>
  </div>;
}
