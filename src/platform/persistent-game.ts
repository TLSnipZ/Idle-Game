import type { OfflineProgress } from '../game/offline-progress';
import { validateSaveCode } from '../game/save-code';
import type { ExportResult, SaveCodeError } from '../game/save-code';
import { createInitialGameState } from '../game/game-state';
import { createGameRuntime } from './game-runtime';
import type { RuntimeSnapshot, RuntimeTiming } from './game-runtime';
import { createLocalSave } from './local-save';
import type { BootstrapResult, LoadResult, WriteResult } from './local-save';

export type ImportResult = { readonly ok: true }
  | { readonly ok: false; readonly error: SaveCodeError | 'runtime-unavailable' | 'persistence-failure'; readonly detail?: Extract<WriteResult, { ok: false }>['error'] };

export const AUTOSAVE_CADENCE_MS = 5_000;
export type PersistenceStatus = Omit<Extract<BootstrapResult, { kind: 'offline-error' }>, 'state'>
  | { readonly kind: 'ready' | 'loaded' | 'saved' }
  | { readonly kind: 'blocked'; readonly error: Extract<LoadResult, { kind: 'error' }>['error'] | 'storage-conflict' }
  | { readonly kind: 'error'; readonly error: Extract<WriteResult, { ok: false }>['error'] };
export interface PersistentSnapshot extends RuntimeSnapshot {
  readonly persistence: PersistenceStatus;
  readonly offline: OfflineProgress | null;
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
    persistence: { kind: 'ready' }, offline: null,
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
      const loaded = saves.bootstrap();
      view = { ...view,
        result: { ok: true, state: loaded.kind === 'loaded' || loaded.kind === 'offline-error' ? loaded.state : view.result.state },
        offline: loaded.kind === 'loaded' ? loaded.offline : null,
        persistence: loaded.kind === 'offline-error' ? { kind: 'offline-error', error: loaded.error } : loaded.kind === 'error' ? { kind: 'blocked', error: loaded.error }
          : { kind: loaded.kind === 'loaded' ? 'loaded' : 'ready' },
      };
      runtime = createGameRuntime(view.result.state, snapshot => {
        view = { ...snapshot, persistence: view.persistence, offline: view.offline };
        publish(view);
      }, timing);
      publish(view);
    }
    if (view.persistence.kind === 'offline-error') return;
    active = true;
    runtime.start();
    startAutosave();
  }
  function startAutosave() {
    if (cancel) return;
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
  function exportCode(): ExportResult {
    if (!active || !runtime?.reconcile()) return { ok: false, error: 'runtime-unavailable' };
    return saves.exportCode(runtime.getSnapshot().result.state);
  }
  // Called only after explicit UI confirmation; validate again at the transaction boundary.
  function importCode(code: string): ImportResult {
    const candidate = validateSaveCode(code);
    if (!candidate.ok) return candidate;
    if (!active || !runtime) return { ok: false, error: 'runtime-unavailable' };
    const commit = runtime.prepareReplacement(candidate.envelope.state);
    if (!commit) return { ok: false, error: 'runtime-unavailable' };
    const written = saves.replace(candidate.envelope.state);
    if (!written.ok) return { ok: false, error: 'persistence-failure', detail: written.error };
    view = { ...view, persistence: { kind: 'saved' }, offline: null };
    commit();
    startAutosave();
    return { ok: true };
  }
  function dismissOffline() { view = { ...view, offline: null }; publish(view); }
  return { dismissOffline, start, stop, execute, exportCode, importCode, getSnapshot: () => view };
}
