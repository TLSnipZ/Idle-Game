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
import { purchaseVehicle } from '../game/purchase-vehicle';
import { purchaseAutomation } from '../game/purchase-automation';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { upgradeBusiness } from '../game/upgrade-business';
import { useEffect, useState } from 'react';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { createPersistentGame } from '../platform/persistent-game';
import { describeAction } from './game-presentation';
import type { PersistentSnapshot } from '../platform/persistent-game';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

let presentationLocale: Locale = DEFAULT_LOCALE;
/** Presentation-only bridge. Never enters GameState or persistence. */
export function setGamePresentationLocale(locale: Locale) { presentationLocale = locale; }

export function useGame() {
  // Each new hook instance begins from the compatibility default; GameShell syncs the device locale after mount.
  presentationLocale = DEFAULT_LOCALE;
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

  const unsaved = () => localize(presentationLocale,
    'The action could not be saved. No purchase or configuration change was made.',
    'Die Aktion konnte nicht gespeichert werden. Kein Kauf und keine Änderung durchgeführt. Dein Cash darf heute ausnahmsweise bleiben.');

  function runStarterJob() {
    runtime.execute(state => {
      const result = performStarterJob(state);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('delivery', result, undefined, presentationLocale) }));
      return result;
    });
  }

  function buyBusiness(businessId: unknown) {
    const result = runtime.execute(state => purchaseBusiness(state, businessId));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? describeAction('purchase', result, businessId, presentationLocale) : unsaved() }));
  }
  function upgradeOwnedBusiness(id: unknown) {
    const result = runtime.execute(state => upgradeBusiness(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? describeAction('upgrade', result, id, presentationLocale) : unsaved() }));
  }
  function buyUpgrade(id: unknown) {
    runtime.execute(state => { const result = purchaseUpgrade(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('equipment', result, id, presentationLocale) })); return result; });
  }
  function buyAutomation(id: unknown) {
    const result = runtime.execute(state => purchaseAutomation(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? describeAction('automation', result, id, presentationLocale) : unsaved() }));
  }
  function toggleAutomation(id: unknown, enabled: boolean) {
    const result = runtime.execute(state => setAutomationEnabled(state, id, enabled));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result ? result.ok ? describeAutomationToggle(result, enabled, presentationLocale) : describeAction('automation', result, id, presentationLocale) : unsaved() }));
  }
  function buyVehicle(id: unknown) {
    const result = runtime.execute(state => purchaseVehicle(state, id));
    if (result) setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('vehicle', result, id, presentationLocale) }));
    else if (runtime.getSnapshot().persistence.kind === 'error' || runtime.getSnapshot().persistence.kind === 'blocked') setFeedback(previous => ({ sequence: previous.sequence + 1, tone: 'warning', message: localize(presentationLocale, 'Vehicle purchase could not be saved. No purchase was made.', 'Fahrzeugkauf konnte nicht gespeichert werden. Kein Kauf durchgeführt. Deine Garage bleibt finanziell verantwortungsvoll — leider.') }));
  }
  function coolDown() { runtime.execute(state => { const result = layLow(state); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeLayLow(result, presentationLocale) })); return result; }); }
  function takeTerritory(id: unknown) { runtime.execute(state => { const result = acquireTerritory(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeTerritoryAcquisition(result, id, presentationLocale) })); return result; }); }
  function buySkill(id: unknown) { runtime.execute(state => { const result = purchaseSkillRank(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeSkillPurchase(result, id, presentationLocale) })); return result; }); }
  function recruitCrew(id: unknown) { runtime.execute(state => { const result = recruitCrewMember(state, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'recruit', id, undefined, presentationLocale) })); return result; }); }
  function assignCrew(slot: unknown, id: unknown) { runtime.execute(state => { const result = assignCrewMember(state, slot, id); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'assign', id, slot, presentationLocale) })); return result; }); }
  function unassignCrew(slot: unknown) { runtime.execute(state => { const result = unassignCrewSlot(state, slot); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'unassign', undefined, slot, presentationLocale) })); return result; }); }
  function chooseEvent(eventId: unknown, choiceId: unknown) { runtime.execute(state => { const result = resolveEventChoice(state, eventId, choiceId); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeEventResolution(result, presentationLocale) })); return result; }); }

  function rebirth() { const result = runtime.rebirth(); if (result.ok) { setReplacementSequence(previous => previous + 1); setFeedback(previous => ({ sequence: previous.sequence + 1, message: '' })); } return result; }
  function importCode(code: string) { const result = runtime.importCode(code); if (result.ok) { setReplacementSequence(previous => previous + 1); setFeedback(previous => ({ sequence: previous.sequence + 1, message: '' })); } return result; }
  function resetProgress(confirmation: string) {
    const result = runtime.resetProgress(confirmation);
    if (result.ok) { setReplacementSequence(previous => previous + 1); setFeedback(previous => ({ sequence: previous.sequence + 1, tone: 'success', message: localize(presentationLocale, 'NEW GAME · All progress has been reset and saved. Start with your first delivery in Operations.', 'NEUES SPIEL · Alles gelöscht und gespeichert. Deine erste Lieferung wartet unter Operationen. Willkommen zurück am unteren Ende der Nahrungskette.') })); }
    return result;
  }
  function changeAutoUpgraderTarget(id: string) {
    const result = runtime.execute(state => setBusinessAutoUpgraderTarget(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning', message: result?.ok ? localize(presentationLocale, `Auto-Upgrader target set to ${findBusiness(id)?.name}.`, `Auto-Upgrader-Ziel auf ${findBusiness(id)?.name} gesetzt. Dein Cash kennt jetzt seine nächste Bestimmung.`) : localize(presentationLocale, 'Auto-Upgrader target could not be changed.', 'Auto-Upgrader-Ziel konnte nicht geändert werden. Die Maschine verweigert die Umstrukturierung.') }));
  }

  return { replacementSequence, resetProgress, changeAutoUpgraderTarget, toggleAutomation, achievementEvent: view.achievementEvent, chooseEvent, cityEvent: view.cityEvent, recruitCrew, assignCrew, unassignCrew, coolDown, takeTerritory, buySkill, rebirth, buyVehicle, levelEvent: view.levelEvent, buyAutomation, automationEvent: view.automationEvent, buyUpgrade, upgradeOwnedBusiness, offline: view.offline, dismissOffline: runtime.dismissOffline, saveActions: { ...runtime, importCode }, persistence: view.persistence, feedback, snapshot: view.result, runtimeError: view.persistence.kind === 'offline-error' ? 'offline-bootstrap' : view.runtimeError, runStarterJob, buyBusiness };
}