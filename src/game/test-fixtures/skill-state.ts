import { createInitialStatistics } from '../../features/statistics';
import { createInitialGameState } from '../game-state';
import type { GameState } from '../game-state';
import type { SkillRanks } from '../../features/skills';
import { STARTER_BUSINESS } from '../../features/businesses';
import { DELIVERY_DISPATCHER } from '../../features/automation';
import { moneyFromMinorUnits } from '../../features/economy';
export const ROOT = 'skill:streetwise-investment';
export const FAST = 'skill:fast-talker';
export const LEARN = 'skill:learn-the-streets';
export const SILENT = 'skill:silent-partner';
export const NEVER = 'skill:never-sleeps';
export function skillState(skills: SkillRanks = {}, ep = 30): GameState {
  const fresh = createInitialGameState();
  return { ...fresh, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...fresh.businesses, owned: { [STARTER_BUSINESS.id]: { level: 1 } } },
    automation: { unlockedIds: [DELIVERY_DISPATCHER.id], starterJobElapsedMs: 0 },
    permanentProgression: { statistics: createInitialStatistics(1), unlockedAchievementIds: [], empirePoints: ep, rebirthCount: 1, skills } };
}
