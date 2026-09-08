import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, validateSaveCode, exportSaveCode } from './save-code';
import { createInitialGameState } from './game-state';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { MAX_XP } from '../features/progression';

const legacy = () => ({ format: 'crime-empire-save', version: 4, savedAt: 123456789,
  state: { economy: { cash: '900719925474099312345' },
    businesses: { owned: { [B.id]: { level: 7 } }, productionRemainderMilliCents: 975,
      productionRemainderSubMilliCents: { numerator: '1', denominator: '3' } },
    upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) },
    automation: { unlockedIds: [D.id], starterJobElapsedMs: 4321 } } });
describe('v5 progression saves', () => {
  it('migrates realistic v4 without altering any prior state or its timestamp', () => {
    const old = legacy(); const text = JSON.stringify(old);
    const expected = { ok: true, envelope: { ...old, version: 8, state: { ...old.state, permanentProgression: { skills: {}, empirePoints: 0, rebirthCount: 0 }, garage: { ownedVehicleIds: [] }, progression: { xp: 0 } } } };
    expect(CURRENT_SAVE_VERSION).toBe(8);
    expect(parseSave(text)).toEqual(expected);
    expect(validateSaveCode(encodeSaveText(text))).toEqual(expected);
    expect(JSON.stringify(old)).toBe(text);
  });
  it.each([0,99,100,1850,980100,MAX_XP])('roundtrips exact XP %i through storage and CE1', xp => {
    const migrated = parseSave(JSON.stringify(legacy())); if (!migrated.ok) throw Error('fixture');
    const state = { ...migrated.envelope.state, progression: { xp } };
    const serialized = serializeSave(state,42); if (!serialized.ok) throw Error('fixture');
    const code = exportSaveCode(state,42); if (!code.ok) throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toEqual(parseSave(serialized.serialized));
    expect(parseSave(serialized.serialized)).toMatchObject({ ok: true, envelope: { version: 8, savedAt: 42, state } });
    expect(serialized.serialized).not.toMatch(/levelEvent|xpIntoLevel|currentLevel|progressRatio/);
  });
  it.each([-1,.5,NaN,Infinity,MAX_XP+1,'10',null,undefined])('rejects malformed XP %#', xp => {
    expect(validateSaveState({ ...createInitialGameState(), progression: { xp } })).toBeNull();
  });
  it('rejects missing/extra progression data, prototypes and getters', () => {
    const state = createInitialGameState();
    const { progression: _progression, ...missing } = state;
    expect(validateSaveState(missing)).toBeNull();
    for (const progression of [{}, { xp: 0, level: 1 }, Object.create({ xp: 0 }),
      Object.defineProperty({},'xp',{ enumerable: true, get: () => { throw Error('must not read'); } })]) {
      expect(validateSaveState({ ...state, progression })).toBeNull();
    }
  });
  it('rejects malformed v4, incompatible shapes and future versions', () => {
    const old = legacy();
    expect(parseSave(JSON.stringify({ ...old, state: { ...old.state, automation: { ...old.state.automation, starterJobElapsedMs: -1 } } })).ok).toBe(false);
    expect(parseSave(JSON.stringify({ ...old, state: { ...old.state, progression: { xp: 123 } } })).ok).toBe(false);
    expect(parseSave(JSON.stringify({ ...old, version: CURRENT_SAVE_VERSION + 1 }))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
