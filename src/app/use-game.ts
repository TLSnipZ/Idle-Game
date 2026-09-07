import { purchaseBusiness } from '../game/purchase-business';
import type { PurchaseBusinessResult } from '../game/purchase-business';
import { useState } from 'react';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import type { StarterJobResult } from '../game/perform-starter-job';

// Feedback is runtime-only; it is not part of authoritative GameState.
export function useGame() {
  const [snapshot, setSnapshot] = useState<StarterJobResult | PurchaseBusinessResult>(() => ({
    ok: true,
    state: createInitialGameState(),
  }));

  function runStarterJob() {
    setSnapshot(previous => performStarterJob(previous.state));
  }

  function buyBusiness(businessId: unknown) {
    setSnapshot(previous => purchaseBusiness(previous.state, businessId));
  }

  return { snapshot, runStarterJob, buyBusiness };
}
