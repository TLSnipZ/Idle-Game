import type { PersistenceStatus } from '../platform/persistent-game';
import { describePersistence } from './game-presentation';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import './SaveStatus.css';

/** Reports the last storage result, never a guarantee that the live tick is saved. */
export function SaveStatus({ status }: { readonly status: PersistenceStatus }) {
  const locale = useLocale(), text = useLocalizedText();
  const failed = status.kind === 'error' || status.kind === 'blocked' || status.kind === 'offline-error';
  return <details className={`save-status ${failed ? 'save-status-warning' : ''}`}>
    <summary>{failed ? text('SAVE NEEDS ATTENTION', 'SAVE PRÜFEN') : text('LOCAL AUTOSAVE', 'LOKALER AUTOSAVE')}</summary>
    <div className="save-status-details">
      <p>{describePersistence(status, locale)}</p>
      <p>{text('This is the last save result. Live progress continues between saves; an action message alone does not confirm storage.',
        'Das ist das letzte Speicherergebnis. Zwischen Saves läuft das Spiel weiter. Eine Aktionsmeldung allein bestätigt noch keinen gespeicherten Fortschritt.')}</p>
      <p>{text('Business purchases, Garage changes, automation settings, district travel and decoys require a successful save before taking effect. Other actions can remain live if saving fails; recent progress may be lost on reload.',
        'Business-Käufe, Garage-Änderungen, Automations-Einstellungen, Bezirkswechsel und Ablenkungen werden erst nach erfolgreichem Speichern wirksam. Andere Aktionen können bei Speicherfehlern live bleiben. Neuer Fortschritt kann beim Neuladen verloren gehen.')}</p>
    </div>
  </details>;
}
