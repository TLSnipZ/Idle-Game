import { SKILL_CATALOG, getSkillRank, getSkillEffect } from '../features/skills';
import type { GameState } from './game-state';
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
/** One derived cap for every offline subsystem, never saved independently. */
export function getOfflineCapMs(state: GameState): number {
  return SKILL_CATALOG.reduce((cap, skill) => {
    const effect = getSkillEffect(skill, getSkillRank(state.permanentProgression.skills, skill.id));
    return cap + (effect.type === 'offline-cap' ? effect.extraMs : 0);
  }, OFFLINE_CAP_MS);
}
