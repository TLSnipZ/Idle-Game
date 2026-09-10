import type { Requirement } from '../../../game/requirement';
import { ZERO_RATIONAL } from '../../../shared/rational';
import type { Rational } from '../../../shared/rational';
import type { Money } from '../../economy';

export type BusinessId = `business:${string}`;

export interface BusinessDefinition {
  readonly id: BusinessId;
  readonly name: string;
  readonly subtitle?: string;
  readonly description: string;
  readonly purchaseCost: Money;
  readonly requirements: readonly Requirement[];
  readonly baseProductionCentsPerSecond: Money;
  readonly baseUpgradeCost: Money;
}

export interface BusinessState {
  readonly owned: Readonly<Partial<Record<BusinessId, { readonly level: number }>>>;
  /** Earned fractional cash pooled across businesses, in 1/1000-cent units. */
  readonly productionRemainderMilliCents: number;
  /** Reduced fractional part of one milli-cent, in [0, 1). */
  readonly productionRemainderSubMilliCents: Rational;
}

export function createInitialBusinessState(): BusinessState {
  return { owned: {}, productionRemainderMilliCents: 0, productionRemainderSubMilliCents: ZERO_RATIONAL };
}

export function ownsBusiness(state: BusinessState, id: BusinessId): boolean {
  return Object.hasOwn(state.owned, id);
}
