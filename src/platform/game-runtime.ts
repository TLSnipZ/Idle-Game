import type { LayLowResult } from '../game/lay-low';
import type { AcquireTerritoryResult } from '../game/acquire-territory';
import type { PurchaseSkillResult } from '../game/purchase-skill-rank';
import type { PurchaseVehicleResult } from '../game/purchase-vehicle';
import { newlyEligibleContent } from '../game/requirements';
import { getLevelIncrease } from '../features/progression';
import type { LevelIncrease } from '../features/progression';
import type { PurchaseAutomationResult } from '../game/purchase-automation';
import type { AutomationSummary } from '../game/simulate-automation';
import type { PurchaseUpgradeResult } from '../game/purchase-upgrade';
import type { UpgradeBusinessResult } from '../game/upgrade-business';
import type { GameState } from '../game/game-state';
import type { StarterJobResult } from '../game/perform-starter-job';
import type { PurchaseBusinessResult } from '../game/purchase-business';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import type { GameSimulationResult } from '../game/simulate-game-elapsed';

export const RUNTIME_CADENCE_MS = 250;

type CommandResult = LayLowResult | AcquireTerritoryResult | PurchaseSkillResult | PurchaseVehicleResult | PurchaseAutomationResult | StarterJobResult | PurchaseBusinessResult | UpgradeBusinessResult | PurchaseUpgradeResult;
type RuntimeError = Extract<GameSimulationResult, { ok: false }>['error']
  | 'invalid-clock' | 'invalid-state';

export interface RuntimeSnapshot {
  readonly result: CommandResult;
  readonly runtimeError: RuntimeError | null;
  readonly levelEvent?: LevelIncrease & { readonly sequence: number; readonly unlocks?: readonly string[] };
  readonly automationEvent?: AutomationSummary & { readonly sequence: number };
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

  function levelEventFor(state: GameState) {
    const increase = getLevelIncrease(snapshot.result.state.progression.xp, state.progression.xp);
    if (!increase) return {};
    const unlocks = newlyEligibleContent(snapshot.result.state, state);
    return { levelEvent: { ...increase, sequence: (snapshot.levelEvent?.sequence ?? 0) + 1,
      ...(unlocks.length ? { unlocks } : {}) } };
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
    let result: GameSimulationResult;
    try {
      result = simulateGameElapsed(snapshot.result.state, wholeMs);
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
      snapshot = { ...snapshot, ...levelEventFor(result.state), result: { ...snapshot.result, state: result.state },
        ...(result.automation.completedJobs > 0 ? { automationEvent: {
          ...result.automation, sequence: (snapshot.automationEvent?.sequence ?? 0) + 1,
        } } : {}),
      };
      publish(snapshot);
    }
    return true;
  }

  function execute(command: (state: GameState) => CommandResult) {
    if (!reconcile()) return;
    const previous = snapshot.result.state;
    const result = command(previous);
    // Ownership/level/equipment/delegation/vehicle/skill/territory changes start a new rate boundary. Runtime sub-ms
    // duration is dropped; earned authoritative milli-cents are never reset.
    if (result.ok && (result.state.businesses.owned !== previous.businesses.owned
        || result.state.city.ownedTerritoryIds !== previous.city.ownedTerritoryIds
        || result.state.garage.ownedVehicleIds !== previous.garage.ownedVehicleIds
        || result.state.permanentProgression.skills !== previous.permanentProgression.skills
        || result.state.upgrades !== previous.upgrades
        || result.state.automation.unlockedIds !== previous.automation.unlockedIds)) remainderMs = 0;
    snapshot = { ...snapshot, ...(result.ok ? levelEventFor(result.state) : {}), result };
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
