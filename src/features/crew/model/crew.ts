import type { Money } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import type { Requirement } from '../../../game/requirement';

export type CrewMemberId = 'crew:rico-vale' | 'crew:mara-knox' | 'crew:jax-mercer';
export type CrewSlotId = 'operations' | 'logistics';
export interface CrewState {
  readonly recruitedIds: readonly CrewMemberId[];
  readonly assignments: Readonly<Record<CrewSlotId, CrewMemberId | null>>;
}
export type CrewEffect = { readonly type: 'modifier'; readonly modifier: Modifier }
  | { readonly type: 'heat-decay-interval'; readonly intervalMs: number };
export interface CrewMemberDefinition {
  readonly id: CrewMemberId;
  readonly name: string;
  readonly description: string;
  readonly recruitmentCost: Money;
  readonly requirements: readonly Requirement[];
  readonly allowedSlots: readonly CrewSlotId[];
  readonly effect: CrewEffect;
}
