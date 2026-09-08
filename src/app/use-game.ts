import { upgradeBusiness } from '../game/upgrade-business';
import { useEffect, useState } from 'react';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { createPersistentGame } from '../platform/persistent-game';
import { describeAction } from './game-presentation';
import type { PersistentSnapshot } from '../platform/persistent-game';

export function useGame() {
  const [feedback, setFeedback] = useState({ sequence: 0, message: '' });
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
      setFeedback(previous => ({ sequence: previous.sequence + 1, message: describeAction('delivery', result) }));
      return result;
    });
  }

  function buyBusiness(businessId: unknown) {
    runtime.execute(state => {
      const result = purchaseBusiness(state, businessId);
      setFeedback(previous => ({ sequence: previous.sequence + 1, message: describeAction('purchase', result) }));
      return result;
    });
  }

  function upgradeOwnedBusiness(id: unknown) {
    runtime.execute(state => {
      const result = upgradeBusiness(state, id);
      setFeedback(previous => ({ sequence: previous.sequence + 1, message: describeAction('upgrade', result) }));
      return result;
    });
  }

  return { upgradeOwnedBusiness, offline: view.offline, dismissOffline: runtime.dismissOffline, saveActions: runtime, persistence: view.persistence, feedback, snapshot: view.result, runtimeError: view.persistence.kind === 'offline-error' ? 'offline-bootstrap' : view.runtimeError, runStarterJob, buyBusiness };
}
