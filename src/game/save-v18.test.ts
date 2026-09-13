import { afterEach, expect, test, vi } from 'vitest';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { createInitialGameState } from './game-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { CURRENT_SAVE_VERSION, migrateToCurrentSave, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { rational } from '../shared/rational';

const envelope = (state: unknown, version: number) => ({ format: 'crime-empire-save', version, savedAt: 123456, state });
afterEach(() => vi.restoreAllMocks());

test.each([false, true])('v17 owner=%s migrates only selection, without clocks, rewards or lost fractions', owner => {
  const base = rebirthState();
  const expected = { ...base, garage: { ownedVehicleIds: owner ? [V.id] : [], activeVehicleId: owner ? V.id : null },
    businesses: { ...base.businesses, productionRemainderMilliCents: 731, productionRemainderSubMilliCents: rational(1n, 3n) } };
  const old = { ...expected, garage: { ownedVehicleIds: [...expected.garage.ownedVehicleIds] } };
  const input = envelope(old, 17), before = structuredClone(input);
  vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('No migration clock'); });
  vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('No migration RNG'); });
  const result = migrateToCurrentSave(input);
  expect(CURRENT_SAVE_VERSION).toBe(18);
  expect(result).toEqual({ ok: true, envelope: envelope(expected, 18) });
  expect(parseSave(JSON.stringify(input))).toEqual(result);
  expect(validateSaveCode(encodeSaveText(JSON.stringify(input)))).toEqual(result);
  expect(migrateToCurrentSave(input)).toEqual(result);
  expect(input).toEqual(before);
});

test('v18 and CE1 roundtrip the exact active selection; no images or derived bonuses enter saves', () => {
  const s = rebirthState(), raw = serializeSave(s, 123456), code = exportSaveCode(s, 123456);
  if (!raw.ok || !code.ok) throw Error('Roundtrip');
  expect(parseSave(raw.serialized)).toEqual({ ok: true, envelope: envelope(s, 18) });
  expect(code.code.startsWith('CE1-')).toBe(true);
  expect(validateSaveCode(code.code)).toEqual(parseSave(raw.serialized));
  expect(Object.keys(s.garage).sort()).toEqual(['activeVehicleId', 'ownedVehicleIds']);
});

test.each([
  { ownedVehicleIds: [] },
  { ownedVehicleIds: [], activeVehicleId: V.id },
  { ownedVehicleIds: [V.id], activeVehicleId: null },
  { ownedVehicleIds: [V.id], activeVehicleId: 'vehicle:unknown' },
  { ownedVehicleIds: [V.id], activeVehicleId: 'vehicle:starter-sport-sedan' },
  { ownedVehicleIds: [V.id, V.id], activeVehicleId: V.id },
  { ownedVehicleIds: [], activeVehicleId: 0 },
  { ownedVehicleIds: [], activeVehicleId: null, extra: true },
])('rejects malformed v18 garage %# without repairing it', garage => {
  const state = { ...createInitialGameState(), garage }, before = structuredClone(state);
  expect(validateSaveState(state)).toBeNull();
  expect(migrateToCurrentSave(envelope(state, 18))).toEqual({ ok: false, error: 'invalid-state' });
  expect(state).toEqual(before);
});

test('rejects forged active fields in raw historical input and preserves the future-version guard', () => {
  expect(migrateToCurrentSave(envelope(createInitialGameState(), 17))).toMatchObject({ ok: false, error: 'invalid-state' });
  expect(migrateToCurrentSave(envelope(createInitialGameState(), 19))).toMatchObject({ ok: false, error: 'unsupported-version' });
});
