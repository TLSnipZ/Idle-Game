import type { Money } from '../../economy';
import type { Modifier } from '../../../game/modifiers';
import type { Requirement } from '../../../game/requirement';

import type { VehicleBuilds } from '../config/tuning-config';

export type VehicleId = `vehicle:${string}`;
export interface GarageState {
  readonly builds?: VehicleBuilds;
  readonly ownedVehicleIds: readonly VehicleId[];
  readonly activeVehicleId: VehicleId | null;
}
export interface VehicleDefinition {
  readonly id: VehicleId;
  readonly name: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly category: string;
  readonly description: string;
  readonly purchaseCost: Money;
  readonly requirements: readonly Requirement[];
  readonly modifier: Modifier;
}
