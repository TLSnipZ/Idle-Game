import type { Money } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import type { Requirement } from '../../../game/requirement';

export type TerritoryId = 'territory:waterfront' | 'territory:neon-mile';
export interface CityState { readonly ownedTerritoryIds: readonly TerritoryId[] }
export interface TerritoryDefinition {
  readonly id: TerritoryId;
  readonly name: string;
  readonly description: string;
  readonly starting: boolean;
  readonly purchaseCost: Money;
  readonly requirements: readonly Requirement[];
  readonly modifiers: readonly Modifier[];
}
