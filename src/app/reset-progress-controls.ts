import { RESET_CONFIRMATION_TEXT } from '../platform/persistent-game';
import type { ResetProgressResult } from '../platform/persistent-game';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export interface ResetProgressState {
  readonly confirming: boolean;
  readonly confirmation: string;
  readonly message: string;
}
export const INITIAL_RESET_PROGRESS: ResetProgressState = { confirming: false, confirmation: '', message: '' };

export function describeResetProgress(result: ResetProgressResult, locale: Locale = DEFAULT_LOCALE): string {
  if (result.ok) return localize(locale, 'New Game saved. All progress has been reset. No Empire Points were awarded.', 'Neues Spiel gespeichert. Sämtlicher Fortschritt wurde gelöscht. Keine Empire Points vergeben. Willkommen wieder ganz unten — Miete ist trotzdem fällig.');
  switch (result.error) {
    case 'confirmation-required': return localize(locale, 'Type RESET exactly before confirming. Nothing was reset.', 'Tippe RESET exakt ein. Nichts wurde gelöscht. Großbuchstaben retten heute Leben.');
    case 'runtime-unavailable': return localize(locale, 'The session is not running or its clock is unavailable. Nothing was reset. Reload before trying again.', 'Die Session läuft nicht oder die Uhr streikt. Nichts gelöscht. Neu laden, dann nochmal alles wegwerfen.');
    case 'persistence-failure': return localize(locale, 'New Game could not be saved. Nothing was reset; your previous save is preserved. Check storage access or reload if another tab changed the save.', 'Neues Spiel konnte nicht gespeichert werden. Nichts gelöscht; alter Save bleibt erhalten. Speicher prüfen oder neu laden, falls ein anderer Tab am Imperium herumgeschraubt hat.');
  }
}

/** Ephemeral consent only. Request/edit/cancel never call gameplay or storage. */
export function createResetProgressControls(
  reset: (confirmation: string) => ResetProgressResult,
  publish: (state: ResetProgressState) => void,
  locale: Locale = DEFAULT_LOCALE,
) {
  let state = INITIAL_RESET_PROGRESS;
  const update = (next: ResetProgressState) => { state = next; publish(state); };
  function request() { update({ confirming: true, confirmation: '', message: '' }); }
  function edit(confirmation: string) {
    if (state.confirming) update({ ...state, confirmation, message: '' });
  }
  function cancel() { update({ ...INITIAL_RESET_PROGRESS, message: localize(locale, 'New Game cancelled. Nothing was reset.', 'Neues Spiel abgebrochen. Nichts gelöscht. Vernunft hatte kurz Zugriff.') }); }
  function confirm(): ResetProgressResult | undefined {
    if (!state.confirming || state.confirmation !== RESET_CONFIRMATION_TEXT) return;
    const confirmation = state.confirmation;
    state = INITIAL_RESET_PROGRESS;
    const result = reset(confirmation);
    update({ ...INITIAL_RESET_PROGRESS, message: describeResetProgress(result, locale) });
    return result;
  }
  return { request, edit, cancel, confirm, getSnapshot: () => state };
}
