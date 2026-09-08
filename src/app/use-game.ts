import { useEffect, useState } from 'react';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { createGameRuntime } from '../platform/game-runtime';
import type { RuntimeSnapshot } from '../platform/game-runtime';

export function useGame() {
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
    runtime.execute(performStarterJob);
  }

  function buyBusiness(businessId: unknown) {
    runtime.execute(state => purchaseBusiness(state, businessId));
  }

  return { snapshot: view.result, runtimeError: view.runtimeError, runStarterJob, buyBusiness };
}
