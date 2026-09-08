import type { GameState } from '../game/game-state';
import type { StarterJobResult } from '../game/perform-starter-job';
import type { PurchaseBusinessResult } from '../game/purchase-business';
import { simulateElapsed } from '../game/simulate-elapsed';
import type { SimulationResult } from '../game/simulate-elapsed';

export const RUNTIME_CADENCE_MS = 250;

type CommandResult = StarterJobResult | PurchaseBusinessResult;
type RuntimeError = Extract<SimulationResult, { ok: false }>['error']
  | 'invalid-clock' | 'invalid-state';

export interface RuntimeSnapshot {
  readonly result: CommandResult;
  readonly runtimeError: RuntimeError | null;
}

export interface RuntimeTiming {
  readonly now: () => number;
  // Scheduling must defer callbacks; cancellation must prevent future callbacks.
  readonly schedule: (callback: () => void) => () => void;
}

export const browserTiming: RuntimeTiming = {
  now: () => performance.now(),
  schedule: callback => {
    const id = window.setInterval(callback, RUNTIME_CADENCE_MS);
    return () => window.clearInterval(id);
  },
};

/** One mounted session. No clock reads or side effects until start(). */
export function createGameRuntime(
  initialState: GameState,
  publish: (snapshot: RuntimeSnapshot) => void,
  timing: RuntimeTiming = browserTiming,
) {
  let snapshot: RuntimeSnapshot = { result: { ok: true, state: initialState }, runtimeError: null };
  let baseline: number | null = null;
  let remainderMs = 0;
  let cancel: (() => void) | null = null;
  let generation = 0;

  function stop() {
    generation += 1;
    cancel?.();
    cancel = null;
    baseline = null;
  }

  function suspend(error: RuntimeError) {
    // Retain the last successful snapshot and unapplied fraction. No resume/retry
    // is offered: reload creates a new session, never replaying a failed interval.
    stop();
    snapshot = { ...snapshot, runtimeError: error };
    publish(snapshot);
  }

  function reconcile(): boolean {
    if (baseline === null || snapshot.runtimeError !== null) return false;
    const now = timing.now();
    const elapsed = now - baseline + remainderMs;
    if (!Number.isFinite(now) || now < baseline || !Number.isFinite(elapsed)
        || elapsed > Number.MAX_SAFE_INTEGER) {
      suspend('invalid-clock');
      return false;
    }
    const wholeMs = Math.floor(elapsed);
    let result: SimulationResult;
    try {
      result = simulateElapsed(snapshot.result.state, wholeMs);
    } catch (error) {
      suspend('invalid-state');
      throw error; // Preserve the domain's fail-loudly corruption policy.
    }
    if (!result.ok) {
      suspend(result.error);
      return false;
    }
    baseline = now;
    remainderMs = elapsed - wholeMs;
    if (result.state !== snapshot.result.state) {
      // Automatic income must not erase feedback from the last player command.
      snapshot = { ...snapshot, result: { ...snapshot.result, state: result.state } };
      publish(snapshot);
    }
    return true;
  }

  function execute(command: (state: GameState) => CommandResult) {
    if (!reconcile()) return;
    const previous = snapshot.result.state;
    const result = command(previous);
    // The first producer starts at this command's actual clock boundary. A
    // sub-ms interval with no owners has no earned value and must not become
    // retroactive time for the new owner. Producing-session fractions persist.
    if (result.ok && previous.businesses.ownedIds.length === 0
        && result.state.businesses.ownedIds.length > 0) remainderMs = 0;
    snapshot = { ...snapshot, result };
    publish(snapshot);
  }

  function start() {
    if (baseline !== null || snapshot.runtimeError !== null) return;
    const now = timing.now();
    if (!Number.isFinite(now) || now < 0) {
      suspend('invalid-clock');
      return;
    }
    baseline = now;
    const currentGeneration = ++generation;
    cancel = timing.schedule(() => {
      if (currentGeneration === generation) reconcile();
    });
  }

  // Prepare without mutation. Caller must durably write before invoking commit,
  // synchronously in this same task (no await between preparation and commit).
  function prepareReplacement(state: GameState): (() => void) | null {
    if (baseline === null || snapshot.runtimeError !== null) return null;
    const now = timing.now();
    if (!Number.isFinite(now) || now < baseline) return null;
    return () => {
      baseline = now;
      remainderMs = 0;
      snapshot = { result: { ok: true, state }, runtimeError: null };
      publish(snapshot);
    };
  }
  return { start, stop, reconcile, execute, prepareReplacement, getSnapshot: () => snapshot };
}
