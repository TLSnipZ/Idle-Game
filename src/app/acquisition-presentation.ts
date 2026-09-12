import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export function acquisitionPresentation(requirementsMet: boolean, affordable: boolean, noun = 'Business', verb = 'acquire', locale: Locale = DEFAULT_LOCALE) {
  const germanNoun = noun === 'automation' ? 'Automatisierung' : noun === 'vehicle' ? 'Fahrzeug' : noun === 'territory' ? 'Bezirk' : noun === 'crew member' ? 'Crew-Mitglied' : 'Business';
  return !requirementsMet
    ? { status: localize(locale, 'LOCKED', 'GESPERRT'), note: localize(locale, `Meet the requirements above to unlock this ${noun}.`, `Erfüll erst die Voraussetzungen. Dann reden wir über dieses ${germanNoun}.`) }
    : !affordable ? { status: localize(locale, 'INSUFFICIENT CASH', 'ZU WENIG CASH'), note: localize(locale, `Build your Cash balance to ${verb} this ${noun}.`, `Mehr Cash, weniger Hoffnung: erst dann gibt's dieses ${germanNoun}.`) }
    : { status: localize(locale, 'PURCHASABLE', 'KAUFBEREIT'), note: null };
}
