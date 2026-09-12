import { getLevelProgress } from '../features/progression';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import { describeLevelIncrease, formatXp } from './progression-presentation';
import { useLocale, useLocalizedText } from './LocalizationProvider';

export function PlayerProgress({ xp, event, paused }: {
  readonly xp: number;
  readonly event: RuntimeSnapshot['levelEvent'];
  readonly paused: boolean;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const progress = getLevelProgress(xp);
  return <section className="player-progress" aria-labelledby="player-level-heading">
    <div className="panel-heading"><h3 id="player-level-heading">Level {progress.currentLevel}</h3>
      <span>{text('Total XP:', 'Gesamt-XP:')} {formatXp(progress.currentXp)}</span></div>
    <label htmlFor="player-xp-progress">{progress.isMaxLevel ? text('MAX LEVEL', 'MAX-LEVEL')
      : text(`${formatXp(progress.xpIntoLevel)} / ${formatXp(progress.xpNeededForLevel)} XP toward Level ${progress.currentLevel + 1}`, `${formatXp(progress.xpIntoLevel)} / ${formatXp(progress.xpNeededForLevel)} XP bis Level ${progress.currentLevel + 1}`)}</label>
    <progress id="player-xp-progress" value={progress.isMaxLevel ? 1 : progress.xpIntoLevel} max={progress.isMaxLevel ? 1 : progress.xpNeededForLevel} />
    <p className="is-live" role="status" aria-live="polite" aria-atomic="true">
      <span key={event?.sequence}>{event && !paused ? <>
        {describeLevelIncrease(event, locale)}
        {event.unlocks && <span className="unlock-feedback">{text('New unlock available:', 'Neue Freischaltung:')} {event.unlocks.join(', ')}</span>}
      </> : ''}</span>
    </p>
  </section>;
}
