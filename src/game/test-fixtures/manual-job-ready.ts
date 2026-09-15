import type { GameState } from '../game-state';
import { performStarterJob } from '../perform-starter-job';

/** Test-only setup helper: restore the canonical ready state without advancing unrelated clocks. */
export function readyManualJobFixture(state: GameState): GameState {
  if (!state.manualJobs) return state;
  const { manualJobs: _manualJobs, ...ready } = state;
  return ready;
}

/** Test-only setup helper for historical fixtures that intentionally ignore action cadence. */
export function performReadyStarterJobFixture(state: GameState): GameState {
  const result = performStarterJob(readyManualJobFixture(state));
  if (!result.ok) throw new Error(`Manual-job fixture failed: ${result.error}`);
  return readyManualJobFixture(result.state);
}
