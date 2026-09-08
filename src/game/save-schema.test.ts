import { describe, expect, it } from 'vitest';
import { STARTER_BUSINESS } from '../features/businesses';
import { createInitialGameState } from './game-state';
import { CURRENT_SAVE_VERSION, MAX_SAVE_LENGTH, SAVE_FORMAT, migrateToCurrentSave, parseSave, serializeSave, validateSaveState } from './save-schema';

const state = { ...createInitialGameState(), economy: { cash: createInitialGameState().economy.cash }, businesses: { productionRemainderSubMilliCents: { numerator: '0', denominator: '1' }, owned: { [STARTER_BUSINESS.id]: { level: 1 } }, productionRemainderMilliCents: 975 } };
const envelope = () => ({ format: SAVE_FORMAT, version: CURRENT_SAVE_VERSION, savedAt: 123456, state });

describe('current save schema', () => {
  it('round trips all authoritative fields with deterministic metadata', () => {
    const encoded = serializeSave(state, 123456);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) throw Error('fixture');
    expect(parseSave(encoded.serialized)).toEqual({ ok: true, envelope: envelope() });
    expect(serializeSave(state, 123456)).toEqual(encoded);
    expect(JSON.parse(encoded.serialized)).toEqual(envelope());
  });
  it('reconstructs a detached validated state rather than trusting the parsed object', () => {
    const valid = validateSaveState(state);
    expect(valid).toEqual(state);
    expect(valid).not.toBe(state);
    expect(valid?.businesses.owned).not.toBe(state.businesses.owned);
  });
  it('rejects malformed JSON', () => {
    expect(parseSave('{')).toEqual({ ok: false, error: 'malformed-json' });
  });
  it('bounds size before parsing', () => {
    expect(parseSave(' '.repeat(MAX_SAVE_LENGTH + 1))).toEqual({ ok: false, error: 'oversized' });
    expect(parseSave(' '.repeat(MAX_SAVE_LENGTH))).toEqual({ ok: false, error: 'malformed-json' });
  });
  it.each([null, [], 1, 'save', {}, { ...envelope(), extra: true }])('rejects invalid envelope shape %#', value => {
    expect(migrateToCurrentSave(value).ok).toBe(false);
  });
  it('rejects an incorrect format', () => {
    expect(migrateToCurrentSave({ ...envelope(), format: 'other' })).toEqual({ ok: false, error: 'wrong-format' });
  });
  it('rejects future versions at the migration boundary', () => {
    expect(migrateToCurrentSave({ ...envelope(), version: CURRENT_SAVE_VERSION + 1 })).toEqual({ ok: false, error: 'unsupported-version' });
  });
  it.each([0, -1, 1.5, '1', NaN, Infinity])('rejects invalid version %s', version => {
    expect(migrateToCurrentSave({ ...envelope(), version }).ok).toBe(false);
  });
  it.each([-1, 0.5, NaN, Infinity, '123', null, Number.MAX_SAFE_INTEGER + 1])('rejects invalid savedAt %s', savedAt => {
    expect(migrateToCurrentSave({ ...envelope(), savedAt })).toEqual({ ok: false, error: 'invalid-timestamp' });
  });
  it('allows metadata in the future without awarding or modifying anything', () => {
    const result = migrateToCurrentSave({ ...envelope(), savedAt: Number.MAX_SAFE_INTEGER });
    expect(result.ok && result.envelope.state).toEqual(state);
  });
  it.each(['-1', '01', 'NaN', '', 0, null, '9'.repeat(101)])('uses canonical Money validation for cash %#', cash => {
    expect(validateSaveState({ ...state, economy: { cash } })).toBeNull();
  });
  it('preserves exact cash beyond number precision', () => {
    const value = { ...state, economy: { cash: '9007199254740993123456789' } };
    expect(validateSaveState(value)).toEqual(value);
  });
  it.each([['business:missing'], [STARTER_BUSINESS.id, STARTER_BUSINESS.id], [null], 'ids'])('rejects invalid ownership %#', ownedIds => {
    expect(validateSaveState({ ...state, businesses: { ...state.businesses, ownedIds } })).toBeNull();
  });
  it.each([-1, 1000, .5, NaN, Infinity, '0', null])('rejects invalid production remainder %s', productionRemainderMilliCents => {
    expect(validateSaveState({ ...state, businesses: { ...state.businesses, productionRemainderMilliCents } })).toBeNull();
  });
  it.each([{}, { economy: state.economy }, { ...state, economy: {} }, { ...state, businesses: { productionRemainderSubMilliCents: { numerator: '0', denominator: '1' }, owned: {} } }])('rejects missing state fields %#', value => {
    expect(validateSaveState(value)).toBeNull();
  });
  it('rejects inherited fields, custom prototypes, and prototype keys', () => {
    expect(validateSaveState(Object.create(state))).toBeNull();
    expect(parseSave(JSON.stringify(envelope()).replace('"state":', '"__proto__":{},"state":')).ok).toBe(false);
    const value = { ...envelope() };
    Object.defineProperty(value, 'state', { get: () => { throw Error('must not execute'); } });
    expect(migrateToCurrentSave(value).ok).toBe(false);
  });
  it('does not persist runtime-only fields or silently drop an unexpected state field', () => {
    expect(validateSaveState({ ...state, remainderMs: .2 })).toBeNull();
    const result = serializeSave(state, 10);
    if (!result.ok) throw Error('fixture');
    expect(result.serialized).not.toMatch(/baseline|remainderMs|timer|feedback|runtimeError/);
  });
  it('rejects invalid outgoing metadata without mutating state', () => {
    expect(serializeSave(state, NaN)).toEqual({ ok: false, error: 'invalid-timestamp' });
    expect(state.businesses.productionRemainderMilliCents).toBe(975);
  });
});
