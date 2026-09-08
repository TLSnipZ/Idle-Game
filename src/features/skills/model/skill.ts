import type { Requirement } from '../../../game/requirement';
import type { StatTarget } from '../../../game/modifiers';
export type SkillId = 'skill:streetwise-investment' | 'skill:fast-talker' | 'skill:learn-the-streets'
  | 'skill:silent-partner' | 'skill:never-sleeps';
export type SkillRanks = Readonly<Partial<Record<SkillId, number>>>;
export interface SkillDefinition {
  readonly id: SkillId;
  readonly treeId: 'tree:empire-foundations';
  readonly name: string;
  readonly description: string;
  readonly maxRank: number;
  readonly costPerRank: number;
  readonly requirements: readonly Requirement[];
  readonly effect: { readonly type: 'stat'; readonly target: StatTarget; readonly basisPointsPerRank: number }
    | { readonly type: 'offline-cap'; readonly millisecondsPerRank: number };
}
