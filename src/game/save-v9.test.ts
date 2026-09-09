import { stringifySaveFixture } from './test-fixtures/save-text';
import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { rebirthState } from './test-fixtures/rebirth-state';
import { ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { WATERFRONT as W, NEON_MILE as N } from '../features/territories';
import { createLocalSave } from '../platform/local-save';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { evaluateJobReward } from './effective-stats';
import { STARTER_BUSINESS as B } from '../features/businesses';

function withValidHeat(city: unknown): unknown {
  if (typeof city !== 'object' || city === null || Array.isArray(city)) return city;
  return Object.create(Object.getPrototypeOf(city), {
    ...Object.getOwnPropertyDescriptors(city),
    heat: { value: 0, enumerable: true }, heatDecayElapsedMs: { value: 0, enumerable: true },
  });
}
function legacy() {
  const { events: _events, crew: _crew, city: _city, ...state } = rebirthState(37, 48);
  return { format: 'crime-empire-save', version: 8, savedAt: 123456789,
    state: { ...state, permanentProgression: { statistics: createInitialStatistics(4), unlockedAchievementIds: [], empirePoints: 17, rebirthCount: 4,
      skills: { [ROOT]: 3, [FAST]: 1, [LEARN]: 1, [SILENT]: 2, [NEVER]: 2 } } } };
}
describe('v9 territory schema and sequential migration', () => {
  it('adds only the Waterfront baseline to a rich v8 save, preserving every prior field exactly', () => {
    const old = legacy(), raw = stringifySaveFixture(legacyEnvelope());
    const result = parseSave(raw); expect(CURRENT_SAVE_VERSION).toBe(15);
    expect(result).toEqual({ ok: true, envelope: { ...old, version: 15,
      state: { ...old.state, events: { opportunityElapsedMs: 0, pendingEventId: null }, crew: { recruitedIds: [], assignments: { operations: null, logistics: null } }, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id] } } } });
    if (!result.ok) throw Error('fixture');
    const { events: _events, crew: _crew, city, ...previous } = result.envelope.state;
    expect(previous).toEqual(old.state); expect(city.ownedTerritoryIds).not.toContain(N.id);
    expect(result.envelope.savedAt).toBe(old.savedAt); expect(stringifySaveFixture(legacyEnvelope())).toBe(raw);
    expect(validateSaveCode(encodeSaveText(raw))).toEqual(result);
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('CE1 migrates historical v%i without charging or granting Neon Mile', version => {
    const old = legacy(), s = old.state;
    const state = { economy: s.economy, businesses: version === 1
      ? { ownedIds: [B.id], productionRemainderMilliCents: 975 }
      : { owned: s.businesses.owned, productionRemainderMilliCents: 975,
        ...(version >= 3 ? { productionRemainderSubMilliCents: s.businesses.productionRemainderSubMilliCents } : {}) },
      ...(version >= 3 ? { upgrades: s.upgrades } : {}), ...(version >= 4 ? { automation: s.automation } : {}),
      ...(version >= 5 ? { progression: s.progression } : {}), ...(version >= 6 ? { garage: s.garage } : {}),
      ...(version >= 7 ? { permanentProgression: { empirePoints: 17, rebirthCount: 4,
        ...(version >= 8 ? { skills: s.permanentProgression.skills } : {}) } } : {}) };
    const result = validateSaveCode(encodeSaveText(stringifySaveFixture({ ...old, version, state })));
    expect(result).toMatchObject({ ok: true, envelope: { version: 15, savedAt: old.savedAt,
      state: { city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id] }, economy: s.economy,
        businesses: { owned: { [B.id]: { level: version === 1 ? 1 : 48 } }, productionRemainderMilliCents: 975 } } } });
  });
  it.each([{ ids: [W.id] }, { ids: [W.id, N.id] }])('roundtrips authoritative city %# and all previous state through CE1', ({ ids }) => {
    const state = { ...legacy().state, events: createInitialGameState().events, crew: createInitialGameState().crew, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: ids } };
    const serialized = serializeSave(state, 42), exported = exportSaveCode(state, 42);
    if (!serialized.ok || !exported.ok) throw Error('fixture');
    expect(exported.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(exported.code)).toEqual({ ok: true, envelope: { format: 'crime-empire-save', version: 15, savedAt: 42, state } });
    expect(parseSave(serialized.serialized)).toEqual(validateSaveCode(exported.code));
    expect(serialized.serialized).not.toMatch(/controlledCount|purchaseCost|SOLARA|requirements|displayName/);
  });
  it.each([undefined, null, [], 'city', {}, { ownedTerritoryIds: null }, { ownedTerritoryIds: 'territory:waterfront' },
    { ownedTerritoryIds: [] }, { ownedTerritoryIds: [N.id] }, { ownedTerritoryIds: [W.id, W.id] },
    { ownedTerritoryIds: [W.id, N.id, N.id] }, { ownedTerritoryIds: [W.id, 'territory:missing'] },
    { ownedTerritoryIds: [W.id, null] }, { ownedTerritoryIds: [W.id], extra: true }])('rejects malformed current city %# without repair', city => {
    const state = { ...createInitialGameState(), city: withValidHeat(city) };
    expect(validateSaveState(state)).toBeNull();
    expect(parseSave(stringifySaveFixture({ format: 'crime-empire-save', version: 15, savedAt: 1, state }))).toEqual({ ok: false, error: 'invalid-state' });
  });
  it('rejects prototypes, getters, holes and non-JSON own properties without executing getters', () => {
    const base = createInitialGameState();
    const getter = { get ownedTerritoryIds() { throw Error('must not execute'); } };
    const ids = [W.id]; Object.defineProperty(ids, '0', { get() { throw Error('must not execute'); } });
    const hidden = { ownedTerritoryIds: [W.id] }; Object.defineProperty(hidden, 'ownedTerritoryIds', { enumerable: false });
    for (const city of [getter, Object.create({ ownedTerritoryIds: [W.id] }), { ownedTerritoryIds: ids }, hidden,
      { ownedTerritoryIds: Object.setPrototypeOf([W.id], {}) },
      { ownedTerritoryIds: new Array(1) }, { ownedTerritoryIds: Object.assign([W.id], { bonus: 1 }) }]) {
      expect(validateSaveState({ ...base, city: withValidHeat(city) })).toBeNull();
    }
  });
  it('retains owned Neon Mile without its acquisition requirements', () => {
    const state = { ...createInitialGameState(), city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] } };
    expect(validateSaveState(state)).toEqual(state); expect(evaluateJobReward(state)).toMatchObject({ reward: '2750' });
  });
  it('rejects smuggled city in v8 and unsupported future versions', () => {
    const old = legacyEnvelope();
    expect(parseSave(stringifySaveFixture({ ...old, state: { ...old.state, city: createInitialGameState().city } }))).toEqual({ ok: false, error: 'invalid-state' });
    expect(parseSave(stringifySaveFixture({ ...old, version: 16 }))).toEqual({ ok: false, error: 'unsupported-version' });
  });
  it('migration retains savedAt for one normal offline catch-up without granting territory', () => {
    const old = legacy(); let raw = stringifySaveFixture(legacyEnvelope()); const now = old.savedAt + 25000;
    const saves = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => now);
    const state = { ...old.state, events: createInitialGameState().events, crew: createInitialGameState().crew, city: createInitialGameState().city };
    const expected = simulateGameElapsed(state, 25000).state;
    expect(saves.bootstrap()).toMatchObject({ kind: 'loaded', state: expected });
    expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { version: 15, savedAt: now, state: expected } });
    expect(saves.bootstrap()).toMatchObject({ kind: 'loaded', state: expected, offline: { incomeEarned: '0', xpEarned: 0 } });
  });
});

function legacyEnvelope() {
  const old = legacy();
  const { statistics: _statistics, unlockedAchievementIds: _ids, ...permanentProgression } = old.state.permanentProgression;
  return { ...old, state: { ...old.state, permanentProgression } };
}
