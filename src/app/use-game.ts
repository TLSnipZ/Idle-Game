import { setBusinessAutoUpgraderTarget } from '../game/set-auto-upgrader-target';
import { findBusiness } from '../features/businesses';
import { setAutomationEnabled } from '../game/set-automation-enabled';
import { describeAutomationToggle } from './automation-presentation';
import { resolveEventChoice } from '../game/resolve-event-choice';
import { describeEventResolution } from './event-presentation';
import { recruitCrewMember, assignCrewMember, unassignCrewSlot } from '../game/crew-commands';
import { describeCrewCommand } from './crew-presentation';
import { layLow } from '../game/lay-low';
import { describeLayLow } from './heat-presentation';
import { acquireTerritory } from '../game/acquire-territory';
import { describeTerritoryAcquisition } from './territory-presentation';
import { purchaseSkillRank } from '../game/purchase-skill-rank';
import { describeSkillPurchase } from './skill-presentation';
import { findVehicle } from '../features/vehicles';
import { purchaseVehicle } from '../game/purchase-vehicle';
import { purchaseAutomation } from '../game/purchase-automation';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { upgradeBusiness } from '../game/upgrade-business';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialGameState } from '../game/game-state';
import { performDiscreetDelivery, performRiskyDelivery, performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { createPersistentGame } from '../platform/persistent-game';
import { describeAction } from './game-presentation';
import type { PersistentSnapshot } from '../platform/persistent-game';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export function useGame() {
  const localeRef = useRef<Locale>(DEFAULT_LOCALE);
  const setPresentationLocale = useCallback((locale: Locale) => { localeRef.current = locale; }, []);
  const [replacementSequence, setReplacementSequence] = useState(0);
  const [feedback, setFeedback] = useState<{ sequence: number; message: string; tone?: 'success' | 'warning' }>({ sequence: 0, message: '' });
  const [view, setView] = useState<PersistentSnapshot>(() => ({
    result: { ok: true, state: createInitialGameState() },
    runtimeError: null,
    persistence: { kind: 'ready' }, offline: null,
  }));
  const [runtime] = useState(() => createPersistentGame(setView));

  useEffect(() => {
    runtime.start();
    return runtime.stop;
  }, [runtime]);

  const unsaved = () => localize(localeRef.current,
    'The action could not be saved. No purchase or configuration change was made.',
    'Die Aktion konnte nicht gespeichert werden. Kein Kauf und keine Änderung durchgeführt. Dein Cash darf heute ausnahmsweise bleiben.');

  function runStarterJob() {
    return runtime.execute(state => {
      const result = performStarterJob(state);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('delivery', result, undefined, localeRef.current) }));
      return result;
    });
  }

  function runManhuntDecoy() {
    const result = runtime.deployManhuntDecoy();
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result?.ok ? localize(localeRef.current,
        'Decoy deployed. Local MANHUNT cleared. The cops have a new favourite van.',
        'Ablenkungsmanöver gestartet. Lokale Großfahndung beendet. Die Cops haben einen neuen Lieblingslieferwagen.')
        : result ? describeAction('delivery', result, undefined, localeRef.current) : unsaved() }));
  }

  function chooseDistrict(id: string) {
    const before = runtime.getSnapshot().result.state;
    const result = runtime.selectActiveDistrict(id);
    if (result?.ok && result.state === before) return;
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result?.ok ? localize(localeRef.current,
        'Operating district changed. Local Heat stays behind; your reputation has a postcode.',
        'Einsatzbezirk gewechselt. Lokales Heat bleibt zurück; dein Ruf hat eine Postleitzahl.')
        : result ? describeAction('delivery', result, undefined, localeRef.current)
          : localize(localeRef.current, 'District change could not be saved. Your location is unchanged.',
            'Bezirkswechsel konnte nicht gespeichert werden. Dein Standort bleibt unverändert.') }));
  }

  function runDiscreetDelivery() {
    const result = runtime.execute(performDiscreetDelivery);
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result ? describeAction('delivery', result, undefined, localeRef.current)
        : localize(localeRef.current, 'Delivery unavailable while paused.', 'Lieferung während der Pause nicht verfügbar.') }));
  }

  function runRiskyDelivery() {
    const result = runtime.execute(performRiskyDelivery);
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result ? describeAction('delivery', result, undefined, localeRef.current) : localize(localeRef.current,
        'Delivery unavailable while the session is paused.', 'Lieferung während der Pause nicht verfügbar. Sogar dubiose Pakete haben Feierabend.') }));
  }

  function buyBusiness(businessId: unknown) {
    const result = runtime.execute(state => purchaseBusiness(state, businessId));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? describeAction('purchase', result, businessId, localeRef.current) : unsaved() }));
  }
  function upgradeOwnedBusiness(id: unknown) {
    const result = runtime.execute(state => upgradeBusiness(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? describeAction('upgrade', result, id, localeRef.current) : unsaved() }));
  }
  function buyUpgrade(id: unknown) {
    runtime.execute(state => { const result = purchaseUpgrade(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('equipment', result, id, localeRef.current) })); return result; });
  }
  function buyAutomation(id: unknown) {
    const result = runtime.execute(state => purchaseAutomation(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? describeAction('automation', result, id, localeRef.current) : unsaved() }));
  }
  function toggleAutomation(id: unknown, enabled: boolean) {
    const result = runtime.execute(state => setAutomationEnabled(state, id, enabled));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? result.ok ? describeAutomationToggle(result, enabled, localeRef.current) : describeAction('automation', result, id, localeRef.current) : unsaved() }));
  }
  function buyVehicle(id: unknown) {
    const result = runtime.execute(state => purchaseVehicle(state, id));
    if (result) setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('vehicle', result, id, localeRef.current) }));
    else if (runtime.getSnapshot().persistence.kind === 'error' || runtime.getSnapshot().persistence.kind === 'blocked') setFeedback(previous => ({ sequence: previous.sequence + 1, tone: 'warning', message: localize(localeRef.current, 'Vehicle purchase could not be saved. No purchase was made.', 'Fahrzeugkauf konnte nicht gespeichert werden. Kein Kauf durchgeführt. Deine Garage bleibt finanziell verantwortungsvoll — leider.') }));
  }
  function chooseActiveVehicle(id: string) {
    const before = runtime.getSnapshot().result.state;
    const result = runtime.selectActiveVehicle(id);
    if (result?.ok && result.state === before) return;
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result?.ok ? localize(localeRef.current,
        `${findVehicle(id)?.name} is active. One car earns the bonus; the others can admire the parking.`,
        `${findVehicle(id)?.name} ist aktiv. Ein Auto liefert den Bonus, der Rest bewundert den Parkplatz.`)
        : localize(localeRef.current, 'Vehicle selection could not be saved. Your active car is unchanged.',
          'Fahrzeugauswahl konnte nicht gespeichert werden. Dein aktives Auto bleibt im Dienst.') }));
  }
  function coolDown() { runtime.execute(state => { const result = layLow(state); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeLayLow(result, localeRef.current) })); return result; }); }
  function takeTerritory(id: unknown) { runtime.execute(state => { const result = acquireTerritory(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeTerritoryAcquisition(result, id, localeRef.current) })); return result; }); }
  function buySkill(id: unknown) { runtime.execute(state => { const result = purchaseSkillRank(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeSkillPurchase(result, id, localeRef.current) })); return result; }); }
  function recruitCrew(id: unknown) { runtime.execute(state => { const result = recruitCrewMember(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'recruit', id, undefined, localeRef.current) })); return result; }); }
  function assignCrew(slot: unknown, id: unknown) { runtime.execute(state => { const result = assignCrewMember(state, slot, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'assign', id, slot, localeRef.current) })); return result; }); }
  function unassignCrew(slot: unknown) { runtime.execute(state => { const result = unassignCrewSlot(state, slot); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'unassign', undefined, slot, localeRef.current) })); return result; }); }
  function chooseEvent(eventId: unknown, choiceId: unknown) { runtime.execute(state => { const result = resolveEventChoice(state, eventId, choiceId); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeEventResolution(result, localeRef.current) })); return result; }); }

  function rebirth() { const result = runtime.rebirth(); if (result.ok) { setReplacementSequence(previous => previous + 1); setFeedback(previous => ({ sequence: previous.sequence + 1, message: '' })); } return result; }
  function importCode(code: string) { const result = runtime.importCode(code); if (result.ok) { setReplacementSequence(previous => previous + 1); setFeedback(previous => ({ sequence: previous.sequence + 1, message: '' })); } return result; }
  function resetProgress(confirmation: string) {
    const result = runtime.resetProgress(confirmation);
    if (result.ok) { setReplacementSequence(previous => previous + 1); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: 'success', message: localize(localeRef.current, 'NEW GAME · All progress has been reset and saved. Start with your first delivery in Operations.', 'NEUES SPIEL · Alles gelöscht und gespeichert. Deine erste Lieferung wartet unter Operationen. Willkommen zurück am unteren Ende der Nahrungskette.') })); }
    return result;
  }
  function configureAppearance(vehicleId: string, appearanceId: string | null) {
    const result = runtime.configureAppearance(vehicleId, appearanceId);
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result?.ok
        ? localize(localeRef.current, 'Look saved. Same engine, more expensive taste.',
          'Look gespeichert. Gleicher Motor, teurerer Geschmack.')
        : localize(localeRef.current, 'Look could not be saved. Check ownership and save status.',
          'Look konnte nicht gespeichert werden. Besitz und Speicherstatus prüfen.') }));
  }
  function configureTuning(vehicleId: string, id: string | null, purchase: boolean) {
    const result = runtime.configureTuning(vehicleId, id, purchase);
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result?.ok
        ? localize(localeRef.current, 'Garage setup ready. Only the active car puts it to work. The mechanic has deleted the invoice.',
          'Garage-Setup bereit. Nur das aktive Auto nutzt es. Der Mechaniker hat die Rechnung bereits gelöscht.')
        : localize(localeRef.current, 'Setup could not be changed. Check ownership, Cash and save status.',
          'Setup konnte nicht geändert werden. Besitz, Cash und Speicherstatus prüfen. Anschreien bringt keine Mehrleistung.') }));
  }
  function changeAutoUpgraderTarget(id: string) {
    const result = runtime.execute(state => setBusinessAutoUpgraderTarget(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result?.ok ? localize(localeRef.current, `Auto-Upgrader target set to ${findBusiness(id)?.name}.`, `Auto-Upgrader-Ziel auf ${findBusiness(id)?.name} gesetzt. Dein Cash kennt jetzt seine nächste Bestimmung.`) : localize(localeRef.current, 'Auto-Upgrader target could not be changed.', 'Auto-Upgrader-Ziel konnte nicht geändert werden. Die Maschine verweigert die Umstrukturierung.') }));
  }

  return { configureAppearance, configureTuning, runManhuntDecoy, chooseDistrict, runDiscreetDelivery, runRiskyDelivery, setPresentationLocale, chooseActiveVehicle, replacementSequence, resetProgress, changeAutoUpgraderTarget, toggleAutomation, achievementEvent: view.achievementEvent, chooseEvent, cityEvent: view.cityEvent, recruitCrew, assignCrew, unassignCrew, coolDown, takeTerritory, buySkill, rebirth, buyVehicle, levelEvent: view.levelEvent, buyAutomation, automationEvent: view.automationEvent, buyUpgrade, upgradeOwnedBusiness, offline: view.offline, dismissOffline: runtime.dismissOffline, saveActions: { ...runtime, importCode }, persistence: view.persistence, feedback, snapshot: view.result, runtimeError: view.persistence.kind === 'offline-error' ? 'offline-bootstrap' : view.runtimeError, runStarterJob, buyBusiness };
}
