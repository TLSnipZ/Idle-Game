import { validateSaveCode } from '../game/save-code';
import type { ExportResult } from '../game/save-code';
import { copySaveCode } from '../platform/clipboard';
import type { ImportResult } from '../platform/persistent-game';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export interface SaveActions {
  exportCode(): ExportResult;
  importCode(code: string): ImportResult;
}
export interface SaveManagementState {
  readonly exported: string;
  readonly input: string;
  readonly confirming: boolean;
  readonly invalidInput?: boolean;
  readonly message: string;
}
export const INITIAL_SAVE_MANAGEMENT: SaveManagementState = {
  exported: '', input: '', confirming: false, message: '',
};
function failure(error: string, locale: Locale): string {
  switch (error) {
    case 'empty-code': return localize(locale, 'Paste a save code first.', 'Erst einen Save-Code einfügen. Gedankenlesen ist noch nicht im Tech-Tree.');
    case 'oversized-code': case 'oversized': return localize(locale, 'This save code is too large.', 'Dieser Save-Code ist zu groß. Selbst Schmuggelware hat Gepäcklimits.');
    case 'unsupported-prefix': case 'wrong-format': return localize(locale, 'This is not a supported Crime Empire save code.', 'Das ist kein unterstützter Solara-Save-Code. Falsche Ware, falscher Hafen.');
    case 'malformed-encoding': return localize(locale, 'The code encoding is damaged. Copy the complete code again.', 'Die Code-Kodierung ist beschädigt. Kopier den kompletten Code nochmal — diesmal mit allen Beweismitteln.');
    case 'malformed-json': return localize(locale, 'The code contains damaged save data.', 'Der Code enthält beschädigte Save-Daten. Das sieht selbst für Solara unseriös aus.');
    case 'unsupported-version': return localize(locale, 'This save requires a newer game version.', 'Dieser Save braucht eine neuere Spielversion. Zukunftstechnologie erkannt.');
    case 'persistence-failure': return localize(locale, 'Import could not be saved. Current progress was not replaced. Check storage access or reload if another tab changed the save.', 'Import konnte nicht gespeichert werden. Aktueller Fortschritt bleibt erhalten. Speicher prüfen oder neu laden, falls ein anderer Tab am Save herumgefummelt hat.');
    case 'runtime-unavailable': return localize(locale, 'The session is not running. Reload before transferring a save.', 'Die Session läuft nicht. Erst neu laden, dann Daten schmuggeln.');
    case 'clock-unavailable': return localize(locale, 'The export timestamp could not be read. Try again.', 'Export-Zeitstempel konnte nicht gelesen werden. Selbst die Uhr will heute nichts damit zu tun haben.');
    default: return localize(locale, 'The save data is invalid. Current progress was not replaced.', 'Save-Daten ungültig. Aktueller Fortschritt bleibt unangetastet — seltene gute Nachricht.');
  }
}

/** Runtime-only interaction state; holds the exact validated code for confirmation. */
export function createSaveManagement(
  actions: SaveActions,
  publish: (state: SaveManagementState) => void,
  copy: (code: string) => Promise<boolean> = copySaveCode,
  locale: Locale = DEFAULT_LOCALE,
) {
  let currentLocale = locale;
  let state = INITIAL_SAVE_MANAGEMENT;
  let pending: string | null = null;
  let revision = 0;
  const update = (patch: Partial<SaveManagementState>) => {
    state = { ...state, ...patch }; publish(state);
  };
  function setLocale(next: Locale) { currentLocale = next; }
  function edit(input: string) {
    revision++; pending = null;
    update({ input, confirming: false, invalidInput: false, message: '' });
  }
  function exportCode() {
    revision++;
    const result = actions.exportCode();
    update(result.ok ? { exported: result.code, message: localize(currentLocale, 'Save code ready. Copy it or select the text manually.', 'Save-Code bereit. Kopieren oder manuell markieren — diskrete Übergabe inklusive.') }
      : { message: failure(result.error, currentLocale) });
  }
  async function copyCode() {
    if (!state.exported) return;
    const current = ++revision;
    const copied = await copy(state.exported);
    if (revision === current) update({ message: copied ? localize(currentLocale, 'Save code copied.', 'Save-Code kopiert. Übergabe erfolgreich.')
      : localize(currentLocale, 'Clipboard unavailable. Your code is still below; select and copy it manually.', 'Zwischenablage nicht verfügbar. Der Code steht noch unten — Handarbeit, wie früher.') });
  }
  function validate() {
    revision++;
    const result = validateSaveCode(state.input);
    pending = result.ok ? state.input : null;
    update({ confirming: result.ok, invalidInput: !result.ok, message: result.ok ? localize(currentLocale, 'Valid save. Confirm below to replace current progress.', 'Gültiger Save. Unten bestätigen, um den aktuellen Fortschritt zu ersetzen. Der Notar wurde nicht eingeladen.') : failure(result.error, currentLocale) });
  }
  function cancel() {
    revision++; pending = null;
    update({ confirming: false, message: localize(currentLocale, 'Import cancelled. Current progress was not replaced.', 'Import abgebrochen. Aktueller Fortschritt bleibt. Datenintegrität durch kalte Füße.') });
  }
  function confirm() {
    if (pending === null) return;
    revision++;
    const result = actions.importCode(pending);
    pending = null;
    update({ confirming: false, message: result.ok ? localize(currentLocale, 'Save imported and stored locally. No offline income added.', 'Save importiert und lokal gespeichert. Keine Offline-Einnahmen gutgeschrieben — doppelte Buchführung gibt’s nur im Witz.') : failure(result.error, currentLocale) });
  }
  function clear() {
    revision++; pending = null;
    state = INITIAL_SAVE_MANAGEMENT; publish(state);
  }
  return { setLocale, clear, edit, exportCode, copyCode, validate, cancel, confirm, getSnapshot: () => state };
}
