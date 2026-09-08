import type { GameState } from '../game/game-state';
import { parseSave, serializeSave } from '../game/save-schema';
import type { SaveDataError } from '../game/save-schema';

export const SAVE_STORAGE_KEY = 'crime-empire:save';
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type LoadResult = { readonly kind: 'loaded'; readonly state: GameState }
  | { readonly kind: 'empty' }
  | { readonly kind: 'error'; readonly error: SaveDataError | 'storage-read' };
export type WriteResult = { readonly ok: true }
  | { readonly ok: false; readonly error: SaveDataError | 'storage-write' | 'storage-conflict' };

export function createLocalSave(
  storage: () => SaveStorage = () => window.localStorage,
  now: () => number = () => Date.now(),
) {
  let loaded = false;
  let previousRaw: string | null = null;
  function load(): LoadResult {
    loaded = false;
    let raw: string | null;
    try { raw = storage().getItem(SAVE_STORAGE_KEY); }
    catch { return { kind: 'error', error: 'storage-read' }; }
    if (raw === null) {
      previousRaw = raw; loaded = true;
      return { kind: 'empty' };
    }
    const result = parseSave(raw);
    if (!result.ok) return { kind: 'error', error: result.error };
    previousRaw = raw; loaded = true;
    // savedAt is deliberately not exposed to the runtime: no offline calculation.
    return { kind: 'loaded', state: result.envelope.state };
  }
  function save(state: GameState): WriteResult {
    if (!loaded) return { ok: false, error: 'storage-conflict' };
    try {
      const result = serializeSave(state, now());
      if (!result.ok) return result;
      const target = storage();
      // Protect a save changed by another tab since this session's last read/write.
      if (target.getItem(SAVE_STORAGE_KEY) !== previousRaw) {
        loaded = false;
        return { ok: false, error: 'storage-conflict' };
      }
      target.setItem(SAVE_STORAGE_KEY, result.serialized);
      previousRaw = result.serialized;
      return { ok: true };
    } catch { return { ok: false, error: 'storage-write' }; }
  }
  return { load, save };
}
