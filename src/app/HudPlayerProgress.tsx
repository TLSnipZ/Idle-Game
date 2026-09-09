import type { getLevelProgress } from '../features/progression';
import { formatInteger } from './number-format';

/** Local-level XP from the domain selector; invalid presentation never repairs state. */
export function HudPlayerProgress({ progress }: { readonly progress: ReturnType<typeof getLevelProgress> }) {
  if (progress.isMaxLevel) return <span className="hud-xp-text">MAX LEVEL</span>;
  const valid = Number.isSafeInteger(progress.xpNeededForLevel) && progress.xpNeededForLevel > 0
    && Number.isSafeInteger(progress.xpIntoLevel) && Number.isSafeInteger(progress.currentLevel);
  if (!valid) return <span className="hud-xp-text">XP unavailable</span>;
  const value = Math.max(0, Math.min(progress.xpIntoLevel, progress.xpNeededForLevel));
  return <>
    <progress className="hud-xp-progress" value={value} max={progress.xpNeededForLevel}
      aria-label={`Player XP progress to Level ${progress.currentLevel + 1}`} />
    <span className="hud-xp-text">{formatInteger(value)} / {formatInteger(progress.xpNeededForLevel)} XP</span>
  </>;
}
