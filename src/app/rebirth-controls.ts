import type { RebirthTransactionResult } from '../platform/persistent-game';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export interface RebirthControlsState { readonly confirming: boolean; readonly message: string }
export const INITIAL_REBIRTH_CONTROLS: RebirthControlsState = { confirming: false, message: '' };
function requirementText(description: string, locale: Locale) {
  if (locale === 'en') return description;
  if (description.startsWith('Player Level ')) return description.replace('Player Level ', 'Spielerlevel ');
  return description;
}
export function describeRebirth(result: RebirthTransactionResult, locale: Locale = DEFAULT_LOCALE): string {
  if (result.ok) return localize(locale,
    `REBIRTH COMPLETE · +${result.reward} Empire Points. Your operation begins again at Level 1.`,
    `REBIRTH KOMPLETT · +${result.reward} Empire Points. Deine Operation startet wieder auf Level 1. Vermögen weg, Erfahrung emotional vorhanden.`);
  switch (result.error) {
    case 'statistics-overflow': return localize(locale, 'Lifetime statistics limit reached. The action was not completed.', 'Statistiklimit erreicht. Rebirth abgebrochen — selbst Ewigkeit braucht Speicherplatz.');
    case 'requirements-not-met': return localize(locale,
      'Rebirth unavailable: ' + result.requirements.requirements.filter(detail => !detail.met).map(detail => detail.description).join('; ') + '. Nothing was reset.',
      'Rebirth nicht verfügbar: ' + result.requirements.requirements.filter(detail => !detail.met).map(detail => requirementText(detail.description, locale)).join('; ') + '. Nichts wurde zurückgesetzt.');
    case 'overflow': return localize(locale, 'Permanent progression limit reached. Nothing was reset.', 'Limit für permanenten Fortschritt erreicht. Nichts wurde zurückgesetzt. Offenbar bist du zu dauerhaft erfolgreich.');
    case 'persistence-failure': return localize(locale, 'Rebirth could not be saved. Nothing was reset and no Empire Points were granted. Your previous save is preserved; check storage access or reload if another tab changed it.', 'Rebirth konnte nicht gespeichert werden. Nichts wurde zurückgesetzt und keine Empire Points vergeben. Alter Save bleibt erhalten; prüf den Speicher oder lade neu, falls ein anderer Tab dazwischengefunkt hat.');
    case 'runtime-unavailable': return localize(locale, 'The session is not running. Nothing was reset. Reload before trying again.', 'Die Session läuft nicht. Nichts wurde zurückgesetzt. Erst neu laden, dann wiedergeboren werden.');
  }
}
/** Opening/cancelling changes only UI state; final confirmation reads live runtime state. */
export function createRebirthControls(rebirth: () => RebirthTransactionResult, publish: (state: RebirthControlsState) => void, locale: Locale = DEFAULT_LOCALE) {
  let currentLocale = locale;
  let state = INITIAL_REBIRTH_CONTROLS;
  const update = (next: RebirthControlsState) => { state = next; publish(state); };
  function setLocale(next: Locale) { currentLocale = next; }
  function request() { update({ confirming: true, message: '' }); }
  function cancel() { update({ confirming: false, message: localize(currentLocale, 'Rebirth cancelled. Nothing was reset.', 'Rebirth abgebrochen. Nichts zurückgesetzt. Feigheit ist manchmal Datenintegrität.') }); }
  function confirm() {
    if (!state.confirming) return;
    state = { ...state, confirming: false };
    const result = rebirth();
    update({ confirming: false, message: describeRebirth(result, currentLocale) });
  }
  function clear() { update(INITIAL_REBIRTH_CONTROLS); }
  return { setLocale, clear, request, cancel, confirm, getSnapshot: () => state };
}
