import { selectAchievements, achievementAnnouncement } from '../game/achievements';
import type { GameState } from '../game/game-state';
import type { RuntimeSnapshot } from '../platform/game-runtime';

export function Achievements({ state, announcement }: {
  readonly state: GameState;
  readonly announcement?: RuntimeSnapshot['achievementEvent'];
}) {
  const view = selectAchievements(state);
  return <section className="panel achievements" aria-labelledby="achievements-heading">
    <h2 id="achievements-heading">ACHIEVEMENTS</h2>
    <p>Unlocked: {view.unlockedCount} / {view.totalCount}</p>
    <div role="status" aria-live="polite" aria-atomic="true">
      {announcement && <span key={announcement.sequence}>{achievementAnnouncement(announcement.ids)}</span>}
    </div>
    <div className="achievement-grid">{view.cards.map(card =>
      <article className={`achievement-card ${card.unlocked ? 'is-unlocked' : ''}`} key={card.id} aria-labelledby={`${card.id}-name`}>
        <h3 id={`${card.id}-name`}>{card.name}</h3>
        <p>{card.description}</p>
        <strong>{card.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
        <p>{card.progress}</p>
      </article>)}</div>
  </section>;
}
