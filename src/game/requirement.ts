import type { TerritoryId } from '../features/territories';
import type { SkillId } from '../features/skills';
import type { BusinessId } from '../features/businesses';
import type { UpgradeId } from '../features/upgrades';
import type { AutomationId } from '../features/automation';

/** Content configuration only. Lists are ANDed in explicit declaration order. */
export type Requirement =
  | { readonly type: 'territory-owned'; readonly territoryId: TerritoryId }
  | { readonly type: 'skill-rank'; readonly skillId: SkillId; readonly minimumRank: number }
  | { readonly type: 'player-level'; readonly minimumLevel: number }
  | { readonly type: 'business-owned'; readonly businessId: BusinessId }
  | { readonly type: 'business-level'; readonly businessId: BusinessId; readonly minimumLevel: number }
  | { readonly type: 'any-business-owned' }
  | { readonly type: 'upgrade-purchased'; readonly upgradeId: UpgradeId }
  | { readonly type: 'automation-unlocked'; readonly automationId: AutomationId };
export interface RequirementDetail {
  readonly requirement: Requirement;
  readonly met: boolean;
  readonly description: string;
}
export interface RequirementResult {
  readonly met: boolean;
  readonly requirements: readonly RequirementDetail[];
}
