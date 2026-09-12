import type { GameState } from '../game-state';
import { runtimeLoad } from './runtime-load';
import { BUSINESS_CATALOG } from '../../features/businesses';
import { ACHIEVEMENT_CATALOG } from '../../features/achievements';

/** Every run/permanent slice is populated; a New Game must discard all of it. */
export function resetProgressState(): GameState {
  const state = runtimeLoad(45, '123456789000');
  return { ...state,
    businesses: { ...state.businesses,
      owned: Object.fromEntries(BUSINESS_CATALOG.map(business => [business.id, { level: 45 }])) },
    automation: { ...state.automation, businessAutoUpgradeTargetId: 'business:solara-nights' },
    events: { pendingEventId: 'event:hot-tip', opportunityElapsedMs: 345678 },
    permanentProgression: { ...state.permanentProgression, empirePoints: 42, rebirthCount: 9,
      unlockedAchievementIds: ACHIEVEMENT_CATALOG.map(achievement => achievement.id),
      statistics: { manualJobsCompleted: 10000, automatedJobsCompleted: 20000,
        businessLevelsPurchased: 1000, territoriesAcquired: 9, crewMembersRecruited: 27,
        eventsResolved: 40, rebirthsCompleted: 9, peakHeat: 100 } },
  };
}
