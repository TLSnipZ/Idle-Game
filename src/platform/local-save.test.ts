import { describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { serializeSave } from '../game/save-schema';
import { createLocalSave, SAVE_STORAGE_KEY } from './local-save';

function fixture(raw: string | null = null) {
  const storage = { getItem: vi.fn(() => raw), setItem: vi.fn((_key: string, value: string) => { raw = value; }) };
  return { storage, adapter: createLocalSave(() => storage, () => 42), raw: () => raw };
}
const state = createInitialGameState();

describe('local save adapter', () => {
  it('distinguishes no save and saves atomically under the stable key', () => {
    const f = fixture();
    expect(f.adapter.load()).toEqual({ kind: 'empty' });
    expect(f.adapter.save(state)).toEqual({ ok: true });
    expect(f.storage.setItem).toHaveBeenCalledTimes(1);
    expect(f.storage.setItem).toHaveBeenCalledWith(SAVE_STORAGE_KEY, expect.any(String));
    expect(f.adapter.load()).toEqual({ kind: 'loaded', state, savedAt: 42 });
    expect(JSON.parse(f.raw() ?? '').savedAt).toBe(42);
  });
  it('reports read and localStorage getter failures without throwing', () => {
    const f = fixture(); f.storage.getItem.mockImplementation(() => { throw Error('read'); });
    expect(f.adapter.load()).toEqual({ kind: 'error', error: 'storage-read' });
    expect(createLocalSave(() => { throw Error('access'); }).load()).toEqual({ kind: 'error', error: 'storage-read' });
  });
  it('does not write before a successful load', () => {
    const f = fixture();
    expect(f.adapter.save(state).ok).toBe(false);
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
  it('never deletes or overwrites corrupted input', () => {
    const f = fixture('{');
    expect(f.adapter.load()).toEqual({ kind: 'error', error: 'malformed-json' });
    expect(f.adapter.save(state).ok).toBe(false);
    expect(f.raw()).toBe('{');
  });
  it('failed writes preserve the previous valid save and permit later retry', () => {
    const encoded = serializeSave(state, 1); if (!encoded.ok) throw Error('fixture');
    const f = fixture(encoded.serialized); f.adapter.load();
    f.storage.setItem.mockImplementationOnce(() => { throw Error('quota'); });
    expect(f.adapter.save(state)).toEqual({ ok: false, error: 'storage-write' });
    expect(f.raw()).toBe(encoded.serialized);
    expect(f.adapter.save(state).ok).toBe(true);
  });
  it('detects external changes and does not overwrite another session', () => {
    const f = fixture(); f.adapter.load();
    f.storage.setItem(SAVE_STORAGE_KEY, 'external');
    expect(f.adapter.save(state)).toEqual({ ok: false, error: 'storage-conflict' });
    expect(f.raw()).toBe('external');
  });
  it('invalid timestamps produce no storage writes', () => {
    const f = fixture(); const adapter = createLocalSave(() => f.storage, () => NaN);
    adapter.load();
    expect(adapter.save(state)).toEqual({ ok: false, error: 'invalid-timestamp' });
    expect(f.storage.setItem).not.toHaveBeenCalled();
  });
});
