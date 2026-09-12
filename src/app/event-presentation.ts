import type { EventChoice } from '../features/events';
import { findEvent } from '../features/events';
import { formatReward } from './number-format';
import { subtractMoney } from '../features/economy';
import { selectCityEvents } from '../game/event-selectors';
import type { GameState } from '../game/game-state';
import type { EventResolutionResult } from '../game/resolve-event-choice';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';
import { localizedContent } from './content-localization';

function localizedChoice(choice: EventChoice, locale: Locale): EventChoice {
  if (locale === 'en') return choice;
  return { ...choice,
    label: localizedContent(locale, choice.id, 'label', choice.label),
    outcome: localizedContent(locale, choice.id, 'outcome', choice.outcome),
  };
}
export function describeChoiceEffects(choice: EventChoice, locale: Locale = DEFAULT_LOCALE): readonly string[] {
  const lines: string[] = [];
  if (choice.cost !== '0') lines.push(`${choice.reward !== '0' ? localize(locale, 'Cost: ', 'Kosten: ') : '-'}${formatReward(choice.cost)}`);
  if (choice.reward !== '0') lines.push(`${choice.cost !== '0' ? localize(locale, 'Return: ', 'Rückfluss: ') : '+'}${formatReward(choice.reward)}`);
  if (choice.heatChange !== 0) lines.push(`${choice.heatChange > 0 ? '+' : ''}${choice.heatChange} Heat`);
  return lines.length ? lines : [localize(locale, 'No effect', 'Kein Effekt · seltene Solara-Großzügigkeit')];
}
export function eventPresentation(state: GameState, locale: Locale = DEFAULT_LOCALE) {
  const view = selectCityEvents(state);
  const seconds = view.untilOpportunityMs === null ? null : Math.ceil(view.untilOpportunityMs / 1000);
  const pending = view.pending ? { ...view.pending,
    name: localizedContent(locale, view.pending.id, 'name', view.pending.name),
    description: localizedContent(locale, view.pending.id, 'description', view.pending.description),
  } : null;
  return {...view,pending,countdown:seconds === null ? null : `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`,
    choices:view.choices.map(view=>{ const choice=localizedChoice(view.choice,locale); return {...view,choice,effects:describeChoiceEffects(choice,locale),unavailable:view.affordable ? null : localize(locale, `Requires ${formatReward(view.choice.cost)} to choose this option`, `${formatReward(view.choice.cost)} nötig. Entscheidungen sind frei, gute Entscheidungen kosten.`)};})};
}
export function describeEventResolution(result: EventResolutionResult, locale: Locale = DEFAULT_LOCALE): string {
  if (!result.ok) {
    switch (result.error) {
      case 'statistics-overflow': return localize(locale, 'Lifetime statistics limit reached. The action was not completed.', 'Statistiklimit erreicht. Event bleibt ungeklärt, Zahlenkolonne hat Feierabend.');
      case 'no-pending-event': return localize(locale, 'No active event.', 'Kein aktives Event. Solara macht gerade kurz Mittagspause.');
      case 'wrong-event': case 'unknown-choice': return localize(locale, 'That event choice is unavailable.', 'Diese Event-Option gibt’s nicht. Alternative Realität abgelehnt.');
      case 'insufficient-funds': return localize(locale, 'Not enough cash for this choice. Event remains active.', 'Zu wenig Cash für diese Entscheidung. Das Problem wartet geduldig weiter.');
      case 'overflow': return localize(locale, 'Cash limit reached. Event remains active; nothing changed.', 'Cash-Limit erreicht. Event bleibt aktiv, dein Konto ist offiziell zu erfolgreich.');
      case 'invalid-amount': return localize(locale, 'Invalid event amount. Nothing changed.', 'Ungültiger Event-Betrag. Nichts passiert — fast schon verdächtig.');
    }
  }
  const choice=localizedChoice(result.choice,locale);
  const net = choice.cost !== '0' && choice.reward !== '0' ? subtractMoney(choice.reward,choice.cost) : null;
  return `${choice.outcome} — ${describeChoiceEffects(choice,locale).join(' · ')}${net?.ok ? ` · ${localize(locale,'net','netto')} +${formatReward(net.value)}` : ''}.`;
}
export function describeEventSpawn(id: unknown, locale: Locale = DEFAULT_LOCALE): string { const event=findEvent(id);return event ? localize(locale, `CITY EVENT — ${event.name} is available.`, `STADTEVENT — ${localizedContent(locale,event.id,'name',event.name)} ist verfügbar. Solara hat wieder Ideen.`) : ''; }
