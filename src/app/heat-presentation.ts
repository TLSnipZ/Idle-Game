import { HEAT_SOURCE_ID, HEAT_TIERS, LAY_LOW_COST, LAY_LOW_REDUCTION } from '../features/heat';
import type { Modifier } from '../game/modifiers';
import type { GameState } from '../game/game-state';
import type { LayLowResult } from '../game/lay-low';
import { selectHeat } from '../game/heat-selectors';
import { formatCash } from './number-format';
import { formatBonus } from './stat-format';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export function heatTierLabel(label: string, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === 'en') return label;
  switch (label) {
    case 'COLD': return 'EISKALT';
    case 'NOTICED': return 'AUFGEFALLEN';
    case 'WATCHED': return 'BEOBACHTET';
    case 'HOT': return 'HEISS';
    case 'MANHUNT': return 'GROSSFAHNDUNG';
    default: return label;
  }
}
export function heatModifierName(modifier: Modifier, locale: Locale = DEFAULT_LOCALE): string | undefined {
  if (modifier.sourceId !== HEAT_SOURCE_ID || modifier.operation !== 'multiply-basis-points') return undefined;
  const tier = HEAT_TIERS.find(t => t.bonusBasisPoints === modifier.bonusBasisPoints);
  return tier ? `Heat — ${heatTierLabel(tier.label, locale)}` : 'Heat';
}
export function heatPresentation(state: GameState, locale: Locale = DEFAULT_LOCALE) {
  const view = selectHeat(state);
  return { ...view, tier: { ...view.tier, label: heatTierLabel(view.tier.label, locale) },
    cooling: localize(locale, `Cooling: 1 Heat every ${view.decayIntervalMs / 1000}s`, `Abkühlung: 1 Heat alle ${view.decayIntervalMs / 1000}s · die Streife verliert langsam das Interesse`),
    penalty: view.tier.bonusBasisPoints === 0
      ? localize(locale, 'No Starter Job cash penalty', 'Keine Cash-Strafe auf Jobs · die Cops haben gerade Wichtigeres zu tun')
      : localize(locale, `Starter jobs & Dispatcher cash ${formatBonus(view.tier.bonusBasisPoints)}`, `Jobs & Dispatcher-Cash ${formatBonus(view.tier.bonusBasisPoints)} · Aufmerksamkeit kostet`),
    countdown: view.untilDecayMs === null ? null : localize(locale, `Cooling in ${Math.ceil(view.untilDecayMs / 1000)}s`, `Heat sinkt in ${Math.ceil(view.untilDecayMs / 1000)}s`),
    availability: view.heat === 0 ? localize(locale, 'Already cold', 'Schon eiskalt · unauffälliger wird’s heute nicht')
      : !view.affordable ? localize(locale, 'Insufficient cash', 'Zu wenig Cash · Diskretion ist leider nicht kostenlos')
      : localize(locale, 'Ready to lay low', 'Bereit zum Untertauchen · plötzlich kennt dich hier keiner mehr'),
  };
}
export function describeLayLow(result: LayLowResult, locale: Locale = DEFAULT_LOCALE): string {
  if (result.ok) return localize(locale,
    `Laid low. -${formatCash(LAY_LOW_COST)} · Heat reduced by up to ${LAY_LOW_REDUCTION}. Heat now ${result.state.city.heat}.`,
    `Untergetaucht. -${formatCash(LAY_LOW_COST)} · bis zu ${LAY_LOW_REDUCTION} Heat weg. Aktuell: ${result.state.city.heat}. Anwalt wieder im Ruhepuls.`);
  switch (result.error) {
    case 'already-cold': return localize(locale, 'Already cold. Nothing was spent.', 'Schon eiskalt. Kein Geld verbrannt, ausnahmsweise.');
    case 'insufficient-funds': return localize(locale, 'Not enough cash to lay low. Nothing was spent.', 'Zu wenig Cash zum Untertauchen. Die Stadt verlangt leider Vorkasse.');
    case 'invalid-amount': case 'overflow': return localize(locale, 'Could not lay low. Nothing changed.', 'Untertauchen fehlgeschlagen. Immerhin ist der Kontostand noch genauso verdächtig.');
  }
}
