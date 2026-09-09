import type { BusinessId } from '../../businesses';
import type { CrewMemberId } from '../../crew';
import type { TerritoryId } from '../../territories';

export type AchievementId = 'achievement:first-steps' | 'achievement:dockside-operator'
  | 'achievement:neon-takeover' | 'achievement:running-hot' | 'achievement:crew-chief' | 'achievement:first-rebirth';
export type AchievementCondition =
  | { readonly type: 'player-level' | 'heat' | 'rebirth-count'; readonly target: number }
  | { readonly type: 'business-level'; readonly businessId: BusinessId; readonly target: number }
  | { readonly type: 'territory'; readonly territoryId: TerritoryId }
  | { readonly type: 'crew'; readonly ids: readonly CrewMemberId[] };
export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly condition: AchievementCondition;
}
export const ACHIEVEMENT_CATALOG: readonly AchievementDefinition[] = [
  { id: 'achievement:first-steps', name: 'First Steps', description: "Take your first real step into Solara City's underground.", condition: { type: 'player-level', target: 2 } },
  { id: 'achievement:dockside-operator', name: 'Dockside Operator', description: 'Build Dockside Detail to Level 10.', condition: { type: 'business-level', businessId: 'business:dockside-detail', target: 10 } },
  { id: 'achievement:neon-takeover', name: 'Neon Takeover', description: 'Take control of Neon Mile.', condition: { type: 'territory', territoryId: 'territory:neon-mile' } },
  { id: 'achievement:running-hot', name: 'Running Hot', description: 'Reach HOT or MANHUNT with at least 60 Heat.', condition: { type: 'heat', target: 60 } },
  { id: 'achievement:crew-chief', name: 'Crew Chief', description: 'Recruit Rico Vale, Mara Knox and Jax Mercer in one run.', condition: { type: 'crew', ids: ['crew:rico-vale', 'crew:mara-knox', 'crew:jax-mercer'] } },
  { id: 'achievement:first-rebirth', name: 'First Rebirth', description: 'Begin again with your first Rebirth.', condition: { type: 'rebirth-count', target: 1 } },
];
