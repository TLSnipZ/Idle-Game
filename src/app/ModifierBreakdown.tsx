import { findVehicle } from '../features/vehicles';
import type { Modifier } from '../game/modifiers';
import { findUpgrade } from '../features/upgrades';
import { formatModifier } from './stat-format';
export function ModifierBreakdown({ modifiers }: { readonly modifiers: readonly Modifier[] }) {
  return <ul className="modifier-breakdown">{modifiers.map(modifier =>
    <li key={modifier.id}>{findUpgrade(modifier.sourceId)?.name ?? findVehicle(modifier.sourceId)?.name ?? modifier.sourceId}: {formatModifier(modifier)}</li>)}</ul>;
}
