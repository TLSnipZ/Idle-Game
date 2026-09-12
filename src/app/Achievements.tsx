import { selectAchievements } from '../game/achievements';
import type { GameState } from '../game/game-state';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

function localizedProgress(progress: string, locale: 'en' | 'de') {
  if (locale === 'en') return progress;
  if (progress === 'Completed') return 'Abgeschlossen · Akte geschlossen';
  if (progress === 'Controlled') return 'Kontrolliert';
  if (progress === 'Not controlled') return 'Nicht kontrolliert';
  if (progress.startsWith('Dockside Level ')) return progress.replace('Dockside Level ', 'Dockside Level ');
  if (progress.endsWith(' recruited')) return progress.replace(' recruited', ' rekrutiert');
  return progress;
}
export function Achievements({ state, announcement }: {
  readonly state: GameState;
  readonly announcement?: RuntimeSnapshot['achievementEvent'];
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const view = selectAchievements(state);
  const announcementText = announcement ? ACHIEVEMENT_CATALOG.filter(item => announcement.ids.includes(item.id))
    .map(item => localizedContent(locale, item.id, 'name', item.name)) : [];
  return <section className="panel achievements" aria-labelledby="achievements-heading">
    <h2 id="achievements-heading">{text('ACHIEVEMENTS', 'ACHIEVEMENTS')}</h2>
    <p>{text('Unlocked:', 'Freigeschaltet:')} {view.unlockedCount} / {view.totalCount} · {text('Proof that questionable decisions can still earn badges.', 'Beweis, dass fragwürdige Entscheidungen trotzdem Abzeichen bringen.')}</p>
    <div role="status" aria-live="polite" aria-atomic="true">
      {announcement && announcementText.length > 0 && <span key={announcement.sequence}>{text(announcementText.length === 1 ? 'ACHIEVEMENT UNLOCKED' : 'ACHIEVEMENTS UNLOCKED', announcementText.length === 1 ? 'ACHIEVEMENT FREIGESCHALTET' : 'ACHIEVEMENTS FREIGESCHALTET')} — {announcementText.join(' · ')}</span>}
    </div>
    <div className="achievement-grid">{view.cards.map(card => {
      const name = localizedContent(locale, card.id, 'name', card.name);
      const description = localizedContent(locale, card.id, 'description', card.description);
      return <article className={`achievement-card ${card.unlocked ? 'is-unlocked' : ''}`} key={card.id} aria-labelledby={`${card.id}-name`}>
        <div className="panel-heading"><h3 id={`${card.id}-name`}>{name}</h3>
        <strong className="ownership-badge">{card.unlocked ? text('UNLOCKED', 'FREIGESCHALTET') : text('LOCKED', 'GESPERRT')}</strong></div>
        <p>{description}</p>
        <p className="achievement-progress">{localizedProgress(card.progress, locale)}</p>
      </article>;})}</div>
  </section>;
}
