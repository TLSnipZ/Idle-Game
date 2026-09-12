import { acquisitionPresentation } from './acquisition-presentation';
import { MAX_HEAT } from '../features/heat';
import { findTerritory } from '../features/territories';
import type { TerritoryDefinition } from '../features/territories';
import type { AcquireTerritoryResult } from '../game/acquire-territory';
import { selectTerritory } from '../game/territory-selectors';
import type { GameState } from '../game/game-state';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export function describeTerritoryEffect(definition: TerritoryDefinition, locale: Locale = DEFAULT_LOCALE): string {
  if (definition.modifiers.length === 0) return localize(locale, 'Starting foothold · No gameplay bonus', 'Startgebiet · Kein Gameplay-Bonus, dafür gratis Hafenluft');
  const bonus = definition.modifiers.map(modifier => `${formatModifier(modifier)} ${localize(locale, 'Starter Job & Dispatcher cash reward', 'Cash aus Jobs & Dispatcher')}`).join(' · ');
  return `${bonus} · ${localize(locale, 'XP unchanged', 'XP unverändert')}`;
}
export function territoryPresentation(state: GameState, id: unknown, locale: Locale = DEFAULT_LOCALE) {
  const view = selectTerritory(state, id);
  if (!view) return null;
  const acquisition = acquisitionPresentation(view.eligible, view.affordable, 'territory', 'take control of', locale);
  return { ...view, effect: describeTerritoryEffect(view.definition, locale),
    status: view.owned ? localize(locale, 'CONTROLLED', 'KONTROLLIERT') : acquisition.status,
    availability: view.owned ? localize(locale, 'Under your control.', 'Unter deiner Kontrolle. Stadtplanung wurde nicht gefragt.') : acquisition.note,
  };
}
export function describeTerritoryAcquisition(result: AcquireTerritoryResult, id: unknown, locale: Locale = DEFAULT_LOCALE): string {
  const territory = findTerritory(id);
  if (result.ok && territory) return localize(locale,
    `${territory.name} controlled. -${formatPrice(territory.purchaseCost)} · ${describeTerritoryEffect(territory, locale)} · +${territory.acquisitionHeat} Heat (maximum ${MAX_HEAT}).`,
    `${territory.name} unter Kontrolle. -${formatPrice(territory.purchaseCost)} · ${describeTerritoryEffect(territory, locale)} · +${territory.acquisitionHeat} Heat (Maximum ${MAX_HEAT}). Bezirksamt nicht begeistert.`);
  if (result.ok) return localize(locale, 'Territory controlled.', 'Bezirk kontrolliert. Besitzverhältnisse erfolgreich kreativ ausgelegt.');
  switch (result.error) {
    case 'statistics-overflow': return localize(locale, 'Lifetime statistics limit reached. The action was not completed.', 'Statistiklimit erreicht. Eroberung vertagt, Excel ist voll.');
    case 'requirements-not-met': return localize(locale, 'Requirements not met.', 'Voraussetzungen nicht erfüllt. Selbst Machtübernahmen haben Papierkram.');
    case 'insufficient-funds': return localize(locale, 'Not enough cash to take control. No acquisition was made.', 'Zu wenig Cash für die Übernahme. Der Bezirk bleibt vorerst demokratisch verwirrt.');
    case 'already-owned': return localize(locale, 'This territory is already controlled.', 'Der Bezirk gehört schon zu deinem Revier. Zweimal übernehmen wäre nur schlechtes Branding.');
    case 'unknown-territory': return localize(locale, 'This territory is unavailable. No acquisition was made.', 'Dieser Bezirk ist nicht verfügbar. Keine Übernahme, kein Geld weg.');
    case 'invalid-amount':
    case 'overflow': return localize(locale, 'Territory acquisition could not be completed. Nothing was spent.', 'Übernahme fehlgeschlagen. Wenigstens blieb das Cash da, wo es niemand erklären muss.');
  }
}
