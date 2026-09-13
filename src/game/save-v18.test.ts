import { describe, expect, it, vi } from 'vitest';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { createInitialGameState } from './game-state';
import { migrateToCurrentSave, parseSave, serializeSave, validateSaveState, CURRENT_SAVE_VERSION } from './save-schema';
import { encodeSaveText, validateSaveCode } from './save-code';
import { stringifySaveFixture } from './test-fixtures/save-text';
import { rebirthState } from './test-fixtures/rebirth-state';
const envelope = (state: unknown, version = 17) => ({ format: 'crime-empire-save', version, savedAt: 123456789, state });
describe('Save v18 active selection', () => {
  it.each([false, true])('v17 owner=%s migrates without rewards, timestamp changes or side effects', owner => {
    const current = owner ? rebirthState() : createInitialGameState();
    const { activeVehicleId: _active, ...garage } = current.garage;
    const input = envelope({ ...current, garage }), before = structuredClone(input);
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock'); });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('random'); });
    try {
      const result = migrateToCurrentSave(input);
      expect(result).toEqual({ ok: true, envelope: envelope(current, 19) });
      expect(input).toEqual(before); expect(validateSaveCode(encodeSaveText(JSON.stringify(input)))).toEqual(result);
      expect(migrateToCurrentSave(input)).toEqual(result);
    } finally { clock.mockRestore(); random.mockRestore(); }
  });
  it.each([6,7,8,9,10,11,12,13,14,15,16,17])('rejects injected active fields in historical v%i Garage', version => {
    const s = createInitialGameState();
    const historical = { economy: s.economy, businesses: s.businesses, upgrades: s.upgrades,
      automation: s.automation, progression: s.progression, garage: s.garage,
      ...(version >= 7 ? { permanentProgression: { empirePoints: 0, rebirthCount: 0,
        ...(version >= 8 ? { skills: {} } : {}),
        ...(version >= 13 ? { unlockedAchievementIds: [] } : {}),
        ...(version >= 14 ? { statistics: s.permanentProgression.statistics } : {}) } } : {}),
      ...(version >= 9 ? { city: version === 9 ? { ownedTerritoryIds: s.city.ownedTerritoryIds } : s.city } : {}),
      ...(version >= 11 ? { crew: s.crew } : {}), ...(version >= 12 ? { events: s.events } : {}),
    };
    const input = JSON.parse(stringifySaveFixture(envelope(historical, version)));
    expect(migrateToCurrentSave(input).ok).toBe(true);
    // Inject only after constructing a proven-valid historical fixture.
    input.state.garage.activeVehicleId = null;
    expect(migrateToCurrentSave(input)).toEqual({ ok: false, error: 'invalid-state' });
  });
  it.each([undefined, null, '', 'vehicle:unknown', 'vehicle:starter-sport-sedan', 4])('rejects missing/invalid active selection for an owner: %s', activeVehicleId => {
    const state = rebirthState();
    expect(validateSaveState({ ...state, garage: { ownedVehicleIds: [V.id], activeVehicleId } })).toBeNull();
  });
  it('empty Garage requires null; no unknown keys, duplicate ownership, accessor or unowned selection', () => {
    const state = createInitialGameState();
    for (const garage of [
      { ownedVehicleIds: [], activeVehicleId: V.id },
      { ownedVehicleIds: [] },
      { ownedVehicleIds: [V.id, V.id], activeVehicleId: V.id },
      { ownedVehicleIds: [], activeVehicleId: null, selected: null },
      { ownedVehicleIds: [V.id], get activeVehicleId() { throw Error('getter'); } },
    ]) expect(validateSaveState({ ...state, garage })).toBeNull();
  });
  it('current local saves and CE1 round-trip; unsupported future versions stay protected', () => {
    expect(CURRENT_SAVE_VERSION).toBe(19);
    for (const state of [createInitialGameState(), rebirthState()]) {
      const saved = serializeSave(state, 99); if (!saved.ok) throw Error(saved.error);
      expect(parseSave(saved.serialized)).toMatchObject({ ok: true, envelope: { version: 19, savedAt: 99, state } });
      expect(validateSaveCode(encodeSaveText(saved.serialized))).toEqual(parseSave(saved.serialized));
    }
    expect(migrateToCurrentSave(envelope(createInitialGameState(), 20))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
