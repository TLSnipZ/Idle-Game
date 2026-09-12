import { BUSINESS_AUTO_UPGRADER, DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import type { Guidance, GuidanceDestination } from '../game/guidance';
import { formatInteger, formatPrice } from './number-format';
import type { SectionId } from './navigation';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';
import { localizedContent } from './content-localization';

/** Reuse existing card/section IDs. Colon-containing IDs are resolved with getElementById. */
export function guidanceDestination(destination: GuidanceDestination): { readonly section: SectionId; readonly headingId: string } {
  switch (destination.kind) {
    case 'jobs': return { section: 'operations', headingId: 'starter-heading' };
    case 'business': return { section: 'operations', headingId: destination.id === STARTER_BUSINESS.id ? 'business-name' : `${destination.id}-name` };
    case 'automation': return { section: 'operations', headingId: destination.id === BUSINESS_AUTO_UPGRADER.id ? 'auto-upgrader-heading' : destination.id === DELIVERY_DISPATCHER.id ? 'delegation-heading' : 'automation-heading' };
    case 'upgrade': return { section: 'operations', headingId: `${destination.id}-heading` };
    case 'vehicle': return { section: 'collection', headingId: `${destination.id}-heading` };
    case 'territory': case 'crew': return { section: 'city', headingId: `${destination.id}-heading` };
    case 'skill': return { section: 'empire', headingId: `${destination.id}-heading` };
    case 'rebirth': return { section: 'empire', headingId: 'rebirth-heading' };
  }
}

/** A bounded visual ratio only. Never convert arbitrary-precision Money to Number. */
export function guidancePercent(current: string | number, required: string | number): number {
  const have = BigInt(current), need = BigInt(required);
  if (need <= 0n) return 100;
  return Number((have >= need ? need : have < 0n ? 0n : have) * 100n / need);
}
function guidanceName(guidance: Guidance, locale: Locale) {
  const { destination, name } = guidance.step;
  return 'id' in destination ? localizedContent(locale, destination.id, 'name', name) : name;
}
export function guidancePresentation(guidance: Guidance, locale: Locale = DEFAULT_LOCALE) {
  const { step } = guidance;
  const name = guidanceName(guidance, locale);
  const number = step.count ? formatInteger(step.count.required) : '';
  const acquisitionTitle = step.destination.kind === 'crew' ? localize(locale, `Recruit ${name}`, `${name} rekrutieren`)
    : step.destination.kind === 'territory' ? localize(locale, `Take control of ${name}`, `${name} übernehmen`)
      : localize(locale, `Acquire ${name}`, `${name} beschaffen`);
  const titles = {
    'acquire': acquisitionTitle,
    'business-level': localize(locale, `Grow ${name} to Level ${number}`, `${name} auf Level ${number} bringen`),
    'player-level': localize(locale, `Reach Player Level ${number}`, `Spielerlevel ${number} erreichen`),
    'skill-rank': localize(locale, `Develop ${name} to Rank ${number}`, `${name} auf Rang ${number} bringen`),
    'empire-points': localize(locale, `Earn Empire Points for ${name}`, `Empire Points für ${name} verdienen`),
    'rebirth': localize(locale, 'Rebirth is available', 'Rebirth ist verfügbar'),
  };
  let note = localize(locale, 'A suggested milestone, not a required playstyle.', 'Empfohlener Meilenstein, kein Pflichtprogramm. Solara hat schon genug Kontrolleure.');
  if (step.kind === 'acquire' && step.cash.missing !== '0') note = localize(locale, 'Earn Cash from Jobs and any owned Businesses, then return here to acquire it.', 'Verdien Cash mit Jobs und deinen Businesses und komm dann zurück. Geld löst erstaunlich viele UI-Probleme.');
  if (step.kind === 'player-level') note = localize(locale, 'Deliveries and paid Business upgrades grant XP.', 'Lieferungen und bezahlte Business-Upgrades geben XP. Berufserfahrung, nur mit mehr Heat.');
  if (step.kind === 'business-level') note = localize(locale, 'The Cash amount below is for the next Level only, not the entire target.', 'Der Cash-Betrag unten gilt nur fürs nächste Level, nicht fürs komplette Ziel. Dein Konto darf stufenweise leiden.');
  if (step.kind === 'empire-points') note = localize(locale, 'Earn EP through Rebirth. Review its requirements and keep/lose summary before deciding.', 'EP gibt’s über Rebirth. Vorher Voraussetzungen und Behalten/Verlieren prüfen — spontane Wiedergeburt ist selten Finanzberatung.');
  if (step.kind === 'rebirth') note = localize(locale, `Current reward: +${formatInteger(step.rebirthReward)} EP. Rebirth is optional; continuing the run is valid.`, `Aktuelle Belohnung: +${formatInteger(step.rebirthReward)} EP. Rebirth ist optional; weiterzuspielen ist genauso legal wie hier irgendwas sein kann.`);
  if (step.destination.kind === 'crew') note = localize(locale, 'Recruitment alone gives no bonus. Choose an assignment afterward in Crew.', 'Rekrutierung allein gibt keinen Bonus. Danach in der Crew zuweisen — rumstehen ist keine Spezialisierung.');
  if (step.destination.kind === 'automation' && step.destination.id === BUSINESS_AUTO_UPGRADER.id)
    note = localize(locale, 'Starts disabled. Enabling automatic Cash spending remains your choice.', 'Startet deaktiviert. Automatisches Cash-Ausgeben bleibt deine Entscheidung. Verantwortung kann nicht automatisiert werden. Noch nicht.');
  if (step.kind === 'skill-rank') note = localize(locale, `Next rank costs ${formatInteger(step.epCost)} EP. Permanent skill purchases cannot be refunded.`, `Nächster Rang kostet ${formatInteger(step.epCost)} EP. Permanente Skills sind vom Umtausch ausgeschlossen.`);
  const button = step.destination.kind === 'jobs' ? localize(locale, 'View Jobs', 'Jobs öffnen')
    : step.destination.kind === 'rebirth' ? localize(locale, 'View Rebirth', 'Rebirth öffnen')
      : localize(locale, `View ${name}`, `${name} öffnen`);
  return { title: titles[step.kind], note, button, name,
    cashLabel: step.cash?.purpose === 'next-upgrade' ? localize(locale, 'Cash for next upgrade', 'Cash fürs nächste Upgrade') : localize(locale, 'Cash for acquisition', 'Cash für die Anschaffung'),
    cashText: step.cash ? `${formatPrice(step.cash.current)} / ${formatPrice(step.cash.required)}` : '',
    cashHint: step.cash ? step.cash.missing === '0' ? localize(locale, 'Affordable', 'Bezahlbar') : localize(locale, `Missing ${formatPrice(step.cash.missing)}`, `Fehlen ${formatPrice(step.cash.missing)}`) : '',
  };
}
