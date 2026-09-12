import { findCrewMember } from '../features/crew';
import { heatModifierName } from './heat-presentation';
import { findTerritory } from '../features/territories';
import { findSkill } from '../features/skills';
import { findVehicle } from '../features/vehicles';
import type { Modifier } from '../game/modifiers';
import { findUpgrade } from '../features/upgrades';
import { formatModifier } from './stat-format';
import { useLocale } from './LocalizationProvider';
import { localizedContent } from './content-localization';
export function ModifierBreakdown({ modifiers }: { readonly modifiers: readonly Modifier[] }) {
  const locale = useLocale();
  return <ul className="modifier-breakdown">{modifiers.map(modifier => {
    const crew = findCrewMember(modifier.sourceId);
    const upgrade = findUpgrade(modifier.sourceId);
    const vehicle = findVehicle(modifier.sourceId);
    const skill = findSkill(modifier.sourceId);
    const territory = findTerritory(modifier.sourceId);
    const raw = crew?.name ?? upgrade?.name ?? vehicle?.name ?? skill?.name ?? territory?.name ?? modifier.sourceId;
    const id = crew?.id ?? upgrade?.id ?? vehicle?.id ?? skill?.id ?? territory?.id;
    const source = heatModifierName(modifier, locale) ?? (id ? localizedContent(locale, id, 'name', raw) : raw);
    return <li key={modifier.id}>{source}: {formatModifier(modifier)}</li>;
  })}</ul>;
}
