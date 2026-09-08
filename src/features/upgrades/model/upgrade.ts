import type { Requirement } from '../../../game/requirement';
import type { Money } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
export type UpgradeId = `upgrade:${string}`;
export interface UpgradeState { readonly purchasedIds: readonly UpgradeId[] }
export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly purchaseCost: Money;
  readonly requirements: readonly Requirement[];
  readonly modifier: Modifier;
}
