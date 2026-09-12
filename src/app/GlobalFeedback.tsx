import type { useGame } from './use-game';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { describeLevelIncrease } from './progression-presentation';
import { describeEventSpawn } from './event-presentation';
import { describeAutomatedJobs } from './automation-presentation';
import { describePersistence } from './game-presentation';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

function localizedUnlock(name: string, locale: 'en' | 'de') {
  if (locale === 'en') return name;
  const knownIds = [
    'business:dockside-detail','business:neon-laundry','business:afterdark-customs','business:solara-nights',
    'vehicle:kairo-kx-r','crew:rico-vale','crew:mara-knox','crew:jax-mercer','territory:waterfront','territory:neon-mile',
    'upgrade:commercial-pressure-washer','upgrade:industrial-detailing-line','upgrade:fleet-logistics','upgrade:street-connections','upgrade:express-tips',
    'automation:delivery-dispatcher','automation:business-auto-upgrader',
    'skill:streetwise-investment','skill:fast-talker','skill:learn-the-streets','skill:silent-partner','skill:never-sleeps',
  ];
  for (const id of knownIds) {
    const localized = localizedContent(locale, id, 'name', name);
    if (localized !== name) return localized;
  }
  return name;
}

export function GlobalFeedback({ game, transferMessage, rebirthMessage }: {
  readonly game: ReturnType<typeof useGame>; readonly transferMessage: string; readonly rebirthMessage: string;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const { feedback, levelEvent, achievementEvent, cityEvent, automationEvent, persistence, runtimeError } = game;
  const paused = runtimeError !== null;
  const storageError = persistence.kind === 'blocked' || persistence.kind === 'error' || persistence.kind === 'offline-error';
  const achievements = achievementEvent ? ACHIEVEMENT_CATALOG.filter(item => achievementEvent.ids.includes(item.id))
    .map(item => localizedContent(locale, item.id, 'name', item.name)) : [];
  return <aside className="global-feedback" aria-label={text('Session feedback', 'Session-Rückmeldungen')} tabIndex={0}>
    <div className={`feedback-command feedback-${feedback.tone ?? 'info'}`} role="status" aria-live="polite" aria-atomic="true"><span key={feedback.sequence}>{feedback.message}</span></div>
    <div className="feedback-achievement" role="status" aria-live="polite" aria-atomic="true">{achievementEvent && achievements.length > 0 && <span key={achievementEvent.sequence}>{text(achievements.length === 1 ? 'ACHIEVEMENT UNLOCKED' : 'ACHIEVEMENTS UNLOCKED', achievements.length === 1 ? 'ACHIEVEMENT FREIGESCHALTET' : 'ACHIEVEMENTS FREIGESCHALTET')} — {achievements.join(' · ')}</span>}</div>
    <div role="status" aria-live="polite" aria-atomic="true">{levelEvent && !paused && <span key={levelEvent.sequence}>{describeLevelIncrease(levelEvent, locale)}{levelEvent.unlocks?.length ? ` · ${text('New unlock available:', 'Neue Freischaltung:')} ${levelEvent.unlocks.map(name => localizedUnlock(name, locale)).join(', ')}` : ''}</span>}</div>
    <div className="feedback-event" role="status" aria-live="polite" aria-atomic="true">{cityEvent && cityEvent.id === game.snapshot.state.events.pendingEventId && <span key={cityEvent.sequence}>{describeEventSpawn(cityEvent.id, locale)}</span>}</div>
    <div>{automationEvent && !paused && <span>{text('Last dispatch:', 'Letzter Dispatch:')} {describeAutomatedJobs(automationEvent, locale)}</span>}</div>
    {transferMessage && <p role="status">{transferMessage}</p>}
    {rebirthMessage && <p role="status">{rebirthMessage}</p>}
    <div role="alert">{paused && <div className="runtime-error"><strong>{text('Session paused. Production has stopped.', 'Session pausiert. Produktion steht. Selbst das fragwürdigste Imperium braucht manchmal Neustart.')}</strong><p>{text('Reload to restore the last available local save. Unsaved progress may be lost.', 'Neu laden, um den letzten verfügbaren lokalen Save wiederherzustellen. Ungespeicherter Fortschritt könnte verloren gehen.')}</p></div>}</div>
    <div role="status" aria-live="polite" aria-atomic="true" className={storageError ? 'runtime-error' : undefined}>{storageError ? describePersistence(persistence, locale) : ''}</div>
  </aside>;
}
