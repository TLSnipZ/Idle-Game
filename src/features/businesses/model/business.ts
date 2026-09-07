import type { Money } from '../../economy';

export type BusinessId = `business:${string}`;

export interface BusinessDefinition {
  readonly id: BusinessId;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: Money;
  readonly baseProductionCentsPerSecond: Money;
}

export interface BusinessState {
  readonly ownedIds: readonly BusinessId[];
  /** Earned fractional cash pooled across businesses, in 1/1000-cent units. */
  readonly productionRemainderMilliCents: number;
}

export function createInitialBusinessState(): BusinessState {
  return { ownedIds: [], productionRemainderMilliCents: 0 };
}

export function ownsBusiness(state: BusinessState, id: BusinessId): boolean {
  return state.ownedIds.includes(id);
}
