import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { migrateToCurrentSave, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { WATERFRONT as W, NEON_MILE as N, getDistrictHeat, switchCityDistrict } from '../features/territories';

function state() {
  const s = createInitialGameState();
  return { ...s, city: { ...s.city, ownedTerritoryIds: [W.id, N.id], heat: 79, heatDecayElapsedMs: 45678 } };
}
const envelope = (value: unknown, version = 20) => ({ format: 'crime-empire-save', version, savedAt: 123456, state: value });
describe('v19 to v20 district migration', () => {
  it.each([false, true])('retains the complete legacy state and timestamp, Neon owned=%s', owned => {
    const s = owned ? state() : createInitialGameState(), input = envelope(s, 19), before = JSON.stringify(input);
    const result = migrateToCurrentSave(input);
    expect(result).toEqual({ ok: true, envelope: envelope(s) });
    expect(validateSaveCode(encodeSaveText(JSON.stringify(input)))).toEqual(result);
    expect(JSON.stringify(input)).toBe(before);
    if (!result.ok) throw Error('migration');
    expect(getDistrictHeat(result.envelope.state.city, W.id).heat).toBe(s.city.heat);
    expect(getDistrictHeat(result.envelope.state.city, N.id).heat).toBe(0);
  });
  it('round-trips selected and parked districts, with independently copied save data', () => {
    const s = state(), value = { ...s, city: switchCityDistrict(s.city, N.id) };
    const saved = serializeSave(value, 123456), code = exportSaveCode(value, 123456);
    if (!saved.ok || !code.ok) throw Error('fixture');
    expect(parseSave(saved.serialized)).toEqual({ ok: true, envelope: envelope(value) });
    expect(validateSaveCode(code.code)).toEqual(parseSave(saved.serialized));
    const valid = validateSaveState(value);
    expect(valid?.city.districts).not.toBe(value.city.districts);
    expect(valid?.city.districts?.parked).not.toBe(value.city.districts?.parked);
  });
  it.each([10, 17, 18, 19])('rejects district fields injected into an old v%i city', version => {
    const s = state(), value = { ...s, city: switchCityDistrict(s.city, N.id) };
    expect(migrateToCurrentSave(envelope(value, version))).toEqual({ ok: false, error: 'invalid-state' });
  });
  it.each([
    null, {}, { activeId: 'fake', parked: { heat: 0, heatDecayElapsedMs: 0 } },
    { activeId: N.id, parked: { heat: 101, heatDecayElapsedMs: 0 } },
    { activeId: N.id, parked: { heat: 0, heatDecayElapsedMs: 1 } },
    { activeId: N.id, parked: { heat: 1, heatDecayElapsedMs: 60000 } },
    { activeId: N.id, parked: { heat: 1, heatDecayElapsedMs: 0, extra: 1 } },
  ])('rejects malformed district extension %j', districts => {
    const s = state();
    expect(validateSaveState({ ...s, city: { ...s.city, districts } })).toBeNull();
  });
  it('rejects unowned selection, accessor fields, extra state and future versions', () => {
    const s = createInitialGameState();
    expect(validateSaveState({ ...s, city: { ...s.city, districts: { activeId: N.id, parked: { heat: 0, heatDecayElapsedMs: 0 } } } })).toBeNull();
    const owned = state();
    const ids = [W.id, N.id];
    Object.defineProperty(ids, '1', { enumerable: true, get() { throw Error('ownership getter'); } });
    expect(validateSaveState({ ...owned, city: { ...owned.city, ownedTerritoryIds: ids,
      districts: { activeId: N.id, parked: { heat: 0, heatDecayElapsedMs: 0 } } } })).toBeNull();
    expect(validateSaveState({ ...owned, city: { ...owned.city, get districts() { throw Error('getter'); } } })).toBeNull();
    expect(migrateToCurrentSave(envelope(s, 21))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
