import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { CURRENT_SAVE_VERSION, MAX_SAVE_LENGTH, SAVE_FORMAT } from './save-schema';
import { decodeSaveText, encodeSaveText, exportSaveCode, MAX_CODE_LENGTH, SAVE_CODE_PREFIX, validateSaveCode } from './save-code';

const state = createInitialGameState();
const envelope = () => ({ format: SAVE_FORMAT, version: CURRENT_SAVE_VERSION, savedAt: 42, state });
const code = () => encodeSaveText(JSON.stringify(envelope()));
describe('portable save transport', () => {
  it('deterministically round trips the existing v1 envelope with the stable prefix', () => {
    const result = exportSaveCode(state, 42);
    expect(result).toEqual({ ok: true, code: code() });
    expect(exportSaveCode(state, 42)).toEqual(result);
    expect(code().startsWith(SAVE_CODE_PREFIX)).toBe(true);
    expect(code()).not.toMatch(/[+/=]/);
    expect(validateSaveCode(code())).toEqual({ ok: true, envelope: envelope() });
    expect(state).toEqual(createInitialGameState());
  });
  it.each(['Miami 🌴 — 東京', '\ufeffhello', 'é ü 中文'])('round trips UTF-8 text %s', text => {
    expect(decodeSaveText(encodeSaveText(text))).toEqual({ ok: true, text });
  });
  it('trims surrounding whitespace', () => {
    expect(validateSaveCode(` \n${code()}\t `)).toEqual(validateSaveCode(code()));
  });
  it.each(['', ' \n\t'])('rejects empty input %#', text => {
    expect(validateSaveCode(text)).toEqual({ ok: false, error: 'empty-code' });
  });
  it.each(['CE2-abc', 'abc', 'ce1-abc'])('rejects unsupported prefix %s', text => {
    expect(validateSaveCode(text)).toEqual({ ok: false, error: 'unsupported-prefix' });
  });
  it.each(['', 'a', 'a=', '+w', '/w', 'ab', '_w', 'Y Q', '!!!!'])('rejects malformed/noncanonical base64 or UTF-8 %s', text => {
    expect(validateSaveCode(SAVE_CODE_PREFIX + text)).toEqual({ ok: false, error: 'malformed-encoding' });
  });
  it('bounds raw encoded input before whitespace trim and decoding', () => {
    expect(validateSaveCode(' '.repeat(MAX_CODE_LENGTH + 1))).toEqual({ ok: false, error: 'oversized-code' });
  });
  it('bounds decoded UTF-16 size separately', () => {
    expect(validateSaveCode(encodeSaveText(' '.repeat(MAX_SAVE_LENGTH + 1)))).toEqual({ ok: false, error: 'oversized' });
    expect(decodeSaveText(encodeSaveText('界'.repeat(MAX_SAVE_LENGTH))).ok).toBe(true);
  });
  it('reports malformed JSON separately', () => {
    expect(validateSaveCode(encodeSaveText('{'))).toEqual({ ok: false, error: 'malformed-json' });
  });
  it.each([
    { ...envelope(), version: CURRENT_SAVE_VERSION + 1 },
    { ...envelope(), state: { ...state, economy: { cash: '01' } } },
    { ...envelope(), state: { ...state, businesses: { ownedIds: ['business:no'], productionRemainderMilliCents: 0 } } },
    { ...envelope(), state: { ...state, businesses: { ownedIds: ['business:dockside-detail', 'business:dockside-detail'], productionRemainderMilliCents: 0 } } },
    { ...envelope(), state: { ...state, businesses: { ownedIds: [], productionRemainderMilliCents: 1000 } } },
    { ...envelope(), savedAt: -1 }, {}, null,
  ])('reuses the shared schema to reject invalid payload %#', value => {
    expect(validateSaveCode(encodeSaveText(JSON.stringify(value))).ok).toBe(false);
  });
  it('keeps future versions distinguishable', () => {
    expect(validateSaveCode(encodeSaveText(JSON.stringify({ ...envelope(), version: CURRENT_SAVE_VERSION + 1 })))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
