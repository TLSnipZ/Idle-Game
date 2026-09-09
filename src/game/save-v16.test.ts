import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from './game-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { migrateToCurrentSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { performRebirth } from './rebirth';
import { evaluateBusinessProduction, collectModifiers } from './effective-stats';
import { STARTER_VEHICLE as V, findVehicle } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { BUSINESS_AUTO_UPGRADER as A } from '../features/automation';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { rational } from '../shared/rational';
const LEGACY = 'vehicle:starter-sport-sedan' as const;
const envelope = (state: unknown, version = 15) => ({ format: 'crime-empire-save', version, savedAt: 123456789, state });
function historical(owner: boolean) {
  const state = rebirthState(37, 48), crew = crewState({ operations: 'crew:mara-knox', logistics: 'crew:jax-mercer' });
  return { ...state, garage: { ownedVehicleIds: owner ? [LEGACY] : [] }, crew: crew.crew,
    city: { ...crew.city, heat: 70, heatDecayElapsedMs: 50000 },
    events: { pendingEventId: 'event:shakedown' as const, opportunityElapsedMs: 123456 },
    automation: { ...state.automation, unlockedIds: [...state.automation.unlockedIds, A.id], enabledIds: [A.id], businessAutoUpgradeElapsedMs: 23456 },
    permanentProgression: { ...state.permanentProgression, empirePoints: 17, rebirthCount: 4,
      skills: { 'skill:streetwise-investment': 3, 'skill:never-sleeps': 2 },
      unlockedAchievementIds: ACHIEVEMENT_CATALOG.map(a => a.id),
      statistics: { manualJobsCompleted: 123, automatedJobsCompleted: 456, businessLevelsPurchased: 47,
        territoriesAcquired: 5, crewMembersRecruited: 8, eventsResolved: 19, rebirthsCompleted: 4, peakHeat: 99 } } };
}
afterEach(() => vi.restoreAllMocks());
describe('v16 canonical vehicle boundary', () => {
  it.each([false, true])('v15 ownership=%s maps only identity, preserving every unrelated field and timestamp', owner => {
    const state = historical(owner), input = envelope(state), before = structuredClone(input);
    const expected = { ...state, garage: { ownedVehicleIds: owner ? [V.id] : [] } };
    vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('migration clock'); });
    vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('migration RNG'); });
    const result = migrateToCurrentSave(input);
    expect(result).toEqual({ ok: true, envelope: envelope(expected, 16) });
    expect(migrateToCurrentSave(input)).toEqual(result); expect(input).toEqual(before);
    const code = encodeSaveText(JSON.stringify(input)); expect(code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code)).toEqual(result);
    const exported = exportSaveCode(expected, input.savedAt); if (!exported.ok) throw Error(exported.error);
    expect(validateSaveCode(exported.code)).toEqual(result);
    const serialized = serializeSave(expected, input.savedAt); if (!serialized.ok) throw Error(serialized.error);
    expect(serialized.serialized).not.toContain(LEGACY);
    expect(validateSaveState(expected)).toEqual(expected);
  });
  it('fresh current state has no free vehicle or future Garage fields', () => {
    const state = createInitialGameState(), serialized = serializeSave(state, 0);
    expect(state.garage).toEqual({ ownedVehicleIds: [] });
    expect(migrateToCurrentSave(envelope(state, 16))).toEqual({ ok: true, envelope: envelope(state, 16) });
    expect(serialized.ok).toBe(true); expect(findVehicle(LEGACY)).toBeUndefined();
  });
  it.each([[LEGACY, LEGACY], ['vehicle:unknown'], [V.id], [LEGACY, V.id]].map(ownedVehicleIds => ({ ownedVehicleIds })))('historical validator rejects malformed/future IDs %#', ({ ownedVehicleIds }) => {
    expect(migrateToCurrentSave(envelope({ ...historical(false), garage: { ownedVehicleIds } })))
      .toEqual({ ok: false, error: 'invalid-state' });
  });
  it.each([[LEGACY], [LEGACY, V.id], [V.id, V.id], ['vehicle:unknown']].map(ownedVehicleIds => ({ ownedVehicleIds })))('current validator rejects noncanonical IDs %#', ({ ownedVehicleIds }) => {
    expect(migrateToCurrentSave(envelope({ ...createInitialGameState(), garage: { ownedVehicleIds } }, 16)))
      .toEqual({ ok: false, error: 'invalid-state' });
  });
  it('migrated ownership survives Rebirth and grants precisely one current modifier after rebuilding', () => {
    const migrated = migrateToCurrentSave(envelope(historical(true))); if (!migrated.ok) throw Error(migrated.error);
    const reset = performRebirth(migrated.envelope.state); expect(reset.ok).toBe(true);
    expect(reset.state.garage).toEqual({ ownedVehicleIds: [V.id] });
    const vehicleModifiers = collectModifiers(reset.state).filter(m => m.sourceId.startsWith('vehicle:'));
    expect(vehicleModifiers).toEqual([V.modifier]);
    // Separate skill-free fixture isolates the vehicle from permanent skills retained above.
    const state = { ...createInitialGameState(), garage: reset.state.garage };
    expect(evaluateBusinessProduction(state, B.id, 4)).toMatchObject({ ok: true, effective: rational(330n) });
  });
});
