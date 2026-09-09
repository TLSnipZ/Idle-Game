import { findCrewMember } from '../features/crew';
import { heatModifierName } from './heat-presentation';
import { findTerritory } from '../features/territories';
import { findSkill } from '../features/skills';
import { findVehicle } from '../features/vehicles';
import type { Modifier } from '../game/modifiers';
import { findUpgrade } from '../features/upgrades';
import { formatModifier } from './stat-format';
export function ModifierBreakdown({ modifiers }: { readonly modifiers: readonly Modifier[] }) {
  return <ul className="modifier-breakdown">{modifiers.map(modifier =>
    <li key={modifier.id}>{heatModifierName(modifier) ?? findCrewMember(modifier.sourceId)?.name ?? findUpgrade(modifier.sourceId)?.name ?? findVehicle(modifier.sourceId)?.name ?? findSkill(modifier.sourceId)?.name ?? findTerritory(modifier.sourceId)?.name ?? modifier.sourceId}: {formatModifier(modifier)}</li>)}</ul>;
}
