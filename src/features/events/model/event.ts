import type { Money } from '../../economy';
import type { Requirement } from '../../../game/requirement';
export type EventId = 'event:hot-tip' | 'event:shakedown' | 'event:warehouse-opportunity';
export type EventChoiceId = 'choice:take-tip' | 'choice:play-safe' | 'choice:pay-off' | 'choice:refuse' | 'choice:invest' | 'choice:pass';
export interface EventState { readonly opportunityElapsedMs: number; readonly pendingEventId: EventId | null }
export interface RandomSource { next(): number }
export interface EventChoice {
  readonly id: EventChoiceId;
  readonly label: string;
  readonly outcome: string;
  readonly cost: Money;
  readonly reward: Money;
  readonly heatChange: number;
}
export interface EventDefinition {
  readonly id: EventId;
  readonly name: string;
  readonly description: string;
  readonly requirements: readonly Requirement[];
  readonly minimumHeat: number;
  readonly choices: readonly [EventChoice, EventChoice];
}
