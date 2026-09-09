import type { useGame } from './use-game';
import { achievementAnnouncement } from '../game/achievements';
import { describeLevelIncrease } from './progression-presentation';
import { describeEventSpawn } from './event-presentation';
import { describeAutomatedJobs } from './automation-presentation';
import { describePersistence } from './game-presentation';

export function GlobalFeedback({ game, transferMessage, rebirthMessage }: {
  readonly game: ReturnType<typeof useGame>; readonly transferMessage: string; readonly rebirthMessage: string;
}) {
  const { feedback, levelEvent, achievementEvent, cityEvent, automationEvent, persistence, runtimeError } = game;
  const paused = runtimeError !== null;
  return <aside className="global-feedback" aria-label="Session feedback">
    <div role="status" aria-live="polite" aria-atomic="true"><span key={feedback.sequence}>{feedback.message}</span></div>
    <div role="status" aria-live="polite" aria-atomic="true">{achievementEvent && <span key={achievementEvent.sequence}>{achievementAnnouncement(achievementEvent.ids)}</span>}</div>
    <div role="status" aria-live="polite" aria-atomic="true">{levelEvent && !paused && <span key={levelEvent.sequence}>{describeLevelIncrease(levelEvent)}{levelEvent.unlocks?.length ? ` · New unlock available: ${levelEvent.unlocks.join(', ')}` : ''}</span>}</div>
    <div role="status" aria-live="polite" aria-atomic="true">{cityEvent && cityEvent.id === game.snapshot.state.events.pendingEventId && <span key={cityEvent.sequence}>{describeEventSpawn(cityEvent.id)}</span>}</div>
    <div role="status" aria-live="polite" aria-atomic="true">{automationEvent && !paused && <span key={automationEvent.sequence}>Last dispatch: {describeAutomatedJobs(automationEvent)}</span>}</div>
    {transferMessage && <p role="status">{transferMessage}</p>}
    {rebirthMessage && <p role="status">{rebirthMessage}</p>}
    <div role="alert">{paused && <div className="runtime-error"><strong>Session paused. Production has stopped.</strong><p>Reload to restore the last available local save. Unsaved progress may be lost.</p></div>}</div>
    <p role="status" className={persistence.kind === 'blocked' || persistence.kind === 'error' || persistence.kind === 'offline-error' ? 'runtime-error' : 'persistence-note'}>{describePersistence(persistence)}</p>
  </aside>;
}
