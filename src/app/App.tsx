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
import './App.css';
import './sections.css';
import './SettingsPanel.css';
import './Hud2.css';

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
  const t = (key: MessageKey) => translate(preferences.settings.locale, key);
  const save = useSaveManagement(game.saveActions, preferences.settings.locale);
  const rebirth = useRebirthControls(game.rebirth, preferences.settings.locale);
  const heading = useRef<HTMLHeadingElement>(null);
  const main = useRef<HTMLElement>(null);
  const captureAction = useActionFocus();
  const previous = useRef(active);
  const [reviewRequest, setReviewRequest] = useState(0);
  const handledReview = useRef(0);
  const [objectiveRequest, setObjectiveRequest] = useState<{ sequence: number; headingId: string; section: SectionId } | null>(null);
  const handledObjective = useRef(0);
  useEffect(() => { setGamePresentationLocale(preferences.settings.locale); }, [preferences.settings.locale]);
  useEffect(() => {
    if (objectiveRequest && objectiveRequest.sequence !== handledObjective.current && active === objectiveRequest.section) {
      const requested = document.getElementById(objectiveRequest.headingId);
      const target = requested && main.current?.contains(requested) ? requested : heading.current;
      if (target) { target.tabIndex = -1; target.classList.add('guidance-destination'); target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
      handledObjective.current = objectiveRequest.sequence;
    } else if (reviewRequest !== handledReview.current && active === SECTION.empire.id) {
      const target = main.current?.querySelector<HTMLElement>('#rebirth-heading'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start', behavior: 'instant' }); handledReview.current = reviewRequest;
    } else if (previous.current !== active) { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
    previous.current = active;
  }, [active, reviewRequest, objectiveRequest]);
  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSettingsOpen(false); };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [settingsOpen]);
  const section = PRIMARY_SECTIONS.find(item => item.id === active) ?? SECTION.overview;
  const [sectionLabelKey, sectionDescriptionKey] = SECTION_COPY[section.id];
  const paused = game.runtimeError !== null;
  const dashboard = dashboardPresentation(game.snapshot.state);
  return <LocalizationProvider locale={preferences.settings.locale}><div className="app-shell">
    <a className="skip-link" href="#main" onClick={() => main.current?.focus()}>{t('skip')}</a>
    <header className="app-header"><span className="wordmark">{CITY_NAME}</span><span className="edition">{t('tagline')}</span><div className="header-actions">{(game.persistence.kind === 'ready' || game.persistence.kind === 'saved' || game.persistence.kind === 'loaded') && <span className="save-health">{t('autosave')}</span>}<button className="settings-trigger" type="button" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">⚙ <span>{t('settings')}</span></button></div></header>
    <GlobalStatus view={dashboard} active={active} onNavigate={setActive} paused={paused} newsMessage={game.feedback.message} t={t} />
    <main ref={main} id="main" className="foundation" tabIndex={-1}>
      <RebirthNotice preview={dashboard.empire} onReview={() => { setActive(SECTION.empire.id); setReviewRequest(request => request + 1); }} />
      <GlobalFeedback game={game} transferMessage={active === SECTION.empire.id ? '' : save.state.message} rebirthMessage={active === SECTION.empire.id ? '' : rebirth.interaction.message} />
      {(save.state.confirming || rebirth.interaction.confirming) && active !== SECTION.empire.id && <button className="action-button section-shortcut" onClick={() => setActive(SECTION.empire.id)}>{t('returnEmpire')}</button>}
      <OfflineReturn progress={game.offline} onDismiss={game.dismissOffline} />
      <NextObjective key={game.replacementSequence} state={game.snapshot.state} onNavigate={destination => { const target = guidanceDestination(destination); setActive(target.section); setObjectiveRequest(request => ({ ...target, sequence: (request?.sequence ?? 0) + 1 })); }} />
      <div onClickCapture={captureAction} id="section-content" data-section={active} aria-labelledby="section-heading">
        <div className="section-heading"><h1 id="section-heading" ref={heading} tabIndex={-1}>{t(sectionLabelKey)}</h1><p>{t(sectionDescriptionKey)}</p></div>
        <SectionContent active={active} game={{ ...game, resetProgress: confirmation => { const result = game.resetProgress(confirmation); if (result.ok) { save.controls.clear(); rebirth.controls.clear(); setActive(DEFAULT_SECTION); } return result; } }} onNavigate={setActive} save={save} rebirth={rebirth} />
      </div>
      <p className="session-note">{t('localProgress')} <span aria-hidden="true">/</span> {t('awayPrefix')} {formatOfflineDuration(getOfflineCapMs(game.snapshot.state))}.</p>
    </main>
    <footer className="app-footer"><span>{CITY_NAME} <span aria-hidden="true">/</span> {t('footerGenre')}</span><span>{t('footerTagline')}</span></footer>
    <SettingsPanel open={settingsOpen} settings={preferences.settings} t={t} onClose={() => setSettingsOpen(false)} onLocale={preferences.setLocale} onReducedMotion={preferences.setReducedMotion} />
  </div></LocalizationProvider>;
}
