import { createInitialGameState } from '../game/game-state';
import { createGameRuntime } from './game-runtime';
import type { RuntimeSnapshot, RuntimeTiming } from './game-runtime';
import { createLocalSave } from './local-save';
import type { LoadResult, WriteResult } from './local-save';

export const AUTOSAVE_CADENCE_MS = 5_000;
export type PersistenceStatus = { readonly kind: 'ready' | 'loaded' | 'saved' }
  | { readonly kind: 'blocked'; readonly error: Extract<LoadResult, { kind: 'error' }>['error'] | 'storage-conflict' }
  | { readonly kind: 'error'; readonly error: Extract<WriteResult, { ok: false }>['error'] };
export interface PersistentSnapshot extends RuntimeSnapshot {
  readonly persistence: PersistenceStatus;
}
const browserAutosave = (callback: () => void) => {
  const id = window.setInterval(callback, AUTOSAVE_CADENCE_MS);
  return () => window.clearInterval(id);
};

/** Lifecycle coordinator; constructor does no storage I/O or scheduling. */
export function createPersistentGame(
  publish: (view: PersistentSnapshot) => void,
  saves = createLocalSave(),
  timing?: RuntimeTiming,
  scheduleSave: (callback: () => void) => () => void = browserAutosave,
) {
  let view: PersistentSnapshot = {
    result: { ok: true, state: createInitialGameState() }, runtimeError: null,
    persistence: { kind: 'ready' },
  };
  let runtime: ReturnType<typeof createGameRuntime> | null = null;
  let cancel: (() => void) | null = null;
  let active = false;
  let generation = 0;
  function saveCurrent() {
    if (!runtime || view.persistence.kind === 'blocked' || view.runtimeError) return;
    const result = saves.save(runtime.getSnapshot().result.state);
    view = { ...view, persistence: result.ok ? { kind: 'saved' }
      : result.error === 'storage-conflict' ? { kind: 'blocked', error: result.error }
      : { kind: 'error', error: result.error } };
    publish(view);
  }
  function start() {
    if (active) return;
    if (!runtime) {
      const loaded = saves.load();
      view = { ...view,
        result: { ok: true, state: loaded.kind === 'loaded' ? loaded.state : view.result.state },
        persistence: loaded.kind === 'error' ? { kind: 'blocked', error: loaded.error }
          : { kind: loaded.kind === 'loaded' ? 'loaded' : 'ready' },
      };
      runtime = createGameRuntime(view.result.state, snapshot => {
        view = { ...snapshot, persistence: view.persistence };
        publish(view);
      }, timing);
      publish(view);
    }
    active = true;
    runtime.start();
    const currentGeneration = ++generation;
    if (view.persistence.kind !== 'blocked') cancel = scheduleSave(() => {
      if (active && generation === currentGeneration && runtime?.reconcile()) saveCurrent();
    });
  }
  function stop() {
    active = false; generation += 1;
    cancel?.(); cancel = null;
    runtime?.stop();
  }
  function execute(command: Parameters<ReturnType<typeof createGameRuntime>['execute']>[0]) {
    if (!active || !runtime) return;
    let changed = false;
    runtime.execute(state => {
      const result = command(state);
      changed = result.ok && result.state !== state;
      return result;
    });
    // Execute has published the completed command. Never persist reconciliation's
    // intermediate snapshot or read a possibly stale React render here.
    if (changed) saveCurrent();
  }
  return { start, stop, execute, getSnapshot: () => view };
}
