import { useEffect, useRef, useState } from 'react';
import { CITY_NAME } from '../features/territories';
import { getOfflineCapMs } from '../game/offline-cap';
import { formatOfflineDuration } from './offline-presentation';
import { OfflineReturn } from './OfflineReturn';
import { setGamePresentationLocale, useGame } from './use-game';
import { useSaveManagement } from './SaveManagement';
import { useRebirthControls } from './RebirthPanel';
import { DEFAULT_SECTION, PRIMARY_SECTIONS, SECTION } from './navigation';
import type { SectionId } from './navigation';
import { SectionContent } from './SectionContent';
import { dashboardPresentation } from './dashboard-presentation';
import { GlobalStatus } from './GlobalStatus';
import { GlobalFeedback } from './GlobalFeedback';
import { useActionFocus } from './use-action-focus';
import { RebirthNotice } from './RebirthNotice';
import { NextObjective } from './NextObjective';
import { guidanceDestination } from './guidance-presentation';
import { SettingsPanel } from './SettingsPanel';
import { translate } from './localization';
import type { MessageKey } from './localization';
import { LocalizationProvider } from './LocalizationProvider';
import { useSettings } from './use-settings';
import { BrandLockup } from './BrandLockup';
import './App.css';
import './sections.css';
import './SettingsPanel.css';
import './Hud2.css';
import './Branding.css';
import './Operations.css';

/** Exactly one runtime hook, outside all navigation-dependent presentation. */
export function App() { return <GameShell game={useGame()} />; }

const SECTION_COPY: Record<SectionId, readonly [MessageKey, MessageKey]> = {
  overview: ['overviewLabel', 'overviewDescription'], operations: ['operationsLabel', 'operationsDescription'],
  city: ['cityLabel', 'cityDescription'], collection: ['collectionLabel', 'collectionDescription'], empire: ['empireLabel', 'empireDescription'],
};

export function GameShell({ game }: { readonly game: ReturnType<typeof useGame> }) {
  const settings = useSettings();
  const t = (key: MessageKey) => translate(settings.locale, key);
  useEffect(() => setGamePresentationLocale(settings.locale), [settings.locale]);
  const [activeSection, setActiveSection] = useState<SectionId>(DEFAULT_SECTION);
  const mainRef = useRef<HTMLElement>(null);
  const save = useSaveManagement(game);
  const rebirth = useRebirthControls(game);
  const actionFocus = useActionFocus();
  const presentation = dashboardPresentation(game.snapshot.state);
  const offlineCapMs = getOfflineCapMs(game.snapshot.state);
  const offlineDuration = game.snapshot.offlineElapsedMs === null ? null : Math.min(game.snapshot.offlineElapsedMs, offlineCapMs);

  function navigate(section: SectionId) {
    setActiveSection(section);
    requestAnimationFrame(() => mainRef.current?.focus());
  }

  function navigateGuidance(destination: ReturnType<typeof guidanceDestination>) {
    navigate(destination.section);
    requestAnimationFrame(() => requestAnimationFrame(() => actionFocus.focus(destination.focusId)));
  }

  const activeCopy = SECTION_COPY[activeSection];
  return <LocalizationProvider locale={settings.locale}>
    <a href="#main-content" className="skip-link">{t('skipToMain')}</a>
    <div className="app-shell">
      <header className="app-header"><BrandLockup /><span className="edition">{CITY_NAME}</span></header>
      <GlobalStatus view={presentation} active={activeSection} onNavigate={navigate} paused={game.runtimeError !== null} t={t} />
      <GlobalFeedback game={game} />
      <main className="foundation" id="main-content" ref={mainRef} tabIndex={-1}>
        {offlineDuration !== null && offlineDuration > 0 && <OfflineReturn duration={formatOfflineDuration(offlineDuration)} earned={game.snapshot.offlineIncome} onDismiss={game.dismissOfflineReturn} />}
        <RebirthNotice view={presentation.empire} onNavigate={() => navigate(SECTION.empire.id)} />
        <NextObjective state={game.snapshot.state} onNavigate={navigateGuidance} />
        <div className="chapter-heading"><div><p className="eyebrow">{t(activeCopy[0])}</p><h1>{t(activeCopy[0])}</h1><p className="intro">{t(activeCopy[1])}</p></div></div>
        <SectionContent section={activeSection} game={game} save={save} rebirth={rebirth} settings={settings} />
      </main>
      <footer className="app-footer"><BrandLockup compact /><span>{CITY_NAME}</span></footer>
      <SettingsPanel settings={settings} />
    </div>
  </LocalizationProvider>;
}
