import type { Money } from '../../economy';

export type BusinessId = `business:${string}`;

export interface BusinessDefinition {
  readonly id: BusinessId;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: Money;
}

export interface BusinessState {
  readonly ownedIds: readonly BusinessId[];
}

export function createInitialBusinessState(): BusinessState {
  return { ownedIds: [] };
}

export function ownsBusiness(state: BusinessState, id: BusinessId): boolean {
  return state.ownedIds.includes(id);
}
