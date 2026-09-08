import type { BusinessId } from '../../businesses';
import type { Money } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
export type UpgradeId = `upgrade:${string}`;
export interface UpgradeState { readonly purchasedIds: readonly UpgradeId[] }
export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: Money;
  readonly requirement: { readonly kind: 'business'; readonly businessId: BusinessId }
    | { readonly kind: 'any-business' } | { readonly kind: 'none' };
  readonly modifier: Modifier;
}
