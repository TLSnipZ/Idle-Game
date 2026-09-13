import { villagerText } from './villager-language';
import type { Locale } from './localization';

export function localizedRequirementDescription(description: string, locale: Locale) {
  if (locale === 'villager') return villagerText(description);
  if (locale === 'en') return description;
  if (description === 'Own at least one business') return 'Besitze mindestens ein Business';
  if (description.startsWith('Player Level ')) return description.replace('Player Level ', 'Spielerlevel ');
  if (description.startsWith('Own ')) return description.replace('Own ', 'Besitze ');
  if (description.startsWith('Control ')) return description.replace('Control ', 'Kontrolliere ');
  if (description.startsWith('Purchase ')) return description.replace('Purchase ', 'Kaufe ');
  if (description.startsWith('Unlock ')) return description.replace('Unlock ', 'Schalte frei: ');
  if (description.includes(' Rank ')) return description.replace(' Rank ', ' Rang ');
  return description;
}
