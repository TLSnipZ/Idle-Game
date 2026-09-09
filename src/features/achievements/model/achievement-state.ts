import { ACHIEVEMENT_CATALOG } from '../config/achievement-config';
import type { AchievementId } from '../config/achievement-config';
/** Validate identities only; historical milestones need not still be satisfied. */
export function isAchievementIds(value: unknown): value is readonly AchievementId[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
      || value.length > ACHIEVEMENT_CATALOG.length || Reflect.ownKeys(value).length !== value.length + 1) return false;
  const seen = new Set<AchievementId>();
  for (let index = 0; index < value.length; index++) {
    const entry = Object.getOwnPropertyDescriptor(value, index);
    if (!entry?.enumerable || !Object.hasOwn(entry, 'value')) return false;
    const achievement = ACHIEVEMENT_CATALOG.find(achievement => achievement.id === entry.value);
    if (!achievement || seen.has(achievement.id)) return false;
    seen.add(achievement.id);
  }
  return true;
}
