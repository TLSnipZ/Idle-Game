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

export function useGame() {
  const [feedback, setFeedback] = useState<{ sequence: number; message: string; tone?: 'success' | 'warning' }>({ sequence: 0, message: '' });
  const [view, setView] = useState<PersistentSnapshot>(() => ({
    result: { ok: true, state: createInitialGameState() },
    runtimeError: null,
    persistence: { kind: 'ready' }, offline: null,
  }));
  // This stable, per-hook adapter serializes transitions synchronously before
  // React batches rendering. Never perform clock side effects in a state updater.
  const [runtime] = useState(() => createPersistentGame(setView));

  useEffect(() => {
    runtime.start();
    return runtime.stop;
  }, [runtime]);

  function runStarterJob() {
    runtime.execute(state => {
      const result = performStarterJob(state);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('delivery', result) }));
      return result;
    });
  }

  function buyBusiness(businessId: unknown) {
    const result = runtime.execute(state => purchaseBusiness(state, businessId));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result ? describeAction('purchase', result, businessId) : 'The action could not be saved. No purchase or configuration change was made.' }));
  }

  function upgradeOwnedBusiness(id: unknown) {
    const result = runtime.execute(state => upgradeBusiness(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result ? describeAction('upgrade', result, id) : 'The action could not be saved. No purchase or configuration change was made.' }));
  }

  function buyUpgrade(id: unknown) {
    runtime.execute(state => {
      const result = purchaseUpgrade(state, id);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeAction('equipment', result, id) }));
      return result;
    });
  }

  function buyAutomation(id: unknown) {
    const result = runtime.execute(state => purchaseAutomation(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result ? describeAction('automation', result, id) : 'The action could not be saved. No purchase or configuration change was made.' }));
  }

  function toggleAutomation(id: unknown, enabled: boolean) {
    const result = runtime.execute(state => setAutomationEnabled(state, id, enabled));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result ? result.ok ? describeAutomationToggle(result, enabled) : describeAction('automation', result, id) : 'The action could not be saved. No purchase or configuration change was made.' }));
  }

  function buyVehicle(id: unknown) {
    const result = runtime.execute(state => purchaseVehicle(state, id));
    if (result) setFeedback(previous => ({ sequence: previous.sequence + 1,
      tone: result.ok ? 'success' : 'warning', message: describeAction('vehicle', result, id) }));
    else if (runtime.getSnapshot().persistence.kind === 'error' || runtime.getSnapshot().persistence.kind === 'blocked')
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: 'warning',
        message: 'Vehicle purchase could not be saved. No purchase was made.' }));
  }

  function coolDown() {
    runtime.execute(state => {
      const result = layLow(state);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeLayLow(result) }));
      return result;
    });
  }

  function takeTerritory(id: unknown) {
    runtime.execute(state => {
      const result = acquireTerritory(state, id);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeTerritoryAcquisition(result, id) }));
      return result;
    });
  }

  function buySkill(id: unknown) {
    runtime.execute(state => {
      const result = purchaseSkillRank(state, id);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeSkillPurchase(result, id) }));
      return result;
    });
  }

  function recruitCrew(id: unknown) {
    runtime.execute(state => {
      const result = recruitCrewMember(state, id);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'recruit', id) }));
      return result;
    });
  }
  function assignCrew(slot: unknown, id: unknown) {
    runtime.execute(state => {
      const result = assignCrewMember(state, slot, id);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'assign', id, slot) }));
      return result;
    });
  }
  function unassignCrew(slot: unknown) {
    runtime.execute(state => {
      const result = unassignCrewSlot(state, slot);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeCrewCommand(result, 'unassign', undefined, slot) }));
      return result;
    });
  }

  function chooseEvent(eventId: unknown, choiceId: unknown) {
    runtime.execute(state => {
      const result = resolveEventChoice(state, eventId, choiceId);
      setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result.ok ? 'success' : 'warning', message: describeEventResolution(result) }));
      return result;
    });
  }

  function rebirth() {
    const result = runtime.rebirth();
    if (result.ok) setFeedback(previous => ({ sequence: previous.sequence + 1, message: '' }));
    return result;
  }

  function changeAutoUpgraderTarget(id: string) {
    const result = runtime.execute(state => setBusinessAutoUpgraderTarget(state, id));
    setFeedback(previous => ({ sequence: previous.sequence + 1, tone: result?.ok ? 'success' : 'warning',
      message: result?.ok ? `Auto-Upgrader target set to ${findBusiness(id)?.name}.`
        : 'Auto-Upgrader target could not be changed.' }));
  }

  return { changeAutoUpgraderTarget, toggleAutomation, achievementEvent: view.achievementEvent, chooseEvent, cityEvent: view.cityEvent, recruitCrew, assignCrew, unassignCrew, coolDown, takeTerritory, buySkill, rebirth, buyVehicle, levelEvent: view.levelEvent, buyAutomation, automationEvent: view.automationEvent, buyUpgrade, upgradeOwnedBusiness, offline: view.offline, dismissOffline: runtime.dismissOffline, saveActions: runtime, persistence: view.persistence, feedback, snapshot: view.result, runtimeError: view.persistence.kind === 'offline-error' ? 'offline-bootstrap' : view.runtimeError, runStarterJob, buyBusiness };
}
