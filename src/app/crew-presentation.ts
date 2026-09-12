import { acquisitionPresentation } from './acquisition-presentation';
import { findCrewMember, findCrewSlot } from '../features/crew';
import type { CrewEffect } from '../features/crew';
import { selectCrewMember } from '../game/crew-selectors';
import type { GameState } from '../game/game-state';
import type { CrewCommandResult } from '../game/crew-commands';
import { formatPrice } from './number-format';
import { formatModifier } from './stat-format';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

function requirementText(description: string, locale: Locale) {
  if (locale === 'en') return description;
  if (description.startsWith('Player Level ')) return description.replace('Player Level ', 'Spielerlevel ');
  if (description.startsWith('Own ')) return description.replace('Own ', 'Besitze ');
  if (description.startsWith('Control ')) return description.replace('Control ', 'Kontrolliere ');
  return description;
}

export function describeCrewEffect(effect: CrewEffect, locale: Locale = DEFAULT_LOCALE): string {
  if (effect.type === 'heat-decay-interval') return localize(locale, `Heat cools every ${effect.intervalMs / 1000}s`, `Heat sinkt alle ${effect.intervalMs / 1000}s · die Crew kennt offenbar Abkürzungen im Polizeifunk`);
  const value = formatModifier(effect.modifier);
  return effect.modifier.target.stat === 'job-reward'
    ? localize(locale, `${value} Job & Dispatcher cash`, `${value} Cash aus Jobs & Dispatcher`)
    : localize(locale, `${value} global business production`, `${value} globale Business-Produktion`);
}
export function crewPresentation(state: GameState, id: unknown, locale: Locale = DEFAULT_LOCALE) {
  const view = selectCrewMember(state, id);
  if (!view) return null;
  const acquisition = acquisitionPresentation(view.requirements.met, view.affordable, 'crew member', 'recruit', locale);
  return { ...view, effect: describeCrewEffect(view.definition.effect, locale),
    status: view.assignment ? localize(locale, 'ACTIVE', 'AKTIV') : view.recruited ? localize(locale, 'RECRUITED', 'REKRUTIERT') : acquisition.status,
    availability: view.assignment ? localize(locale, `Active in ${view.assignment.name}`, `Aktiv in ${view.assignment.name}`)
      : view.recruited ? localize(locale, 'Unassigned — effect inactive', 'Nicht zugewiesen — Bonus macht gerade Feierabend') : acquisition.note,
  };
}
export function describeCrewCommand(result: CrewCommandResult, action: 'recruit' | 'assign' | 'unassign', id?: unknown, slotId?: unknown, locale: Locale = DEFAULT_LOCALE): string {
  if (!result.ok) {
    switch (result.error) {
      case 'statistics-overflow': return localize(locale, 'Lifetime statistics limit reached. The action was not completed.', 'Statistiklimit erreicht. Selbst Solara hat irgendwann genug Zahlen. Aktion abgebrochen.');
      case 'requirements-not-met': return localize(locale,
        `Recruitment locked: ${result.requirements.requirements.filter(r => !r.met).map(r => r.description).join('; ')}.`,
        `Rekrutierung gesperrt: ${result.requirements.requirements.filter(r => !r.met).map(r => requirementText(r.description, locale)).join('; ')}.`);
      case 'insufficient-funds': return localize(locale, 'Not enough cash to recruit. Nothing was spent.', 'Zu wenig Cash für die Rekrutierung. Wenigstens wurde nichts verbrannt.');
      case 'already-recruited': return localize(locale, 'This specialist is already recruited.', 'Der Spezialist steht schon auf deiner verdächtig kurzen Gehaltsliste.');
      case 'not-recruited': return localize(locale, 'Recruit this specialist before assigning them.', 'Erst rekrutieren, dann herumkommandieren. Sogar Solara kennt Reihenfolgen.');
      case 'incompatible-slot': return localize(locale, 'This specialist cannot fill that slot.', 'Dieser Spezialist passt nicht in den Slot. Fachkräftemangel, aber mit Neonlicht.');
      case 'already-assigned': return localize(locale, 'This specialist is already assigned. Unassign them before moving slots.', 'Schon im Einsatz. Erst abziehen, dann neu verteilen — Menschen sind keine Tabs.');
      case 'already-empty': return localize(locale, 'This slot is already empty.', 'Der Slot ist bereits leer. Noch leerer wird schwierig.');
      case 'unknown-slot': case 'unknown-crew-member': case 'invalid-amount': case 'overflow': return localize(locale, 'Crew action failed. Nothing changed.', 'Crew-Aktion fehlgeschlagen. Niemand gefeuert, niemand verklagt.');
    }
  }
  const slot = findCrewSlot(slotId);
  if (action === 'unassign') return localize(locale,
    `${slot?.name ?? 'Crew slot'} unassigned. Specialist remains recruited; effect inactive.`,
    `${slot?.name ?? 'Crew-Slot'} geräumt. Spezialist bleibt rekrutiert, Bonus legt die Füße hoch.`);
  const member = findCrewMember(id);
  if (!member) return localize(locale, 'Crew updated.', 'Crew aktualisiert. Die Personalakte bleibt selbstverständlich inoffiziell.');
  return action === 'recruit' ? localize(locale,
    `${member.name} recruited. -${formatPrice(member.recruitmentCost)} · Available for ${member.allowedSlots.map(id => findCrewSlot(id)?.name).join(', ')}. Effect inactive until assigned.`,
    `${member.name} rekrutiert. -${formatPrice(member.recruitmentCost)} · Einsatzbereit für ${member.allowedSlots.map(id => findCrewSlot(id)?.name).join(', ')}. Bonus startet erst nach Zuweisung.`)
    : localize(locale, `${member.name} assigned to ${slot?.name}. ${describeCrewEffect(member.effect, locale)}.`, `${member.name} ist jetzt bei ${slot?.name}. ${describeCrewEffect(member.effect, locale)}.`);
}
