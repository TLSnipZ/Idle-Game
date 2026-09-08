import { getLevelProgress } from '../features/progression';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import { describeLevelIncrease, formatXp } from './progression-presentation';

export function PlayerProgress({ xp, event, paused }: {
  readonly xp: number;
  readonly event: RuntimeSnapshot['levelEvent'];
  readonly paused: boolean;
}) {
  const progress = getLevelProgress(xp);
  return <section className="player-progress" aria-labelledby="player-level-heading">
    <div className="panel-heading"><h3 id="player-level-heading">Level {progress.currentLevel}</h3>
      <span>Total XP: {formatXp(progress.currentXp)}</span></div>
    <label htmlFor="player-xp-progress">{progress.isMaxLevel ? 'MAX LEVEL'
      : `${formatXp(progress.xpIntoLevel)} / ${formatXp(progress.xpNeededForLevel)} XP toward Level ${progress.currentLevel + 1}`}</label>
    <progress id="player-xp-progress" value={progress.isMaxLevel ? 1 : progress.xpIntoLevel} max={progress.isMaxLevel ? 1 : progress.xpNeededForLevel} />
    <p className="is-live" role="status" aria-live="polite" aria-atomic="true">
      <span key={event?.sequence}>{event && !paused ? describeLevelIncrease(event) : ''}</span>
    </p>
  </section>;
}
