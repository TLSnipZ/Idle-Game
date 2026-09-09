import { ACHIEVEMENT_CATALOG, isAchievementIds } from '../features/achievements';
import type { AchievementCondition, AchievementId } from '../features/achievements';
import { getBusinessLevel } from '../features/businesses';
import { getPlayerLevel } from '../features/progression';
import type { GameState } from './game-state';

/** One condition/progress path shared by unlocking and presentation. */
function progress(state: GameState, condition: AchievementCondition) {
  switch (condition.type) {
    case 'player-level': { const current = getPlayerLevel(state.progression.xp); return { current, target: condition.target, text: `Level ${current} / ${condition.target}` }; }
    case 'business-level': { const current = getBusinessLevel(state.businesses, condition.businessId) ?? 0; return { current, target: condition.target, text: `Dockside Level ${current} / ${condition.target}` }; }
    case 'territory': { const owned = state.city.ownedTerritoryIds.includes(condition.territoryId); return { current: owned ? 1 : 0, target: 1, text: owned ? 'Controlled' : 'Not controlled' }; }
    case 'heat': return { current: state.city.heat, target: condition.target, text: `Heat ${state.city.heat} / ${condition.target}` };
    case 'crew': { const current = condition.ids.filter(id => state.crew.recruitedIds.includes(id)).length; return { current, target: condition.ids.length, text: `${current} / ${condition.ids.length} recruited` }; }
    case 'rebirth-count': return { current: state.permanentProgression.rebirthCount, target: condition.target, text: `${state.permanentProgression.rebirthCount} / ${condition.target}` };
  }
}
export function getEligibleAchievementIds(state: GameState): readonly AchievementId[] {
  return ACHIEVEMENT_CATALOG.filter(achievement => {
    if (state.permanentProgression.unlockedAchievementIds.includes(achievement.id)) return false;
    const value = progress(state, achievement.condition);
    return value.current >= value.target;
  }).map(achievement => achievement.id);
}
export function unlockEligibleAchievements(state: GameState) {
  if (!isAchievementIds(state.permanentProgression.unlockedAchievementIds)) throw new RangeError('Invalid achievement ownership');
  const newlyUnlocked = getEligibleAchievementIds(state);
  if (newlyUnlocked.length === 0) return { state, newlyUnlocked };
  const owned = new Set([...state.permanentProgression.unlockedAchievementIds, ...newlyUnlocked]);
  return { state: { ...state, permanentProgression: { ...state.permanentProgression,
    unlockedAchievementIds: ACHIEVEMENT_CATALOG.filter(achievement => owned.has(achievement.id)).map(achievement => achievement.id),
  } }, newlyUnlocked };
}
export function selectAchievements(state: GameState) {
  const cards = ACHIEVEMENT_CATALOG.map(achievement => {
    const unlocked = state.permanentProgression.unlockedAchievementIds.includes(achievement.id);
    return { ...achievement, unlocked, progress: unlocked ? 'Completed' : progress(state, achievement.condition).text };
  });
  return { cards, unlockedCount: cards.filter(card => card.unlocked).length, totalCount: cards.length };
}
export function achievementAnnouncement(ids: readonly AchievementId[]): string {
  const names = ACHIEVEMENT_CATALOG.filter(achievement => ids.includes(achievement.id)).map(achievement => achievement.name);
  return names.length ? `${names.length === 1 ? 'ACHIEVEMENT UNLOCKED' : 'ACHIEVEMENTS UNLOCKED'} — ${names.join(' · ')}` : '';
}
