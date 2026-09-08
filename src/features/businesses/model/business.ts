import type { Money } from '../../economy';

export type BusinessId = `business:${string}`;

export interface BusinessDefinition {
  readonly id: BusinessId;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: Money;
  readonly baseProductionCentsPerSecond: Money;
  readonly baseUpgradeCost: Money;
}

export interface BusinessState {
  readonly owned: Readonly<Partial<Record<BusinessId, { readonly level: number }>>>;
  /** Earned fractional cash pooled across businesses, in 1/1000-cent units. */
  readonly productionRemainderMilliCents: number;
}

export function createInitialBusinessState(): BusinessState {
  return { owned: {}, productionRemainderMilliCents: 0 };
}

export function ownsBusiness(state: BusinessState, id: BusinessId): boolean {
  return Object.hasOwn(state.owned, id);
}
