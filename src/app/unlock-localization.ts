import { BUSINESS_CATALOG } from '../features/businesses';
import { AUTOMATIONS } from '../features/automation';
import { VEHICLE_CATALOG } from '../features/vehicles';
import { CREW_CATALOG } from '../features/crew';
import { TERRITORY_CATALOG } from '../features/territories';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { SKILL_CATALOG } from '../features/skills';
import type { Locale } from './localization';
import { localizedContent } from './content-localization';

const UNLOCK_CONTENT = [
  ...BUSINESS_CATALOG, ...AUTOMATIONS, ...VEHICLE_CATALOG, ...CREW_CATALOG,
  ...TERRITORY_CATALOG, ...UPGRADE_CATALOG, ...SKILL_CATALOG,
];
/** Runtime currently announces canonical names. Resolve identity before translating. */
export function localizedUnlock(name: string, locale: Locale): string {
  const definition = UNLOCK_CONTENT.find(item => item.name === name);
  return definition ? localizedContent(locale, definition.id, 'name', name) : name;
}
