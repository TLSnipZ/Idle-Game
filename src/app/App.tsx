import { SaveStatus } from './SaveStatus';
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
import { RebirthNotice } from './RebirthNotice';
import { NextObjective } from './NextObjective';
import { guidanceDestination } from './guidance-presentation';
import { SettingsPanel } from './SettingsPanel';
import { translate } from './localization';
import type { MessageKey } from './localization';
import { localize, LocalizationProvider } from './LocalizationProvider';
import { useSettings } from './use-settings';
import { BrandLockup } from './BrandLockup';
import './App.css';
import './sections.css';
import './SettingsPanel.css';
import './Hud2.css';
import './Branding.css';
import './Operations.css';
import './Layout.css';
import './DesignSystem.css';
import './BusinessPortfolio.css';
import './WorldWorkspace.css';

/** Exactly one runtime hook, outside all navigation-dependent presentation. */
export function App() { return <GameShell game={useGame()} />; }

const SECTION_COPY: Record<SectionId, readonly [MessageKey, MessageKey]> = {
  overview: ['overviewLabel', 'overviewDescription'], operations: ['operationsLabel', 'operationsDescription'],
  city: ['cityLabel', 'cityDescription'], collection: ['collectionLabel', 'collectionDescription'], empire: ['empireLabel', 'empireDescription'],
};

export function GameShell({ game }: { readonly game: ReturnType<typeof useGame> }) {
  const [active, setActive] = useState<SectionId>(DEFAULT_SECTION);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const preferences = useSettings();
  const text = (value: string) => localize(preferences.settings.locale, value, value);
  const t = (key: MessageKey) => translate(preferences.settings.locale, key);
  const save = useSaveManagement(game.saveActions, preferences.settings.locale);
  const rebirth = useRebirthControls(game.rebirth, preferences.settings.locale);
  const heading = useRef<HTMLHeadingElement>(null);
  const main = useRef<HTMLElement>(null);
  const captureAction = useActionFocus();
  const previous = useRef(active);
  const [objectiveRequest, setObjectiveRequest] = useState<{ sequence: number; headingId: string; section: SectionId } | null>(null);
  const handledObjective = useRef(0);
  useEffect(() => { game.setPresentationLocale(preferences.settings.locale); }, [game.setPresentationLocale, preferences.settings.locale]);
  useEffect(() => {
    if (objectiveRequest && objectiveRequest.sequence !== handledObjective.current && active === objectiveRequest.section) {
      if (active !== SECTION.overview.id) { handledObjective.current = objectiveRequest.sequence; previous.current = active; return; }
      const requested = document.getElementById(objectiveRequest.headingId);
      const target = requested && main.current?.contains(requested) ? requested : heading.current;
      if (target) { target.tabIndex = -1; target.classList.add('guidance-destination'); target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
      handledObjective.current = objectiveRequest.sequence;
    } else if (previous.current !== active) { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
    previous.current = active;
  }, [active, objectiveRequest]);
  function navigate(section: SectionId, headingId?: string) {
    setActive(section);
    if (headingId) setObjectiveRequest(request => ({ section, headingId, sequence: (request?.sequence ?? 0) + 1 }));
  }
  const section = PRIMARY_SECTIONS.find(item => item.id === active) ?? SECTION.overview;
  const [sectionLabelKey, sectionDescriptionKey] = SECTION_COPY[section.id];
  const paused = game.runtimeError !== null;
  const dashboard = dashboardPresentation(game.snapshot.state);
  return <LocalizationProvider locale={preferences.settings.locale}><div className="app-shell">
    <a className="skip-link" href="#main" onClick={() => main.current?.focus()}>{t('skip')}</a>
    <header className="app-header"><BrandLockup /><span className="edition">{t('tagline')}</span><div className="header-actions"><SaveStatus status={game.persistence} /><button className="settings-trigger" type="button" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">⚙ <span>{t('settings')}</span></button></div></header>
    <GlobalStatus view={dashboard} active={active} onNavigate={navigate} paused={paused} newsMessage={game.feedback.message} t={t} />
    <main ref={main} id="main" className="foundation" tabIndex={-1}>
      <RebirthNotice preview={dashboard.empire} onReview={() => navigate(SECTION.empire.id, 'rebirth-heading')} />
      <GlobalFeedback game={game} transferMessage={active === SECTION.empire.id ? '' : save.state.message} rebirthMessage={active === SECTION.empire.id ? '' : rebirth.interaction.message} />
      {(save.state.confirming || rebirth.interaction.confirming) && active !== SECTION.empire.id && <button className="action-button section-shortcut" onClick={() => navigate(SECTION.empire.id, save.state.confirming ? 'save-transfer-heading' : 'rebirth-heading')}>{t('returnEmpire')}</button>}
      <OfflineReturn progress={game.offline} onDismiss={game.dismissOffline} />
      <NextObjective key={game.replacementSequence} state={game.snapshot.state} onNavigate={destination => { const target = guidanceDestination(destination); setActive(target.section); setObjectiveRequest(request => ({ ...target, sequence: (request?.sequence ?? 0) + 1 })); }} />
      <div onClickCapture={captureAction} id="section-content" data-section={active} aria-labelledby="section-heading">
        <div className="section-heading"><h1 id="section-heading" ref={heading} tabIndex={-1}>{t(sectionLabelKey)}</h1><p>{t(sectionDescriptionKey)}</p></div>
        <SectionContent workspaceDestination={objectiveRequest?.section === active && objectiveRequest.sequence !== handledObjective.current ? objectiveRequest : null} operationsDestination={objectiveRequest?.section === SECTION.operations.id && objectiveRequest.sequence !== handledObjective.current ? objectiveRequest : null} collectionDestination={objectiveRequest?.section === SECTION.collection.id && objectiveRequest.sequence !== handledObjective.current ? objectiveRequest : null} active={active} game={{ ...game, resetProgress: confirmation => { const result = game.resetProgress(confirmation); if (result.ok) { save.controls.clear(); rebirth.controls.clear(); setActive(DEFAULT_SECTION); } return result; } }} onNavigate={navigate} save={save} rebirth={rebirth} />
      </div>
      <p className="session-note">{t('localProgress')} <span aria-hidden="true">/</span> {t('awayPrefix')} {text(formatOfflineDuration(getOfflineCapMs(game.snapshot.state)))}.</p>
    </main>
    <footer className="app-footer"><span>{text(CITY_NAME)} <span aria-hidden="true">/</span> {t('footerGenre')}</span><span>{t('footerTagline')}</span></footer>
    <SettingsPanel open={settingsOpen} settings={preferences.settings} t={t} onClose={() => setSettingsOpen(false)} onLocale={preferences.setLocale} onReducedMotion={preferences.setReducedMotion} />
  </div></LocalizationProvider>;
}
