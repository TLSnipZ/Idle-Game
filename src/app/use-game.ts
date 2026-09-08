import { useEffect, useState } from 'react';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { createGameRuntime } from '../platform/game-runtime';
import { describeAction } from './game-presentation';
import type { RuntimeSnapshot } from '../platform/game-runtime';

export function useGame() {
  const [feedback, setFeedback] = useState({ sequence: 0, message: '' });
  const [view, setView] = useState<RuntimeSnapshot>(() => ({
    result: { ok: true, state: createInitialGameState() },
    runtimeError: null,
  }));
  // This stable, per-hook adapter serializes transitions synchronously before
  // React batches rendering. Never perform clock side effects in a state updater.
  const [runtime] = useState(() => createGameRuntime(view.result.state, setView));

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

  return { feedback, snapshot: view.result, runtimeError: view.runtimeError, runStarterJob, buyBusiness };
}
